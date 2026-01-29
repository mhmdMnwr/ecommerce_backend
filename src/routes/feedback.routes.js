const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const {Roles} = require('../constants/roles');

router.use(verifyToken);


router.route('/')
    .get( feedbackController.getAllFeedbacks)
    .post(allowedTo(Roles.ADMIN, Roles.MANAGER), feedbackController.createFeedback);

module.exports = router;