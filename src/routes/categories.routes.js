const express = require('express');
const categoryController = require('../controllers/category.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');

router.use(verifyToken);

router.use(checkPermission('categories'));

router.route('/')
    .get(categoryController.getAllCategories)
    .post(categoryController.createCategory);

router.route('/:id')
    .get(categoryController.getCategory)
    .patch(categoryController.updateCategory)
    .delete(categoryController.deleteCategory);

module.exports = router;
