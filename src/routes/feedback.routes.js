const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const {ROLES} = require('../config/permissions');

router.use(verifyToken);


router.route('/')
    .get( feedbackController.getAllFeedbacks)
    .post(allowedTo(ROLES.ADMIN, ROLES.MANAGER), feedbackController.createFeedback);

module.exports = router;