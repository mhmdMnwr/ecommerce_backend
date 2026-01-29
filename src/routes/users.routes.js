
const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const userController = require('../controllers/user.controller');
const router = express.Router();
const allowedTo = require('../middleware/allowedTo');
const { ROLES } = require('../config/permissions');

router.route('/')
    .get(verifyToken , allowedTo(ROLES.ADMIN), userController.getAllUsers);

 

router.route('/login')
    .post(userController.login);

router.route('/refresh-token')
    .post(userController.refreshToken);

router.route('/me')
    .get(verifyToken,allowedTo(ROLES.CUSTOMER, ROLES.MANAGER, ROLES.ADMIN), userController.getMe);   

    router.route('/registerCustomer')
    .post(userController.registerCustomer);

    router.route('/createManagerByAdmin' )
    .post(verifyToken, allowedTo(ROLES.ADMIN), userController.createManagerByAdmin);


router.route('/:userId/toggleStatus')
    .patch(verifyToken, allowedTo(ROLES.ADMIN), userController.toggleUserStatus);

module.exports = router;