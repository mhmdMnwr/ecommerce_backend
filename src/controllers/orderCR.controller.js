const httpStatus = require('../utils/httpStatusText');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper'); 
const {validateAndCalculateOrder} = require('../utils/orderHelpers');


/**
 * 1. CREATE ORDER
 * Logic: Snapshots product data and calculates initial total.
 */
const createOrder = asyncWrapper(async (req, res, next) => {
    const { items } = req.body;
    const user = req.currentUser;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return next(AppError.create('Order items are required', 400, httpStatus.FAIL));
    }

    const { finalItems, totalAmount } = await validateAndCalculateOrder(items, false);
        
       

    const newOrder = new Order({
        customerId: user.id,
        customerName: user.username, // Denormalized for easier querying
        items: finalItems,
        totalAmount: totalAmount
    });

    await newOrder.save();

    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: { order: newOrder }
    });
});

/**
 * 2. GET ALL ORDERS (For Admins/Managers)
 * Logic: Includes filtering by customer name and date range with pagination.
 */
const getAllOrders = asyncWrapper(async (req, res) => {
    const { limit = 10, page = 1, name, startDate, endDate } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let filter = {};

    // Filter by denormalized customer name
    if (name) {
        filter.customerName = { $regex: name, $options: 'i' }; 
    }

    // Filter by Date Range
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Run both queries in parallel for better speed
    const [orders, total] = await Promise.all([
        Order.find(filter)
            .sort({ createdAt: -1 }) 
            .limit(parseInt(limit))
            .skip(skip),
        Order.countDocuments(filter)
    ]);

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

/**
 * 3. GET MY ORDERS (For Customers)
 * Logic: Returns only orders belonging to the logged-in user.
 */
const getMyOrders = asyncWrapper(async (req, res) => {
    const userId = req.currentUser.id;
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
        Order.find({ customerId: userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip),
        Order.countDocuments({ customerId: userId })
    ]);

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
    getMyOrders
};