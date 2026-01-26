const express = require('express');
const orderController = require('../controllers/order.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const verifyToken = require('../middleware/verifyToken');



router.route('/').get(verifyToken, checkPermission('orders'), orderController.getAllOrders)
    .post(verifyToken, orderController.createOrder);

router.route('/:id/updateStatus')
    .patch(verifyToken, orderController.updateOrderStatus);

router.route('/:id/updateContent')
    .patch(verifyToken, checkPermission('orders'), orderController.updateOrderContent);

module.exports = router;