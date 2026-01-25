const Product = require('../models/product.model');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appErrors');
const asyncWrapper = require('../middleware/asyncWrapper');

const getAllProducts = asyncWrapper(async (req, res) => {
    const query = req.query || {};
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    // Build filter object for search
    const filter = {};
    
    // Search by name (partial, case-insensitive)
    if (query.name) {
        filter.name = { $regex: query.name, $options: 'i' };
    }
    
    // Filter by brand (exact match, case-insensitive)
    if (query.brand) {
        filter.brand = { $regex: `^${query.brand}$`, $options: 'i' };
    }
    
    // Filter by category (exact match, case-insensitive)
    if (query.category) {
        filter.category = { $regex: `^${query.category}$`, $options: 'i' };
    }
    
    // Filter by state (available / not available)
    if (query.state) {
        filter.state = query.state;
    }

    // Sorting: ?sort=name (asc) or ?sort=-name (desc)
    let sortOption = {};
    if (query.sort) {
        const sortField = query.sort.startsWith('-') ? query.sort.slice(1) : query.sort;
        const sortOrder = query.sort.startsWith('-') ? -1 : 1;
        sortOption[sortField] = sortOrder;
    }

    // Get total count for pagination info
    const total = await Product.countDocuments(filter);

    let productsQuery = Product.find(filter, { "__v": false })
        .limit(limit)
        .skip(skip);
    
    // Apply sorting if specified
    if (Object.keys(sortOption).length > 0) {
        productsQuery = productsQuery.sort(sortOption).collation({ locale: 'en', strength: 2 });
    }
    
    const products = await productsQuery;
        
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

const getProduct = asyncWrapper(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw AppError.create('Product not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            product
        }
    });
});

const createProduct = asyncWrapper(async (req, res) => {
    const { name, price, image, state, brand, category, units_num } = req.body;
    if (!name || !price || !units_num) {
        throw AppError.create('Name, price and units_num are required', 400, httpStatus.FAIL);
    }
    const newProduct = new Product({
        name,
        price,
        image,
        state,
        brand,
        category,
        units_num
    });
    await newProduct.save();
    res.status(201).json({
        status: httpStatus.SUCCESS,
        data: {
            product: newProduct
        }
    });
});

const updateProduct = asyncWrapper(async (req, res) => {
    const productId = req.params.id;
    const updatedProduct = await Product.updateOne({_id: productId}, {$set: {...req.body}});
    if (updatedProduct.matchedCount === 0) {
        throw AppError.create('Product not found', 404, httpStatus.FAIL);
    }
    const product = await Product.findById(productId);
    res.json({
        status: httpStatus.SUCCESS,
        data: {
            product
        }
    });
});

const deleteProduct = asyncWrapper(async (req, res) => { 
    const result = await Product.deleteOne({_id: req.params.id});
    if (result.deletedCount === 0) {
        throw AppError.create('Product not found', 404, httpStatus.FAIL);
    }
    res.json({
        status: httpStatus.SUCCESS,
        data: null
    });
});

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};
