const Product = require('../models/product');
const User = require('../models/user');
const fileHelper = require('../util/file');
const { validationResult } = require('express-validator');

exports.getProducts = (req, res, next) => { 
  Product.find({userId: req.user._id})
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        products: products,
      });
    })
};

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    edit: false,
    error: false,
    message: null,
    validationErrors: []
  });
}; 

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const price = req.body.price;
  const image = req.file;
  const description = req.body.description;
  const userId = req.user._id;
  const errors = validationResult(req);
  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      edit: false,
      error: true,
      message: 'Attached File is not an Image.',
      product: {
        title: title, 
        price: price, 
        description: description,
        userId: userId
      },
      validationErrors: []
    })
  }

  const imageUrl = image.path;
  
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      edit: false,
      error: true,
      message: errors.array()[0].msg,
      product: {
        title: title, 
        price: price, 
        imageUrl: imageUrl, 
        description: description,
        userId: userId
      },
      validationErrors: errors.array()
    })
  }

  const prod = new Product({
    title: title, 
    price: price, 
    imageUrl: imageUrl, 
    description: description,
    userId: userId
  });
  prod.save()
    .then(result => res.redirect('/admin/products'))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
  
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if(!editMode)
      return res.redirect('/admin/products');
  
  const prodId = req.params.pid;
  Product.findOne({_id: prodId})
    .then(product => {
      if(!product)
        return res.redirect('/admin/products');

      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        product: product,
        edit: editMode,
        error: false,
        message: null,
        validationErrors: []
      })
    })
  .catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error); 
  });
}

exports.postEditProduct = (req, res, next) => {
  const id = req.body.id;
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const userId = req.user._id;
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      edit: true,
      error: true,
      message: errors.array()[0].msg,
      product: {
        title: title, 
        price: price,
        description: description,
        userId: userId,
        _id: id
      },
      validationErrors: errors.array()
    })
  }

  Product.findOne({_id: id, userId: userId})
    .then(product => {
      product.title = title;
      product.price = price;
      product.description = description;
      product.userId = userId;
      if(image){
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save();
    })
    .then(result => res.redirect('/products/'+id))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); 
    });
}

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.prodId;
  Product.findOne({_id: prodId})
    .then(product => {
      if(!product)
        return next(new Error('Product Not Found'));
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id: prodId});
    })
    .then(result => {
      return req.user.deleteCartItemById(prodId);
    })
    .then(result => res.status(200).json({message: "Success"}))
    .catch(err => {
      res.status(500).json({message: "Delete Product Failed"}); 
    });
}

// exports.postDeleteProduct = (req, res, next) => {
  // const prodId = req.body.id;
  // Product.findOne({_id: prodId})
  //   .then(product => {
  //     if(!product)
  //       return next(new Error('Product Not Found'));
  //     fileHelper.deleteFile(product.imageUrl);
  //     return Product.deleteOne({_id: prodId});
  //   })
  //   .then(result => {
  //     return req.user.deleteCartItemById(prodId);
  //   })
  //   .then(result => res.redirect('/admin/products'))
  //   .catch(err => {
  //     const error = new Error(err);
  //     error.httpStatusCode = 500;
  //     return next(error); 
  //   });
// }
