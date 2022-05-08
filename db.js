const mysql = require('mysql2/promise');
const { connectionConfig } = require('./dbconfig.js');

async function sql(query) {
    const connection = await mysql.createConnection(connectionConfig);
    const [rows, fields] = await connection.execute(query);
    connection.end();
    return rows;
}

queries = {
findCustomerByName: (name) => `
SELECT * FROM customer WHERE name = '${name}'
`,

findCustomerByEmail: (email) => `
SELECT * FROM customer WHERE email = '${email}'
`,

findAgentByEmail: (email) => `
SELECT * FROM booking_agent WHERE email = '${email}'
`,

findStaffByUsername: (username) => `
SELECT * FROM airline_staff WHERE username = '${username}'
`,

findAirlineByName: (name) => `
SELECT * FROM airline WHERE airline_name = '${name}'
`,

saveCustomer: (body) => `
INSERT INTO customer
VALUES ('${body.email}', '${body.name}', '${body.password}', '${body.buildingnum}', '${body.street}', 
    '${body.city}', '${body.state}', '${body.phone}', '${body.passportnum}', '${body.exp}', '${body.passportcountry}', '${body.dob}')
`,

saveAgent: (body) => `
INSERT INTO booking_agent
VALUES ('${body.email}', '${body.password}', '${body.id}')
`,

saveStaff: (body) => `
INSERT INTO airline_staff
VALUES ('${body.username}', '${body.password}', '${body.firstname}', '${body.lastname}', 
    '${body.dob}', '${body.airline}')
`,

findFlights: (query) => {
    let whereClause = '1';
    if (query.departure !== undefined && query.departure !== '') {
        whereClause += ` AND (
        flight.departure_airport = '${query.departure}' OR 
        dep.airport_city = '${query.departure}'
    )`;
    }
    if (query.destination !== undefined && query.destination !== '') {
        whereClause += ` AND (
        flight.arrival_airport = '${query.destination}' OR 
        des.airport_city = '${query.destination}'
    )`;
    }
    if (query.date !== undefined && query.date !== '') {
        whereClause += ` AND (
        DATE(flight.departure_time) = '${query.date}' OR
        DATE(flight.arrival_time) = '${query.date}'
    )`;
    }
    return `
SELECT DISTINCT flight.*
FROM flight, airport as dep, airport as des
WHERE (flight.departure_airport = dep.airport_name AND 
    flight.arrival_airport = des.airport_name) AND ${whereClause}
`;
},

addFlight: (body) => `
INSERT INTO flight
VALUES ('${body.flightName}', '${body.flightNum}', '${body.depAirport}', '${body.depTime}', '${body.arrAirport}', 
'${body.arrTime}', '${body.price}', '${body.status}', '${body.airplane}')
`,

getPermission: (username) => `
SELECT permission_type
FROM permission
WHERE username = '${username}'
`,

findMyFlights: (email) => `
SELECT flight.airline_name, flight.flight_num, flight.departure_airport, flight.departure_time,
    flight.arrival_airport, flight.arrival_time, flight.price, flight.status, flight.airplane_id
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.customer_email = '${email}'
`,

createTicket: (obj) => `
INSERT INTO ticket
VALUES ('${obj.id}', '${obj.airline}', '${obj.num}')
`,

createPurchase: (obj) => `
INSERT INTO purchases
VALUES ('${obj.id}', '${obj.email}', '${obj.agent_id}', '${obj.date}')
`,

trackTotalSpending: (email) => `
SELECT SUM(flight.price) as price
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.customer_email = '${email}' AND 
    purchases.purchase_date BETWEEN CURDATE() - INTERVAL 1 YEAR AND CURDATE()
`,

trackMonthlySpending: (email) => `
SELECT MONTH(purchases.purchase_date) as month, SUM(flight.price) as price
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.customer_email = '${email}' AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL 6 MONTH
    group by MONTH(purchases.purchase_date)
`,

findAgentFlights: (id) =>  `
SELECT flight.airline_name, flight.flight_num, flight.departure_airport, flight.departure_time,
    flight.arrival_airport, flight.arrival_time, flight.price, flight.status, flight.airplane_id
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.booking_agent_id = '${id}'
`,

findAgentAirlines: (email) => `
SELECT airline_name
FROM booking_agent_work_for
WHERE email = '${email}'
`,

findAgentCommission: (id) => `
SELECT sum(flight.price * 0.05) as total, count(flight.price) as num, sum(flight.price * 0.05)/count(flight.price) as average
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.booking_agent_id = '${id}' AND
    DATE(purchases.purchase_date) >= DATE(NOW()) - INTERVAL 30 DAY
`
}

module.exports = {
    sql,
    queries,
}
