require('dotenv').config();
const { Pool } = require('pg');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

const ALLOWED = [
  'customers', 'cars', 'driver',
  'bank', 'account', 'employee', 'status',
  'service_type', 'service',
  'document', 'document_items', 'delivery_orders',
  'location', 'consigner', 'consignee'
];

async function getPK(table) {
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_name = $1 AND ordinal_position = 1`,
    [table]
  );
  return result.rows[0]?.column_name;
}

// GET /api/:table
app.get('/api/:table', async (req, res) => {
  if (!ALLOWED.includes(req.params.table)) return res.status(400).json({ error: 'Invalid table' });
  try {
    const pk = await getPK(req.params.table);
    const result = await pool.query(`SELECT * FROM ${req.params.table} ORDER BY ${pk}`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/:table
app.post('/api/:table', async (req, res) => {
  if (!ALLOWED.includes(req.params.table)) return res.status(400).json({ error: 'Invalid table' });
  try {
    const data = req.body;
    const keys = Object.keys(data);
    const values = Object.values(data);
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO ${req.params.table} (${cols}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    res.json({ message: '✅ เพิ่มข้อมูลสำเร็จ!', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/:table/:id
app.put('/api/:table/:id', async (req, res) => {
  if (!ALLOWED.includes(req.params.table)) return res.status(400).json({ error: 'Invalid table' });
  try {
    const pk = await getPK(req.params.table);
    if (!pk) return res.status(400).json({ error: 'No PK found' });

    const data = req.body;
    const keys = Object.keys(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), req.params.id];

    const result =
     await pool.query(
      `UPDATE ${req.params.table} SET ${setClause} WHERE ${pk} = $${keys.length + 1} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    res.json({ message: '✅ แก้ไขข้อมูลสำเร็จ!', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/:table/:id
app.delete('/api/:table/:id', async (req, res) => {
  if (!ALLOWED.includes(req.params.table)) return res.status(400).json({ error: 'Invalid table' });
  try {
    const pk = await getPK(req.params.table);
    if (!pk) return res.status(400).json({ error: 'No PK found' });

    const result = await pool.query(
      `DELETE FROM ${req.params.table} WHERE ${pk} = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    res.json({ message: '✅ ลบข้อมูลสำเร็จ!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});
