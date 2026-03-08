const express = require('express');
const categoryController = require('../controllers/category.controller');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const allowedTo = require('../middleware/allowedTo');
const {Roles} = require('../constants/roles');

router.use(verifyToken);



router.route('/')
    .get(categoryController.getAllCategories)
    .post(allowedTo(Roles.ADMIN, Roles.MANAGER), categoryController.createCategory);

router.route('/:id')
    .get(categoryController.getCategory)
    .patch(allowedTo(Roles.ADMIN, Roles.MANAGER), categoryController.updateCategory)
    .delete(allowedTo(Roles.ADMIN, Roles.MANAGER), categoryController.deleteCategory);

module.exports = router;
