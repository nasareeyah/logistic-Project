const pool = require('../config/db');

async function setupUsers() {
  try {
    console.log('Creating users table if not exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table users created / verified successfully.');

    await pool.query(`
      INSERT INTO users (user_id, username, email, password, full_name, role, department)
      VALUES 
        ('usr-001', 'operator', 'operator@st-tran.com', '1234', 'Operator', 'operator', 'Operations'),
        ('usr-002', 'employee', 'employee@st-tran.com', '1234', 'Employee', 'employee', 'Logistics'),
        ('usr-003', 'accounting', 'account@st-tran.com', '1234', 'Accounting', 'accounting', 'Accounting')
      ON CONFLICT (email) DO UPDATE 
      SET password = EXCLUDED.password,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          department = EXCLUDED.department;
    `);
    console.log('Users seeded with 3 distinct roles: operator, accounting, employee.');

    const res = await pool.query('SELECT user_id, username, email, role, full_name, department FROM users');
    console.log('Current users in database:', res.rows);
  } catch (err) {
    console.error('Error during setupUsers:', err);
  } finally {
    await pool.end();
  }
}

setupUsers();
