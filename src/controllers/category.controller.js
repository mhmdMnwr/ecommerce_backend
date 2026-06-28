const Category = require('../models/category.model');
const Product = require('../models/product.model');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');
const ApiResponse = require('../utils/apiResponse');
const { escapeRegex } = require('../utils/sanitize');
const { safePaginationLimit } = require('../utils/validators');
const axios = require('axios');

// @desc    Get all categories with search and pagination
const getAllCategories = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = safePaginationLimit(query.limit);
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (query.title) {
        const regex = { $regex: escapeRegex(query.title), $options: 'i' };
        filter.$or = [
            { 'translation.en': regex },
            { 'translation.fr': regex },
            { 'translation.ar': regex }
        ];
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
    const { translation, image } = req.body;
    
    if (!translation || (!translation.en && !translation.fr && !translation.ar)) {
        return next(AppError.create('At least one translation (en, fr, ar) is required', 400, httpStatus.FAIL));
    }

    const newCategory = new Category({ translation, image });
    await newCategory.save();

    res.status(201).json(
        new ApiResponse(201, "Category created successfully", newCategory)
    );
});

// @desc    Update category
const updateCategory = asyncWrapper(async (req, res, next) => {
    // V4: Whitelist allowed fields
    const { translation, image } = req.body;
    const updates = {};
    if (translation !== undefined) updates.translation = translation;
    if (image !== undefined) updates.image = image;

    if (Object.keys(updates).length === 0) {
        return next(AppError.create('No valid fields to update', 400, httpStatus.FAIL));
    }

    const category = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
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

// @desc    Translate word using DeepL
const translateWord = asyncWrapper(async (req, res, next) => {
    const { word, currentLang, targetLang } = req.body;

    if (!word || typeof word !== 'string') {
        return next(AppError.create('A valid word is required', 400, httpStatus.FAIL));
    }
    
    if (!targetLang || typeof targetLang !== 'string') {
        return next(AppError.create('Target language is required', 400, httpStatus.FAIL));
    }

    try {
        const apiKey = process.env.DEEPL_API_KEY;
        if (!apiKey) {
            console.warn("DEEPL_API_KEY is not set. Falling back to English/original word.");
            return res.status(200).json(
                new ApiResponse(200, "Translation fallback (No API Key)", { translation: word })
            );
        }

        // DeepL expects EN-US or EN-GB for English
        let mappedTargetLang = targetLang.toUpperCase();
        if (mappedTargetLang === 'EN') mappedTargetLang = 'EN-US';

        const isFreeAccount = apiKey.endsWith(':fx');
        const apiUrl = isFreeAccount 
            ? 'https://api-free.deepl.com/v2/translate' 
            : 'https://api.deepl.com/v2/translate';

        const data = {
            text: [word],
            target_lang: mappedTargetLang
        };

        if (currentLang) {
            data.source_lang = currentLang.toUpperCase();
        }

        const response = await axios.post(apiUrl, data, {
            headers: {
                'Authorization': `DeepL-Auth-Key ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        const translatedText = response.data.translations[0].text;
        
        res.status(200).json(
            new ApiResponse(200, "Translation successful", { translation: translatedText })
        );
    } catch (error) {
        console.error('DeepL translation error:', error.response?.data || error.message);
        // Fallback to English (or original word) if translation fails
        res.status(200).json(
            new ApiResponse(200, "Translation fallback", { translation: word })
        );
    }
});

module.exports = {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    translateWord
};