const Settings = require('../models/settings.model');
const httpStatus = require('../constants/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');
const AppError = require('../utils/appErrors');

// @desc    Update global store settings (Admin)
const updateMinOrderAmount = asyncWrapper(async (req, res, next) => {
    const { minOrderAmount } = req.body;

    // Validation: Ensure it's a positive number
    if (minOrderAmount === undefined || minOrderAmount < 0) {
        return next(AppError.create('A valid minimum order amount is required', 400, httpStatus.FAIL));
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
        settings = new Settings();
    }

    settings.minOrderAmount = minOrderAmount;
    await settings.save();

    res.status(200).json(
        new ApiResponse(200, 'Minimum order amount updated successfully', settings)
    );
});

// @desc    Get current store configuration
const getCurrentMinOrderAmount = asyncWrapper(async (req, res) => {
    let settings = await Settings.findOne();
    
    // Default initialization if settings document doesn't exist yet
    if (!settings) {
        settings = new Settings(); 
        await settings.save();
    }

    res.status(200).json(
        new ApiResponse(200, "Settings fetched successfully", {
            minOrderAmount: settings.minOrderAmount
        })
    );
});

module.exports = {
    updateMinOrderAmount,
    getCurrentMinOrderAmount
};