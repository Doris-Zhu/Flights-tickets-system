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

app.get('/', (req, res) => {
    res.render('home', {  });
});

app.get('/login', (req, res) => {
    if (req.query.role === undefined) {
        res.render('role', { op: 'login' });
    }
    else {
        if (req.query.role === 'Customer') {
            res.redirect('/loginCustomer');
        }
        else if (req.query.role === 'Agent') {
            res.redirect('/loginAgent');
        }
        else if (req.query.role === 'Staff') {
            res.redirect('/loginStaff');
        }
        else {
            throw new Error();
        }
    }
});

app.get('/loginCustomer', (req, res) => {
    res.render('customer_login');
});

app.get('/loginAgent', (req, res) => {
    res.render('agent_login');
});

app.get('/loginStaff', (req, res) => {
    res.render('staff_login');
});

// handle login
app.post('/login', (req, res) => {
    res.render('login', {  });
});

app.get('/register', (req, res) => {
    if (req.query.role === undefined) {
        res.render('role', { op: 'register' });
    }
    else {
        if (req.query.role === 'Customer') {
            res.render('customer_register', {  });
        }
        else if (req.query.role === 'Agent') {
            res.render('agent_register', {});
        }
        else if (req.query.role === 'Staff') {
            res.render('staff_register', {});
        }
        else {
            throw new Error();
        }
    }
});

const handleCustomerRegister = async function(req, res) {
    const body = req.body;
    console.log(body);
    if (body.email === '') {
        res.render('register', { message: 'Email is required' });
        return;
    }
    if (body.name === '') {
        res.render('register', { message: 'Name is required' });
        return;
    }
    if (body.password === '') {
        res.render('register', { message: 'Password is required' });
        return;
    }
    if (body.buildingnum === '' || body.street === '' || body.city === '' || body.state === '') {
        res.render('register', { message: 'Address information is required' });
        return;
    }
    if (body.phone === '') {
        res.render('register', { message: 'Phone number is required' });
        return;
    }
    if (body.passportnum === ''|| body.exp === '' || body.passportcountry === '') {
        res.render('register', { message: 'Passport information is required' });
        return;
    }
    if (body.dob === '') {
        res.render('register', { message: 'Date of birth is required' });
        return;
    } //TODO: check format
    if (body.password.length < 6) {
        res.render('register', { message: 'Unsafe password' });
        return;
    }

    sql.query(queries.findCustomerByEmail(body.email), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'This email is already registered.' });
        }
        else {
            saveCustomerToDatabase();
        }
    });

    const saveCustomerToDatabase = () => {
        console.log('saving customer');
        body.phone = parseInt(body.phone);
        console.log(body);
        sql.query(queries.saveCustomer(body), (err, results, fields) => {
            if (err) {
                throw err;
            }
            else{
                res.redirect('/login')
            }
            console.log(results);
        });
    }
};

const handleAgentRegister = async function(req, res) {
    const body = req.body;
    console.log(body);
    if (body.email === '') {
        res.render('register', { message: 'Email is required' });
        return;
    }
    if (body.password === '') {
        res.render('register', { message: 'Password is required' });
        return;
    }
    if (body.password.length < 6) {
        res.render('register', { message: 'Unsafe password' });
        return;
    }

    sql.query(queries.findAgentByEmail(body.email), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'This email is already registered.' });
        }
        else {
            saveAgentToDatabase();
        }
    });

    const saveAgentToDatabase = () => {
        console.log('saving agent');
        console.log(body);
        sql.query(queries.saveAgent(body), (err, results, fields) => {
            if (err) {
                throw err;
            }
            else{
                res.redirect('/login')
            }
            console.log(results);
        });
    }
};

const handleStaffRegister = async function(req, res) {
    const body = req.body;
    console.log(body);
    if (body.username === '') {
        res.render('register', { message: 'Username is required' });
        return;
    }
    if (body.password === '') {
        res.render('register', { message: 'Password is required' });
        return;
    }
    if (body.firstname === '' || body.lastname === '') {
        res.render('register', { message: 'Firstname and lastname are both required' });
        return;
    }

    if (body.airlinename === '') {
        res.render('register', { message: 'Airline name is required' });
        return;
    }//check airline name
    if (body.dob === '') {
        res.render('register', { message: 'Date of birth is required' });
        return;
    } //TODO: check format
    if (body.password.length < 6) {
        res.render('register', { message: 'Unsafe password' });
        return;
    }

    sql.query(queries.findStaffByUsername(body.username), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'This username is already registered.' });
        }
        else {
            saveStaffToDatabase();
        }
    });

    const saveStaffToDatabase = () => {
        console.log('saving staff');
        console.log(body);
        sql.query(queries.saveStaff(body), (err, results, fields) => {
            if (err) {
                throw err;
            }
            else{
                res.redirect('/login')
            }
            console.log(results);
        });
    }
};

const handleCustomerLogin  = async function(req, res){
    sql.query(queries.findCustomerByEmail(req.body.email), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
           const pw = req.body.pw;
           if(pw === results.password){
               req.session.email = req.body.email;
               req.session.role = 'customer';
               res.redirect('/home');
           }
            else {
		        res.render('customer_login', { message:'Your login or password is incorrect.' });
		    }
        }
        else {
            res.render('customer_login', { message:'User not existed.' });
        }
    });
};

const handleAgentLogin  = async function(req, res){
    sql.query(queries.findAgentByEmail(req.body.email), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
           const pw = req.body.pw;
           if(pw === results.password){
               req.session.email = req.body.email;
               req.session.role = 'agent';
               res.redirect('/home');
           }
            else {
		        res.render('agent_login', { message:'Your login or password is incorrect.' });
		    }
        }
        else {
            res.render('agent_login', { message:'User not existed.' });
        }
    });
};

const handleStaffLogin  = async function(req, res){
    sql.query(queries.findStaffByUsername(req.body.username), (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
           const pw = req.body.pw;
           if(pw === results.password){
               req.session.username = req.body.username;
               req.session.role = 'staff';
               res.redirect('/home');
           }
            else {
		        res.render('staff_login', { message:'Your login or password is incorrect.' });
		    }
        }
        else {
            res.render('staff_login', { message:'User not existed.' });
        }
    });
};

app.post('/registerCustomer', handleCustomerRegister);

app.post('/registerAgent', handleAgentRegister);

app.post('/registerStaff', handleStaffRegister);

app.post('/loginCustomer', handleCustomerLogin);

app.post('/loginAgent', handleAgentLogin);

app.post('/loginStaff', handleStaffLogin);

app.post('/')

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
