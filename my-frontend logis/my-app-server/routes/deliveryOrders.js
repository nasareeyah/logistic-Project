const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

let isTableInitialized = false;

async function initDeliveryOrdersTable() {
    if (isTableInitialized) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS delivery_orders (
                do_id VARCHAR(50) PRIMARY KEY,
                do_no VARCHAR(50) NOT NULL UNIQUE,
                booking_id VARCHAR(50),
                customer_id VARCHAR(50),
                customer_name VARCHAR(255),
                truck_number VARCHAR(100),
                driver_name VARCHAR(100),
                date_of_load DATE,
                eta DATE,
                destination TEXT,
                cargo_details TEXT,
                remark TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_delivery_order;`);

        // Clean any old dummy seeds if they exist
        await db.query(`DELETE FROM delivery_orders WHERE do_id IN ('do-00001', 'do-00002', 'do-00003', 'do-00004')`);

        isTableInitialized = true;
    } catch (err) {
        console.error('Error initializing delivery_orders table:', err);
    }
}

// GET all delivery orders
router.get('/delivery-orders', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const result = await db.query(
            `SELECT * FROM delivery_orders ORDER BY created_at DESC, do_id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE delivery order
router.post('/delivery-orders', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const {
            do_no,
            booking_id,
            customer_id,
            customer_name,
            truck_number,
            driver_name,
            date_of_load,
            eta,
            destination,
            cargo_details,
            remark
        } = req.body;

        let finalDoNo = do_no;
        if (!finalDoNo) {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            finalDoNo = `DO-${todayStr}-${rand}`;
        }

        const do_id = await nextId('seq_delivery_order', 'do-', 5);

        await db.query(
            `INSERT INTO delivery_orders 
             (do_id, do_no, booking_id, customer_id, customer_name, truck_number, driver_name, date_of_load, eta, destination, cargo_details, remark)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
                do_id,
                finalDoNo,
                booking_id || null,
                customer_id || null,
                customer_name || 'Unassigned Customer',
                truck_number || '-',
                driver_name || '-',
                date_of_load || null,
                eta || null,
                destination || null,
                cargo_details || null,
                remark || null
            ]
        );

        res.status(201).json({
            message: 'สร้างเอกสาร Delivery Order สำเร็จ',
            do_id,
            do_no: finalDoNo
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE delivery order
router.put('/delivery-orders/:id', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const { id } = req.params;
        const {
            customer_name,
            truck_number,
            driver_name,
            date_of_load,
            eta,
            destination,
            cargo_details,
            remark
        } = req.body;

        await db.query(
            `UPDATE delivery_orders 
             SET customer_name = COALESCE($1, customer_name),
                 truck_number = COALESCE($2, truck_number),
                 driver_name = COALESCE($3, driver_name),
                 date_of_load = COALESCE($4, date_of_load),
                 eta = COALESCE($5, eta),
                 destination = COALESCE($6, destination),
                 cargo_details = COALESCE($7, cargo_details),
                 remark = COALESCE($8, remark)
             WHERE do_id = $9 OR do_no = $9`,
            [customer_name, truck_number, driver_name, date_of_load, eta, destination, cargo_details, remark, id]
        );

        res.json({ message: 'แก้ไข Delivery Order สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE delivery order
router.delete('/delivery-orders/:id', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const { id } = req.params;
        await db.query(`DELETE FROM delivery_orders WHERE do_id = $1 OR do_no = $1`, [id]);
        res.json({ message: 'ลบ Delivery Order สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
