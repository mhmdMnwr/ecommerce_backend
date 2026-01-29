const express = require('express');
const brandController = require('../controllers/brand.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const { Roles } = require('../constants/roles');



router.use(verifyToken);

router.route('/')
    .get(brandController.getAllBrands)
    .post(allowedTo(Roles.ADMIN, Roles.MANAGER), brandController.createBrand);

router.route('/:id')
    .get(brandController.getBrand)
    .patch(allowedTo(Roles.ADMIN, Roles.MANAGER), brandController.updateBrand)
    .delete(allowedTo(Roles.ADMIN, Roles.MANAGER), brandController.deleteBrand);

module.exports = router;
