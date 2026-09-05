const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// --- CONSIGNER ---
router.get('/consigner', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM consigner ORDER BY consigner_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/consigner', async (req, res) => {
    try {
        const { consigner_id, consigner_name, address_line, city, state, province, postal_code, country } = req.body;
        const lineVal = address_line || null;
        const stateVal = state || province || null;
        const provVal = province || state || null;

        if (lineVal) {
            const existing = await db.query('SELECT consigner_id FROM consigner WHERE address_line = $1 AND (city = $2 OR city IS NULL)', [lineVal, city || null]);
            if (existing.rows.length > 0) {
                return res.json({ consigner_id: existing.rows[0].consigner_id, address_line: lineVal });
            }
        }
        const finalId = consigner_id || await nextId('seq_consigner', 'cgr-', 5);
        await db.query(
            `INSERT INTO consigner (
                consigner_id, consigner_name, address_line, city, state, province, postal_code, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [finalId, consigner_name || null, lineVal, city || null, stateVal, provVal, postal_code || null, country || 'Thailand']
        );
        res.json({ consigner_id: finalId, address_line: lineVal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/consigner/:id', async (req, res) => {
    try {
        const { consigner_name, address_line, city, state, province, postal_code, country } = req.body;
        const lineVal = address_line || null;
        const stateVal = state || province || null;
        const provVal = province || state || null;

        await db.query(
            `UPDATE consigner SET 
                consigner_name = COALESCE($1, consigner_name), 
                address_line = COALESCE($2, address_line),
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                province = COALESCE($5, province),
                postal_code = COALESCE($6, postal_code),
                country = COALESCE($7, country)
            WHERE consigner_id = $8`,
            [consigner_name || null, lineVal, city || null, stateVal, provVal, postal_code || null, country || null, req.params.id]
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
        const result = await db.query('SELECT * FROM consignee ORDER BY consignee_id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/consignee', async (req, res) => {
    try {
        const { consignee_id, consignee_name, address_line, city, state, province, postal_code, country } = req.body;
        const lineVal = address_line || null;
        const stateVal = state || province || null;
        const provVal = province || state || null;

        if (lineVal) {
            const existing = await db.query('SELECT consignee_id FROM consignee WHERE address_line = $1 AND (city = $2 OR city IS NULL)', [lineVal, city || null]);
            if (existing.rows.length > 0) {
                return res.json({ consignee_id: existing.rows[0].consignee_id, address_line: lineVal });
            }
        }
        const finalId = consignee_id || await nextId('seq_consignee', 'cge-', 5);
        await db.query(
            `INSERT INTO consignee (
                consignee_id, consignee_name, address_line, city, state, province, postal_code, country
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [finalId, consignee_name || null, lineVal, city || null, stateVal, provVal, postal_code || null, country || 'Thailand']
        );
        res.json({ consignee_id: finalId, address_line: lineVal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/consignee/:id', async (req, res) => {
    try {
        const { consignee_name, address_line, city, state, province, postal_code, country } = req.body;
        const lineVal = address_line || null;
        const stateVal = state || province || null;
        const provVal = province || state || null;

        await db.query(
            `UPDATE consignee SET 
                consignee_name = COALESCE($1, consignee_name), 
                address_line = COALESCE($2, address_line),
                city = COALESCE($3, city),
                state = COALESCE($4, state),
                province = COALESCE($5, province),
                postal_code = COALESCE($6, postal_code),
                country = COALESCE($7, country)
            WHERE consignee_id = $8`,
            [consignee_name || null, lineVal, city || null, stateVal, provVal, postal_code || null, country || null, req.params.id]
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
