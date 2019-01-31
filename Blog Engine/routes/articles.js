const express = require('express');
const router = express.Router();
const imageStorageStartegy = require('../controller/imageStorage');

//Getting out models
let Article = require('../models/articles');

router.get('/', (req, res, next) => {
    res.render('add-article', {
        title: 'Add Article',
        errors: null
    });
    console.log('add page');
});

//POST route for submiting articles
router.post('/', imageStorageStartegy.single('articleImage'), (req, res, next) => {
    console.log(req.file);

    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('author', 'Author is required').notEmpty();
    req.checkBody('body', 'Article body is required').notEmpty();

    // Getting all validation errors
    let errors = req.validationErrors();

    if (errors) {
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
        res.render('view-article', {
            title: 'View Article',
            article: article
        });
    });
});

//Adding Comments middleware
router.post('/:id', function (req, res) {
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



//Loading edit form
router.get('/edit/:id', function (req, res) {
    Article.findById(req.params.id, function (err, article) {
        res.render('edit-article', {
            title: 'Edit Article',
            article: article
        });
    });
});

//Update Submit POST Route
router.post('/edit/:id', imageStorageStartegy.single('articleImage'), (req, res, next) => {
    console.log(req.file);
    let article = {};
    article.title = req.body.title;
    article.author = req.body.author;
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
    let query = { _id: req.params.id }

    Article.remove(query, function (err) {
        if (err) {
            console.log(err);
        }
        res.send('Success');
    });
});

module.exports = router;