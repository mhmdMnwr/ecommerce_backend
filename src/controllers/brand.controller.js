const Brand = require('../models/brand.model');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

const getAllBrands = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const brands = await Brand.find({}, { "__v": false }).limit(limit).skip(skip);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            brands
        }
    });
});

const getBrand = asyncWrapper(async (req, res) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
        throw AppError.create('Brand not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            brand
        }
    });
});

const createBrand = asyncWrapper(async (req, res) => {
    const { name, image } = req.body;
    if (!name) {
        throw AppError.create('Name is required', 400, httpStatus.FAIL);
    }
    const newBrand = new Brand({
        name,
        image
    });
    await newBrand.save();
    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: {
            brand: newBrand
        }
    });
});

const updateBrand = asyncWrapper(async (req, res) => {
    const brandId = req.params.id;
    const updatedBrand = await Brand.updateOne({ _id: brandId }, { $set: { ...req.body } });
    if (updatedBrand.matchedCount === 0) {
        throw AppError.create('Brand not found', 404, httpStatus.FAIL);
    }
    const brand = await Brand.findById(brandId);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            brand
        }
    });
});

const deleteBrand = asyncWrapper(async (req, res) => {
    const result = await Brand.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
        throw AppError.create('Brand not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: null
    });
});

module.exports = {
    getAllBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand
};
