
const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const userController = require('../controllers/user.controller');
const router = express.Router();
const allowedTo = require('../middleware/allowedTo');
const { Roles } = require('../constants/roles');
const rateLimit = require('express-rate-limit');

// Stricter rate limits for auth endpoints
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: 'FAIL', message: 'Too many login attempts, please try again later.', data: null }
});

const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { status: 'FAIL', message: 'Too many registration attempts, please try again later.', data: null }
});

router.route('/')
    .get(verifyToken , allowedTo(Roles.ADMIN , Roles.MANAGER), userController.getAllUsers);

router.route('/login')
    .post(loginLimiter, userController.login);

router.route('/refresh-token')
    .post(userController.refreshToken);

router.route('/me')
    .get(verifyToken,allowedTo(Roles.CUSTOMER, Roles.MANAGER, Roles.ADMIN), userController.getMe)
    .patch(verifyToken, allowedTo(Roles.CUSTOMER), userController.updateMe);   

    router.route('/registerCustomer')
    .post(registerLimiter, userController.registerCustomer);

    router.route('/createManagerByAdmin' )
    .post(verifyToken, allowedTo(Roles.ADMIN), userController.createManagerByAdmin);


router.route('/updateManager/:managerId')
    .patch(verifyToken, allowedTo(Roles.ADMIN), userController.updateManagerById);

router.route('/toggleStatus/:userId')
    .patch(verifyToken, allowedTo(Roles.ADMIN), userController.toggleUserStatus);

module.exports = router;