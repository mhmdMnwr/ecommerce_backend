
const Order = require('../models/order.model');
const User = require('../models/user.model');
const asyncWrapper = require('../middleware/asyncWrapper');
const httpStatus = require('../constants/httpStatusText');

const getTotalsWithGrowth = asyncWrapper(async (req, res) => {
    const now = new Date();
    
    // Define the two 30-day blocks
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    const [currentStats, previousStats] = await Promise.all([
        // Block 1: Last 30 days
        Order.aggregate([
            { $match: { status: 'delivered', updatedAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, rev: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        // Block 2: 30 days before that
        Order.aggregate([
            { $match: { status: 'delivered', updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: { _id: null, rev: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ])
    ]);

    const curr = currentStats[0] || { rev: 0, count: 0 };
    const prev = previousStats[0] || { rev: 0, count: 0 };

    // Smart Percentage Logic
    const calcGrowth = (c, p) => {
        if (p === 0) return c > 0 ? 100 : 0; // If prev was 0 and now we have sales, that's 100% growth
        return (((c - p) / p) * 100).toFixed(2);
    };

    res.status(200).json({
        status: "success",
        data: {
            revenue: {
                total: curr.rev,
                growth: calcGrowth(curr.rev, prev.rev)
            },
            orders: {
                total: curr.count,
                growth: calcGrowth(curr.count, prev.count)
            }
        }
    });
});

const getAnalytics = asyncWrapper(async (req, res) => {
    const { range, type } = req.query; // range: 'week'|'year', type: 'revenue'|'orders'|'clients'
    
    const now = new Date();
    let startDate;
    let groupFormat;

    // 1. Set Timeframe
    if (range === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        groupFormat = "%Y-%m"; // Groups by Month
    } else {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        groupFormat = "%Y-%m-%d"; // Groups by Day
    }

    let result;

    // 2. Selective Logic based on "type"
    if (type === 'clients') {
        // Query the User Model
        result = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                    value: { $sum: 1 } // Count registrations
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    } else {
        // Query the Order Model (for revenue or orders)
        const valueExpression = type === 'revenue' ? "$totalAmount" : 1;
        
        result = await Order.aggregate([
            { 
                $match: { 
                    status: 'delivered', 
                    updatedAt: { $gte: startDate } 
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$updatedAt" } },
                    value: { $sum: valueExpression }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    }

    res.status(200).json({
        status: "success",
        info: {
            selectedRange: range || 'week',
            selectedType: type || 'revenue'
        },
        data: { result }
    });
});



const getTopProductsAnalytics = asyncWrapper(async (req, res) => {
    // 1. Get parameters from URL: ?limit=10&type=revenue
    const limit = parseInt(req.query.limit) || 5; 
    const type = req.query.type === 'revenue' ? 'totalRevenue' : 'totalQty';

    const topProducts = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                totalQty: { $sum: "$items.quantity" },
                totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
            }
        },
        // 2. Sort based on the user's choice (Qty or Revenue)
        { $sort: { [type]: -1 } },
        { $limit: limit },
        
        // 3. Optional: Calculate the sum of these Top X products to get percentages
        {
            $group: {
                _id: null,
                allProducts: { $push: "$$ROOT" },
                combinedTotal: { $sum: `$${type}` }
            }
        },
        { $unwind: "$allProducts" },
        {
            $project: {
                _id: "$allProducts._id",
                name: "$allProducts.name",
                value: `$allProducts.${type}`,
                percentage: { 
                    $multiply: [
                        { $divide: [`$allProducts.${type}`, "$combinedTotal"] }, 
                        100 
                    ] 
                }
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        data: { topProducts }
    });
});


const getTopClients = asyncWrapper(async (req, res) => {
    // 1. Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy === 'revenue' ? 'totalSpent' : 'totalOrders';

    // 2. Query the User model
    // We already have totalSpent and totalOrders in the User model (from our earlier step!)
    const clients = await User.find({ role: 'USER' }) // Filter out other Admins
        .select('firstName lastName email totalSpent totalOrders')
        .sort({ [sortBy]: -1 }) // Sort descending (Highest first)
        .skip(skip)
        .limit(limit);

    // 3. Get total count for pagination math on frontend
    const totalClients = await User.countDocuments({ role: 'USER' });

    res.status(200).json({
        status: "success",
        results: clients.length,
        totalClients,
        currentPage: page,
        totalPages: Math.ceil(totalClients / limit),
        data: clients.map(user => ({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            value: user[sortBy] // Returns either the amount or the count based on the filter
        }))
    });
});


const getRevenueReport = asyncWrapper(async (req, res) => {
    const { interval, page = 1, limit = 10 } = req.query; // interval: 'day' | 'month' | 'year'
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let groupFormat;

    // 1. Determine the grouping format based on the interval
    switch (interval) {
        case 'year':
            groupFormat = "%Y";       // e.g., "2026"
            break;
        case 'month':
            groupFormat = "%Y-%m";    // e.g., "2026-01"
            break;
        default: // 'day'
            groupFormat = "%Y-%m-%d"; // e.g., "2026-01-27"
    }

    // 2. The Main Aggregation
    const stats = await Order.aggregate([
        { $match: { status: 'delivered' } },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$updatedAt" } },
                revenue: { $sum: "$totalAmount" },
                ordersCount: { $sum: 1 }
            }
        },
        { $sort: { "_id": -1 } }, // Newest first
        
        // 3. Facet for Pagination (Allows us to get total count and data in one query)
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: parseInt(limit) }]
            }
        }
    ]);

    // 4. Clean up the response format
    const totalRecords = stats[0].metadata[0]?.total || 0;
    const resultData = stats[0].data;

    res.status(200).json({
        status: "success",
        pagination: {
            totalRecords,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / limit)
        },
        data: { resultData }
    });
});

module.exports = {
    getTotalsWithGrowth,
    getAnalytics,
    getTopProductsAnalytics,
    getTopClients,
    getRevenueReport
};