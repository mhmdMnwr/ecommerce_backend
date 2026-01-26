const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkPermission = require('../middleware/checkPermission');

router.use(verifyToken);


router.route('/')
    .get(checkPermission('feedbacks'), feedbackController.getAllFeedbacks)
    .post(feedbackController.createFeedback);

module.exports = router;