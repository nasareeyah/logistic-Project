const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// GET ALL CARS
router.get('/cars', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cars');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW CAR
router.post('/cars', async (req, res) => {
    try {
        const { car_id, car_number, car_type, capacity, capacity_unit, assigned_driver_id, notes } = req.body;
        await db.query(
            'INSERT INTO cars (car_id, car_number, car_type, capacity, capacity_unit, assigned_driver_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [car_id || await nextId('seq_car', 'car-', 5), car_number, car_type, capacity ? parseFloat(capacity) : null, capacity_unit || null, assigned_driver_id || null, notes || null]
        );
        res.json({ message: 'เพิ่มข้อมูลรถสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE CAR
router.put('/cars/:id', async (req, res) => {
    try {
        const { car_number, car_type, capacity, capacity_unit, assigned_driver_id, notes } = req.body;
        await db.query(
            'UPDATE cars SET car_number=$1, car_type=$2, capacity=$3, capacity_unit=$4, assigned_driver_id=$5, notes=$6 WHERE car_id=$7',
            [car_number, car_type, capacity ? parseFloat(capacity) : null, capacity_unit || null, assigned_driver_id || null, notes || null, req.params.id]
        );
        res.json({ message: 'แก้ไขข้อมูลรถสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE CAR
router.delete('/cars/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM cars WHERE car_id = $1', [req.params.id]);
        res.json({ message: 'ลบรถสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
