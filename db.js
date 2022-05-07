const mysql = require('mysql');
const { connectionConfig } = require('./dbconfig.js');

const connection = mysql.createConnection(connectionConfig);
connection.connect(err => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected to mysql as id ' + connection.threadId);
});

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
SELECT flight.airline_name,flight.flight_num,flight.departure_airport,flight.departure_time,
flight.arrival_airport,flight.arrival_time,flight.price,flight.status,flight.airplane_id
FROM flight,airport
WHERE flight.departure_airport = '${keyword}'
or flight.arrival_airport = '${keyword}'
or (flight.departure_airport = airport.airport_name and airport.airport_city = '${keyword}')
or (flight.arrival_airport = airport.airport_name and airport.airport_city = '${keyword}')
`;

const addFlight = (body) => `
INSERT INTO flight
VALUES ('${body.airlineName}’, '${body.flightNum}’, '${body.depAirport}’, '${body.depTime}’, '${body.arrAirport}’, 
'${body.arrTime}’, '${body.price}’, '${body.status}’, '${body.airplane}’)
`;

module.exports = {
    sql: connection, 
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
        addFlight
    },
}
