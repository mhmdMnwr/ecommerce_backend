const express = require('express');
const productController = require('../controllers/product.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const { Roles } = require('../constants/roles');

router.use(verifyToken);


router.route('/')
    .get(productController.getAllProducts)
    .post(allowedTo(Roles.ADMIN, Roles.MANAGER), productController.createProduct);

// Static routes MUST come before the parameterised /:id route
router.route('/new')
    .get(productController.getNewProducts);

router.route('/top')
    .get(productController.getTopSellingProducts);

router.route('/:id')
    .get(productController.getProduct)
    .patch(allowedTo(Roles.ADMIN, Roles.MANAGER), productController.updateProduct)
    .delete(allowedTo(Roles.ADMIN, Roles.MANAGER), productController.deleteProduct);

module.exports = router;
