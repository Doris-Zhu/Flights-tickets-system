const mysql = require('mysql2/promise');
const { connectionConfig } = require('./dbconfig.js');

async function sql(query) {
    const connection = await mysql.createConnection(connectionConfig);
    const [rows, fields] = await connection.execute(query);
    return rows;
}

const findCustomerByName = (name) => `SELECT * FROM customer WHERE name = '${name}'`;

const findCustomerByEmail = (email) => `SELECT * FROM customer WHERE email = '${email}'`;

const findAgentByEmail = (email) => `SELECT * FROM booking_agent WHERE email = '${email}'`;

const findStaffByUsername = (username) => `SELECT * FROM airline_staff WHERE username = '${username}'`;

const findAirlineByName = (name) => `SELECT * FROM airline WHERE airline_name = '${name}'`;

const saveCustomer = (body) => `
INSERT INTO customer
VALUES ('${body.email}', '${body.name}', '${body.password}', '${body.buildingnum}', '${body.street}', 
'${body.city}', '${body.state}', '${body.phone}', '${body.passportnum}', '${body.exp}', '${body.passportcountry}', '${body.dob}')
`;

const saveAgent = (body) => `
INSERT INTO booking_agent
VALUES ('${body.email}', '${body.password}', '${body.id}')
`;

const saveStaff = (body) => `
INSERT INTO airline_staff
VALUES ('${body.username}', '${body.password}', '${body.firstname}', '${body.lastname}', 
'${body.dob}', '${body.airline}')
`;

const findAllFlights = () => `SELECT * FROM flight`;

const findFlights = (keyword) => `
SELECT * FROM flight WHERE departure_airport = '${keyword}'
or arrival_airport = '${keyword}'
`;

const addFlight = (body) => `
INSERT INTO flight
VALUES ('${body.flightName}', '${body.flightNum}', '${body.depAirport}', '${body.depTime}', '${body.arrAirport}', 
'${body.arrTime}', '${body.price}', '${body.status}', '${body.airplane}')
`;

const getPermission = (username) => `
SELECT permission_type
FROM permission
WHERE username = '${username}'
`

module.exports = {
    sql,
    queries: {
        findCustomerByName,
        findCustomerByEmail,
        findAgentByEmail,
        findStaffByUsername,
        saveCustomer,
        saveAgent,
        saveStaff,
        findAirlineByName,
        findAllFlights,
        findFlights,
        addFlight,
        getPermission,
    },
}
