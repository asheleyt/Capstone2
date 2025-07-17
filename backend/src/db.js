const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'capstone2',
  password: '098611059',
  port: 5432,
});

module.exports = pool;
