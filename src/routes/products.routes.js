const express = require('express');
const productController = require('../controllers/product.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const verifyToken = require('../middleware/verifyToken');


router.use(verifyToken);


router.route('/')
    .get(productController.getAllProducts)
    .post(checkPermission('products'), productController.createProduct);

router.route('/:id')
    .get(productController.getProduct)
    .patch(checkPermission('products'), productController.updateProduct)
    .delete(checkPermission('products'), productController.deleteProduct);

module.exports = router;
