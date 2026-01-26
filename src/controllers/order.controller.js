const httpStatus = require('../utils/httpStatusText');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper'); 
const Product = require('../models/product.model');


// create order 
const createOrder = asyncWrapper(async (req, res, next) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return next(AppError.create('Order items are required', 400, httpStatus.FAIL));
    }

    const orderItems = await Promise.all(items.map(async (item) => {
        const product = await Product.findById(item.productId);
        
        if (!product) {
            throw AppError.create(`Product ${item.productId} not found`, 404, httpStatus.FAIL);
        }

        const productData = product.toObject();

        return {
            productId: productData._id,
            name: productData.name,
            price: productData.price,
            units: productData.units,
            quantity: item.quantity
        };
    }));

    const totalAmount = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const newOrder = new Order({
        customerId: req.currentUser.id,
        items: orderItems,
        totalAmount
    });

    await newOrder.save();

    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: { order: newOrder }
    });
});


const getAllOrders = asyncWrapper(async (req, res) => {
    const { limit = 10, page = 1, name, startDate, endDate } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let filter = {};

    if (name) {
        filter.customerName = { $regex: name, $options: 'i' }; 
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
        .sort({ customerName: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const total = await Order.countDocuments(filter);

    res.json({
        status: httpStatus.SUCCESS,
        results: orders.length,
        total,
        data: { orders }
    });
});


const updateOrderStatus = asyncWrapper(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
        throw AppError.create('Status is required', 400, httpStatus.FAIL);
    }

    const order = await Order.findByIdAndUpdate(
        orderId, 
        { status, updatedAt: Date.now() }, 
        { new: true, runValidators: true }
    );

    if (!order) {
        throw AppError.create('Order not found', 404, httpStatus.FAIL);
    }

    res.status(200).json({ status: httpStatus.SUCCESS, data: { order } });
});


const updateOrderContent = asyncWrapper(async (req, res) => {
    const { orderId } = req.params;
    const { items } = req.body;
    const user = req.currentUser;

    const order = await Order.findById(orderId);
    if (!order) {
        throw AppError.create('Order not found', 404, httpStatus.FAIL);
    }

    const lockedStates = ['delivered', 'cancelled'];
    if (lockedStates.includes(order.status)) {
        throw AppError.create(
            `Cannot modify items because the order is already ${order.status}`, 
            400, 
            httpStatus.FAIL
        );
    }

    if (!items || !Array.isArray(items)) {
        throw AppError.create('Items array is required', 400, httpStatus.FAIL);
    }

    const canOverridePrice = ['sup_admin', 'upper_manager', 'manager'].includes(user.role);
    let newTotalAmount = 0;
    const updatedItems = [];

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw AppError.create(`Product ${item.productId} not found`, 404, httpStatus.FAIL);
        }

        const finalPrice = (canOverridePrice && item.price !== undefined) 
            ? item.price 
            : product.price;

        newTotalAmount += finalPrice * item.quantity;
        updatedItems.push({
            productId: product._id,
            title: product.title,
            price: finalPrice,
            quantity: item.quantity
        });
    }

    order.items = updatedItems;
    order.totalAmount = newTotalAmount;
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({ 
        status: httpStatus.SUCCESS, 
        data: { order } 
    });
});

const cancelMyOrder = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.currentUser.id;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(AppError.create('Order not found', 404, httpStatus.FAIL));
    }

    if (order.customerId.toString() !== userId) {
        return next(AppError.create('You can only cancel your own orders', 403, httpStatus.FAIL));
    }

    if (order.status !== 'pending') {
        return next(AppError.create(`Cannot cancel order. It is already ${order.status}`, 400, httpStatus.FAIL));
    }

    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({ status: httpStatus.SUCCESS, message: 'Order cancelled successfully' });
});

const getMyOrders = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find({ customerId: userId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const total = await Order.countDocuments({ customerId: userId });

    res.json({
        status: httpStatus.SUCCESS,
        results: orders.length,
        data: { 
            orders,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        }
    });
});

module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    updateOrderContent,
    cancelMyOrder,
    getMyOrders
};