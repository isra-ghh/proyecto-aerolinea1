const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'class',
    database: 'aerolinea_db'
});

module.exports = pool;
