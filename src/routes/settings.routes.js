const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const settingsController = require('../controllers/settings.controller');
const { Roles } = require('../constants/roles');



// Public or Customer-accessible routes
router.route('/').get(verifyToken, settingsController.getSettings);
router.route('/getCurrentAmount').get(verifyToken, settingsController.getCurrentMinOrderAmount);

// Admin-only routes
router.use(verifyToken, allowedTo(Roles.ADMIN));
router.route('/updateAmount').patch(settingsController.updateMinOrderAmount);
router.route('/updateShopInfo').patch(settingsController.updateShopInfo);

module.exports = router;