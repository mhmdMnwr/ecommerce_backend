const express = require('express');
const brandController = require('../controllers/brand.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const { ROLES } = require('../config/permissions');



router.use(verifyToken);

router.route('/')
    .get(brandController.getAllBrands)
    .post(allowedTo(ROLES.ADMIN, ROLES.MANAGER), brandController.createBrand);

router.route('/:id')
    .get(brandController.getBrand)
    .patch(allowedTo(ROLES.ADMIN, ROLES.MANAGER), brandController.updateBrand)
    .delete(allowedTo(ROLES.ADMIN, ROLES.MANAGER), brandController.deleteBrand);

module.exports = router;
