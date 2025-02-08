const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendGrid = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');

const transporter = nodemailer.createTransport(sendGrid({
    auth: {
        api_key: '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'
    }
}));

const storeUserSession = (req, user, cb) => {
    req.session.isLoggedIn = true;
    req.session.user = user;
    return req.session.save(cb);
}

exports.getLogin = (req, res, next) => {
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login', 
        message: null,
        oldData: {email: '', password: ''},
        validationErrors: []
    });
}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login', 
            message: errors.array()[0].msg,
            oldData: {email: email, password: password},
            validationErrors: errors.array()
        });
    }

    User.findOne({email: email})
        .then(user => {
            storeUserSession(req, user, err => res.redirect('/'))                          
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error); 
        });
}

exports.postLogouot = (req, res, next) => {
    req.session.destroy(result => res.redirect('/'));
}

exports.getSignup = (req, res, next) => {
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        message: null,
        oldData: {username: '', email: '', password: ''},
        validationErrors: []
    })
}

exports.postSignup = (req, res, next) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            message: errors.array()[0].msg,
            oldData: {username: username, email: email, password: password},
            validationErrors: errors.array()
        })
    }

    let tempUser;
    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const newUser = new User({
                name: username,
                email: email,
                password: hashedPassword,
                cart: {items: []}
            });
            tempUser = newUser;
            return newUser.save()
        })
        .then(result => {
            storeUserSession(req, tempUser, err => {
                res.redirect('/');
            })
            transporter.sendMail({
                to: email,
                from: 'lawlinkotp@gmail.com',
                subject: 'Signup Succeeded',
                html: '<h1>You Successfully signed up to shopification!</h1>'
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error); 
        });
}

exports.getReset = (req, res, next) => {
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        path: '/reset',
        message: null
    });
}

exports.getResetForm = (req, res, next) => {
    res.render('auth/reset-form', {
        pageTitle: 'Reset',
        path: '/reset', 
        message: null,
        resetToken: req.params.token
    })
}

exports.postResetForm = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        req.flash('error', errors.array()[0].msg);
        return res.redirect('/reset/' + req.body.resetToken);
    }
    let tempUser;
    User.findOne({resetToken: req.params.token, resetExpiry: {$gt: Date.now()}})
        .then(user => {
            if(!user){
                req.flash('error', 'Reset Token Invalid / Expired')
                return res.redirect('/reset');
            }
            tempUser = user;
            return bcrypt.hash(req.body.password, 12)     
        })
        .then(hashedPassword => {
            tempUser.password = hashedPassword;
            tempUser.resetExpiry = undefined;
            tempUser.resetToken = undefined;
            return tempUser.save();
        })
        .then(result => {
            req.flash('error', 'Password Resetted Successfully');
            res.redirect('/login');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error); 
        });
}   

exports.postReset = (req, res, next) => {
    const email = req.body.email;

    crypto.randomBytes(32, (err, buffer) => {
        if(err){
            req.flash('error', 'Unexpected Error, Try Again')
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: email})
            .then(user => {
                if(!user){
                    req.flash('error', 'Email not registered');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetExpiry = Date.now() + 3600000; //1 hour
                return user.save()
            })
            .then(result => {
                req.flash('error', 'A mail for changing passwords has been sent to ' + email);
                res.redirect('/login');
                transporter.sendMail({
                    to: email,
                    from: 'lawlinkotp@gmail.com',
                    subject: 'Password Reset',
                    html: `
                        <p>You have requested to change password for this email at shopification.com</p>
                        '<a href="http://localhost:3000/reset/${token}">Click Here to change Password</a>'
                        <p>Link is valid only for 1 hour</p>
                    `
                });
            })
            .catch(err => {
                const error = new Error(err);
                error.httpStatusCode = 500;
                return next(error); 
            });
    })
}
