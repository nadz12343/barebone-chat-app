const Pool = require('pg').Pool;

const pool = new Pool({
    user: "postgres",
    password: "1234",
    database: "Chat",
    host: "localhost",
    port: 4321
})

module.exports = pool