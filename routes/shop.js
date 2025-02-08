const express = require('express');

const shopController = require('../controllers/shop');
const isAuth = require('../middleware/is-auth');
const router = express.Router();

router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

router.get('/products/:pid', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/delete-cart', isAuth, shopController.deleteCartItem);

router.get('/checkout', isAuth, shopController.getCheckout)

router.get('/checkout/success', isAuth, shopController.getCheckoutSuccess) // postOrders

router.get('/checkout/cancel', isAuth, shopController.getCheckout)

router.get('/orders', isAuth, shopController.getOrders);

// router.post('/orders', isAuth, shopController.postOrders);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

// router.get('/checkout', shopController.getCheckout);

module.exports = router;
