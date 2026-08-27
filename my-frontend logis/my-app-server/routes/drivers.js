const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// GET ALL DRIVERS
router.get('/driver', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM driver');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW DRIVER
router.post('/driver', async (req, res) => {
    try {
        const { driver_id, full_name, phone, email, license_number, assigned_car_id, notes } = req.body;
        const finalDriverId = driver_id || await nextId('seq_driver', 'd-', 6);
        await db.query(
            'INSERT INTO driver (driver_id, full_name, phone, email, license_number, assigned_car_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [finalDriverId, full_name, phone, email || null, license_number || null, assigned_car_id || null, notes || null]
        );
        if (assigned_car_id) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = $1 WHERE car_id = $2',
                [finalDriverId, assigned_car_id]
            );
        }
        res.json({ message: 'เพิ่มคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE DRIVER
router.put('/driver/:id', async (req, res) => {
    try {
        const { full_name, phone, email, license_number, assigned_car_id, notes } = req.body;
        const oldResult = await db.query('SELECT assigned_car_id FROM driver WHERE driver_id = $1', [req.params.id]);
        const oldCarId = oldResult.rows[0]?.assigned_car_id || null;
        await db.query(
            'UPDATE driver SET full_name=$1, phone=$2, email=$3, license_number=$4, assigned_car_id=$5, notes=$6 WHERE driver_id=$7',
            [full_name, phone, email || null, license_number || null, assigned_car_id || null, notes || null, req.params.id]
        );
        const newCarId = assigned_car_id || null;
        if (oldCarId && oldCarId !== newCarId) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = NULL WHERE car_id = $1 AND assigned_driver_id = $2',
                [oldCarId, req.params.id]
            );
        }
        if (newCarId) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = $1 WHERE car_id = $2',
                [req.params.id, newCarId]
            );
        }
        res.json({ message: 'แก้ไขคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE DRIVER
router.delete('/driver/:id', async (req, res) => {
    try {
        const driverResult = await db.query('SELECT assigned_car_id FROM driver WHERE driver_id = $1', [req.params.id]);
        const carId = driverResult.rows[0]?.assigned_car_id || null;
        await db.query('DELETE FROM driver WHERE driver_id = $1', [req.params.id]);
        if (carId) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = NULL WHERE car_id = $1 AND assigned_driver_id = $2',
                [carId, req.params.id]
            );
        }
        res.json({ message: 'ลบคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
