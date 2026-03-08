const express = require('express');
const orderCRController = require('../controllers/orderCR.controller');
const orderUController = require('../controllers/orderU.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const { Roles } = require('../constants/roles');

router.use(verifyToken);

// 1. Base routes
router.route('/')
    .get(allowedTo(Roles.ADMIN , Roles.MANAGER), orderCRController.getAllOrders)
    .post(allowedTo(Roles.CUSTOMER), orderCRController.createOrder);

// 2. Customer specific list (No orderId needed in URL, uses Token)
router.route('/my-orders')
    .get(allowedTo(Roles.CUSTOMER), orderCRController.getMyOrders);

// 3. Specific Order Actions (Changed :id to :orderId to match your controller)
router.route('/updateStatus/:orderId')
    .patch(allowedTo(Roles.ADMIN, Roles.MANAGER), orderUController.updateOrderStatus);

router.route('/updateContent/:orderId')
    .patch(allowedTo(Roles.ADMIN, Roles.MANAGER), orderUController.updateOrderContentAdmin);

router.route('/updateMyOrder/:orderId')
    .patch(allowedTo(Roles.CUSTOMER), orderUController.updateMyOrder);

router.route('/cancelMyOrder/:orderId')
    .patch(allowedTo(Roles.CUSTOMER), orderUController.cancelMyOrder);
module.exports = router;