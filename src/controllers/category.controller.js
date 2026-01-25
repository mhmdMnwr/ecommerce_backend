const Category = require('../models/category.model');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

const getAllCategories = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const categories = await Category.find({}, { "__v": false }).limit(limit).skip(skip);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            categories
        }
    });
});

const getCategory = asyncWrapper(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
        throw AppError.create('Category not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            category
        }
    });
});

const createCategory = asyncWrapper(async (req, res) => {
    const { name, image } = req.body;
    if (!name) {
        throw AppError.create('Name is required', 400, httpStatus.FAIL);
    }
    const newCategory = new Category({
        name,
        image
    });
    await newCategory.save();
    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: {
            category: newCategory
        }
    });
});

const updateCategory = asyncWrapper(async (req, res) => {
    const categoryId = req.params.id;
    const updatedCategory = await Category.updateOne({ _id: categoryId }, { $set: { ...req.body } });
    if (updatedCategory.matchedCount === 0) {
        throw AppError.create('Category not found', 404, httpStatus.FAIL);
    }
    const category = await Category.findById(categoryId);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            category
        }
    });
});

const deleteCategory = asyncWrapper(async (req, res) => {
    const result = await Category.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0) {
        throw AppError.create('Category not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: null
    });
});

module.exports = {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
