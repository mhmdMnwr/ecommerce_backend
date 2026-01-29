

const ProductStatus = Object.freeze({
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable'
});

const StatusValues = Object.values(ProductStatus);

module.exports = { ProductStatus, StatusValues };