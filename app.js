const express = require('express');
const session = require('express-session');
const path = require('path');

const { sql, queries } = require('./db.js');

const app = express();

const PORT = process.env.PORT || 3000;

app.set('view engine', 'hbs');

app.use(session({
    secret: 'ATRSSESSIONHASH',  
    resave: true,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
    res.render('login', { message: 'test message' });
});

app.post('/login', (req, res) => {});

app.get('/register', (req, res) => {
    res.render('register', {});
})

const handleRegister = async function(req, res) {
    const {username, password, role} = req.body;
    if (username === '') {
        res.render('register', { message: 'Username is required' });
        return;
    }

    if (password === '') {
        res.render('register', { message: 'Password is required' });
        return;
    }

    if (password.length < 6) {
        res.render('register', { message: 'Unsafe password' });
        return;
    }
    
    if (role !== 'Customer') {
        res.render('register', { message: 'Only customer login is supported currently' });
        return;
    }

    sql.query(queries.findCustomerByName(username), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'Username is occupied' });
        }
        else {
            saveCustomerToDatabase();
        }
    });

    const saveCustomerToDatabase = () => {
        console.log('saving customer');
        sql.query(queries.saveCustomer(username, password), (err, results, fields) => {
            if (err) {
                throw err;
            }
            console.log(results);
        });
    }
}
app.post('/register', handleRegister);

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
