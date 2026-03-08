const Category = require('../models/category.model');
const Product = require('../models/product.model'); // Standard: imports at the top
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');

// @desc    Get all categories with search and pagination
const getAllCategories = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.title) {
        filter.title = { $regex: query.title, $options: 'i' }; 
    }

    const totalCategories = await Category.countDocuments(filter);
    const categories = await Category.find(filter, { "__v": false })
        .limit(limit)
        .skip(skip);

    const pagination = {
        page,
        limit,
        totalPages: Math.ceil(totalCategories / limit),
        totalItems: totalCategories
    };

    res.status(200).json(
        new ApiResponse(200, "Categories fetched successfully", categories, pagination)
    );
});

// @desc    Get single category
const getCategory = asyncWrapper(async (req, res, next) => {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
        return next(AppError.create('Category not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Category details fetched", category)
    );
});

// @desc    Create new category
const createCategory = asyncWrapper(async (req, res, next) => {
    const { title, image } = req.body;
    
    if (!title) {
        return next(AppError.create('Title is required', 400, httpStatus.FAIL));
    }

    const newCategory = new Category({ title, image });
    await newCategory.save();

    res.status(201).json(
        new ApiResponse(201, "Category created successfully", newCategory)
    );
});

// @desc    Update category
const updateCategory = asyncWrapper(async (req, res, next) => {
    // Note: Using findByIdAndUpdate is cleaner than updateOne + findById
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
    );

    if (!category) {
        return next(AppError.create('Category not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Category updated successfully", category)
    );
});

// @desc    Delete category
const deleteCategory = asyncWrapper(async (req, res, next) => {
    const productsWithCategory = await Product.find({ category: req.params.id });
    
    if (productsWithCategory.length > 0) {
        return next(AppError.create('Cannot delete category with associated products', 400, httpStatus.FAIL));
    }

    const result = await Category.deleteOne({ _id: req.params.id });

    if (result.deletedCount === 0) {
        return next(AppError.create('Category not found', 404, httpStatus.FAIL));
    }

    res.status(200).json(
        new ApiResponse(200, "Category deleted successfully", null)
    );
});

module.exports = {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};