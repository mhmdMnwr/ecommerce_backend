const httpStatus = require('../constants/httpStatusText');
const Order = require('../models/order.model');
const AppError = require('../constants/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper'); 
const {validateAndCalculateOrder} = require('../utils/orderHelpers');
const User = require('../models/user.model');
const Settings = require('../models/settings.model');



const createOrder = asyncWrapper(async (req, res, next) => {
    const { items } = req.body;
    const user = req.currentUser;
    const settings = await Settings.findOne();
    const minRequired = settings ? settings.minOrderAmount : 50000;

    if (!items) {
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
        totalAmount: totalAmount
    });

    await newOrder.save();

    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: { order: newOrder }
    });
});


const getAllOrders = asyncWrapper(async (req, res) => {
    const { limit = 10, page = 1, name, status, startDate, endDate } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let filter = {};

    // Filter by Customer Name
    if (name) {
        const users = await User.find({ 
            username: { $regex: name, $options: 'i' } 
        }).select('_id');

        const userIds = users.map(u => u._id);

        filter.customerId = { $in: userIds };
    }

    // Filter by Date Range
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Filter by Status
    if (status) {
        filter.status = status;
    }

    // Run queries in parallel
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('customerId', 'username ') 
            .sort({ createdAt: -1 }) 
            .limit(limit)
            .skip(skip),
        Order.countDocuments(filter)
    ]);

    res.json({
        status: httpStatus.SUCCESS,
        results: orders.length,
        data: { 
            
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        },
        data: { orders }
    });
});

/**
 * 3. GET MY ORDERS (For Customers)
 * Logic: Returns only orders belonging to the logged-in user.
 */
const getMyOrders = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        Order.find({ customerId: userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip),
        Order.countDocuments({ customerId: userId })
    ]);

    res.json({
        status: httpStatus.SUCCESS,
        results: orders.length,
        data: { 
            pagination: {
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
            
        },
        data: { orders }
    });
});

module.exports = {
    createOrder,
    getAllOrders,
    getMyOrders
};