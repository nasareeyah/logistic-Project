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

// ====== API สำหรับ service_type ======
app.get('/api/service_type', (req, res) => {
    db.query('SELECT * FROM service_type', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/service_type', (req, res) => {
    const { service_typeID, service_typeNAME } = req.body;
    db.query('INSERT INTO service_type (service_typeID, service_typeNAME) VALUES (?, ?)', 
    [service_typeID, service_typeNAME], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ เพิ่มประเภทบริการสำเร็จ!' });
    });
});

// ====== API สำหรับ service ======
app.get('/api/service', (req, res) => {
    // JOIN กับ service_type เพื่อเอาชื่อประเภทบริการมาโชว์ด้วย
    const sql = `
        SELECT s.*, st.service_typeNAME 
        FROM service s
        LEFT JOIN service_type st ON s.service_typeID = st.service_typeID
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/service', (req, res) => {
    const { service_id, service_typeID, description, default_price, unit } = req.body;
    db.query('INSERT INTO service (service_id, service_typeID, description, default_price, unit) VALUES (?, ?, ?, ?, ?)', 
    [service_id, service_typeID, description, default_price, unit], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ เพิ่มข้อมูลบริการสำเร็จ!' });
    });
});
// แก้ไขไฟล์หลังบ้าน (Backend)
app.post('/api/document', (req, res) => {
    // 1. รับค่าตัวแปรจากหน้าบ้านให้ครบ (รวมถึงรหัสคนขับและรหัสรถ)
    const { document_id, document_no, document_type, customer_id, driver_id, car_id, document_date, grand_total, status } = req.body;
    
    // 2. โครงสร้างคำสั่ง INSERT (มีเครื่องหมาย ? ทั้งหมด 9 ตัว)
    const sql = `INSERT INTO document 
    (document_id, document_no, document_type, customer_id, driver_id, car_id, document_date, grand_total, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [document_id, document_no, document_type, customer_id, driver_id, car_id, document_date, grand_total, status], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ บันทึกเอกสารสำเร็จ!' });
    });
});
app.get('/api/document', (req, res) => {
    const sql = `
        SELECT d.*, c.customer_name, dr.full_name AS driver_name, car.car_number
        FROM document d
        LEFT JOIN customers c ON d.customer_id = c.customer_id
        LEFT JOIN driver dr ON d.driver_id = dr.driver_id
        LEFT JOIN cars car ON d.car_id = car.car_id
        ORDER BY d.document_date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});
// API แก้ไขเอกสาร (UPDATE)
app.put('/api/document/:id', (req, res) => {
    const { id } = req.params;
    const { document_no, customer_id, driver_id, car_id, document_date, grand_total, status } = req.body;
    
    const sql = `UPDATE document 
    SET document_no = ?, customer_id = ?, driver_id = ?, car_id = ?, document_date = ?, grand_total = ?, status = ? 
    WHERE document_id = ?`;
    
    db.query(sql, [document_no, customer_id, driver_id, car_id, document_date, grand_total, status, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ อัปเดตข้อมูลเอกสารสำเร็จ!' });
    });
});

// API ลบเอกสาร (DELETE)
app.delete('/api/document/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM document WHERE document_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '✅ ลบเอกสารเรียบร้อยแล้ว!' });
    });
});