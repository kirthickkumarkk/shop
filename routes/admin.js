const express = require('express');
const { check, body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post(   
    '/add-product',
    isAuth,  
    [
        body('title', 'Title must contain atleast two characters')
            .isLength({min: 2}),
        body('price', 'Price must be a number above 0')
            .isNumeric({min: 1}),
        body('description', 'Description must contain atleast two characters')
            .isLength({min: 2}),
    ],
    adminController.postAddProduct
);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:pid', isAuth, adminController.getEditProduct);

router.post(
    '/edit-product',
    isAuth, 
    [
        body('title', 'Title must contain atleast two characters')
            .isLength({min: 2})
            .trim(),
        body('price', 'Price must be a number above 0')
            .isNumeric({min: 1}),
        body('description', 'Description must contain atleast two characters')
            .isLength({min: 2})
            .trim(),
    ], 
    adminController.postEditProduct
);

// router.post('/delete-product', isAuth, adminController.postDeleteProduct);

router.delete('/product/:prodId', isAuth, adminController.deleteProduct)


module.exports = router;
