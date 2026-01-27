const express = require('express');
const orderCRController = require('../controllers/orderCR.controller');
const orderUController = require('../controllers/orderU.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');

router.use(verifyToken);

// 1. Base routes
router.route('/')
    .get(checkPermission('orders'), orderCRController.getAllOrders)
    .post(allowedTo('customer'), orderCRController.createOrder);

// 2. Customer specific list (No orderId needed in URL, uses Token)
router.route('/my-orders')
    .get(allowedTo('customer'), orderCRController.getMyOrders);

// 3. Specific Order Actions (Changed :id to :orderId to match your controller)
router.route('/:orderId/updateStatus')
    .patch(checkPermission('orders'), orderUController.updateOrderStatus);

router.route('/:orderId/updateContent')
    .patch(checkPermission('orders'), orderUController.updateOrderContentAdmin);

router.route('/:orderId/updateMyOrder')
    .patch(allowedTo('customer'), orderUController.updateMyOrder);

router.route('/:orderId/cancelMyOrder')
    .patch(allowedTo('customer'), orderUController.cancelMyOrder);

module.exports = router;