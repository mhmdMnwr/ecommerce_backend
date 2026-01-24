
const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const userController = require('../controllers/user.controller');
const router = express.Router();

router.route('/')
    .get( userController.getAllUsers);

router.route('/register')
    .post( userController.register);    

router.route('/login')
    .post(userController.login);

router.route('/refresh-token')
    .post(userController.refreshToken);

router.route('/me')
    .get(verifyToken, userController.getMe);   

module.exports = router;