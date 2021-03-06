const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const imageStorageStartegy = require('../controller/imageStorage');
var nodemailer = require('nodemailer');


//Getting user model
let User = require('../models/user');

//Register form
router.get('/register', function(req, res) {
    res.render('register', {
        title: 'User Registration',
        errors: null,
        path: '/register'
    });
});

router.post('/register', imageStorageStartegy.single('profilePicture'), function(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const password2 = req.body.password2;
    let profilePicture;
    if (req.file != undefined || req.file != null) {
        profilePicture = req.file.filename;
    }
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    let errors = req.validationErrors();

    if(errors){
        res.locals.user = req.user;
        res.render('register', {
            title: 'User Registration',
            errors: errors,
            path: '/register'
        });
    } else {
        let newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password,
            profilePicture: profilePicture
        });

        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(newUser.password, salt, function(err, hash){
                if(err){
                    console.log(err);
                }
                newUser.password = hash;
                newUser.save(function(err) {
                   if(err){
                       console.log(err);
			return;
                   } else {
                       req.flash('success', 'Registered successfully. You can now login');
                       res.redirect('/users/login');
                   }
                });
            });  
        });

    }

});

//Login form
router.get('/login', function(req, res){
    res.render('login', {
        title: 'Login',
        path: '/login'
    });
});

//Login process route
router.post('/login', function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});

//contact us route
router.get('/contact-us',(req,res) => {
    res.render('contact-us', {
        title:'Contact Us',
        msg: 'Enter your details below',
        path: '/contact'
    });
});

router.post('/contact-us', (req,res)=> {
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

//view profile route
router.get('/view/:id',(req, res) => {
    User.findById(req.params.id, function (err, user) {
        res.render('profile', {
            title: 'View Profile',
            user: user,
            path: '/profile'
        });
    });
});

router.get('/edit/:id', checkAuthentication, (req, res) => {
    User.findById(req.params.id, function (err, user) {
        res.locals.user = req.user;
        res.render('edit-profile', {
            title: 'Edit Profile',
            user: user,
            errors: null,
            path: '/editProfile'
        });
    });
});

router.post('/edit/:id', checkAuthentication, (req, res) => {
    User.findById(req.params.id, function (err, user) {
        const name = req.body.name;
        const email = req.body.email;
        const username = req.body.username;
        const password = req.body.password;

        req.checkBody('name', 'Name is required').notEmpty();
        req.checkBody('email', 'Email is required').notEmpty();
        req.checkBody('email', 'Email is not valid').isEmail();
        req.checkBody('username', 'Username is required').notEmpty();
        req.checkBody('password', 'Password is required').notEmpty();
        req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

        let errors = req.validationErrors();

        if (errors) {
            res.locals.user = req.user;
            res.render('edit-profile', {
                title: 'Edit Profile',
                errors: errors,
                path: '/editProfile'
            });
        } else {
            user.name = name;
            user.email = email;
            user.username = username;
            user.password = password;
    
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(user.password, salt, function (err, hash) {
                    if (err) {
                        console.log(err);
                    }
                    user.password = hash;
                    let query = { _id: req.params.id }
                    //Article.update(query, article, 
                    User.update(query, user, function (err) {
                        if (err) {
                            console.log(err);
                            return;
                        } else {
                            req.flash('success', 'Your Profile has been successfully updated');
                            res.redirect('/');
                        }
                    });
                });
            });

        }


    });
});

function checkAuthentication(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash('danger', 'Please Login!');
        res.redirect('/users/login');
    }
}

module.exports = router;