const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

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
                qd.document_no AS quotation_no,
                COUNT(ii.item_id) AS item_count
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.customer_id
            LEFT JOIN bookings b ON i.booking_id = b.booking_id
            LEFT JOIN document qd ON i.quotation_id = qd.document_id
            LEFT JOIN invoice_items ii ON i.invoice_id = ii.invoice_id
            GROUP BY i.invoice_id, c.customer_name, c.address, c.phone, b.booking_no, qd.document_no
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
router.get('/invoices-eligible-bookings', async (req, res) => {
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
                COALESCE(qd.document_no, cust_qd.document_no) AS quotation_no,
                COALESCE(d.do_no, (SELECT ba.file_name FROM booking_attachments ba WHERE ba.booking_id = b.booking_id LIMIT 1)) AS do_no,
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
            LEFT JOIN document qd ON b.quotation_id = qd.document_id
            LEFT JOIN service qs ON qd.service_id = qs.service_id
            LEFT JOIN service_type qst ON qs.service_typeid = qst.service_typeid
            LEFT JOIN LATERAL (
                SELECT d2.document_id, d2.document_no, d2.service_id
                FROM document d2
                WHERE d2.customer_id = b.customer_id AND d2.document_type = 'Quotation'
                ORDER BY d2.document_date DESC NULLS LAST
                LIMIT 1
            ) cust_qd ON true
            LEFT JOIN service cust_qs ON cust_qd.service_id = cust_qs.service_id
            LEFT JOIN service_type cust_qst ON cust_qs.service_typeid = cust_qst.service_typeid
            LEFT JOIN delivery_orders d ON d.booking_id = b.booking_id
            WHERE EXISTS (
                SELECT 1 FROM booking_attachments ba WHERE ba.booking_id = b.booking_id
            ) OR d.do_no IS NOT NULL
            ORDER BY b.created_at DESC;
        `;
        const result = await db.query(sql);
        res.json(result.rows);
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
                qd.document_no AS quotation_no
            FROM invoices i
            LEFT JOIN customers c ON i.customer_id = c.customer_id
            LEFT JOIN bookings b ON i.booking_id = b.booking_id
            LEFT JOIN document qd ON i.quotation_id = qd.document_id
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
            items
        } = req.body;

        const invId = await nextId('seq_invoice', 'inv-', 6);

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

        // Insert into invoices
        const insertSql = `
            INSERT INTO invoices (
                invoice_id, invoice_no, invoice_date, due_date, credit_term,
                customer_id, booking_id, quotation_id, do_no, total_amount, remark
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
            remark || null
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
            items
        } = req.body;

        const invId = req.params.id;

        // Calculate total
        let totalAmount = 0;
        const validItems = Array.isArray(items) ? items : [];
        validItems.forEach(item => {
            const qty = parseFloat(item.quantity) || 1;
            const price = parseFloat(item.unit_price) || 0;
            totalAmount += (qty * price);
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
                remark = $10
            WHERE invoice_id = $11 OR invoice_no = $11
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
        res.json({ message: 'ลบใบแจ้งหนี้สำเร็จ' });
    } catch (err) {
        console.error('Error deleting invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
