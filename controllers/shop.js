const fs = require('fs');
const path = require('path');

const PDFDocument = require('pdfkit');
const stripe = require('stripe')(process.env.STRIPE_KEY);

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

exports.getProducts = (req, res, next) => {
  const page = req.query.page || 1;
  let numItems = 0;
  Product.countDocuments()
    .then(itemCount => {
      numItems = itemCount;
      return Product.find().limit(ITEMS_PER_PAGE).skip(ITEMS_PER_PAGE * (page-1))
    })
    .then(products => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products',
        products: products,
        page: page,
        numItems: numItems,
        ITEMS_PER_PAGE: ITEMS_PER_PAGE
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });

};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.pid;
  // Product.findOne({_id: prodId}) also works
  Product.findById(prodId)
    .then(product => {
      if(!product)
        return res.redirect('/products');

      res.render('shop/product-detail', {
        pageTitle: product.title,
        path: '/product',
        product: product,
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
};

exports.getIndex = (req, res, next) => {
  const page = req.query.page || 1;
  let numItems = 0;
  Product.countDocuments()
    .then(itemCount => {
      numItems = itemCount;
      return Product.find().limit(ITEMS_PER_PAGE).skip(ITEMS_PER_PAGE * (page-1))
    })
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        products: products,
        page: page,
        numItems: numItems, 
        ITEMS_PER_PAGE: ITEMS_PER_PAGE
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
};

exports.getCart = (req, res, next) => {
  let total = 0;
  // User.findOne({_id: req.session.user._id})
  req.user
    .populate('cart.items.prodId')
    .then(user => {
      let products = user.cart.items;
      
      for(let product of products)
        total += product.prodId.price * product.quantity;

      res.render('shop/cart', {
        pageTitle: req.user.name + "'s Cart",
        path: '/cart',
        total: total,
        products: products,
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
}

exports.postCart = (req, res, next) => {
  const prodId = req.body.id;
  req.user.addToCart(prodId)
    .then(result => res.redirect('/cart'))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
};

exports.deleteCartItem = (req, res, next) => {
  const prodId = req.body.id;
  // User.findOne({_id: req.session.user._id})
  req.user.deleteCartItemById(prodId)
    .then(result => res.redirect('/cart'))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
}


exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.prodId')
    .then(user => {
      products = user.cart.items;
      
      for(let product of products)
        total += product.prodId.price * product.quantity;

      
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p => {
          return {
            price_data: {
              unit_amount: p.prodId.price * 100, //Specify in cents
              currency: 'usd',
              product_data: {
                name: p.prodId.title,
                description: p.prodId.description,
              },
            },
            quantity: p.quantity
          }
        }),
        mode: 'payment',
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      })
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        total: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
}


exports.getOrders = (req, res, next) => {
  Order.find({userId: req.user._id})
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
        total: 0,
      });
    })
};

exports.getCheckoutSuccess = (req, res, next) => {
  // let idList = []
  // for(let product of req.user.cart.items)
  //   idList.push(product.prodId)

  req.user.populate('cart.items.prodId')
    .then(user => {
      productsOrdered = []
      
      for(let product of user.cart.items)
        productsOrdered.push({
          prodId: product.prodId._id,
          title: product.prodId.title,
          price: product.prodId.price,
          imageUrl: product.prodId.imageUrl,
          description: product.prodId.description,
          quantity: product.quantity
        });

      const order = new Order({products: productsOrdered, userId: req.user._id});
      return order.save()   
    })
    .then(result => {
      return req.user.clearCart()
    })
    .then(result => res.redirect('/orders'))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    }); 
}

// exports.postOrders = (req, res, next) => {
//   let idList = []
//   for(let product of req.user.cart.items)
//     idList.push(product.prodId)

//   req.user.populate('cart.items.prodId')
//     .then(user => {
//       productsOrdered = []
      
//       for(let product of user.cart.items)
//         productsOrdered.push({
//           prodId: product.prodId._id,
//           title: product.prodId.title,
//           price: product.prodId.price,
//           imageUrl: product.prodId.imageUrl,
//           description: product.prodId.description,
//           quantity: product.quantity
//         });

//       const order = new Order({products: productsOrdered, userId: req.user._id});
//       return order.save()   
//     })
//     .then(result => {
//       return req.user.clearCart()
//     })
//     .then(result => res.redirect('/orders'))
//     .catch(err => {
//       const error = new Error(err);
//       error.httpStatusCode = 500;
//       return next(error); 
//     }); 
// }

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findOne({_id: orderId})
    .then(order => {
      if(!order)
        return next(new Error('Order not found'));
      if(!order.userId.equals(req.user._id))
        return next(new Error('User lacks permissions'));

      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join('data', 'invoice', invoiceName);

      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(invoicePath));
      res.setHeader(
        'Content-Type', 'application/pdf',
        'Content-Disposition', 'inline; filename="'+ invoiceName +'"'
      );
      doc.pipe(res);  
      doc.fontSize(24);
      doc.font('Helvetica-Bold').text('INVOICE', {characterSpacing: 3});
      doc.font('Helvetica')
      doc.fontSize(14);
      doc.text('Order Number: ', {continued: true})
        .fillColor('red').text(orderId);
      doc.fillColor('black').text('____________________________________________________________');
      doc.moveDown();
      let total = 0;        
      doc.moveDown();
      for(let prod of order.products){
        total += prod.price * prod.quantity;
        doc.font('Helvetica-Bold').text(prod.title, {continued: true})
          .font('Helvetica').text(': ' + prod.description)
          .font('Helvetica').text(' x ' + prod.quantity + ': $' + prod.price * prod.quantity)
        doc.moveDown();
      }
      doc.fillColor('black').text('____________________________________________________________');
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(18).text('Total: ', {continued: true})
        .fillColor('green').text('$' + total);
      doc.end();

      //Streaming better
      // const file = fs.createReadStream(invoicePath);        
      // res.setHeader(
      //   'Content-Type', 'application/pdf',
      //   'Content-Disposition', 'inline; filename="'+ invoiceName +'"'
      // );
      // file.pipe(res);

      //Preloading File takes up memory
      // fs.readFile(path.join('FileManaging', 'data', 'invoice', invoiceName), (err, file) => {
      //   if(err)
      //     return next(err);
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'attachment; filename="'+ invoiceName +'"');
        // res.send(file)
      // })

    })
    .catch(err => next(err));
}
