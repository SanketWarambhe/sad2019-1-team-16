const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');

//Strategy for storing images
const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //rejecting a file
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
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


//Getting user model
let User = require('../models/user');

//Register form
router.get('/register', function(req, res) {
    res.render('register', {
        title: 'User Registration',
        errors: null
    });
});

router.post('/register', upload.single('profilePicture'), function(req, res) {
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
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    let errors = req.validationErrors();

    if(errors){
        res.render('register', {
            title: 'User Registration',
            errors: errors
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
                   } else {
                       req.flash('success', 'Registered successfully. You can now login');
                       res.redirect('/users/login');
                   }
                });
            });  
        });

    }

});

router.get('/login', function(req, res){
    res.render('login', {
        title: 'Login'
    });
})

module.exports = router;