const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf')
const flash = require('connect-flash');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const User = require('./models/user');
const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.hzv32.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority&appName=Cluster0`


const app = express();
const sessionStore = new MongoDbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const privateKey = fs.readFileSync('server.key');
const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) =>  {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || file.mimetype ===  'image/jpg' || file.mimetype ===  'image/jpeg')
        cb(null, true);
    else
        cb(null, false);
}


app.set('view engine', 'ejs');
app.set('views', 'views');

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'});

app.use(helmet());
app.use(compression());
app.use(morgan('combined', {stream: accessLogStream}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(session({secret: 'my secret', resave: false, saveUninitialized: false, store: sessionStore}));
app.use(csrfProtection);
app.use(flash());


app.use((req, res, next) => {
    res.locals.isLoggedIn = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
})


app.use((req, res, next) => {
    if(!req.session.user) 
        return next(); 
    User.findOne({_id: req.session.user._id})
        .then(user => {
            if(!user) 
                return next(); 
            req.user = user;
            next();
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error); 
        });
})


app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


const errorController = require('./controllers/error');
app.get('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render()
    // res.redirect('/500'); inf loops if sync error
    console.log(error);
    error.httpStatusCode = error.httpStatusCode ? error.httpStatusCode : 500;
    res.status(error.httpStatusCode).render('500', { 
        pageTitle: 'Error', 
        path: '/500',
        isLoggedIn: req.isLoggedIn 
    });
})


mongoose.connect(MONGODB_URI)
    .then(result => {
        app.listen(process.env.PORT || 3000);
        // https.createServer({key: privateKey, cert: certificate}, app).listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));

