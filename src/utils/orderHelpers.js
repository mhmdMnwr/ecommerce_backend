const Product = require('../models/product.model');
const { ProductStatus } = require('../constants/productStatus');
const AppError = require('./appErrors');
const httpStatus = require('../constants/httpStatusText');
/**
 * DRY Helper: Validates products and calculates totals
 * @param {Array} items - The items from req.body
 * @param {Boolean} isAdmin - Whether to allow price overrides
 */
const validateAndCalculateOrder = async (items, isAdmin = false) => {
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = Object.fromEntries(products.map(p => [p._id.toString(), p]));

    let calculatedTotal = 0;
    const finalItems = items.map(item => {
        const product = productMap[item.productId];
        
        if (!product) throw AppError.create(`Product ${item.productId} not found`, 404, httpStatus.FAIL);

        // --- CHECK THE STATE INSTEAD OF QUANTITY ---
        if (!isAdmin && product.state === ProductStatus.UNAVAILABLE) {
            throw AppError.create(`Product "${product.title}" is currently not available.`, 400, httpStatus.FAIL);
        }

        const price = parseFloat(((isAdmin && item.price !== undefined) ? item.price : product.price).toFixed(2));
        calculatedTotal += price * item.quantity;
        
        return {
            productId: product._id,
            title: product.title,
            image: product.image || '',
            price: price,
            units: product.units,
            quantity: item.quantity
        };
    });

    return {
        finalItems,
        totalAmount: Math.round(calculatedTotal * 100) / 100
    };
};

module.exports = {
    validateAndCalculateOrder
};