const express = require('express');
const orderController = require('../controllers/order.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);

// 1. Base routes
router.route('/')
    .get(checkPermission('orders'), orderController.getAllOrders)
    .post(orderController.createOrder);

// 2. Customer specific list (No orderId needed in URL, uses Token)
router.route('/my-orders')
    .get(orderController.getMyOrders);

// 3. Specific Order Actions (Changed :id to :orderId to match your controller)
router.route('/:orderId/updateStatus')
    .patch(checkPermission('orders'), orderController.updateOrderStatus);

router.route('/:orderId/updateContent')
    .patch(checkPermission('orders'), orderController.updateOrderContent);

router.route('/:orderId/cancelMyOrder')
    .patch(orderController.cancelMyOrder);

module.exports = router;