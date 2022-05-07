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

const findFlights = (keyword) => {
    if (keyword === undefined || keyword === '') {
        return `SELECT * FROM flight`;
    }
    return `
    SELECT flight.airline_name, flight.flight_num, flight.departure_airport, flight.departure_time,
        flight.arrival_airport, flight.arrival_time, flight.price, flight.status, flight.airplane_id
    FROM flight, airport
    WHERE flight.departure_airport = airport.airport_name AND (
        flight.departure_airport = '${keyword}' OR 
        flight.arrival_airport = '${keyword}' OR 
        airport.airport_city = '${keyword}' OR 
        airport.airport_city = '${keyword}'
    )
    `;
}

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

const findMyFlights = (email) => `
SELECT flight.airline_name,flight.flight_num,flight.departure_airport,flight.departure_time,
flight.arrival_airport,flight.arrival_time,flight.price,flight.status,flight.airplane_id
FROM flight,ticket,purchases
WHERE flight.airline_name = ticket.airline_name
and flight.flight_num = ticket.flight_num
and ticket.ticket_id = purchases.ticket_id
and purchases.customer_email = ${email}
`

const createTicket = (obj) => `
INSERT INTO ticket
VALUES ('${obj.id}', '${obj.airline}', '${obj.num}')
`;

const createPurchase = (obj) => `
INSERT INTO purchases
VALUES ('${obj.id}', '${obj.email}', NULL, '${obj.date}')
`;

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
        findFlights,
        addFlight,
        getPermission,
        findMyFlights,
        createTicket,
        createPurchase
    },
}
