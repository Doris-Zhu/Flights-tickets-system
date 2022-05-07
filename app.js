const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
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
app.get('/logout', (req, res) => {
	req.user = undefined;
	req.session.username = undefined;
	res.redirect('/login');
});

const handleGetHome = function(req, res) {
    if(req.query.search === undefined || req.query.search === ''){
        sql.query(queries.findAllFlights(), async (err, results, fields) => {
            if (err) {
                throw err;
            }
            else{
                const flights = results;
                if(req.session.role === 'customer'){
                    res.render('home_customer', {user: req.session.email, flights: flights});
                }
                else if(req.session.role === 'agent'){
                    res.render('home_agent', {user: req.session.email, flights: flights});
                }
                else if(req.session.role === 'staff'){
                    res.render('home_staff', {user: req.session.username, flights: flights});
                }
            }
        });
    }
    else{
        sql.query(queries.findFlights(req.query.search), async (err, results, fields) => {
            console.log(req.query.search);
            if (err) {
                throw err;
            }
            else{
                const flights = results;
                console.log('post', flights);
                if(req.session.role === 'customer'){
                    res.render('home_customer', {user: req.session.email, flights: flights});
                }
                else if(req.session.role === 'agent'){
                    res.render('home_agent', {user: req.session.email, flights: flights});
                }
                else if(req.session.role === 'staff'){
                    res.render('home_staff', {user: req.session.username, flights: flights});
                }
            }
            
        });
    }
    
};

app.get('/', handleGetHome);

app.get('/logout', (req, res) => {
	req.user = undefined;
	req.session.username = undefined;
	res.redirect('/login');
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

    sql.query(queries.findCustomerByEmail(body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'This email is already registered.' });
        }
        else {
            const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(body.password, salt);
            body.password = hash;
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

    sql.query(queries.findAgentByEmail(body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'This email is already registered.' });
        }
        else {
            const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(body.password, salt);
            body.password = hash;
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

    sql.query(queries.findStaffByUsername(body.username), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
            res.render('register', { message: 'This username is already registered.' });
        }
        else {
            const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(body.password, salt);
            body.password = hash;
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
    sql.query(queries.findCustomerByEmail(req.body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
           const password = req.body.password;
           const validPassword = await bcrypt.compare(password, results[0].password);
           console.log(validPassword);
           if(validPassword){
               req.session.email = req.body.email;
               req.session.role = 'customer';
               res.redirect('/');
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
    sql.query(queries.findAgentByEmail(req.body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        console.log(results);
        if (results.length > 0) {
           const password = req.body.password;
           const validPassword = await bcrypt.compare(password, results[0].password);
           console.log(validPassword);
           if(validPassword){
               req.session.email = req.body.email;
               req.session.role = 'agent';
               res.redirect('/');
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
    sql.query(queries.findStaffByUsername(req.body.username), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
           const password = req.body.password;
           const validPassword = await bcrypt.compare(password, results[0].password);
           if(validPassword){
               req.session.username = req.body.username;
               req.session.role = 'staff';
               res.redirect('/');
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

// const getFlights  = function(req, res){
//     sql.query(queries.findAllFlights(), async (err, results, fields) => {
//         if (err) {
//             throw err;
//         }
//         else{
//             console.log(results);
//             return results;
//         }
//     });
// };

app.post('/registerCustomer', handleCustomerRegister);

app.post('/registerAgent', handleAgentRegister);

app.post('/registerStaff', handleStaffRegister);

app.post('/loginCustomer', handleCustomerLogin);

app.post('/loginAgent', handleAgentLogin);

app.post('/loginStaff', handleStaffLogin);

app.post('/')

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
