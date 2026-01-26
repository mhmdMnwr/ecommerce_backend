const express = require('express');
const productController = require('../controllers/product.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');


router.use(verifyToken);

router.use(checkPermission('products'));

router.route('/')
    .get(productController.getAllProducts)
    .post(productController.createProduct);

router.route('/:id')
    .get(productController.getProduct)
    .patch(productController.updateProduct)
    .delete(productController.deleteProduct);

module.exports = router;
