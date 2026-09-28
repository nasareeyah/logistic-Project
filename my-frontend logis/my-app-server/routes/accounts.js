const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// Helper to resolve or create bank
async function resolveBank(clientOrDb, bankName, bankId) {
    if (bankId) {
        const existing = await clientOrDb.query('SELECT bank_id FROM bank WHERE bank_id = $1', [bankId]);
        if (existing.rows.length > 0) return bankId;
    }
    if (!bankName || !bankName.trim()) return null;

    const cleanBankName = bankName.trim();
    const bankCheck = await clientOrDb.query(
        `SELECT bank_id FROM bank WHERE LOWER(TRIM(bank_name)) = LOWER(TRIM($1)) LIMIT 1`,
        [cleanBankName]
    );

    if (bankCheck.rows.length > 0) {
        return bankCheck.rows[0].bank_id;
    }

    // Ensure sequence exists
    await clientOrDb.query(`CREATE SEQUENCE IF NOT EXISTS seq_bank START 1;`);
    const newBankId = await nextId('seq_bank', 'bnk-', 3);
    await clientOrDb.query(
        `INSERT INTO bank (bank_id, bank_name) VALUES ($1, $2)`,
        [newBankId, cleanBankName]
    );
    return newBankId;
}

// GET all accounts
router.get('/accounts', async (req, res) => {
    try {
        const sql = `
            SELECT 
                a.account_no,
                a.account_name,
                a.bank_branch,
                a.bank_id,
                b.bank_name
            FROM account a
            LEFT JOIN bank b ON a.bank_id = b.bank_id
            ORDER BY a.account_no ASC;
        `;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching accounts:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET all banks
router.get('/banks', async (req, res) => {
    try {
        const sql = `SELECT * FROM bank ORDER BY bank_name ASC;`;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching banks:', err);
        res.status(500).json({ error: err.message });
    }
});

// CREATE account
router.post('/accounts', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const { account_no, account_name, bank_branch, bank_name, bank_id } = req.body;

        if (!account_no || !account_no.trim()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'กรุณากรอกเลขที่บัญชี' });
        }
        if (!account_name || !account_name.trim()) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'กรุณากรอกชื่อบัญชี' });
        }

        const cleanAccountNo = account_no.trim();
        const cleanAccountName = account_name.trim();
        const cleanBranch = (bank_branch || '').trim();

        // Check if account already exists
        const existsCheck = await client.query('SELECT 1 FROM account WHERE account_no = $1', [cleanAccountNo]);
        if (existsCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: `เลขที่บัญชี ${cleanAccountNo} มีอยู่ในระบบแล้ว` });
        }

        const resolvedBankId = await resolveBank(client, bank_name, bank_id);

        const insertRes = await client.query(`
            INSERT INTO account (account_no, account_name, bank_branch, bank_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [cleanAccountNo, cleanAccountName, cleanBranch, resolvedBankId]);

        await client.query('COMMIT');
        res.status(201).json({
            message: 'เพิ่มบัญชีธนาคารสำเร็จ',
            account: insertRes.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating account:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// UPDATE account
router.put('/accounts/:account_no', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const oldAccountNo = req.params.account_no;
        const { account_no: newAccountNo, account_name, bank_branch, bank_name, bank_id } = req.body;

        const checkRes = await client.query('SELECT * FROM account WHERE account_no = $1', [oldAccountNo]);
        if (checkRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'ไม่พบบัญชีธนาคารนี้ในระบบ' });
        }

        const cleanAccountName = (account_name || '').trim();
        const cleanBranch = (bank_branch || '').trim();
        const resolvedBankId = await resolveBank(client, bank_name, bank_id);

        let finalAccountNo = oldAccountNo;
        // If account_no changed and is provided
        if (newAccountNo && newAccountNo.trim() !== oldAccountNo) {
            finalAccountNo = newAccountNo.trim();
            const dupeCheck = await client.query('SELECT 1 FROM account WHERE account_no = $1', [finalAccountNo]);
            if (dupeCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `เลขที่บัญชีใหม่ ${finalAccountNo} ซ้ำกับบัญชีที่มีอยู่แล้ว` });
            }
        }

        const updateRes = await client.query(`
            UPDATE account
            SET account_no = $1, account_name = $2, bank_branch = $3, bank_id = $4
            WHERE account_no = $5
            RETURNING *;
        `, [finalAccountNo, cleanAccountName, cleanBranch, resolvedBankId, oldAccountNo]);

        await client.query('COMMIT');
        res.json({
            message: 'แก้ไขบัญชีธนาคารสำเร็จ',
            account: updateRes.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating account:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE account
router.delete('/accounts/:account_no', async (req, res) => {
    try {
        const accountNo = req.params.account_no;

        // Check if referenced in invoices
        const invCheck = await db.query('SELECT COUNT(*) FROM invoices WHERE account_no = $1', [accountNo]);
        const invCount = parseInt(invCheck.rows[0].count, 10);
        if (invCount > 0) {
            return res.status(400).json({
                error: `ไม่สามารถลบบัญชีนี้ได้ เนื่องจากมีใบแจ้งหนี้ (${invCount} รายการ) อ้างอิงการใช้งานอยู่`
            });
        }

        // Check if referenced in receipts
        const rcCheck = await db.query('SELECT COUNT(*) FROM receipts WHERE account_no = $1', [accountNo]);
        const rcCount = parseInt(rcCheck.rows[0].count, 10);
        if (rcCount > 0) {
            return res.status(400).json({
                error: `ไม่สามารถลบบัญชีนี้ได้ เนื่องจากมีใบเสร็จรับเงิน (${rcCount} รายการ) อ้างอิงการใช้งานอยู่`
            });
        }

        const delRes = await db.query('DELETE FROM account WHERE account_no = $1 RETURNING *', [accountNo]);
        if (delRes.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบบัญชีธนาคารนี้ในระบบ' });
        }

        res.json({ message: 'ลบบัญชีธนาคารสำเร็จ' });
    } catch (err) {
        console.error('Error deleting account:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
