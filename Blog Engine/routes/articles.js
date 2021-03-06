const express = require('express');
const router = express.Router();
const imageStorageStartegy = require('../controller/imageStorage');

//Getting out models
let Article = require('../models/articles');
let User = require('../models/user');

router.get('/', checkAuthentication, (req, res, next) => {
    res.render('add-article', {
        title: 'Add Article',
        author: req.user.name,
        errors: null,
        path: '/addArticle'
    });
});

//POST route for submiting articles
router.post('/', checkAuthentication, imageStorageStartegy.single('articleImage'), (req, res, next) => {

    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('body', 'Article body is required').notEmpty();

    // Getting all validation errors
    let errors = req.validationErrors();

    if (errors) {
        res.locals.user = req.user
        res.render('add-article', {
            title: 'Add-Article',
            errors: errors,
            path: 'addArticle'
        });
    } else {
        let article = new Article();
        article.title = req.body.title;
        article.userAuthorID = req.user._id;
        article.body = req.body.body;
        article.author = req.user.name;
        if(req.file !=undefined || req.file != null){
            article.articleImage = req.file.filename;
        }
        article.save(err => {
            if (err) {
                console.log(err);
                return;
            } else {
                req.flash('success', 'Article Added Successfully!');
                res.redirect('/');
            }
        });
    }
});

//get single article
router.get('/:id', function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        User.findById(article.userAuthorID, function(err, user){
            res.render('view-article', {
                title: 'View Article',
                article: article,
                author: user.name,
                email: user.email,
                path: '/viewArticle'
        });
        });
    });
});

//Adding a replaceAll function for removing script injections in comments.
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

//Adding Comments middleware
router.post('/:id', function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        User.findById(article.userAuthorID, function (err, user) {
            let verfiedComment = req.body.comment;
            if(req.body.comment.includes('script')){
                verfiedComment = req.body.comment.replaceAll('script','');
            }
            article.comment.push(verfiedComment);
            let query = { _id: req.params.id }
            Article.update(query, article, function (err) {
                if (err) {
                    console.log(err);
                    return;
                } else {
                    res.locals.user = req.user;
                    res.render('view-article', {
                        title: 'View Article',
                        article: article,
                        author: article.author,
                        email: user.email,
                        path: '/viewArticle'
                    });
                }
            });
        });
        
    });
});



//Loading edit form
router.get('/edit/:id', checkAuthentication, function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        if(article.userAuthorID != req.user._id){
            req.flash('danger', 'Not Authorized');
            res.redirect('/');
        }
        res.render('edit-article', {
            title: 'Edit Article',
            article: article,
            errors: null,
            path: '/editArticle'
        });
    });
});

//Update Submit POST Route
router.post('/edit/:id', checkAuthentication, imageStorageStartegy.single('articleImage'), (req, res, next) => {
    let article = {};
    article.title = req.body.title;
    //article.author = req.body.author;
    article.body = req.body.body;
    if (req.file != undefined || req.file != null) {
        article.articleImage = req.file.filename;
    }
    let query = { _id: req.params.id }
    Article.update(query, article, function (err) {
        if (err) {
            console.log(err);
            return;
        } else {
            req.flash('success', 'Article Updated Successfully!');
            res.redirect('/');
        }
    });
});

//Deleting ROUTE

router.delete('/:id', function (req, res) {

    if (!req.user._id) {
        res.status(500).send();
    }

    let query = { _id: req.params.id }
    Article.findById(req.params.id, function (err, article) {
        if (article.userAuthorID != req.user._id) {
            res.status(500).send();
        } else {

            Article.remove(query, function (err) {
                if (err) {
                    console.log(err);
                }
                res.send('Success');
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