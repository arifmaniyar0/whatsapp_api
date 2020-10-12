const mysql = require('mysql');

db_code = {
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'whatsappp_clone'
}

const connection = mysql.createConnection(db_code);

connection.connect();


module.exports = connection;