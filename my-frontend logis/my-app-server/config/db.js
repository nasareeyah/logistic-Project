const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '..', '.env')});

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '5432')
});

pool.query('SELECT 1', (err) => {
  if (err) { console.error('❌ PostgreSQL Error: ' + err.stack); return; }
  console.log('✅ Connected to PostgreSQL!');
});

module.exports = pool;