const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');

//Login get
router.get('/login', authController.getLogin)

//Login post
router.post('/login', 
    [
        body('email', 'Enter a valid email')
            .isEmail()
            .normalizeEmail(), 
        body('password', 'Password must only contain numbers or text with at least 5 characters long')
            .isLength({min: 5})
            .isAlphanumeric()
            .custom((value, {req}) => {
                return User.findOne({email: req.body.email})
                    .then(user => {
                        if(!user)
                            return Promise.reject('Email not found');
                        return bcrypt.compare(value, user.password);
                    })
                    .then(result => {
                        if(!result)
                            return Promise.reject('Invalid Password');
                    })
            })
            .trim(),
    ],
    authController.postLogin
);

//Logout post
router.post('/logout', authController.postLogouot)

//Signup get
router.get('/signup', authController.getSignup)

//Signup post
router.post(
    '/signup',
    [  //Extracts from cookies/headers
        check('email')
            .isEmail()
            .withMessage('Enter a valid E-mail')
            .custom(value => {
                return User.findOne({email: value})
                    .then(user => {
                        if(user)
                            return Promise.reject('Account with this email already exists');
                    })
            })
            .normalizeEmail(),
        //Extracts from form body / Default message for all validators
        body('password', 'Password must only contain numbers or text with at least 5 characters long') 
            .isLength({min: 5})
            .isAlphanumeric()
            .withMessage('')
            .trim(),
        body('confirmPassword')
            .custom((value, {req}) => {
                if(value !== req.body.password)
                    throw new Error('Password and Confirm Password Mismatch');
                return true;
            })
            .trim()
    ],
    authController.postSignup
);

//Reset get
router.get('/reset', authController.getReset);

//Reset post
router.post('/reset',
    body('email', 'Enter a valid email')
        .isEmail(), 
    authController.postReset);

//Reset Token get
router.get('/reset/:token', authController.getResetForm);

//Reset Token post
router.post('/reset/:token',[
    body('password', 'Password must only contain numbers or text with at least 5 characters long')
        .isLength({min: 5})
        .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .custom((value, {req}) => {
            if(value !== req.body.password)
                throw new Error('Password and Confirm Password Mismatch');
            return true;
        })
        .trim()
    ],   
    authController.postResetForm);

module.exports = router;
