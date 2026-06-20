const Order = require('../models/order.model');
const User = require('../models/user.model');
const Settings = require('../models/settings.model');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper'); 
const ApiResponse = require('../utils/apiResponse');
const { validateAndCalculateOrder } = require('../utils/orderHelpers');
const { escapeRegex } = require('../utils/sanitize');

// @desc    Create new order with minimum amount validation
const createOrder = asyncWrapper(async (req, res, next) => {
    const { items , comment } = req.body;
    const user = req.currentUser;
    const settings = await Settings.findOne();
    const minRequired = settings ? settings.minOrderAmount : 50000;

    if (!items || items.length === 0) {
        return next(AppError.create('Order items are required', 400, httpStatus.FAIL));
    }

    const { finalItems, totalAmount } = await validateAndCalculateOrder(items, false);
    
    if (totalAmount < minRequired) {
        return next(AppError.create(
            `Order total must be at least ${minRequired} DZD. Your current total is ${totalAmount} DZD.`,
            400,
            httpStatus.FAIL
        ));
    }

    const newOrder = new Order({
        customerId: user.id,
        items: finalItems,
        totalAmount: totalAmount,
        comment: comment || ''
    });

    await newOrder.save();

    res.status(201).json(
        new ApiResponse(201, "Order placed successfully", newOrder)
    );
});

// @desc    Get all orders with advanced filtering (Admin)
const getAllOrders = asyncWrapper(async (req, res) => {
    const { limit = 10, page = 1, name, status, startDate, endDate } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let filter = {};

    // 1. Filter by Customer Name (Sub-query)
    if (name) {
        const users = await User.find({ 
            username: { $regex: escapeRegex(name), $options: 'i' } 
        }).select('_id');
        filter.customerId = { $in: users.map(u => u._id) };
    }

    // 2. Filter by Date Range
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // 3. Filter by Status
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('customerId', 'username') 
            .populate('items.productId', 'title image')
            .sort({ createdAt: -1 }) 
            .limit(parseInt(limit))
            .skip(skip),
        Order.countDocuments(filter)
    ]);

    const formattedOrders = orders.map(order => {
        const orderObj = order.toObject();
        orderObj.items = orderObj.items.map(item => {
            if (item.productId && typeof item.productId === 'object') {
                item.title = item.title || item.productId.title || '';
                item.image = item.image || item.productId.image || '';
                item.productId = item.productId._id;
            }
            return item;
        });
        return orderObj;
    });

    const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        totalItems: total
    };

    res.status(200).json(
        new ApiResponse(200, "Orders fetched successfully", formattedOrders, pagination)
    );
});

// @desc    Get logged-in user's order history
const getMyOrders = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
        Order.find({ customerId: userId })
            .populate('items.productId', 'title image')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip),
        Order.countDocuments({ customerId: userId })
    ]);

    const formattedOrders = orders.map(order => {
        const orderObj = order.toObject();
        orderObj.items = orderObj.items.map(item => {
            if (item.productId && typeof item.productId === 'object') {
                item.title = item.title || item.productId.title || '';
                item.image = item.image || item.productId.image || '';
                item.productId = item.productId._id;
            }
            return item;
        });
        return orderObj;
    });

    const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        totalItems: total
    };

    res.status(200).json(
        new ApiResponse(200, "Your orders fetched successfully", formattedOrders, pagination)
    );
});

module.exports = {
    createOrder,
    getAllOrders,
    getMyOrders
};