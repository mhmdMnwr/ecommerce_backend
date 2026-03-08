const Brand = require('../models/brand.model');
const Product = require('../models/product.model'); // Moved to top for clean imports
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all brands with filtering and pagination
const getAllBrands = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.title) {
        filter.title = { $regex: query.title, $options: 'i' }; 
    }

    const totalBrands = await Brand.countDocuments(filter);
    const brands = await Brand.find(filter, { "__v": false })
        .limit(limit)
        .skip(skip);

    const pagination = {
        page,
        limit,
        totalPages: Math.ceil(totalBrands / limit),
        totalItems: totalBrands
    };

    // Using standardized ApiResponse
    res.status(200).json(
        new ApiResponse(200, "Brands fetched successfully", brands, pagination)
    );
});

// @desc    Get single brand
const getBrand = asyncWrapper(async (req, res, next) => {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
        return next(AppError.create('Brand not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Brand details fetched", brand)
    );
});

// @desc    Create new brand
const createBrand = asyncWrapper(async (req, res, next) => {
    const { title, image } = req.body;
    
    if (!title) {
        return next(AppError.create('Title is required', 400, httpStatus.FAIL));
    }

    const newBrand = new Brand({ title, image });
    await newBrand.save();

    res.status(201).json(
        new ApiResponse(201, "Brand created successfully", newBrand)
    );
});

// @desc    Update brand
const updateBrand = asyncWrapper(async (req, res, next) => {
    const brand = await Brand.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!brand) {
        return next(AppError.create('Brand not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Brand updated successfully", brand)
    );
});

// @desc    Delete brand (only if no products are associated)
const deleteBrand = asyncWrapper(async (req, res, next) => {
    const productsWithBrand = await Product.find({ brand: req.params.id });

    if (productsWithBrand.length > 0) {
        return next(AppError.create('Cannot delete brand with associated products', 400, httpStatus.FAIL));
    }

    const result = await Brand.deleteOne({ _id: req.params.id });

    if (result.deletedCount === 0) {
        return next(AppError.create('Brand not found', 404, httpStatus.FAIL));
    }

    // Success response with null data
    res.status(200).json(
        new ApiResponse(200, "Brand deleted successfully", null)
    );
});

module.exports = {
    getAllBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand
};
