const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');
const { syncDocumentRegistry, removeDocumentRegistry } = require('../utils/documentRegistry');

// GET all invoices
router.get('/invoices', async (req, res) => {
    try {
        const sql = `
            SELECT 
                i.*,
                c.customer_name,
                c.address AS customer_address,
                c.phone AS customer_phone,
                b.booking_no,
                qd.quotation_no,
                a.account_name,
                a.bank_branch,
                bnk.bank_name,
                COUNT(ii.item_id) AS item_count
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.customer_id
            LEFT JOIN bookings b ON i.booking_id = b.booking_id
            LEFT JOIN quotations qd ON (i.quotation_id = qd.quotation_id OR i.quotation_id = qd.quotation_no)
            LEFT JOIN account a ON i.account_no = a.account_no
            LEFT JOIN bank bnk ON a.bank_id = bnk.bank_id
            LEFT JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
            GROUP BY i.invoice_id, c.customer_name, c.address, c.phone, b.booking_no, qd.quotation_no, a.account_name, a.bank_branch, bnk.bank_name
            ORDER BY i.created_at DESC, i.invoice_no DESC;
        `;
        const result = await db.query(sql);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET bookings eligible for invoice (have DO attached or DO created)
router.get(['/invoices-eligible-bookings', '/invoices/eligible-bookings'], async (req, res) => {
    try {
        const sql = `
            SELECT 
                b.booking_id,
                b.booking_no,
                b.customer_id,
                COALESCE(b.customer_name, c.customer_name) AS customer_name,
                c.address AS customer_address,
                c.phone AS customer_phone,
                b.pickup_date,
                b.delivery_date,
                COALESCE(b.service_id, qd.service_id, cust_qd.service_id) AS service_id,
                COALESCE(st.service_typename, qst.service_typename, cust_qst.service_typename, 'ค่าขนส่ง') AS service_typename,
                COALESCE(s.default_price, qs.default_price, cust_qs.default_price, 0) AS default_price,
                COALESCE(s.quantity, qs.quantity, cust_qs.quantity, 1) AS service_qty,
                COALESCE(s.unit_quantity, qs.unit_quantity, cust_qs.unit_quantity, 'คันรถ') AS unit_quantity,
                COALESCE(b.quotation_id, cust_qd.document_id) AS quotation_id,
                COALESCE(qd.quotation_no, cust_qd.document_no) AS quotation_no,
                COALESCE(d.do_no, (SELECT COALESCE(bdf.original_name, bdf.file_name) FROM booking_do_files bdf WHERE bdf.booking_id = b.booking_id LIMIT 1)) AS do_no,
                (
                    SELECT STRING_AGG(DISTINCT bc.product_name, ', ')
                    FROM booking_cargo bc
                    WHERE bc.booking_id = b.booking_id
                ) AS cargo_product_names,
                EXISTS(SELECT 1 FROM invoices inv WHERE inv.booking_id = b.booking_id) AS has_invoice
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.customer_id
            LEFT JOIN service s ON b.service_id = s.service_id
            LEFT JOIN service_type st ON s.service_typeid = st.service_typeid
            LEFT JOIN quotations qd ON (b.quotation_id = qd.quotation_id OR b.quotation_id = qd.quotation_no)
            LEFT JOIN service qs ON qd.service_id = qs.service_id
            LEFT JOIN service_type qst ON qst.service_typeid = qs.service_typeid
            LEFT JOIN LATERAL (
                SELECT q2.quotation_id AS document_id, q2.quotation_no AS document_no, q2.service_id
                FROM quotations q2
                WHERE q2.customer_id = b.customer_id
                ORDER BY q2.quotation_date DESC NULLS LAST
                LIMIT 1
            ) cust_qd ON true
            LEFT JOIN service cust_qs ON cust_qd.service_id = cust_qs.service_id
            LEFT JOIN service_type cust_qst ON cust_qs.service_typeid = cust_qst.service_typeid
            LEFT JOIN delivery_orders d ON d.booking_id = b.booking_id
            WHERE EXISTS (
                SELECT 1 FROM booking_do_files bdf WHERE bdf.booking_id = b.booking_id
            )
            ORDER BY b.created_at DESC;
        `;
        const result = await db.query(sql);

        const bookingServicesRes = await db.query(`SELECT * FROM booking_services ORDER BY booking_service_id ASC`);
        const bsMap = {};
        bookingServicesRes.rows.forEach(item => {
            if (!bsMap[item.booking_id]) bsMap[item.booking_id] = [];
            bsMap[item.booking_id].push({
                booking_service_id: item.booking_service_id,
                service_id: item.service_id,
                description: item.description,
                quantity: parseFloat(item.quantity) || 1,
                unit: item.unit || 'คัน',
                unit_price: parseFloat(item.unit_price) || 0,
                total_amount: parseFloat(item.total_amount) || 0
            });
        });

        const qItemsRes = await db.query(`
            SELECT qi.*, q.quotation_id 
            FROM quotation_items qi 
            JOIN quotations q ON qi.quotation_id = q.quotation_id
        `);
        const qItemsMap = {};
        qItemsRes.rows.forEach(qi => {
            if (!qItemsMap[qi.quotation_id]) qItemsMap[qi.quotation_id] = [];
            qItemsMap[qi.quotation_id].push({
                booking_service_id: qi.item_id,
                service_id: null,
                description: qi.description || qi.service_type || 'บริการขนส่ง',
                quantity: parseFloat(qi.quantity) || 1,
                unit: qi.unit_quantity || 'คัน',
                unit_price: parseFloat(qi.unit_price) || 0,
                total_amount: parseFloat(qi.total_amount) || ((parseFloat(qi.quantity) || 1) * (parseFloat(qi.unit_price) || 0))
            });
        });

        const rows = result.rows.map(b => {
            const bServices = (bsMap[b.booking_id] && bsMap[b.booking_id].length > 0)
                ? bsMap[b.booking_id]
                : (b.quotation_id ? (qItemsMap[b.quotation_id] || []) : []);
            return {
                ...b,
                service_items: bServices
            };
        });

        res.json(rows);
    } catch (err) {
        console.error('Error fetching eligible bookings:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET single invoice with items
router.get('/invoices/:id', async (req, res) => {
    try {
        const invRes = await db.query(`
            SELECT 
                i.*,
                c.customer_name,
                c.address AS customer_address,
                c.phone AS customer_phone,
                c.email AS customer_email,
                b.booking_no,
                qd.quotation_no,
                a.account_name,
                a.bank_branch,
                bnk.bank_id,
                bnk.bank_name
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.customer_id
            LEFT JOIN bookings b ON i.booking_id = b.booking_id
            LEFT JOIN quotations qd ON (i.quotation_id = qd.quotation_id OR i.quotation_id = qd.quotation_no)
            LEFT JOIN account a ON i.account_no = a.account_no
            LEFT JOIN bank bnk ON a.bank_id = bnk.bank_id
            WHERE i.invoice_id = $1 OR i.invoice_no = $1
        `, [req.params.id]);

        if (invRes.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลใบแจ้งหนี้' });
        }

        const invoice = invRes.rows[0];
        const itemsRes = await db.query(`
            SELECT ii.*, s.description AS original_service_description, st.service_typename
            FROM invoice_items ii
            LEFT JOIN service s ON ii.service_id = s.service_id
            LEFT JOIN service_type st ON s.service_typeid = st.service_typeid
            WHERE ii.invoice_id = $1
            ORDER BY ii.item_id ASC
        `, [invoice.invoice_id]);

        invoice.items = itemsRes.rows;
        res.json(invoice);
    } catch (err) {
        console.error('Error fetching invoice details:', err);
        res.status(500).json({ error: err.message });
    }
});

// Helper: resolve bank (reuse if exists or insert new) and upsert account
async function resolveAndSaveAccount(client, { account_no, account_name, bank_name, bank_branch }) {
    if (!account_no || !account_no.trim()) {
        return null;
    }
    const cleanAccountNo = account_no.trim();
    const cleanAccountName = (account_name || '').trim();
    const cleanBranch = (bank_branch || '').trim();
    const cleanBankName = (bank_name || '').trim();

    let resolvedBankId = null;

    if (cleanBankName) {
        // 1. Check if bank already exists (case-insensitive) -> reuse existing bank_id
        const bankCheck = await client.query(
            `SELECT bank_id FROM bank WHERE LOWER(TRIM(bank_name)) = LOWER(TRIM($1)) LIMIT 1`,
            [cleanBankName]
        );

        if (bankCheck.rows.length > 0) {
            resolvedBankId = bankCheck.rows[0].bank_id;
        } else {
            // New bank name -> create new bank_id and insert
            resolvedBankId = await nextId('seq_bank', 'bnk-', 3);
            await client.query(
                `INSERT INTO bank (bank_id, bank_name) VALUES ($1, $2)`,
                [resolvedBankId, cleanBankName]
            );
        }
    }

    // 2. Upsert into account table
    await client.query(`
        INSERT INTO account (account_no, account_name, bank_branch, bank_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (account_no) DO UPDATE SET
            account_name = COALESCE(NULLIF(EXCLUDED.account_name, ''), account.account_name),
            bank_branch = COALESCE(NULLIF(EXCLUDED.bank_branch, ''), account.bank_branch),
            bank_id = COALESCE(EXCLUDED.bank_id, account.bank_id)
    `, [cleanAccountNo, cleanAccountName, cleanBranch, resolvedBankId]);

    return cleanAccountNo;
}

// CREATE new invoice
router.post('/invoices', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            invoice_no,
            invoice_date,
            due_date,
            credit_term,
            customer_id,
            booking_id,
            quotation_id,
            do_no,
            remark,
            items,
            account_no,
            account_name,
            bank_name,
            bank_branch
        } = req.body;

        const invId = await nextId('seq_invoice', 'inv-', 6);

        // Validation: If booking_id is provided, must have attached DO file
        if (booking_id && String(booking_id).trim() !== '') {
            const doCheck = await client.query(
                `SELECT 1 FROM booking_do_files WHERE booking_id = $1 LIMIT 1`,
                [booking_id]
            );
            if (doCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: 'ไม่สามารถสร้างใบแจ้งหนี้ได้ เนื่องจากรายการ Booking นี้ยังไม่ได้แนบไฟล์เอกสารใบ DO (Delivery Order)'
                });
            }
        }

        // Auto-generate invoice number: INV-YYYYMMDD-XXXX
        let finalInvoiceNo = invoice_no;
        if (!finalInvoiceNo) {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, '');
            const prefix = `INV-${todayStr}-`;
            const lastRes = await client.query(
                `SELECT invoice_no FROM invoices WHERE invoice_no LIKE $1 ORDER BY invoice_no DESC LIMIT 1`,
                [`${prefix}%`]
            );
            let nextSeq = 1;
            if (lastRes.rows.length > 0) {
                const parts = lastRes.rows[0].invoice_no.split('-');
                const seq = parseInt(parts[parts.length - 1], 10);
                if (!isNaN(seq)) nextSeq = seq + 1;
            }
            finalInvoiceNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;
        }

        // Calculate total from items
        let totalAmount = 0;
        const validItems = Array.isArray(items) && items.length > 0 ? items : [];
        validItems.forEach(item => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.unit_price) || 0;
            totalAmount += (qty * price);
        });

        // Resolve and save bank & account
        const savedAccountNo = await resolveAndSaveAccount(client, {
            account_no,
            account_name,
            bank_name,
            bank_branch
        });

        // Insert into invoices
        const insertSql = `
            INSERT INTO invoices (
                invoice_id, invoice_no, invoice_date, due_date, credit_term,
                customer_id, booking_id, quotation_id, do_no, total_amount, remark, account_no
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        await client.query(insertSql, [
            invId,
            finalInvoiceNo,
            invoice_date || new Date().toISOString().slice(0, 10),
            due_date || null,
            credit_term !== undefined && credit_term !== null ? parseInt(credit_term, 10) : 30,
            customer_id || null,
            booking_id || null,
            quotation_id || null,
            do_no || null,
            totalAmount,
            remark || null,
            savedAccountNo
        ]);

        // Insert invoice_items
        for (const it of validItems) {
            const itemId = await nextId('seq_invoice_item', 'ivi-', 6);
            const qty = parseFloat(it.quantity) || 1;
            const price = parseFloat(it.unit_price) || 0;
            const lineTotal = it.total_amount !== undefined ? parseFloat(it.total_amount) : (qty * price);

            await client.query(`
                INSERT INTO invoice_items (
                    item_id, invoice_id, service_id, description, quantity, unit, unit_price, total_amount
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                itemId,
                invId,
                it.service_id || null,
                it.description || 'ค่าบริการขนส่ง',
                qty,
                it.unit || 'คันรถ',
                price,
                lineTotal
            ]);
        }

        await client.query('COMMIT');

        // Auto-sync to Central Document Registry
        await syncDocumentRegistry({
            documentType: 'Invoice',
            refId: invId,
            documentNo: finalInvoiceNo,
            customerId: customer_id || null,
            documentDate: invoice_date || new Date().toISOString().slice(0, 10),
            grandTotal: totalAmount,
            status: 'Active',
            remark: remark || null
        });

        res.json({
            message: 'สร้างใบแจ้งหนี้สำเร็จ',
            data: { invoice_id: invId, invoice_no: finalInvoiceNo, total_amount: totalAmount }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating invoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// UPDATE invoice
router.put('/invoices/:id', async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');

        const {
            invoice_no,
            invoice_date,
            due_date,
            credit_term,
            customer_id,
            booking_id,
            quotation_id,
            do_no,
            remark,
            items,
            account_no,
            account_name,
            bank_name,
            bank_branch
        } = req.body;

        const invId = req.params.id;

        // Validation: If booking_id is provided, must have attached DO file
        if (booking_id && String(booking_id).trim() !== '') {
            const doCheck = await client.query(
                `SELECT 1 FROM booking_do_files WHERE booking_id = $1 LIMIT 1`,
                [booking_id]
            );
            if (doCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: 'ไม่สามารถบันทึกใบแจ้งหนี้ได้ เนื่องจากรายการ Booking นี้ยังไม่ได้แนบไฟล์เอกสารใบ DO (Delivery Order)'
                });
            }
        }

        // Calculate total
        let totalAmount = 0;
        const validItems = Array.isArray(items) ? items : [];
        validItems.forEach(item => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.unit_price) || 0;
            totalAmount += (qty * price);
        });

        // Resolve and save bank & account
        const savedAccountNo = await resolveAndSaveAccount(client, {
            account_no,
            account_name,
            bank_name,
            bank_branch
        });

        const updateSql = `
            UPDATE invoices SET
                invoice_no = COALESCE(NULLIF($1, ''), invoice_no),
                invoice_date = COALESCE(NULLIF($2, '')::date, invoice_date),
                due_date = NULLIF($3, '')::date,
                credit_term = $4,
                customer_id = NULLIF($5, ''),
                booking_id = NULLIF($6, ''),
                quotation_id = NULLIF($7, ''),
                do_no = $8,
                total_amount = $9,
                remark = $10,
                account_no = $11
            WHERE invoice_id = $12 OR invoice_no = $12
        `;
        await client.query(updateSql, [
            invoice_no || null,
            invoice_date || null,
            due_date || null,
            credit_term !== undefined && credit_term !== null ? parseInt(credit_term, 10) : 30,
            customer_id || null,
            booking_id || null,
            quotation_id || null,
            do_no || null,
            totalAmount,
            remark || null,
            savedAccountNo,
            invId
        ]);

        // If items are provided, replace them
        if (Array.isArray(items)) {
            await client.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [invId]);

            for (const it of validItems) {
                const itemId = await nextId('seq_invoice_item', 'ivi-', 6);
                const qty = parseFloat(it.quantity) || 1;
                const price = parseFloat(it.unit_price) || 0;
                const lineTotal = it.total_amount !== undefined ? parseFloat(it.total_amount) : (qty * price);

                await client.query(`
                    INSERT INTO invoice_items (
                        item_id, invoice_id, service_id, description, quantity, unit, unit_price, total_amount
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                `, [
                    itemId,
                    invId,
                    it.service_id || null,
                    it.description || 'ค่าบริการขนส่ง',
                    qty,
                    it.unit || 'คันรถ',
                    price,
                    lineTotal
                ]);
            }
        }

        await client.query('COMMIT');

        // Auto-sync to Central Document Registry
        await syncDocumentRegistry({
            documentType: 'Invoice',
            refId: invId,
            documentNo: invoice_no || invId,
            customerId: customer_id || null,
            documentDate: invoice_date || null,
            grandTotal: totalAmount,
            status: 'Active',
            remark: remark || null
        });

        res.json({ message: 'แก้ไขใบแจ้งหนี้สำเร็จ' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating invoice:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// DELETE invoice
router.delete('/invoices/:id', async (req, res) => {
    try {
        await db.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [req.params.id]);
        const result = await db.query(`DELETE FROM invoices WHERE invoice_id = $1 OR invoice_no = $1`, [req.params.id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'ไม่พบใบแจ้งหนี้ที่ต้องการลบ' });
        }
        await removeDocumentRegistry(req.params.id);
        res.json({ message: 'ลบใบแจ้งหนี้สำเร็จ' });
    } catch (err) {
        console.error('Error deleting invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
