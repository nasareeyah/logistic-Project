const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// Ensure tables exist
const initReceiptsTable = async () => {
    try {
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_receipt START 1;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_receipt_item START 1;`);
        await db.query(`
            CREATE TABLE IF NOT EXISTS receipts (
                receipt_id VARCHAR(50) PRIMARY KEY,
                receipt_no VARCHAR(50) UNIQUE NOT NULL,
                invoice_id VARCHAR(50),
                invoice_no VARCHAR(50),
                customer_id VARCHAR(50),
                payment_date DATE,
                payment_method VARCHAR(50) DEFAULT 'Transfer',
                account_no VARCHAR(50),
                total_amount DECIMAL(12,2) DEFAULT 0,
                amount_paid DECIMAL(12,2) DEFAULT 0,
                remark TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS receipt_items (
                item_id VARCHAR(50) PRIMARY KEY,
                receipt_id VARCHAR(50) REFERENCES receipts(receipt_id) ON DELETE CASCADE,
                description TEXT,
                item_date DATE,
                quantity DECIMAL(10,2) DEFAULT 1,
                unit VARCHAR(50) DEFAULT 'คันรถ',
                unit_price DECIMAL(12,2) DEFAULT 0,
                total_amount DECIMAL(12,2) DEFAULT 0
            );
        `);
    } catch (err) {
        console.warn('Note: Could not verify/create receipts tables in DB:', err.message);
    }
};

initReceiptsTable();

// Local fallback in-memory store if DB is offline
let fallbackReceipts = [];

// GET all receipts
router.get('/receipts', async (req, res) => {
    try {
        await initReceiptsTable();
        const sql = `
            SELECT 
                r.*,
                c.customer_name,
                c.address AS customer_address,
                c.tax_id AS customer_tax_id,
                c.phone AS customer_phone,
                a.account_name,
                a.bank_branch,
                bnk.bank_name,
                COUNT(ri.item_id) AS item_count
            FROM receipts r
            LEFT JOIN customers c ON r.customer_id = c.customer_id
            LEFT JOIN account a ON r.account_no = a.account_no
            LEFT JOIN bank bnk ON a.bank_id = bnk.bank_id
            LEFT JOIN receipt_items ri ON r.receipt_id = ri.receipt_id
            GROUP BY r.receipt_id, c.customer_name, c.address, c.tax_id, c.phone, a.account_name, a.bank_branch, bnk.bank_name
            ORDER BY r.created_at DESC, r.receipt_no DESC;
        `;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching receipts from DB (using memory fallback):', err.message);
        res.json(fallbackReceipts);
    }
});

// GET receipt by id with items
router.get('/receipts/:id', async (req, res) => {
    try {
        await initReceiptsTable();
        const { id } = req.params;
        const sql = `
            SELECT 
                r.*,
                c.customer_name,
                c.address AS customer_address,
                c.tax_id AS customer_tax_id,
                c.phone AS customer_phone,
                a.account_name,
                a.bank_branch,
                bnk.bank_name
            FROM receipts r
            LEFT JOIN customers c ON r.customer_id = c.customer_id
            LEFT JOIN account a ON r.account_no = a.account_no
            LEFT JOIN bank bnk ON a.bank_id = bnk.bank_id
            WHERE r.receipt_id = $1 OR r.receipt_no = $1;
        `;
        const result = await db.query(sql, [id]);
        if (result.rows.length === 0) {
            const found = fallbackReceipts.find(r => r.receipt_id === id || r.receipt_no === id);
            if (found) return res.json(found);
            return res.status(404).json({ error: 'ไม่พบใบเสร็จรับเงิน' });
        }

        const receipt = result.rows[0];
        const itemsSql = `SELECT * FROM receipt_items WHERE receipt_id = $1 ORDER BY item_id ASC;`;
        const itemsResult = await db.query(itemsSql, [receipt.receipt_id]);
        receipt.items = itemsResult.rows;

        res.json(receipt);
    } catch (err) {
        console.error('Error fetching receipt detail:', err.message);
        const found = fallbackReceipts.find(r => r.receipt_id === req.params.id);
        if (found) return res.json(found);
        res.status(500).json({ error: err.message });
    }
});

// POST create receipt
router.post('/receipts', async (req, res) => {
    try {
        const {
            receipt_no,
            invoice_id,
            invoice_no,
            customer_id,
            payment_date,
            payment_method,
            account_no,
            items,
            remark,
            amount_paid
        } = req.body;

        const totalAmount = Array.isArray(items) 
            ? items.reduce((sum, it) => sum + (parseFloat(it.total_amount) || 0), 0)
            : (parseFloat(amount_paid) || 0);

        let finalReceiptNo = receipt_no;
        if (!finalReceiptNo || finalReceiptNo.trim() === '') {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, '');
            const prefix = `RC-${todayStr}-`;
            const lastRes = await db.query(
                `SELECT receipt_no FROM receipts WHERE receipt_no LIKE $1 ORDER BY receipt_no DESC LIMIT 1`,
                [`${prefix}%`]
            );
            let nextSeq = 1;
            if (lastRes.rows.length > 0) {
                const parts = lastRes.rows[0].receipt_no.split('-');
                const seq = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(seq)) nextSeq = seq + 1;
            }
            finalReceiptNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;
        }

        const receiptId = await nextId('seq_receipt', 'rc-', 6);

        try {
            await db.query('BEGIN');

            const insertSql = `
                INSERT INTO receipts (
                    receipt_id, receipt_no, invoice_id, invoice_no, customer_id,
                    payment_date, payment_method, account_no, total_amount, amount_paid, remark
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *;
            `;

            const insertResult = await db.query(insertSql, [
                receiptId,
                finalReceiptNo,
                invoice_id || null,
                invoice_no || null,
                customer_id || null,
                payment_date || new Date(),
                payment_method || 'Transfer',
                account_no || null,
                totalAmount,
                parseFloat(amount_paid) || totalAmount,
                remark || ''
            ]);

            if (Array.isArray(items) && items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                    const it = items[i];
                    const itemId = await nextId('seq_receipt_item', 'rci-', 6);
                    await db.query(`
                        INSERT INTO receipt_items (
                            item_id, receipt_id, description, item_date, quantity, unit, unit_price, total_amount
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
                    `, [
                        itemId,
                        receiptId,
                        it.description || 'ค่าบริการ',
                        it.item_date || payment_date || new Date(),
                        parseFloat(it.quantity) || 1,
                        it.unit || 'คันรถ',
                        parseFloat(it.unit_price) || 0,
                        parseFloat(it.total_amount) || 0
                    ]);
                }
            }

            await db.query('COMMIT');

            res.status(201).json({
                message: 'สร้างใบเสร็จรับเงินสำเร็จ',
                receipt: insertResult.rows[0]
            });
        } catch (dbErr) {
            await db.query('ROLLBACK').catch(() => {});
            throw dbErr;
        }
    } catch (err) {
        console.warn('DB error on create receipt, saving to memory fallback:', err.message);
        
        // Memory fallback save
        const fallbackObj = {
            receipt_id: 'rc-' + Date.now(),
            receipt_no: req.body.receipt_no || `RC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`,
            invoice_id: req.body.invoice_id,
            invoice_no: req.body.invoice_no,
            customer_id: req.body.customer_id,
            customer_name: req.body.customer_name,
            customer_address: req.body.customer_address,
            customer_tax_id: req.body.customer_tax_id,
            payment_date: req.body.payment_date || new Date().toISOString().slice(0, 10),
            payment_method: req.body.payment_method || 'Transfer',
            account_no: req.body.account_no,
            total_amount: req.body.items?.reduce((s, it) => s + (parseFloat(it.total_amount) || 0), 0) || parseFloat(req.body.amount_paid) || 0,
            amount_paid: parseFloat(req.body.amount_paid) || 0,
            remark: req.body.remark || '',
            items: req.body.items || [],
            created_at: new Date()
        };
        fallbackReceipts.unshift(fallbackObj);

        res.status(201).json({
            message: 'สร้างใบเสร็จรับเงินสำเร็จ',
            receipt: fallbackObj
        });
    }
});

// PUT update receipt
router.put('/receipts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            receipt_no,
            customer_id,
            payment_date,
            payment_method,
            account_no,
            items,
            remark,
            amount_paid
        } = req.body;

        const totalAmount = Array.isArray(items) 
            ? items.reduce((sum, it) => sum + (parseFloat(it.total_amount) || 0), 0)
            : 0;

        await db.query('BEGIN');

        await db.query(`
            UPDATE receipts
            SET 
                receipt_no = COALESCE($1, receipt_no),
                customer_id = COALESCE($2, customer_id),
                payment_date = COALESCE($3, payment_date),
                payment_method = COALESCE($4, payment_method),
                account_no = $5,
                total_amount = $6,
                amount_paid = $7,
                remark = $8
            WHERE receipt_id = $9;
        `, [
            receipt_no,
            customer_id || null,
            payment_date,
            payment_method,
            account_no || null,
            totalAmount,
            parseFloat(amount_paid) || totalAmount,
            remark || '',
            id
        ]);

        if (Array.isArray(items)) {
            await db.query(`DELETE FROM receipt_items WHERE receipt_id = $1;`, [id]);
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                const itemId = await nextId('seq_receipt_item', 'rci-', 6);
                await db.query(`
                    INSERT INTO receipt_items (
                        item_id, receipt_id, description, item_date, quantity, unit, unit_price, total_amount
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
                `, [
                    itemId,
                    id,
                    it.description || 'ค่าบริการ',
                    it.item_date || payment_date || new Date(),
                    parseFloat(it.quantity) || 1,
                    it.unit || 'คันรถ',
                    parseFloat(it.unit_price) || 0,
                    parseFloat(it.total_amount) || 0
                ]);
            }
        }

        await db.query('COMMIT');
        res.json({ message: 'แก้ไขใบเสร็จรับเงินสำเร็จ' });
    } catch (err) {
        await db.query('ROLLBACK').catch(() => {});
        console.warn('Update receipt DB fallback:', err.message);
        const idx = fallbackReceipts.findIndex(r => r.receipt_id === req.params.id);
        if (idx !== -1) {
            fallbackReceipts[idx] = { ...fallbackReceipts[idx], ...req.body };
            return res.json({ message: 'แก้ไขใบเสร็จรับเงินสำเร็จ' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE receipt
router.delete('/receipts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(`DELETE FROM receipts WHERE receipt_id = $1;`, [id]);
        fallbackReceipts = fallbackReceipts.filter(r => r.receipt_id !== id);
        res.json({ message: 'ลบใบเสร็จรับเงินสำเร็จ' });
    } catch (err) {
        fallbackReceipts = fallbackReceipts.filter(r => r.receipt_id !== req.params.id);
        res.json({ message: 'ลบใบเสร็จรับเงินสำเร็จ' });
    }
});

module.exports = router;
