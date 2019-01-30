const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
var nodemailer = require('nodemailer');
const passport =require('passport');
const config = require('./config/database');
const ITEMS_PER_PAGE = 3;

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
const upload = multer({
    storage: storage,
    limit: {
        fileSize: 1024 * 1024 * 5 //max 5 mb image upload
    },
    fileFilter: fileFilter
});

mongoose.connect(config.database, { useNewUrlParser: true });
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

//Adding Comments middleware
app.post('/article/:id', function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        article.comment.push(req.body.comment);
        let query = { _id: req.params.id }
        Article.update(query, article, function (err) {
            if (err) {
                console.log(err);
                return;
            } else {
                res.render('view-article', {
                    title: 'View Article',
                    article: article
                });
            }
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
//edit profile route
app.get('/edit-profile', (req, res) => {
    res.render('edit-profile', {
        title: 'Edit Profile page'
    });
});
//my profile route
app.get('/profile',(req, res) => {
    res.render('profile', {
        title:'profile page'
    } );
});
//contact us route
app.get('/contact-us',(req,res) => {
    res.render('contact-us', {
        title:'contact us page',
        msg: 'Enter your details below'
    });
});
app.post('/contact-us', (req,res)=> {
    const output=`
    <h3>You have a new contact </h3>
     <h3>Contact details </h3>
     <ul>
     <li>FullName: ${req.body.FullName} </li>
     <li>Email: ${req.body.Email} </li>
     <li>Contact: ${req.body.Contact} </li>   
     </ul>
     <h3> Message  </h3>
     <p>  ${req.body.Message}   </p>
    `;
     // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'noreply.blogengine@gmail.com', // generated ethereal user
      pass: 'sarangsanket' // generated ethereal password
    },
    tls:{
        rejectUnauthorized:false
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    from: '"Blog Engine" <noreply.blogengine@gmail>', // sender address
    to: "samarthsarang1@gmail.com, sanketwarambhe@gmail.com", // list of receivers
    subject: "New user contact", // Subject line
    text: 'Hello Word', // plain text body
    html: output // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error,info)=> {

    if (error) {
        return console.log(error);
    }
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    req.flash('success', 'Email sent successfully');
    res.redirect('/');
  });
});

//Route files
let users = require('./routes/users');
app.use('/users',users);
//about us route
app.get('/about-us',(req,res)=>{
    res.render('about-us',{
       title:'about us page'
    });
});

app.use('/', (req, res, next) => {
    res.render('404', {
        title: 'Page Not Found'
    })
});

app.listen(1010);