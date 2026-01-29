const express = require('express');
const productController = require('../controllers/product.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const { ROLES } = require('../config/permissions');

router.use(verifyToken );


router.route('/')
    .get(productController.getAllProducts)
    .post(allowedTo(ROLES.ADMIN, ROLES.MANAGER ), productController.createProduct);

router.route('/:id')
    .get(productController.getProduct)
    .patch(allowedTo(ROLES.ADMIN, ROLES.MANAGER ), productController.updateProduct)
    .delete(allowedTo(ROLES.ADMIN, ROLES.MANAGER ), productController.deleteProduct);

module.exports = router;
