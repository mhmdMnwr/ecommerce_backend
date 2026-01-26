const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

router.route('/')
    .get(verifyToken, feedbackController.getAllFeedbacks)
    .post(verifyToken, feedbackController.createFeedback);

module.exports = router;