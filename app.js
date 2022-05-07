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
const handleGetHome = async function(req, res) {
    const results = await sql(queries.findAllFlights());
    res.render('home_staff', { flights: results });
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
            res.redirect('/');
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
    const results = await sql(queries.findCustomerByEmail(req.body.email));
    handleLogin(req, res, results, 'customer');
};

const handleAgentLogin  = async function(req, res) {
    const results = await sql(queries.findAgentByEmail(req.body.email));
    handleLogin(req, res, results, 'agent');
};

const handleStaffLogin  = async function(req, res) {
    const results = await sql(queries.findStaffByUsername(req.body.username));
    handleLogin(req, res, results, 'staff');
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
        return;
    }

    if (body.dob === '') {
        res.render('customer_register', { message: 'Date of birth is required' });
        return;
    }
    if (!moment(body.dob, "YYYY-MM-DD", true).isValid()) {
        res.render('customer_register', { message: 'Invalid date format' });
        return;
    }

    const results = await sql(queries.findCustomerByEmail(body.email));
    if (results.length > 0) {
        res.render('customer_register', { message: 'This email is already registered.' });
    }
    else {
        saveCustomerToDatabase();
    }

    const saveCustomerToDatabase = async () => {
        console.log('saving customer');
        await hashPassword(body);
        const results = await sql(queries.saveCustomer(body));
        res.redirect('/login');
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

    const results = await sql(queries.findAgentByEmail(body.email));
    if (results.length > 0) {
        res.render('agent_register', { message: 'This email is already registered.' });
    }
    else {
        saveAgentToDatabase();
    }

    const saveAgentToDatabase = async () => {
        console.log('saving agent');
        await hashPassword(body);
        body.id = Math.floor(Math.random() * (2**31 - 1));
        const results = await sql(queries.saveAgent(body));
        res.redirect('/login');
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
        return;
    }
    
    if (body.airlinename === '') {
        res.render('staff_register', { message: 'Airline name is required' });
        return;
    }

    const results = await sql(queries.findStaffByUsername(body.username));
    if (results.length > 0) {
        res.render('staff_register', { message: 'This username is already registered.' });
    }
    else {
        checkAirlineName();
    }

    const checkAirlineName = async () => {
        const results = await sql(queries.findAirlineByName(body.airline));
        if (results.length === 0) {
            res.render('staff_register', { message: 'Airline is not in database' });
        }
        else {
            saveStaffToDatabase();
        }
    };

    const saveStaffToDatabase = async () => {
        console.log('saving staff');
        await hashPassword(body);
        const results = await sql(queries.saveStaff(body));
        res.redirect('/login');
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

// STAFF
async function getPermission(username) {
    let permission = 'None'
    permission = await sql.execute(queries.getPermission(username));
    // , (err, results, fields) => {
    //     if (err) {
    //         throw err;
    //     }
    //     if (results.length === 0) {
    //         return;
    //     }
    //     else if (results.length === 1) {
    //         console.log(results[0].permission_type);
    //         permission = results[0].permission_type;
    //         return permission;
    //     }
    //     else {
    //         throw new Error();
    //     }
    // });
    console.log('out', permission);
    return permission;
}

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
