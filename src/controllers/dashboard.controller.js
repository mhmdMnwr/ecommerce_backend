
const Order = require('../models/order.model');
const User = require('../models/user.model');
const asyncWrapper = require('../middleware/asyncWrapper');
const httpStatus = require('../constants/httpStatusText');
const {OrderStatus} = require('../constants/orderStatus');
const {Roles} = require('../constants/roles');

const getTotalsWithGrowth = asyncWrapper(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const status = OrderStatus.PENDING;
    const customer = Roles.CUSTOMER;

    const [allTimeStats, currentPeriod, previousPeriod, clientStats] = await Promise.all([
        // 1. Grand Totals (All Time)
        Order.aggregate([
            { $match: { status: status } },
            { $group: { _id: null, totalRev: { $sum: "$totalAmount" }, totalCount: { $sum: 1 } } }
        ]),
        // 2. Current Month (Last 30 days)
        Order.aggregate([
            { $match: { status: status, updatedAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, rev: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        // 3. Previous Month (30-60 days ago)
        Order.aggregate([
            { $match: { status: status, updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: { _id: null, rev: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        // 4. Clients (Total vs New)
        Promise.all([
            User.countDocuments({ role: customer }), // All time clients
            User.countDocuments({ role: customer, createdAt: { $gte: thirtyDaysAgo } }), // New this month
            User.countDocuments({ role: customer, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }) // New last month
        ])
    ]);

    // Data Extraction
    const total = allTimeStats[0] || { totalRev: 0, totalCount: 0 };
    const curr = currentPeriod[0] || { rev: 0, count: 0 };
    const prev = previousPeriod[0] || { rev: 0, count: 0 };
    const [totalClients, newClientsCurr, newClientsPrev] = clientStats;

    // Growth Helper
    const calcGrowth = (c, p) => {
        if (p === 0) return c > 0 ? 100 : 0;
        return (((c - p) / p) * 100).toFixed(2);
    };

    res.status(200).json({
        status: httpStatus.SUCCESS,
        data: {
            revenue: {
                total: total.totalRev,
                growth: calcGrowth(curr.rev, prev.rev)
            },
            orders: {
                total: total.totalCount,
                growth: calcGrowth(curr.count, prev.count)
            },
            clients: {
                total: totalClients,
                growth: calcGrowth(newClientsCurr, newClientsPrev)
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
                    status: OrderStatus.PENDING, 
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
        status: httpStatus.SUCCESS,
        info: {
            selectedRange: range || 'week',
            selectedType: type || 'revenue'
        },
        data: { result }
    });
});



const getTopProductsAnalytics = asyncWrapper(async (req, res) => {
    // 1. Get parameters from URL: ?limit=10&type=revenue
    const limit = parseInt(req.query.limit)<15 ? parseInt(req.query.limit) : 5; 
    const type = req.query.type === 'revenue' ? 'totalRevenue' : 'totalQty';

    const topProducts = await Order.aggregate([
    { $match: { status: OrderStatus.PENDING } },
    { $unwind: "$items" },
    {
        $group: {
            _id: "$items.productId",
            // We sum qty and revenue first to keep the group small
            totalQty: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
    },
    // --- START POPULATION ---
    {
        $lookup: {
            from: "products",       
            localField: "_id",      
            foreignField: "_id",    
            as: "productDetails"    
        }
    },
    { $unwind: "$productDetails" }, 
  
    
    {
        $addFields: {
            title: "$productDetails.title" // Extract the title
        }
    },
    { $sort: { [type]: -1 } },
    { $limit: limit },
    
    // Part 3: Percentage Calculation
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
            title: "$allProducts.title",
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
        status: httpStatus.SUCCESS,
        data: { topProducts }
    });
});


const getTopClients = asyncWrapper(async (req, res) => {
    // 1. Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy === 'revenue' ? 'totalSpent' : 'totalOrders';

    // 2. Query the User model
    // We already have totalSpent and totalOrders in the User model (from our earlier step!)
    const clients = await User.find({ role: Roles.CUSTOMER }) // Filter out other Admins
        .select('username totalSpent totalOrders')
        .sort({ [sortBy]: -1 }) // Sort descending (Highest first)
        .skip(skip)
        .limit(limit);

    // 3. Get total count for pagination math on frontend
    const totalClients = await User.countDocuments({ role: Roles.CUSTOMER });

    res.status(200).json({
        status: httpStatus.SUCCESS,
        pagination:{
            limit,
            page,
            totalPages: Math.ceil(totalClients / limit)
        },
        data: clients.map(user => ({
            name: user.username,
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
        { $match: { status: OrderStatus.PENDING } },
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
        status: httpStatus.SUCCESS,
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
