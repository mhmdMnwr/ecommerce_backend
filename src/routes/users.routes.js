
const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const userController = require('../controllers/user.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const allowedTo = require('../middleware/allowedTo');

router.route('/')
    .get(verifyToken ,checkPermission('users'), userController.getAllUsers);

 

router.route('/login')
    .post(userController.login);

router.route('/refresh-token')
    .post(userController.refreshToken);

router.route('/me')
    .get(verifyToken, userController.getMe);   

    router.route('/registerCustomer')
    .post(userController.registerCustomer);

    router.route('/createAdminBySuper' )
    .post(verifyToken, checkPermission('users') , allowedTo('sup_admin'), userController.createAdminBySuper);

    router.route('/updateUserRole' )
    .put(verifyToken, checkPermission('users') , allowedTo('sup_admin'), userController.updateUserRole);

module.exports = router;