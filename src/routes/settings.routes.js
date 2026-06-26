const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const settingsController = require('../controllers/settings.controller');
const { Roles } = require('../constants/roles');



router.use(verifyToken, allowedTo(Roles.ADMIN))

router.route('/updateAmount').patch(settingsController.updateMinOrderAmount);
router.route('/getCurrentAmount').get(settingsController.getCurrentMinOrderAmount);

module.exports = router;