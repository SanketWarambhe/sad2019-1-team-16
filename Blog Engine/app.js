const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');

const expressValidator = require('express-validator');

const session = require('express-session');
var nodemailer = require('nodemailer');
const passport =require('passport');
const config = require('./config/database');
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
        title:'Contact Us',
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
let articles = require('./routes/articles');
app.use('/users',users);
app.use('/articles', articles);

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