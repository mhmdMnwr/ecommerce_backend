const Brand = require('../models/brand.model');
const httpStatus = require('../constants/httpStatusText');
const AppError = require('../constants/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

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

    res.json({
        status: httpStatus.SUCCESS,
        pagination: {
                page,
                limit,
                totalPages: Math.ceil(totalBrands / limit)
            },
        data: {brands,}
    });
});

const getBrand = asyncWrapper(async (req, res , next) => {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
        return next ( AppError.create('Brand not found', 404, httpStatus.FAIL));
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            brand
        }
    });
});

const createBrand = asyncWrapper(async (req, res , next) => {
    const { title, image } = req.body;
    if (!title) {
        return next ( AppError.create('title is required', 400, httpStatus.FAIL))
    }
    const newBrand = new Brand({
        title,
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

const updateBrand = asyncWrapper(async (req, res , next) => {
    const brandId = req.params.id;

    const brand = await Brand.findByIdAndUpdate(
        brandId,
        { $set: req.body },
        { 
            new: true,           
            runValidators: true  
        }    );

    if (!brand) {
        return next ( AppError.create('Brand not found', 404, httpStatus.FAIL));
    }

    res.json({
        status: httpStatus.SUCCESS,
        data: {
            brand
        }
    });
});
const Product = require('../models/product.model');
const deleteBrand = asyncWrapper(async (req, res , next) => {
    const productsWithBrand = await Product.find({ brand: req.params.id });

    if (productsWithBrand.length > 0) {
        return next ( AppError.create('Cannot delete brand with associated products', 400, httpStatus.FAIL));
    }
    const result = await Brand.deleteOne({ _id: req.params.id });

    if (result.deletedCount === 0) {
        return next ( AppError.create('Brand not found', 404, httpStatus.FAIL))
    }
    res.json({
        status: httpStatus.SUCCESS,
    });
});

module.exports = {
    getAllBrands,
    getBrand,
    createBrand,
    updateBrand,
    deleteBrand
};
