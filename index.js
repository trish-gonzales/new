if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
};

const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const localStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override');
const initializePassport = require('./passport-config');
const nodemailer = require('nodemailer');
const xoauth2 = require('xoauth2');
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
app.set('view engine', 'handlebars');
app.engine('handlebars', exphbs.engine({ extname: '.handlebars', defaultLayout: "main"}));
app.use(express.static(path.join(__dirname, 'Main')));
app.use(flash());
app.use(session({
    secret: (process.env.SESSION_SECRET || 'this is a secret'),
    resave: false,
    saveUninitialized: false
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}))

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
    // res.sendFile(path.join(__dirname, '/Main/feedback.html'));
    res.render('feedback.handlebars', {layout: false});
});

app.post('/send_feedback', (req, res) => {
    const user_feedback = `
        <p>Feedback from user</p>
        <ul>
            <li>Experience: ${req.body.experience}</li>
            <li>Name: ${req.body.name}</li>
            <li>Phone Number: ${req.body.number}</li>
            <li>Email: ${req.body.email}</li>
            <li>Message: ${req.body.message}</li>
        </ul>
    `;

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            type: 'OAuth2',
            user: 'nmailer69@gmail.com',
            clientId: '157778543832-9tsif7g9fdi9lpgnnvtgu0ka6ois4d8a.apps.googleusercontent.com',
            clientSecret: 'Pq7h0sB7ZkJh1BQoo1vyT7lD',
            refreshToken: '1//04iCCyEXgaeiDCgYIARAAGAQSNwF-L9IruQwjVPUPheoQb4G8Bpyv3_M2KFjSAwttMSwySQ8HhwZmfTzURlfPs0OH9PfpNS6Wq4o',
            accessToken: 'ya29.a0AfH6SMD_MGOhwvMg8uCt9av1Quu7VndbymfeCS0MRKEjtXOvd9Ra5m5eXWBMfm-OjZtwifkmDiWe8zFgT_3PeFu2RJQd2F12nJIB1gamG2IlsHDpp0rpVqJODqFUxmyCH8vtV30uuY7tt3Pflc9rXYABHkRrhemXxlBokBVTg3s'
            // user: process.env.EMAIL, // generated ethereal use
            // clientId: process.env.GOOGLE_CLIENT_ID,
            // clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            // accessToken: process.env.GOOGLE_ACCESS_TOKEN
        },
        tls : {
            rejectUnauthorized : false
        }
    });

    let info = transporter.sendMail({
        from: '"Portfolio Contact" <nmailer69@gmail.com>', // sender address
        to: "harrison.arranzhurtado@gmail.com", // list of receivers
        subject: "Porfolio contact request", // Subject line
        text: "Hello world?", // plain text body
        html: user_feedback, // html body
    });
    console.log(info)
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