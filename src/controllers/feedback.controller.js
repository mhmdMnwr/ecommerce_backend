const Feedback = require('../models/feedback.model');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all feedbacks with pagination
const getAllFeedbacks = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({}, { "__v": false })
        .sort({ date: -1 })
        .populate('customer', 'username')
        .limit(limit)
        .skip(skip);

    const total = await Feedback.countDocuments();

    const pagination = {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalItems: total
    };

    res.status(200).json(
        new ApiResponse(200, "Feedbacks fetched successfully", feedbacks, pagination)
    );
});

// @desc    Create feedback (Authenticated users only)
const createFeedback = asyncWrapper(async (req, res, next) => {
    const { comment } = req.body; 
    
    if (!comment) {
        return next(AppError.create('Comment is required', 400, httpStatus.FAIL));
    }

    // Creating feedback using the ID attached by the auth middleware
    const newFeedback = new Feedback({
        customer: req.currentUser.id, 
        comment
    });

    await newFeedback.save();
    
    res.status(201).json(
        new ApiResponse(201, "Thank you for your feedback!", newFeedback)
    );
});

module.exports = {
    getAllFeedbacks,
    createFeedback
};