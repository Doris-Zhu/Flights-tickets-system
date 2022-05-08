const bcrypt = require('bcrypt');
const express = require('express');
const hbs = require('hbs');
const moment = require('moment');
const path = require('path');
const session = require('express-session');

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
hbs.registerPartials(__dirname + '/views/partials');

app.get('/logout', (req, res) => {
	req.user = undefined;
    req.session.user = undefined;
    req.session.role = undefined;
    req.session.username = undefined;
	res.redirect('/');
});

// HELPERS
const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const addMonths = (input, months) => {
  const date = new Date(input)
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  date.setDate(Math.min(input.getDate(), getDaysInMonth(date.getFullYear(), date.getMonth()+1)));
  return date;
}
// END OF HELPERS

// HOME
const handleGetHome = async function(req, res) {
    const flights = await sql(queries.findFlights(req.query));
    if (req.session.role === undefined) {
        res.render('home', { flights });
    }
    else if (req.session.role === 'staff') {
        const permission = await getPermission(req.session.username);
        const admin = permission === 'Admin';
        const operator = permission === 'Operator';
        res.render('home', { user: req.session.username, flights, admin, operator, staff: true });
    }
    else if (req.session.role === 'agent') {
        let airlines = await sql(queries.findAgentAirlines(req.session.user.email));
        airlines = airlines.map(a => a.airline_name);
        const agentFlights = flights.map(f => ({ ...f, myAirline: airlines.includes(f.airline_name)}));
        res.render('home', { user:req.session.username, flights: agentFlights, agent: true });
    }
    else if (req.session.role === 'customer') {
        res.render('home', { user: req.session.username, flights, customer: true });
    }
};

app.get('/', handleGetHome);
// END OF HOME

//INFO
app.get('/myinfo', async (req, res) => {
	const role = req.session.role;
    if (role == 'customer') {
        const flights = await sql(queries.findMyFlights(req.session.user.email));
        const totalSpending = await sql(queries.trackTotalSpending(req.session.user.email));

        if (req.query.to === undefined || req.query.to === '') {
            req.query.to = new Date().toISOString().slice(0, 10);
        }
        let toDate = new Date(req.query.to);
        if (req.query.from === undefined || req.query.from === '') {
            req.query.from = addMonths(new Date(req.query.to), -5).toISOString().slice(0, 10);
        }
        let fromDate = new Date(req.query.from);
        if (fromDate > toDate) {
            fromDate = toDate;
            req.query.from = fromDate.toISOString().slice(0, 10);
        }

        const monthLabels = [];
        const monthSpendings = [];
        let loopDate = new Date(req.query.from);
        while (loopDate <= toDate) {
            monthLabels.push(loopDate.toISOString().slice(0, 7));
            monthSpendings.push(0);
            loopDate = addMonths(loopDate, 1);
        }
        const monthlySpending = await sql(queries.trackMonthlySpending(req.session.user.email, req.query.from, req.query.to));
        monthlySpending.forEach((spending) => {
            const yearMonth = `${spending.year}-` + `${spending.month}`.padStart(2, '0');
            for (let i = 0; i < monthLabels.length; i++) {
                if (monthLabels[i] === yearMonth) {
                    monthSpendings[i] = spending.price;
                }
            }
        });

        res.render('view_customer', {
            myflights: flights,
            spending: totalSpending[0].price,
            monthLabels,
            monthSpendings
        });
    }
    else if (role == 'agent') {
        const flights = await sql(queries.findAgentFlights(req.session.user.booking_agent_id));
        const commission = await sql(queries.findAgentCommission(req.session.user.booking_agent_id));
        const topCustomersByNum = await sql(queries.findTopCustomersByNum(req.session.user.booking_agent_id));
        const topCustomersByCom = await sql(queries.findTopCustomersByCommission(req.session.user.booking_agent_id));
        const customerEmails1 = topCustomersByNum.map(customer => customer.customer);
        const numOfTickets = topCustomersByNum.map(customer => customer.num);
        const customerEmails2 = topCustomersByCom.map(customer => customer.customer);
        const customerCommission = topCustomersByCom.map(customer => customer.total);
        res.render('view_agent', {
            myflights: flights, 
            commission: commission[0], 
            customerEmails1, 
            numOfTickets, 
            customerEmails2, 
            customerCommission
        });
    }
    else if (role == 'staff') {
        const flights = await sql(queries.findStaffFlights(req.session.user.airline_name));
        const topAgentsByTicketLastMonth = await sql(queries.topAgentsByTicketLastMonth(req.session.user.airline_name));
        res.render('view_staff', { myflights: flights, topAgentsByTicketLastMonth})
    }
});

app.post('/purchase', async (req, res) => {
    const purchaseInfo = JSON.parse(req.body.purchase);
    purchaseInfo.id = Math.floor(Math.random() * (2**31 - 1));
    if (req.session.role == 'customer') {
        purchaseInfo.email = req.session.user.email;
        purchaseInfo.agent_id = null;
        purchaseInfo.date = new Date().toISOString().slice(0, 10);
        await sql(queries.createTicket(purchaseInfo));
        await sql(queries.createPurchase(purchaseInfo));
    }
    else if (req.session.role == 'agent') {
        purchaseInfo.email = req.body[req.body.purchase];
        console.log(purchaseInfo.email);
        purchaseInfo.agent_id = req.session.user.booking_agent_id;
        purchaseInfo.date = new Date().toISOString().slice(0, 10);
        console.log(purchaseInfo);
        await sql(queries.createTicket(purchaseInfo));
        await sql(queries.createPurchase(purchaseInfo));
    }
    res.redirect('/myinfo');
});
//END OF INFO

// LOGIN
const handleLogin = async (req, res, results, role) => {
    if (results.length === 1) {
        const correctPassword = await bcrypt.compare(req.body.password, results[0].password);
        if (correctPassword) {
            req.session.user = results[0];
            req.session.role = role;
            if (role === 'customer') {
                req.session.username = results[0].name;
            }
            else if (role === 'agent') {
                req.session.username = results[0].email;
            }
            else {
                req.session.username = results[0].username;
            }
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
        return;
    }

    console.log('saving customer');
    await hashPassword(body);
    await sql(queries.saveCustomer(body));
    res.redirect('/login');
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
        return;
    }

    console.log('saving agent');
    await hashPassword(body);
    body.id = Math.floor(Math.random() * (2**31 - 1));
    await sql(queries.saveAgent(body));
    res.redirect('/login');
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

    let results = await sql(queries.findStaffByUsername(body.username));
    if (results.length > 0) {
        res.render('staff_register', { message: 'This username is already registered.' });
        return;
    }

    results = await sql(queries.findAirlineByName(body.airline));
    if (results.length === 0) {
        res.render('staff_register', { message: 'Airline is not in database' });
        return;
    }
    
    console.log('saving staff');
    await hashPassword(body);
    await sql(queries.saveStaff(body));
    res.redirect('/login');
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
// END OF REGISTER

// STAFF
async function getPermission(username) {
    const results = await sql(queries.getPermission(username));
    if (results.length === 1) {
        return results[0].permission_type;
    }
    return null;
}
// END OF STAFF

// STAFF OPERATION
const handleCreateFlight = async function(req, res) {
    const body = req.body;
    if (body.airline === '') {
        res.render('create_flight', { message: 'Airline Name is required' });
        return;
    }

    if (body.flightNum === '') {
        res.render('create_flight', { message: 'Password is required' });
        return;
    }

    if (body.depAirport === '' || body.depTime === '' || body.ArrAirport === '' || body.ArrTime === '') {
        res.render('create_flight', { message: 'Departure and Destination information is required' });
        return;
    }

    if (body.price === '') {
        res.render('create_flight', { message: 'Price is required' });
        return;
    }

    if (body.status === '') {
        res.render('create_flight', { message: 'Flight status is required' });
        return;
    }

    if (body.airplane === '') {
        res.render('create_flight', { message: 'Airplane ID is required' });
        return;
    }
    console.log('creating flight');
    await sql(queries.createFlight(body));
    res.redirect('/');
};

const handleAddAirport = async function(req, res) {
    const body = req.body;
    if (body.name === '') {
        res.render('add_airport', { message: 'Airport Name is required' });
        return;
    }

    if (body.city === '') {
        res.render('add_airport', { message: 'Airport City is required' });
        return;
    }
    console.log('Adding airport');
    await sql(queries.addAirport(body));
    res.redirect('/');
};

const handleAddAirplane = async function(req, res) {
    const body = req.body;
    if (body.name === '') {
        res.render('add_airplane', { message: 'Airline Name is required' });
        return;
    }

    if (body.id === '') {
        res.render('add_airplane', { message: 'Airplane ID is required' });
        return;
    }

    if (body.seat === '') {
        res.render('add_airplane', { message: 'Airplane seat is required' });
        return;
    }
    console.log('Adding airplane');
    await sql(queries.addAirplane(body));
    res.redirect('/');
};

const handleAddAgent = async function(req, res) {
    const email = req.body.email;
    const airline = req.session.user.airline_name;
    if (email === '') {
        res.render('add_agent', { message: 'The email of booking agent is required' });
        return;
    }
    console.log('Adding booking agent');
    await sql(queries.addAgent(email, airline));
    res.redirect('/');
};

const handleGrantPermission = async function(req, res) {
    const admin = req.body.admin;
    const operator = req.body.operator;
    if(admin !== undefined){
        await sql(queries.grantPermission(admin, 'Admin'));
        res.redirect('/');
    }
    else if(operator !== undefined){
        await sql(queries.grantPermission(operator, 'Operator'));
        res.redirect('/');
    }
    else{
        res.redirect('/grantStaffPermissoin');
    }
};

app.get('/createFlight', (req, res) => {
    res.render('create_flight');
});

app.get('/addAirport', (req, res) => {
    res.render('add_airport');
});

app.get('/addAirplane', (req, res) => {
    res.render('add_airplane');
});

app.get('/addBookingAgent', (req, res) => {
    res.render('add_agent');
});

app.get('/grantStaffPermission', async (req, res) => {
    const staffs = await sql(queries.findAllStaffs(req.session.username));
    res.render('grant_permission', {staffs});
});

app.post('/createFlight', handleCreateFlight);

app.post('/addAirport', handleAddAirport);

app.post('/addAirplane', handleAddAirplane);

app.post('/addBookingAgent', handleAddAgent);

app.post('/grantStaffPermission', handleGrantPermission);
//END OF STAFF OPERATION

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
