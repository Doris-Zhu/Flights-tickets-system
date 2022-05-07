const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const moment = require('moment');
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
    req.session.user = undefined;
    req.session.role = undefined;
	res.redirect('/');
});

// HOME
const handleGetHome = function(req, res) {
    if (req.query.search === undefined || req.query.search === '') {
        sql.query(queries.findAllFlights(), async (err, results, fields) => {
            if (err) {
                throw err;
            }
            const flights = results;
            if (req.session.role === 'customer') {
                res.render('home_customer', { user: req.session.user.email, flights: flights });
            }
            else if (req.session.role === 'agent') {
                res.render('home_agent', { user: req.session.user.email, flights: flights });
            }
            else if (req.session.role === 'staff') {
                res.render('home_staff', { user: req.session.user.username, flights: flights });
            }
        });
    }
    else {
        sql.query(queries.findFlights(req.query.search), async (err, results, fields) => {
            console.log(req.query.search);
            if (err) {
                throw err;
            }
            else {
                const flights = results;
                console.log('post', flights);
                if (req.session.role === 'customer') {
                    res.render('home_customer', {user: req.session.user.email, flights: flights});
                }
                else if (req.session.role === 'agent') {
                    res.render('home_agent', {user: req.session.user.email, flights: flights});
                }
                else if (req.session.role === 'staff') {
                    res.render('home_staff', {user: req.session.user.username, flights: flights});
                }
            }
        });
    }
};

app.get('/', handleGetHome);
// END OF HOME

// LOGIN
const handleLogin = async (req, res, results, role) => {
    if (results.length === 1) {
        const correctPassword = await bcrypt.compare(req.body.password, results[0].password);
        if (correctPassword) {
            req.session.user = results[0];
            req.session.role = role;
            res.redirect('/home');
        }
        else {
            res.render(`${role}_login`, { message:'Your login or password is incorrect.' });
        }
     }
     else {
         res.render(`${role}_login`, { message:'User not existed.' });
     }
};

const handleCustomerLogin  = async function(req, res) {
    sql.query(queries.findCustomerByEmail(req.body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        handleLogin(req, res, results, 'customer');
    });
};

const handleAgentLogin  = async function(req, res) {
    sql.query(queries.findAgentByEmail(req.body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        handleLogin(req, res, results, 'agent');
    });
};

const handleStaffLogin  = async function(req, res) {
    sql.query(queries.findStaffByUsername(req.body.username), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        handleLogin(req, res, results, 'staff');
    });
};

app.get('/login', (req, res) => {
    if (req.query.role === undefined) {
        res.render('role', { op: 'login' });
    }
    else {
        res.redirect(`/login/${req.query.role}`);
    }
});

app.get('/login/customer', (req, res) => {
    res.render('customer_login');
});

app.post('/login/customer', handleCustomerLogin);

app.get('/login/agent', (req, res) => {
    res.render('agent_login');
});

app.post('/login/agent', handleAgentLogin);

app.get('/login/staff', (req, res) => {
    res.render('staff_login');
});

app.post('/login/staff', handleStaffLogin);
// END OF LOGIN

// REGISTER
const hashPassword = async (body) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(body.password, salt);
    body.password = hash;
};

const handleCustomerRegister = async function(req, res) {
    const body = req.body;
    if (body.email === '') {
        res.render('customer_register', { message: 'Email is required' });
        return;
    }

    if (body.name === '') {
        res.render('customer_register', { message: 'Name is required' });
        return;
    }

    if (body.password === '') {
        res.render('customer_register', { message: 'Password is required' });
        return;
    }
    if (body.password.length < 6) {
        res.render('customer_register', { message: 'Unsafe password' });
        return;
    }

    if (body.buildingnum === '' || body.street === '' || body.city === '' || body.state === '') {
        res.render('customer_register', { message: 'Address information is required' });
        return;
    }

    if (body.phone === '') {
        res.render('customer_register', { message: 'Phone number is required' });
        return;
    }

    if (body.passportnum === ''|| body.exp === '' || body.passportcountry === '') {
        res.render('customer_register', { message: 'Passport information is required' });
        return;
    }
    if (!moment(body.exp, "YYYY-MM-DD", true).isValid()) {
        res.render('customer_register', { message: 'Invalid date format' });
    }

    if (body.dob === '') {
        res.render('customer_register', { message: 'Date of birth is required' });
        return;
    }
    if (!moment(body.dob, "YYYY-MM-DD", true).isValid()) {
        res.render('customer_register', { message: 'Invalid date format' });
    }

    sql.query(queries.findCustomerByEmail(body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.render('customer_register', { message: 'This email is already registered.' });
        }
        else {
            saveCustomerToDatabase();
        }
    });

    const saveCustomerToDatabase = async () => {
        console.log('saving customer');
        await hashPassword(body);
        sql.query(queries.saveCustomer(body), (err, results, fields) => {
            if (err) {
                throw err;
            }
            res.redirect('/login')
        });
    }
};

const handleAgentRegister = async function(req, res) {
    const body = req.body;
    if (body.email === '') {
        res.render('agent_register', { message: 'Email is required' });
        return;
    }

    if (body.password === '') {
        res.render('agent_register', { message: 'Password is required' });
        return;
    }
    if (body.password.length < 6) {
        res.render('agent_register', { message: 'Unsafe password' });
        return;
    }

    sql.query(queries.findAgentByEmail(body.email), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.render('agent_register', { message: 'This email is already registered.' });
        }
        else {
            saveAgentToDatabase();
        }
    });

    const saveAgentToDatabase = async () => {
        console.log('saving agent');
        await hashPassword(body);
        sql.query(queries.saveAgent(body), (err, results, fields) => {
            if (err) {
                throw err;
            }
            res.redirect('/login')
        });
    }
};

const handleStaffRegister = async function(req, res) {
    const body = req.body;
    if (body.username === '') {
        res.render('staff_register', { message: 'Username is required' });
        return;
    }

    if (body.password === '') {
        res.render('staff_register', { message: 'Password is required' });
        return;
    }
    if (body.password.length < 6) {
        res.render('staff_register', { message: 'Unsafe password' });
        return;
    }

    if (body.firstname === '' || body.lastname === '') {
        res.render('staff_register', { message: 'Firstname and lastname are required' });
        return;
    }

    if (body.dob === '') {
        res.render('staff_register', { message: 'Date of birth is required' });
        return;
    }
    if (!moment(body.dob, "YYYY-MM-DD", true).isValid()) {
        res.render('staff_register', { message: 'Invalid date format' });
    }
    
    if (body.airlinename === '') {
        res.render('staff_register', { message: 'Airline name is required' });
        return;
    }

    sql.query(queries.findStaffByUsername(body.username), async (err, results, fields) => {
        if (err) {
            throw err;
        }
        if (results.length > 0) {
            res.render('staff_register', { message: 'This username is already registered.' });
        }
        else {
            checkAirlineName();
        }
    });

    const checkAirlineName = () => {
        sql.query(queries.findAirlineByName(body.airlinename), async (err, results, fields) => {
            if (err) {
                throw err;
            }
            if (results.length === 0) {
                res.render('staff_register', { message: 'Airline is not in database' });
            }
            else {
                saveStaffToDatabase();
            }
        });
    };

    const saveStaffToDatabase = async () => {
        console.log('saving staff');
        await hashPassword(body);
        sql.query(queries.saveStaff(body), (err, results, fields) => {
            if (err) {
                throw err;
            }
            res.redirect('/login')
        });
    }
};

app.get('/register', (req, res) => {
    if (req.query.role === undefined) {
        res.render('role', { op: 'register' });
    }
    else {
        res.redirect(`/register/${req.query.role}`);
    }
});

app.get('/register/customer', (req, res) => {
    res.render('customer_register');
});

app.post('/register/customer', handleCustomerRegister);

app.get('/register/agent', (req, res) => {
    res.render('agent_register');
});

app.post('/register/agent', handleAgentRegister);

app.get('/register/staff', (req, res) => {
    res.render('staff_register');
});

app.post('/register/staff', handleStaffRegister);

app.post('/');

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
