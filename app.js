const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'hbs');
const session = require('express-session');
const sessionOptions = {
    secret: 'secret cookie thang (store this elsewhere!)',  
    resave: true,
    saveUninitialized: true,
};
app.use(session(sessionOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(async(req, res, next) => {
    if (req.session.username) {
        req.user = await User.findOne({ username: req.session.username }).exec();
    }
    next();
});

app.get('/login', (req, res) => {
    res.render('login', {});
});

app.post('/login', (req, res) => {});

app.get('/register', (req, res) => {
    res.render('register', {});
})

app.post('/register', (req, res) => {});

app.listen(3000);