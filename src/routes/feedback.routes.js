const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const {Roles} = require('../constants/roles');

router.use(verifyToken);


router.route('/')
    .get(allowedTo(Roles.ADMIN) ,feedbackController.getAllFeedbacks)
    .post( feedbackController.createFeedback);

module.exports = router;