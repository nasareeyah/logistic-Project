const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// GET ALL CUSTOMERS
router.get('/customers', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW CUSTOMER
router.post('/customers', async (req, res) => {
    try {
        const { customer_id, customer_name, tax_id, address, phone, email, contact_person } = req.body;

        if (!customer_name) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อลูกค้า' });
        }

        const finalCustId = customer_id || await nextId('seq_customer', 'cust-', 5);
        const sql = `INSERT INTO customers (customer_id, customer_name, tax_id, address, phone, email, contact_person) VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        await db.query(sql, [
            finalCustId,
            customer_name || null,
            tax_id || null,
            address || null,
            phone || null,
            email || null,
            contact_person || null
        ]);

        return res.json({ message: 'เพิ่มข้อมูลลูกค้าสำเร็จ' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(200).json({ error: err.message });
    }
});

// UPDATE CUSTOMER
router.put('/customers/:id', async (req, res) => {
    try {
        const { customer_name, tax_id, address, phone, email, contact_person } = req.body;
        const sql = `UPDATE customers SET customer_name=$1, tax_id=$2, address=$3, phone=$4, email=$5, contact_person=$6 WHERE customer_id=$7`;
        await db.query(sql, [customer_name, tax_id, address, phone, email, contact_person, req.params.id]);
        res.json({ message: 'แก้ไขข้อมูลลูกค้าสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE CUSTOMER
router.delete('/customers/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM customers WHERE customer_id = $1', [req.params.id]);
        res.json({ message: 'ลบลูกค้าสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
