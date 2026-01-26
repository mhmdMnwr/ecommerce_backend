const httpStatus = require('../utils/httpStatusText');
const Feedback = require('../models/feedback.model');
const User = require('../models/user.model');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

// GET FEEDBACKS (Filtered by User)
const getAllFeedbacks = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    // LOGIC: If user is NOT admin, only show THEIR feedbacks
    // Assuming your auth middleware sets req.currentUser
    const filter = req.currentUser.role === 'sup_admin' ? {} : { userId: req.currentUser.id };

    const feedbacks = await Feedback.find(filter, { "__v": false })
        .sort({ date: -1 })
        .limit(limit)
        .skip(skip);

    // Get total for pagination
    const total = await Feedback.countDocuments(filter);

    res.json({
        status: httpStatus.SUCCESS,
        data: {
            feedbacks,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// CREATE FEEDBACK (Secure)
const createFeedback = asyncWrapper(async (req, res) => {
    const { comment } = req.body; 
    
    // Check comment exists
    if (!comment) {
        throw AppError.create('Comment is required', 400, httpStatus.FAIL);
    }

        const username = (await User.findById(req.currentUser.id)).username;
    // DON'T take userId from body. Take it from the authenticated user (token).
    const newFeedback = new Feedback({
        userId: req.currentUser.id, // Securely identified
        username: username, 
        comment
    });

    await newFeedback.save();
    
    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: { feedback: newFeedback } // Good practice to return the created object
    });
});
module.exports = {
    getAllFeedbacks,
    createFeedback
};