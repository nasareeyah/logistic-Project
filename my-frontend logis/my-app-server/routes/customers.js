
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// GET ALL CUSTOMERS
router.get('/customers', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers ORDER BY customer_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW CUSTOMER
router.post('/customers', async (req, res) => {
    try {
        const {
            customer_id,
            customer_name,
            tax_id,
            address,
            phone,
            email,
            contact_person,
            street_address,
            streetAddress,
            address_line2,
            addressLine2,
            city,
            province,
            postal_code,
            postalCode,
            country
        } = req.body;

        if (!customer_name) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อลูกค้า' });
        }

        // Store street address (and line2 if provided) into address column
        const streetVal = streetAddress || street_address || address || null;
        const line2Val = addressLine2 || address_line2 || null;
        let finalStreet = streetVal;
        if (finalStreet && line2Val) {
            finalStreet = `${finalStreet}, ${line2Val}`;
        } else if (!finalStreet && line2Val) {
            finalStreet = line2Val;
        }

        const cityVal = city || null;
        const provVal = province || null;
        const postalVal = postalCode || postal_code || null;
        const countryVal = country || 'Thailand';

        const finalCustId = customer_id || await nextId('seq_customer', 'cust-', 5);
        const sql = `
            INSERT INTO customers (
                customer_id, customer_name, tax_id, address, phone, email, contact_person,
                city, province, postal_code, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await db.query(sql, [
            finalCustId,
            customer_name || null,
            tax_id || null,
            finalStreet,
            phone || null,
            email || null,
            contact_person || null,
            cityVal,
            provVal,
            postalVal,
            countryVal
        ]);

        return res.json({ message: 'เพิ่มข้อมูลลูกค้าสำเร็จ', customer_id: finalCustId });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(500).json({ error: err.message });
    }
});

// UPDATE CUSTOMER
router.put('/customers/:id', async (req, res) => {
    try {
        const {
            customer_name,
            tax_id,
            address,
            phone,
            email,
            contact_person,
            street_address,
            streetAddress,
            address_line2,
            addressLine2,
            city,
            province,
            postal_code,
            postalCode,
            country
        } = req.body;

        const streetVal = streetAddress !== undefined ? streetAddress : (street_address !== undefined ? street_address : address);
        const line2Val = addressLine2 !== undefined ? addressLine2 : address_line2;
        let finalStreet = streetVal || null;
        if (finalStreet && line2Val) {
            finalStreet = `${finalStreet}, ${line2Val}`;
        } else if (!finalStreet && line2Val) {
            finalStreet = line2Val;
        }

        const cityVal = city !== undefined ? city : null;
        const provVal = province !== undefined ? province : null;
        const postalVal = postalCode !== undefined ? postalCode : (postal_code !== undefined ? postal_code : null);
        const countryVal = country || 'Thailand';

        const sql = `
            UPDATE customers SET 
                customer_name=$1, 
                tax_id=$2, 
                address=$3, 
                phone=$4, 
                email=$5, 
                contact_person=$6,
                city=$7,
                province=$8,
                postal_code=$9,
                country=$10 
            WHERE customer_id=$13
        `;
        await db.query(`
            UPDATE customers SET 
                customer_name=$1, 
                tax_id=$2, 
                address=$3, 
                phone=$4, 
                email=$5, 
                contact_person=$6,
                city=$7,
                province=$8,
                postal_code=$9,
                country=$10 
            WHERE customer_id=$11
        `, [
            customer_name,
            tax_id,
            finalStreet,
            phone,
            email,
            contact_person,
            cityVal,
            provVal,
            postalVal,
            countryVal,
            req.params.id
        ]);
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
