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

    // 1. Fetch all products in parallel and build the order items array
    const orderItems = await Promise.all(items.map(async (item) => {
        const product = await Product.findById(item.productId);
        
        if (!product) {
            throw AppError.create(`Product ${item.productId} not found`, 404, httpStatus.FAIL);
        }

        // Return a clean snapshot of the product + the requested quantity
        // We use ._doc or .toObject() to get the raw data
        const productData = product.toObject();

        return {
            productId: productData._id,
            name: productData.name,
            price: productData.price,
            units: productData.units,
            quantity: item.quantity
        };
    }));

    // 2. Calculate total amount
    const totalAmount = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // 3. Save to Database
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

    // 1. Search by Name (Case-insensitive regex)
    if (name) {
        // This assumes 'customerName' is a field in your Order model
        filter.customerName = { $regex: name, $options: 'i' }; 
    }

    // 2. Search by Creation Date Range
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate); // Greater than or equal
        if (endDate) filter.createdAt.$lte = new Date(endDate);     // Less than or equal
    }

    // 3. Fetch orders with Filter, Sort (Name DESC), and Pagination
    const orders = await Order.find(filter)
        .sort({ customerName: -1 }) // -1 for Descending
        .limit(parseInt(limit))
        .skip(skip);

    // 4. Get total count for pagination metadata
    const total = await Order.countDocuments(filter);

    res.json({
        status: 'success',
        results: orders.length,
        total,
        data: { orders }
    });
});


//update status of order 


const updateOrderStatus = asyncWrapper(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate that status is provided
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

    res.status(200).json({ status: 'success', data: { order } });
});

//update order content
const updateOrderContent = asyncWrapper(async (req, res) => {
    const { orderId } = req.params;
    const { items } = req.body;
    const user = req.currentUser;

    // 1. Find the order first
    const order = await Order.findById(orderId);
    if (!order) {
        throw AppError.create('Order not found', 404, httpStatus.FAIL);
    }

    // 2. Prevent changes if order is in a final state
    const lockedStates = ['delivered', 'cancelled'];
    if (lockedStates.includes(order.status)) {
        throw AppError.create(
            `Cannot modify items because the order is already ${order.status}`, 
            400, 
            httpStatus.FAIL
        );
    }

    // 3. Basic validation
    if (!items || !Array.isArray(items)) {
        throw AppError.create('Items array is required', 400, httpStatus.FAIL);
    }

    // 4. Calculate new items and total
    const canOverridePrice = ['sup_admin', 'upper_manager', 'manager'].includes(user.role);
    let newTotalAmount = 0;
    const updatedItems = [];

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
            throw AppError.create(`Product ${item.productId} not found`, 404);
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

    // 5. Update the existing order object and save
    // This avoids the "redeclare" error because we are not using 'const' again
    order.items = updatedItems;
    order.totalAmount = newTotalAmount;
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({ 
        status: 'success', 
        data: { order } 
    });
});

module.exports = {
    createOrder,
    getAllOrders,
    updateOrderStatus,
    updateOrderContent
};