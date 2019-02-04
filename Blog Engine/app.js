const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const session = require('express-session');
const passport =require('passport');
const config = require('./config/database');
const errorController = require('./controller/error');
const ITEMS_PER_PAGE = 3;

mongoose.connect(config.database, { useNewUrlParser: true });
let db = mongoose.connection;

//Check for successful connections
db.once('open', function () {
    console.log('Connected to MongoDB');
});

//Checking for errors;
db.on('error', function (err) {
    console.log(err);
});

const app = express();

//Getting out models
let Article = require('./models/articles');

//Loading view engines
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//Middleware for body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Set public folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join('uploads')));

// Express session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

//Express messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

//Express Validator middleware
app.use(expressValidator());

//Passport Config
require('./config/passport')(passport);
//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function(req, res, next){
    res.locals.user = req.user || null;
    next();
});


app.get('/', (req, res, next) => {

    const page = +req.query.page  || 1;
    let totalItems;
    
    Article.find().countDocuments()
    .then(numArticles => {
        totalItems = numArticles;
        return Article.find().sort({$natural:-1})
            .skip((page - 1) * ITEMS_PER_PAGE)
            .limit(ITEMS_PER_PAGE)
    })
    .then(articles => {
        res.render('index', {
            title: 'Articles',
            articles: articles,
            currentPage: page,
            hasNextPage: ITEMS_PER_PAGE * page < totalItems,
            hasPreviousPage: page > 1,
            nextPage: page + 1,
            previousPage: page - 1,
            lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
        });
    }).catch(err => {
        if (err) {
            console.log(err);
        }
    });
});



//Route files
let users = require('./routes/users');
let articles = require('./routes/articles');
app.use('/users',users);
app.use('/articles', articles);

//about us route
app.get('/about-us',(req,res)=>{
    res.render('about-us',{
       title:'about us page'
    });
});

app.use(errorController.get404);

app.listen(1010);