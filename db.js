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
SELECT *
FROM customer
WHERE name = '${name}'
`,

findCustomerByEmail: (email) => `
SELECT *
FROM customer
WHERE email = '${email}'
`,

findAgentByEmail: (email) => `
SELECT *
FROM booking_agent
WHERE email = '${email}'
`,

findStaffByUsername: (username) => `
SELECT *
FROM airline_staff
WHERE username = '${username}'
`,

findAirlineByName: (name) => `
SELECT *
FROM airline
WHERE airline_name = '${name}'
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
    flight.arrival_airport = des.airport_name) AND 
    flight.status = 'upcoming' AND ${whereClause}
`;
},


createFlight: (body) => `
INSERT INTO flight
VALUES ('${body.airline}', '${body.flightNum}', '${body.depAirport}', '${body.depTime}', '${body.arrAirport}', 
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
    flight.status = 'upcoming' AND
    purchases.customer_email = '${email}'
`,

createTicket: (obj) => `
INSERT INTO ticket
VALUES ('${obj.id}', '${obj.airline}', '${obj.num}')
`,

createPurchase: (obj) => `
INSERT INTO purchases
VALUES ('${obj.id}', '${obj.email}', ${obj.agent_id}, '${obj.date}')
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

trackMonthlySpending: (email, from, to) => `
SELECT YEAR(purchases.purchase_date) as year, MONTH(purchases.purchase_date) as month, SUM(flight.price) as price
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.customer_email = '${email}' AND
    purchases.purchase_date >= '${from}' AND
    purchases.purchase_date <= '${to}'
GROUP BY YEAR(purchases.purchase_date), MONTH(purchases.purchase_date)
`,

trackMonthlyTickets: (airline, from, to) => `
SELECT YEAR(purchases.purchase_date) as year, MONTH(purchases.purchase_date) as month, COUNT(purchases.ticket_id) as count
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    flight.airline_name = '${airline}' AND
    DATE(purchases.purchase_date) >= '${from}' AND
    DATE(purchases.purchase_date) <= '${to}'
GROUP BY YEAR(purchases.purchase_date), MONTH(purchases.purchase_date)
`,

findAgentFlights: (id) =>  `
SELECT flight.airline_name, flight.flight_num, flight.departure_airport, flight.departure_time,
    flight.arrival_airport, flight.arrival_time, flight.price, flight.status, flight.airplane_id, purchases.customer_email as customer
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND
    flight.status = 'upcoming' AND 
    purchases.booking_agent_id = '${id}'
`,

findAgentAirlines: (email) => `
SELECT airline_name
FROM booking_agent_work_for
WHERE email = '${email}'
`,

findAgentCommission: (id, from, to) => `
SELECT sum(flight.price * 0.05) as total, count(flight.price) as num, sum(flight.price * 0.05)/count(flight.price) as average
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    purchases.booking_agent_id = '${id}' AND
    DATE(purchases.purchase_date) >= '${from}' AND
    DATE(purchases.purchase_date) <= '${to}'
`,

findTicketsSold: (airline, from, to) => `
SELECT count(purchases.ticket_id) as num
FROM flight, ticket, purchases
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND 
    flight.airline_name = '${airline}' AND
    DATE(purchases.purchase_date) >= '${from}' AND
    DATE(purchases.purchase_date) <= '${to}'
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
`,

findStaffFlights: (airline, from, to) => `
SELECT *
FROM flight
WHERE flight.airline_name = '${airline}' AND
    DATE(flight.departure_time) >= '${from}' AND
    flight.status = 'upcoming' AND
    DATE(flight.arrival_time) <= '${to}'
`,

findAllStaffFlights:(airline)=> `
SELECT *
FROM flight
WHERE flight.airline_name = '${airline}'
`,

addAirport: (body) => `
INSERT INTO airport
VALUES ('${body.name}', '${body.city}')
`,

addAirplane: (body) => `
INSERT INTO airplane
VALUES ('${body.name}', '${body.id}', '${body.seat}')
`,

addAgent: (email, airline) => `
INSERT INTO booking_agent_work_for
VALUES ('${email}', '${airline}')
`,

findAllStaffs: (username) => `
SELECT *
FROM airline_staff
WHERE username <> '${username}'
`,

grantPermission: (username, permission) => `
INSERT INTO permission
VALUES ('${username}', '${permission}')
`,

topAgentsByTicketLastMonth: (airline) => `
SELECT booking_agent.email, count(purchases.ticket_id) as count
FROM booking_agent, booking_agent_work_for, purchases
WHERE booking_agent.email = booking_agent_work_for.email AND
    booking_agent.booking_agent_id = purchases.booking_agent_id AND
    booking_agent_work_for.airline_name = '${airline}' AND
    DATE(purchases.purchase_date) >= DATE(NOW()) - INTERVAL 30 DAY
GROUP BY booking_agent.email
ORDER BY count
DESC LIMIT 5
`,

totalRevenueEarned: (airline, from) => `
SELECT IF(ISNULL(purchases.booking_agent_id), 'NULL', 'NOT NULL') as purchase_method, SUM(flight.price) AS revenue
FROM ticket, purchases, flight
WHERE ticket.ticket_id = purchases.ticket_id AND
    ticket.airline_name = '${airline}' AND
    purchases.purchase_date > '${from}' AND
    flight.flight_num = ticket.flight_num
GROUP BY purchase_method
`,

topAgentsByTicketPastYear: (airline) => `
SELECT booking_agent.email, count(purchases.ticket_id) as count
FROM booking_agent, booking_agent_work_for, purchases
WHERE booking_agent.email = booking_agent_work_for.email AND
    booking_agent.booking_agent_id = purchases.booking_agent_id AND
    booking_agent_work_for.airline_name = '${airline}' AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL 12 MONTH
GROUP BY booking_agent.email
ORDER BY count
DESC LIMIT 5
`,

topAgentsByCommissionPastYear: (airline) => `
SELECT booking_agent.email, sum(flight.price * 0.05) as total
FROM booking_agent, booking_agent_work_for, purchases, flight, ticket
WHERE booking_agent.email = booking_agent_work_for.email AND
    booking_agent.booking_agent_id = purchases.booking_agent_id AND
    flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND
    booking_agent_work_for.airline_name = '${airline}' AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL 12 MONTH
GROUP BY booking_agent.email
ORDER BY total
DESC LIMIT 5
`,

findfrequentCustomers:(airline) => `
SELECT purchases.customer_email as customer, count(purchases.ticket_id) as num
FROM purchases, flight, ticket
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND
    flight.airline_name = '${airline}' AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL 12 MONTH
GROUP BY customer
ORDER BY num
DESC LIMIT 3
`,

findTopDestinations: (month) => `
SELECT airport.airport_city as city, count(purchases.ticket_id) as num
FROM purchases, flight, ticket, airport
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND
    flight.arrival_airport = airport.airport_name AND
    purchases.purchase_date > CURDATE() - INTERVAL (DAYOFMONTH(CURDATE()) - 1) DAY - INTERVAL ${month} MONTH
GROUP BY city
ORDER BY num
DESC LIMIT 3
`,

updateStatus: (airline, num, s) =>`
UPDATE flight
SET status = '${s}'
WHERE airline_name = '${airline}' AND
flight_num = '${num}'
`,

findCustomersByFlight:(airline, num) => `
SELECT purchases.customer_email as customer
FROM purchases, flight, ticket
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND
    flight.airline_name = '${airline}' AND
    flight.flight_num = '${num}'
`,

findFlightsByCustomer:(airline, email) => `
SELECT flight.flight_num as flight
FROM purchases, flight, ticket
WHERE flight.airline_name = ticket.airline_name AND 
    flight.flight_num = ticket.flight_num AND 
    ticket.ticket_id = purchases.ticket_id AND
    flight.airline_name = '${airline}' AND
    purchases.customer_email = '${email}'
`,
}

module.exports = {
    sql,
    queries,
}
