const express = require('express');
const brandController = require('../controllers/brand.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const verifyToken = require('../middleware/verifyToken');



router.use(verifyToken);

router.route('/')
    .get(brandController.getAllBrands)
    .post(checkPermission('brands'), brandController.createBrand);

router.route('/:id')
    .get(checkPermission('brands'), brandController.getBrand)
    .patch(checkPermission('brands'), brandController.updateBrand)
    .delete(checkPermission('brands'), brandController.deleteBrand);

module.exports = router;
