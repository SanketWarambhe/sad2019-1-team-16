const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');

//Strategy for storing images
const storage = multer.diskStorage({
    destination: function(req, res, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //rejecting a file
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        cb(null, true);
    }
    else {
        cb(null, false);
    }
} 
const upload = multer({storage: storage,
    limit: {
        fileSize: 1024 * 1024 * 5 //max 5 mb image upload
    },
    fileFilter: fileFilter
});

mongoose.connect('mongodb://localhost/nodekb', { useNewUrlParser: true });
let db = mongoose.connection;

//Check for successful connections
db.once('open', function() {
    console.log('Connected to MongoDB');
});

//Checking for errors;
db.on('error', function(err) {
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

app.get('/', (req, res, next) => {
    Article.find({}, function(err, articles) {
        if(err){
            console.log(err);
        }
        else{
            res.render('index', {
                title: 'Articles',
                articles: articles
            })
        }
    });
});
app.get('/article', (req, res,next) => {
    res.render('add-article', {
       title:'Add Article',
       errors: null
    });
    console.log('add page');
});

//get single article
app.get('/article/:id', function (req, res){
    Article.findById(req.params.id, function(err, article){
        res.render('view-article', {
            title: 'View Article',
            article: article
        });
    });
});

//POST route for submiting articles
app.post('/article', upload.single('articleImage'), (req, res, next) => {
    console.log(req.file);

    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('author', 'Author is required').notEmpty();
    req.checkBody('body', 'Article body is required').notEmpty();
    
    // Getting all validation errors
    let errors = req.validationErrors();

    if(errors){
        res.render('add-article', {
            title: 'Add-Article',
            errors: errors
        });
    } else {
        let article = new Article();
        article.title = req.body.title;
        article.author = req.body.author;
        article.body = req.body.body;
        article.articleImage = req.file.filename;
        article.save(err => {
            if(err){
                console.log(err);
                return;
            } else {
                req.flash('success', 'Article Added Successfully!');
                res.redirect('/');
        }
    });
    }
});

//Loading edit form
app.get('/article/edit/:id', function (req, res){
    Article.findById(req.params.id, function(err, article){
        res.render('edit-article', {
            title: 'Edit Article',
            article: article
        });
    });
});

//Update Submit POST Route
app.post('/article/edit/:id', upload.single('articleImage'), (req, res, next) => {
    console.log(req.file);
    let article = {};
    article.title = req.body.title;
    article.author = req.body.author;
    article.body = req.body.body;
    if(req.file != undefined || req.file != null){
        article.articleImage = req.file.filename;
    }
    let query = {_id:req.params.id}
    Article.update(query, article,function(err) {
        if(err){
            console.log(err);
            return;
        } else {
            req.flash('success', 'Article Updated Successfully!');
            res.redirect('/');
        }
    });
});

//Deleting ROUTE

app.delete('/article/:id', function(req, res){
    let query = {_id:req.params.id}

    Article.remove(query, function(err){
        if(err){
            console.log(err);
        }
        res.send('Success');
    });
});

app.listen(1010);