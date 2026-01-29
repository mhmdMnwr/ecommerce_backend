
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const dashboardController = require('../controllers/dashboard.controller');
const { Roles } = require('../constants/roles');
const allowedTo = require('../middleware/allowedTo');



router.use(verifyToken , allowedTo(Roles.ADMIN)) 




router.route('/getTotalsWithGrowth').get(dashboardController.getTotalsWithGrowth);
router.route('/getAnalytics').get(dashboardController.getAnalytics);
router.route('/getRevenueReport').get(dashboardController.getRevenueReport);
router.route('/getTopProductsAnalytics').get(dashboardController.getTopProductsAnalytics);
router.route('/getTopClients').get(dashboardController.getTopClients);


module.exports = router;