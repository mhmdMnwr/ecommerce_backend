
const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const userController = require('../controllers/user.controller');
const router = express.Router();
const allowedTo = require('../middleware/allowedTo');
const { Roles } = require('../constants/roles');

router.route('/')
    .get(verifyToken , allowedTo(Roles.ADMIN , Roles.MANAGER), userController.getAllUsers);

 

router.route('/login')
    .post(userController.login);

router.route('/refresh-token')
    .post(userController.refreshToken);

router.route('/me')
    .get(verifyToken,allowedTo(Roles.CUSTOMER, Roles.MANAGER, Roles.ADMIN), userController.getMe)
    .patch(verifyToken, allowedTo(Roles.CUSTOMER), userController.updateMe);   

    router.route('/registerCustomer')
    .post(userController.registerCustomer);

    router.route('/createManagerByAdmin' )
    .post(verifyToken, allowedTo(Roles.ADMIN), userController.createManagerByAdmin);


router.route('/updateManager/:managerId')
    .patch(verifyToken, allowedTo(Roles.ADMIN), userController.updateManagerById);

router.route('/toggleStatus/:userId')
    .patch(verifyToken, allowedTo(Roles.ADMIN), userController.toggleUserStatus);

module.exports = router;