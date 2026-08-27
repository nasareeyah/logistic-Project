const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// --- CONSIGNER ---
router.get('/consigner', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM consigner ORDER BY address');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/consigner', async (req, res) => {
    try {
        const { consigner_id, consigner_name, address } = req.body;
        if (address) {
            const existing = await db.query('SELECT consigner_id FROM consigner WHERE address = $1', [address]);
            if (existing.rows.length > 0) {
                return res.json({ consigner_id: existing.rows[0].consigner_id, address });
            }
        }
        const finalId = consigner_id || await nextId('seq_consigner', 'cgr-', 5);
        await db.query(
            'INSERT INTO consigner (consigner_id, consigner_name, address) VALUES ($1,$2,$3)',
            [finalId, consigner_name || null, address || null]
        );
        res.json({ consigner_id: finalId, address });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/consigner/:id', async (req, res) => {
    try {
        const { consigner_name, address } = req.body;
        await db.query(
            'UPDATE consigner SET consigner_name=$1, address=$2 WHERE consigner_id=$3',
            [consigner_name || null, address || null, req.params.id]
        );
        res.json({ message: 'แก้ไขผู้ส่งสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/consigner/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM consigner WHERE consigner_id = $1', [req.params.id]);
        res.json({ message: 'ลบผู้ส่งสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CONSIGNEE ---
router.get('/consignee', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM consignee ORDER BY address');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/consignee', async (req, res) => {
    try {
        const { consignee_id, consignee_name, address } = req.body;
        if (address) {
            const existing = await db.query('SELECT consignee_id FROM consignee WHERE address = $1', [address]);
            if (existing.rows.length > 0) {
                return res.json({ consignee_id: existing.rows[0].consignee_id, address });
            }
        }
        const finalId = consignee_id || await nextId('seq_consignee', 'cge-', 5);
        await db.query(
            'INSERT INTO consignee (consignee_id, consignee_name, address) VALUES ($1,$2,$3)',
            [finalId, consignee_name || null, address || null]
        );
        res.json({ consignee_id: finalId, address });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/consignee/:id', async (req, res) => {
    try {
        const { consignee_name, address } = req.body;
        await db.query(
            'UPDATE consignee SET consignee_name=$1, address=$2 WHERE consignee_id=$3',
            [consignee_name || null, address || null, req.params.id]
        );
        res.json({ message: 'แก้ไขผู้รับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/consignee/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM consignee WHERE consignee_id = $1', [req.params.id]);
        res.json({ message: 'ลบผู้รับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
