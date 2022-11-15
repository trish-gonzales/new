if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
};

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');
const initializePassport = require('./passport-config');
const path = require('path');
const User = require('./model/user');

const app = express();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clothingdealfinder', { useNewUrlParser: true, useUnifiedTopology: true},
    err => {
        if (err) {
            throw err;
        }
        console.log('Connected to MongoDB')
    }
);

// middlwear
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'Main')));
app.use(flash());
app.use(session({
    secret: (process.env.SESSION_SECRET || 'this is a secret'),
    resave: false,
    saveUninitialized: false
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// passport.js
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

initializePassport(passport, email => {
    return User.findOne({ email : email })
});

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    } else {
        res.redirect('/login');
    }
}
function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}

// routes
app.get('/', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/Home.html'));
});

app.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login.ejs');
});

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuthenticated, function(req, res){
    res.render('register.ejs');
});

app.post('/register', checkNotAuthenticated, async function(req, res){
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const new_user_instance = new User({
            name: req.body.name,
            username: req.body.email,
            password: hashedPassword
        });
        new_user_instance.save(function(error){
            if (error){
                return error
            }
        });
        console.log('user added');
        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }
});

app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { 
        return next(err); 
        }
      res.redirect('/');
    });
});

app.get('/support', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/faq.html'));
});

app.get('/feedback', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/feedback.html'));
});

app.get('/tos', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/tos.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '/Main/privacyPolicy.html'));
});

app.listen(process.env.PORT || 8000, function(){
    console.log('Connected to localhost:8000');
});