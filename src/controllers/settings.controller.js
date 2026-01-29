    const Settings = require('../models/settings.model');
const httpStatus = require('../constants/httpStatusText');
const asyncWrapper = require('../middleware/asyncWrapper');

const  updateMinOrderAmount = asyncWrapper(async (req, res) => {
    const { minOrderAmount } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings();
    }
    settings.minOrderAmount = minOrderAmount;
    await settings.save();
    res.status(200).json({
        status: httpStatus.SUCCESS,
        message: 'Minimum order amount updated successfully',
    })

})

const getCurrentMinOrderAmount = asyncWrapper(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = new Settings(); 
        await settings.save();
    }
    res.status(200).json({
        status: httpStatus.SUCCESS,
        data: settings.minOrderAmount,
    });
});

module.exports = {
    updateMinOrderAmount,
    getCurrentMinOrderAmount
};