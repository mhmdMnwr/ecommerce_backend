const express = require('express');
const categoryController = require('../controllers/category.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const {ROLES} = require('../config/permissions');

router.use(verifyToken);



router.route('/')
    .get(categoryController.getAllCategories)
    .post(allowedTo(ROLES.ADMIN, ROLES.MANAGER), categoryController.createCategory);

router.route('/:id')
    .get(categoryController.getCategory)
    .patch(allowedTo(ROLES.ADMIN, ROLES.MANAGER), categoryController.updateCategory)
    .delete(allowedTo(ROLES.ADMIN, ROLES.MANAGER), categoryController.deleteCategory);

module.exports = router;
