const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // ดึงการเชื่อมต่อมาใช้

const ALLOWED = [
  'customers', 'cars', 'driver', 'bank', 'account', 
  'employee', 'status', 'service_type', 'service',
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

// === ซ่อม API พิเศษที่มีการ JOIN (ต้องวางไว้ก่อน Dynamic Route ไม่งั้นจะโดนแย่งแกะ) ===

// GET /api/service (แบบดึงชื่อประเภทมาโชว์ด้วย)
router.get('/service', async (req, res) => {
  try {
    const sql = `
      SELECT s.*, st."service_typeNAME" 
      FROM service s
      LEFT JOIN service_type st ON s."service_typeID" = st."service_typeID"
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/document (แบบดึงข้อมูลลูกค้า คนขับ รถ มาครบเซ็ต)
router.get('/document', async (req, res) => {
  try {
    const sql = `
      SELECT d.*, c.customer_name, dr.full_name AS driver_name, car.car_number
      FROM document d
      LEFT JOIN customers c ON d.customer_id = c.customer_id
      LEFT JOIN driver dr ON d.driver_id = dr.driver_id
      LEFT JOIN cars car ON d.car_id = car.car_id
      ORDER BY d.document_date DESC
    `;
    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === Dynamic Route (CRUD ทั่วไปสำหรับตารางอื่นๆ) ===

// GET /api/:table
router.get('/:table', async (req, res) => {
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
router.post('/:table', async (req, res) => {
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
router.put('/:table/:id', async (req, res) => {
  if (!ALLOWED.includes(req.params.table)) return res.status(400).json({ error: 'Invalid table' });
  try {
    const pk = await getPK(req.params.table);
    if (!pk) return res.status(400).json({ error: 'No PK found' });

    const data = req.body;
    const keys = Object.keys(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), req.params.id];

    const result = await pool.query(
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
router.delete('/:table/:id', async (req, res) => {
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

// GET /api/document/:id/items
// ดึงรายการบริการทั้งหมดในใบเสนอราคานั้นๆ มาโชว์เป็นตาราง
router.get('/document/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    
    // ดึงไอเทมของเอกสารนั้น พร้อมดึงชื่อบริการ ราคากลาง และหน่วย จากตาราง service มาร่วมด้วย
    const sql = `
      SELECT 
        di.id AS item_id,
        di.document_id,
        di.service_id,
        s.description AS service_name,
        di.quantity,
        di.price_per_unit,
        di.total_price
      FROM document_items di
      LEFT JOIN service s ON di.service_id = s.service_id
      WHERE di.document_id = $1
      ORDER BY di.id ASC
    `;
    
    const result = await pool.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;