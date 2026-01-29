const httpStatus = require('../constants/httpStatusText');

const Feedback = require('../models/feedback.model');
const User = require('../models/user.model');
const AppError = require('../constants/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

// GET FEEDBACKS (Filtered by User)
const getAllFeedbacks = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    
    const feedbacks = await Feedback.find({},  { "__v": false })
        .sort({ date: -1 })
        .populate('customer', 'username')
        .limit(limit)
        .skip(skip);

    // Get total for pagination
    const total = await Feedback.countDocuments();

    res.json({
        status: httpStatus.SUCCESS,
        data: {
            
            pagination: {
                limit,
                page,
                totalPages: Math.ceil(total / limit)
            },
            data: { feedbacks }
        }
    });
});

// CREATE FEEDBACK (Secure)
const createFeedback = asyncWrapper(async (req, res, next) => {
    const { comment } = req.body; 
    
    // Check comment exists
    if (!comment) {
        return next ( AppError.create('Comment is required', 400, httpStatus.FAIL));
    }

        
    // DON'T take userId from body. Take it from the authenticated user (token).
    const newFeedback = new Feedback({
        customer: req.currentUser.id, 
        comment
    });

    await newFeedback.save();
    
    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: {  newFeedback } // Good practice to return the created object
    });
});
module.exports = {
    getAllFeedbacks,
    createFeedback
};