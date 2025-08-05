const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'capstone2',
  password: process.env.DB_PASSWORD || '098611059',
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
