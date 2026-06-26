const Order = require('../models/order.model');
const User = require('../models/user.model');
const asyncWrapper = require('../middleware/asyncWrapper');
const httpStatus = require('../constants/httpStatusText');
const { OrderStatus } = require('../constants/orderStatus');
const { Roles } = require('../constants/roles');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get dashboard summary tiles with 30-day growth percentages
const getTotalsWithGrowth = asyncWrapper(async (req, res) => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);
    
    const status = OrderStatus.DELIVERED;
    const customer = Roles.CUSTOMER;

    const [allTimeStats, currentPeriod, previousPeriod, clientStats] = await Promise.all([
        Order.aggregate([
            { $match: { status: status } },
            { $group: { _id: null, totalRev: { $sum: "$totalAmount" }, totalCount: { $sum: 1 } } }
        ]),
        Order.aggregate([
            { $match: { status: status, updatedAt: { $gte: thirtyDaysAgo } } },
            { $group: { _id: null, rev: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        Order.aggregate([
            { $match: { status: status, updatedAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
            { $group: { _id: null, rev: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
        ]),
        Promise.all([
            User.countDocuments({ role: customer }),
            User.countDocuments({ role: customer, createdAt: { $gte: thirtyDaysAgo } }),
            User.countDocuments({ role: customer, createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
        ])
    ]);

    const total = allTimeStats[0] || { totalRev: 0, totalCount: 0 };
    const curr = currentPeriod[0] || { rev: 0, count: 0 };
    const prev = previousPeriod[0] || { rev: 0, count: 0 };
    const [totalClients, newClientsCurr, newClientsPrev] = clientStats;

    const calcGrowth = (c, p) => {
        if (p === 0) return c > 0 ? 100 : 0;
        return parseFloat((((c - p) / p) * 100).toFixed(2));
    };

    const dashboardData = {
        revenue: {
            total: parseFloat(total.totalRev.toFixed(2)),
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
    };

    res.status(200).json(
        new ApiResponse(200, "Dashboard totals calculated", dashboardData)
    );
});

// @desc    Get chart data for revenue, orders, or client registrations
// @query   range: 'week' | 'month' | 'year' | 'all'
// @query   type: 'revenue' | 'orders' | 'clients'
const getAnalytics = asyncWrapper(async (req, res) => {
    const { range = 'week', type = 'revenue' } = req.query; 
    const now = new Date();
    let startDate = null;
    let groupFormat;

    switch (range) {
        case 'all':
            startDate = null; // No date filter
            groupFormat = "%Y"; // Group by year
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of current year
            groupFormat = "%Y-%m"; // Group by month
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
            groupFormat = "%Y-%m-%d"; // Group by day
            break;
        case 'week':
        default:
            startDate = new Date();
            startDate.setDate(now.getDate() - 7); // Last 7 days
            groupFormat = "%Y-%m-%d"; // Group by day
            break;
    }

    let result;
    if (type === 'clients') {
        const matchStage = startDate 
            ? { $match: { role: Roles.CUSTOMER, createdAt: { $gte: startDate } } }
            : { $match: { role: Roles.CUSTOMER } };
        
        result = await User.aggregate([
            matchStage,
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                    value: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    } else {
        const valueExpression = type === 'revenue' ? "$totalAmount" : 1;
        const matchStage = startDate 
            ? { $match: { status: OrderStatus.DELIVERED, updatedAt: { $gte: startDate } } }
            : { $match: { status: OrderStatus.DELIVERED } };
        
        result = await Order.aggregate([
            matchStage,
            {
                $group: {
                    _id: { $dateToString: { format: groupFormat, date: "$updatedAt" } },
                    value: { $sum: valueExpression }
                }
            },
            { $sort: { "_id": 1 } }
        ]);
    }

    res.status(200).json(
        new ApiResponse(200, "Analytics data fetched", result, {
            range,
            type
        })
    );
});

// @desc    Get top products by revenue or quantity with percentage of total
const getTopProductsAnalytics = asyncWrapper(async (req, res) => {
    const limit = parseInt(req.query.limit) < 15 ? parseInt(req.query.limit) : 5; 
    const type = req.query.type === 'revenue' ? 'totalRevenue' : 'totalQty';

    const topProducts = await Order.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                totalQty: { $sum: "$items.quantity" },
                totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "productDetails"
            }
        },
        { $unwind: "$productDetails" }, 
        { $addFields: { title: "$productDetails.title" } },
        { $sort: { [type]: -1 } },
        { $limit: limit },
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
                    $round: [
                        { $multiply: [{ $divide: [`$allProducts.${type}`, "$combinedTotal"] }, 100] }, 
                        2
                    ]
                }
            }
        }
    ]);

    res.status(200).json(
        new ApiResponse(200, "Top products analytics fetched", topProducts)
    );
});

// @desc    Get top spending or most active clients
const getTopClients = asyncWrapper(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy === 'revenue' ? 'totalSpent' : 'totalOrders';

    const clients = await User.find({ role: Roles.CUSTOMER })
        .select('username totalSpent totalOrders')
        .sort({ [sortBy]: -1 })
        .skip(skip)
        .limit(limit);

    const totalClients = await User.countDocuments({ role: Roles.CUSTOMER });

    const formattedClients = clients.map(user => ({
        name: user.username,
        value: parseFloat(user[sortBy].toFixed(2))
    }));

    res.status(200).json(
        new ApiResponse(200, "Top clients fetched", formattedClients, {
            page,
            limit,
            totalPages: Math.ceil(totalClients / limit)
        })
    );
});

// @desc    Get detailed revenue report grouped by day/month/year
const getRevenueReport = asyncWrapper(async (req, res) => {
    const { interval, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let groupFormat;

    switch (interval) {
        case 'year': groupFormat = "%Y"; break;
        case 'month': groupFormat = "%Y-%m"; break;
        default: groupFormat = "%Y-%m-%d";
    }

    const stats = await Order.aggregate([
        { $match: { status: OrderStatus.DELIVERED } },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$updatedAt" } },
                revenue: { $sum: "$totalAmount" },
                ordersCount: { $sum: 1 }
            }
        },
        { $sort: { "_id": -1 } },
        {
            $facet: {
                metadata: [{ $count: "total" }],
                data: [{ $skip: skip }, { $limit: parseInt(limit) }]
            }
        }
    ]);

    const totalRecords = stats[0].metadata[0]?.total || 0;
    const resultData = stats[0].data;

    res.status(200).json(
        new ApiResponse(200, "Revenue report generated", resultData, {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit)
        })
    );
});

module.exports = {
    getTotalsWithGrowth,
    getAnalytics,
    getTopProductsAnalytics,
    getTopClients,
    getRevenueReport
};