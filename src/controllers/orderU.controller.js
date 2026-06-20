const Order = require('../models/order.model');
const Product = require('../models/product.model');
const User = require('../models/user.model');
const Settings = require('../models/settings.model');
const httpStatus = require('../constants/httpStatusText');
const { OrderStatus } = require('../constants/orderStatus');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');
const { validateAndCalculateOrder } = require('../utils/orderHelpers');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Admin: Update order items and prices
const updateOrderContentAdmin = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { items } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(AppError.create('Order not found', 404, httpStatus.FAIL));

    if (order.status === OrderStatus.CANCELLED) {
        return next(AppError.create('Cannot modify a cancelled order. Change status first.', 400, httpStatus.FAIL));
    }

    if (!items || !Array.isArray(items)) {
        return next(AppError.create('Items array is required', 400, httpStatus.FAIL));
    }

    // isAdmin = true allows price overrides from the body
    const { finalItems, totalAmount } = await validateAndCalculateOrder(items, true);

    order.items = finalItems;
    order.totalAmount = totalAmount;
    await order.save();

    // Notify customer about admin update
    await createNotification(order.customerId, {
        title: 'Order Updated',
        message: `Your order has been updated by the admin. New total: ${totalAmount} DZD.`,
        type: 'order_update',
        orderId: order._id
    });

    res.status(200).json(
        new ApiResponse(200, 'Order content updated by admin', order)
    );
});

// @desc    Customer: Update own pending order
const updateMyOrder = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { items } = req.body;
    const userId = req.currentUser.id;
    
    const settings = await Settings.findOne();
    const minRequired = settings ? settings.minOrderAmount : 50000;

    const order = await Order.findById(orderId);
    if (!order) return next(AppError.create('Order not found', 404, httpStatus.FAIL));

    if (order.customerId.toString() !== userId) {
        return next(AppError.create('Access Denied', 403, httpStatus.FAIL));
    }

    if (order.status !== OrderStatus.PENDING) {
        return next(AppError.create(`Cannot edit order in ${order.status} status.`, 400, httpStatus.FAIL));
    }

    const { finalItems, totalAmount } = await validateAndCalculateOrder(items, false);

    if (totalAmount < minRequired) {
        return next(AppError.create(`Minimum order amount is ${minRequired} DZD`, 400, httpStatus.FAIL));
    }

    order.items = finalItems;
    order.totalAmount = totalAmount;
    await order.save();

    res.status(200).json(
        new ApiResponse(200, "Your order has been updated", order)
    );
});

// @desc    Customer: Cancel own pending order
const cancelMyOrder = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.currentUser.id;

    const order = await Order.findById(orderId);
    if (!order) return next(AppError.create('Order not found', 404, httpStatus.FAIL));

    if (order.customerId.toString() !== userId) {
        return next(AppError.create('You can only cancel your own orders', 403, httpStatus.FAIL));
    }

    if (order.status !== OrderStatus.PENDING) {
        return next(AppError.create(`Cannot cancel order. It is already ${order.status}.`, 400, httpStatus.FAIL));
    }

    order.status = OrderStatus.CANCELLED;
    await order.save();

    res.status(200).json(
        new ApiResponse(200, 'Order cancelled successfully', null)
    );
});

// @desc    Admin: Change order status and update financial analytics
const updateOrderStatus = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(AppError.create('Order not found', 404, httpStatus.FAIL));

    const oldStatus = order.status;

    // --- FINANCIAL ANALYTICS LOGIC ---
    // Transitioning to DELIVERED: Increment totals
    if (status === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
        await User.findByIdAndUpdate(order.customerId, { $inc: { totalSpent: order.totalAmount, totalOrders: 1 } });

        const productUpdates = order.items.map(item => 
            Product.findByIdAndUpdate(item.productId, {
                $inc: { 
                    totalSold: item.quantity, 
                    totalRevenue: (item.price * item.quantity) 
                }
            })
        );
        await Promise.all(productUpdates);
    }

    // Reversing DELIVERED (if cancelled/returned): Decrement totals
    if (status !== OrderStatus.DELIVERED && oldStatus === OrderStatus.DELIVERED) {
        await User.findByIdAndUpdate(order.customerId, { $inc: { totalSpent: -order.totalAmount, totalOrders: -1 } });

        const productReversals = order.items.map(item => 
            Product.findByIdAndUpdate(item.productId, {
                $inc: { 
                    totalSold: -item.quantity, 
                    totalRevenue: -(item.price * item.quantity) 
                }
            })
        );
        await Promise.all(productReversals);
    }

    order.status = status;
    // Stamp delivery date when order is marked as Delivered.
    if (status === OrderStatus.DELIVERED && oldStatus !== OrderStatus.DELIVERED) {
        order.deliveredAt = new Date();
    } else if (status !== OrderStatus.DELIVERED && oldStatus === OrderStatus.DELIVERED) {
        order.deliveredAt = null;
    }
    await order.save();

    // Notify customer about status change
    await createNotification(order.customerId, {
        title: 'Order Status Updated',
        message: `Your order status has changed from ${oldStatus} to ${status}.`,
        type: 'order_status',
        orderId: order._id
    });

    res.status(200).json(
        new ApiResponse(200, `Order status updated to ${status}`, order)
    );
});

module.exports = { 
    updateOrderContentAdmin,
    cancelMyOrder,
    updateOrderStatus,
    updateMyOrder
};