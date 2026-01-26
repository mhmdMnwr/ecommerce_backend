const express = require('express');
const categoryController = require('../controllers/category.controller');
const router = express.Router();
const checkPermission = require('../middleware/checkPermission');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);



router.route('/')
    .get(categoryController.getAllCategories)
    .post(checkPermission('categories'), categoryController.createCategory);

router.route('/:id')
    .get(checkPermission('categories'), categoryController.getCategory)
    .patch(checkPermission('categories'), categoryController.updateCategory)
    .delete(checkPermission('categories'), categoryController.deleteCategory);

module.exports = router;
