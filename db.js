const mysql = require('mysql');

const connectionConfig = {
    host: 'localhost',
    user: 'ATRS',
    database: 'atrs',
};

const connection = mysql.createConnection(connectionConfig);
connection.connect(err => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected to mysql as id ' + connection.threadId);
});

const findCustomerByName = (name) => `SELECT * FROM customer WHERE name = "${name}"`;
const saveCustomer = (name, pwd) => `
INSERT INTO customer
VALUES ('${name}@gmail.com', '${name}', '${pwd}', 'a', 'a', 'a', 'a', '1', 'a', '2022-05-03', 'a', '2022-05-03')
`;

module.exports = {
    sql: connection, 
    queries: {
        findCustomerByName,
        saveCustomer,
    },
}