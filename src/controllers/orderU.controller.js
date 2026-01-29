

const {validateAndCalculateOrder} = require('../utils/orderHelpers');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const AppError = require('../constants/appErrors');
const httpStatus = require('../constants/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');


const updateOrderContentAdmin = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { items } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        return next(AppError.create('Order not found', 404, httpStatus.FAIL));
    }

    // Protection: Even admins shouldn't edit a cancelled order without re-opening it
    if (order.status === 'cancelled') {
        return next(AppError.create('Cannot modify a cancelled order. Change status first.', 400, httpStatus.FAIL));
    }

    if (!items || !Array.isArray(items)) {
        return next(AppError.create('Items array is required', 400, httpStatus.FAIL));
    }

    
    const { finalItems, totalAmount } = await validateAndCalculateOrder(items, true);

    // Update the order
    order.items = finalItems;
    order.totalAmount = totalAmount;
    order.updatedAt = Date.now();

    await order.save();

    res.status(200).json({
        status: httpStatus.SUCCESS,
        message: 'Order updated successfully by admin',
        data: { order }
    });
});

const updateMyOrder = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { items } = req.body;
    const userId = req.currentUser.id;

    const order = await Order.findById(orderId);
    if (!order) return next(AppError.create('Order not found', 404, httpStatus.FAIL));

    // A. Verify Ownership
    if (order.customerId.toString() !== userId) {
        return next(AppError.create('Access Denied', 403, httpStatus.FAIL));
    }

    // B. Verify State (YOUR LOGIC: Check state before calling the function)
    if (order.status !== 'pending') {
        return next(AppError.create(`Cannot edit order in ${order.status} status.`, 400, httpStatus.FAIL));
    }

    // C. Call helper with isAdmin = false (Safety switch: ignores prices in req.body)
    const { finalItems, totalAmount } = await validateAndCalculateOrder(items, false);

    order.items = finalItems;
    order.totalAmount = totalAmount;
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({ status: httpStatus.SUCCESS, data: { order } });
});


const cancelMyOrder = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const userId = req.currentUser.id;

    const order = await Order.findById(orderId);

    if (!order) {
        return next(AppError.create('Order not found', 404, httpStatus.FAIL));
    }

    // 1. Ownership Check
    if (order.customerId.toString() !== userId) {
        return next(AppError.create('You can only cancel your own orders', 403, httpStatus.FAIL));
    }

    // 2. Status Constraint (Strict)
    // If it's already "processing", "shipped", or "delivered", the customer can't touch it.
    if (order.status !== 'pending') {
        return next(AppError.create(
            `Cannot cancel order. It is already ${order.status}. Please contact support.`, 
            400, 
            httpStatus.FAIL
        ));
    }

    // 3. Update the state
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({ 
        status: httpStatus.SUCCESS, 
        message: 'Order cancelled successfully' 
    });
});


const updateOrderStatus = asyncWrapper(async (req, res, next) => {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(AppError.create('Order not found', 404, httpStatus.FAIL));

    const oldStatus = order.status;

    // --- CASE A: DELIVERED (Money IN) ---
    if (status === 'delivered' && oldStatus !== 'delivered') {
        
        await User.findByIdAndUpdate(order.customerId, { 
            $inc: { totalSpent: order.totalAmount } 
        });

        const productUpdates = order.items.map(item => {
            return Product.findByIdAndUpdate(item.productId, {
                $inc: { 
                    totalSold: item.quantity, 
                    totalRevenue: (item.price * item.quantity) 
                }
            });
        });
        await Promise.all(productUpdates);
    }

    // --- CASE B: CANCELLED AFTER DELIVERY (Money OUT) ---
    if (status === 'cancelled' && oldStatus === 'delivered') {
        // USE customerId HERE
        await User.findByIdAndUpdate(order.customerId, { 
            $inc: { totalSpent: -order.totalAmount } 
        });

        const productReversals = order.items.map(item => {
            return Product.findByIdAndUpdate(item.productId, {
                $inc: { 
                    totalSold: -item.quantity, 
                    totalRevenue: -(item.price * item.quantity) 
                }
            });
        });
        await Promise.all(productReversals);
    }

    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    res.status(200).json({ 
        status: httpStatus.SUCCESS, 
        message: `Order status updated to ${status}`,
        data: { order } 
    });
});

module.exports = { 
    updateOrderContentAdmin,
    cancelMyOrder,
    updateOrderStatus,
    updateMyOrder
 };