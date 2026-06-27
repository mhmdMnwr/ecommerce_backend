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
            minOrderAmount: parseFloat(settings.minOrderAmount.toFixed(2))
        })
    );
});

// @desc    Update shop information (Admin)
const updateShopInfo = asyncWrapper(async (req, res, next) => {
    const { shopPhone, shopLatitude, shopLongitude } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
        settings = new Settings();
    }

    if (shopPhone !== undefined) settings.shopPhone = shopPhone;
    if (shopLatitude !== undefined) settings.shopLatitude = shopLatitude;
    if (shopLongitude !== undefined) settings.shopLongitude = shopLongitude;
    
    await settings.save();

    res.status(200).json(
        new ApiResponse(200, 'Shop information updated successfully', settings)
    );
});

// @desc    Get all store settings including shop and dev info
const getSettings = asyncWrapper(async (req, res) => {
    let settings = await Settings.findOne();
    
    if (!settings) {
        settings = new Settings(); 
        await settings.save();
    }

    res.status(200).json(
        new ApiResponse(200, "Settings fetched successfully", settings)
    );
});

module.exports = {
    updateMinOrderAmount,
    getCurrentMinOrderAmount,
    updateShopInfo,
    getSettings
};