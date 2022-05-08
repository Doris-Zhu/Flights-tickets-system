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
`,

findTopCustomersByNum: (id) => `
SELECT purchases.customer_email as customer, count(flight.price) as num
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.booking_agent_id = '${id}' AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL 6 MONTH
GROUP BY customer
ORDER BY num
DESC LIMIT 5
`,

findTopCustomersByCommission: (id) => `
SELECT purchases.customer_email as customer, sum(flight.price * 0.05) as total
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.booking_agent_id = '${id}' AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL 12 MONTH
GROUP BY customer
ORDER BY total
DESC LIMIT 5
`
}

module.exports = {
    sql,
    queries,
}
