const mysql = require('mysql2/promise');
const { connectionConfig } = require('./dbconfig.js');

async function sql(query) {
    const connection = await mysql.createConnection(connectionConfig);
    const [rows, fields] = await connection.execute(query);
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

findFlights: (keyword) => {
    if (keyword === undefined || keyword === '') {
        return `
SELECT * FROM flight
        `;
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
VALUES ('${obj.id}', '${obj.email}', NULL, '${obj.date}')
`,

trackTotalSpending: (email) => `
SELECT sum(flight.price) as p
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
flight.flight_num = ticket.flight_num AND 
ticket.ticket_id = purchases.ticket_id AND 
purchases.customer_email = '${email}' AND
purchases.purchase_date BETWEEN CURDATE() - INTERVAL 1 YEAR AND CURDATE()
`,

trackMonthlySpending: (email) => `
SELECT MONTH(purchases.purchase_date) as month,sum(flight.price) as p, month(curdate()) as curr
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
flight.flight_num = ticket.flight_num AND 
ticket.ticket_id = purchases.ticket_id AND 
purchases.customer_email = '${email}' AND
purchases.purchase_date > curdate() - interval (dayofmonth(curdate()) - 1) day - interval 6 month
group by MONTH(purchases.purchase_date)
`,
}




module.exports = {
    sql,
    queries,
}
