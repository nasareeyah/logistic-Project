const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

// Middleware ตรวจสอบสิทธิ์การเข้าถึงเอกสารทางการเงิน (Quotation, Invoice, Receipt)
// Employee ไม่มีสิทธิ์เข้าถึง ส่วน Operator / Accounting มีสิทธิ์เต็ม
const checkFinancialPermission = (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role && role === 'employee') {
        return res.status(403).json({
            error: 'ปฏิเสธการเข้าถึง: พนักงานทั่วไป (Employee) ไม่มีสิทธิ์เข้าถึงเอกสารทางการเงิน (Quotation, Invoice, Receipt)'
        });
    }
    next();
};

// --- CENTRAL DOCUMENT REGISTRY & DOCUMENT ITEMS ---
const { syncDocumentRegistry, removeDocumentRegistry } = require('../utils/documentRegistry');

router.get('/document', checkFinancialPermission, async (req, res) => {
    try {
        const { document_type, ref_id } = req.query;
        let query = `
            SELECT d.*,
                   COALESCE(d.customer_name, c.customer_name) AS customer_name,
                   c.address AS customer_address,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   c.tax_id AS customer_tax_id,
                   c.contact_person AS customer_contact_person,
                   q.project_name AS job_name,
                   q.project_name AS project,
                   q.project_name,
                   q.salesperson AS sale_name,
                   q.consigner_id,
                   q.consignee_id,
                   q.service_id
            FROM document d
            LEFT JOIN customers c ON d.customer_id = c.customer_id
            LEFT JOIN quotations q ON (d.document_type = 'Quotation' AND (d.ref_id = q.quotation_id OR d.document_no = q.quotation_no))
        `;
        const params = [];
        const conditions = [];

        if (document_type) {
            params.push(document_type);
            conditions.push(`d.document_type = $${params.length}`);
        }
        if (ref_id) {
            params.push(ref_id);
            conditions.push(`d.ref_id = $${params.length}`);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY d.document_date DESC NULLS LAST, d.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching documents from registry:', err);
        res.status(500).json({ error: err.message });
    }
});

router.get('/document/:id', checkFinancialPermission, async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT d.*,
                   COALESCE(d.customer_name, c.customer_name) AS customer_name,
                   c.address AS customer_address,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   c.tax_id AS customer_tax_id,
                   c.contact_person AS customer_contact_person,
                   q.project_name AS job_name,
                   q.project_name AS project,
                   q.project_name,
                   q.salesperson AS sale_name,
                   q.consigner_id,
                   q.consignee_id,
                   q.service_id
            FROM document d
            LEFT JOIN customers c ON d.customer_id = c.customer_id
            LEFT JOIN quotations q ON (d.document_type = 'Quotation' AND (d.ref_id = q.quotation_id OR d.document_no = q.quotation_no))
            WHERE d.document_id = $1 OR d.ref_id = $1 OR d.document_no = $1
            LIMIT 1
        `;
        const result = await db.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบเอกสาร' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/document', checkFinancialPermission, async (req, res) => {
    try {
        const {
            document_type,
            ref_id,
            document_no,
            customer_id,
            customer_name,
            document_date,
            grand_total,
            total_amount,
            status,
            remark
        } = req.body;

        const docId = await syncDocumentRegistry({
            documentType: document_type || 'General',
            refId: ref_id || document_no || await nextId('seq_document', 'ref-', 6),
            documentNo: document_no,
            customerId: customer_id || null,
            customerName: customer_name || null,
            documentDate: document_date || new Date(),
            grandTotal: grand_total || total_amount || 0,
            status: status || 'Active',
            remark: remark || null
        });

        res.json({ message: 'บันทึกเอกสารลงทะเบียนกลางสำเร็จ', data: { document_id: docId } });
    } catch (err) {
        console.error('POST document error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/document/:id', checkFinancialPermission, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            document_type,
            ref_id,
            document_no,
            customer_id,
            customer_name,
            document_date,
            grand_total,
            total_amount,
            status,
            remark
        } = req.body;

        const docId = await syncDocumentRegistry({
            documentType: document_type || 'General',
            refId: ref_id || id,
            documentNo: document_no || id,
            customerId: customer_id || null,
            customerName: customer_name || null,
            documentDate: document_date,
            grandTotal: grand_total || total_amount || 0,
            status: status || 'Active',
            remark: remark || null
        });

        res.json({ message: 'แก้ไขเอกสารในทะเบียนกลางสำเร็จ', data: { document_id: docId } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/document/:id', checkFinancialPermission, async (req, res) => {
    try {
        const { id } = req.params;
        // Check if this document points to a quotation
        const check = await db.query('SELECT ref_id, document_type FROM document WHERE document_id = $1 OR ref_id = $1', [id]);
        if (check.rows.length > 0) {
            const { ref_id, document_type } = check.rows[0];
            if (document_type === 'Quotation' && ref_id) {
                await db.query('DELETE FROM quotations WHERE quotation_id = $1', [ref_id]);
            }
        }
        await removeDocumentRegistry(id);
        res.json({ message: 'ลบเอกสารออกจากทะเบียนสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/document_items', checkFinancialPermission, async (req, res) => {
    try {
        const { document_id } = req.query;
        let query = `
            SELECT 
                qi.item_id AS document_items_id,
                qi.item_id,
                qi.quotation_id AS document_id,
                qi.service_type AS service_typename,
                qi.service_type,
                qi.description,
                qi.quantity AS item_quantity,
                qi.quantity,
                qi.unit_quantity AS unit,
                qi.unit_quantity,
                qi.unit_price,
                qi.unit_price AS default_price,
                qi.total_amount,
                qi.total_amount AS total
            FROM quotation_items qi
        `;
        let params = [];
        if (document_id) {
            let targetQuotationId = document_id;
            if (document_id.startsWith('doc-')) {
                const regRes = await db.query('SELECT ref_id FROM document WHERE document_id = $1', [document_id]);
                if (regRes.rows.length > 0 && regRes.rows[0].ref_id) {
                    targetQuotationId = regRes.rows[0].ref_id;
                }
            }
            query += ' WHERE qi.quotation_id = $1';
            params.push(targetQuotationId);
        }
        query += ' ORDER BY qi.item_id ASC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/document_items', checkFinancialPermission, async (req, res) => {
    // Legacy stub if anything still calls it
    res.json({ message: 'บันทึกรายการสำเร็จ' });
});

router.delete('/document_items/:id', checkFinancialPermission, async (req, res) => {
    try {
        await db.query('DELETE FROM quotation_items WHERE item_id = $1', [req.params.id]);
        res.json({ message: 'ลบรายการสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/service', async (req, res) => {
    try {
        const { service_id, service_typeID, quantity, unit_quantity, default_price, unit } = req.body;

        // ถ้า service_typeID ไม่มีในตาราง ให้สร้างใหม่อัตโนมัติ
        const stCheck = await db.query('SELECT service_typeid FROM service_type WHERE service_typeid = $1', [service_typeID]);
        if (stCheck.rows.length === 0) {
            await db.query('INSERT INTO service_type (service_typeid, service_typename) VALUES ($1, $2)', [service_typeID, 'ทั่วไป']);
        }

        const finalServiceId = service_id || await nextId('seq_service', 'sv-', 5);
        await db.query(
            `INSERT INTO service (service_id, service_typeID, quantity, unit_quantity, default_price, unit) VALUES ($1, $2, $3, $4, $5, $6)`,
            [finalServiceId, service_typeID || null, quantity || null, unit_quantity || null, default_price || null, unit || null]
        );
        res.json({ message: 'สร้าง service สำเร็จ', service_id: finalServiceId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/service', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT s.*, st.service_typename
             FROM service s
             LEFT JOIN service_type st ON s.service_typeid = st.service_typeid`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/service_type', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM service_type');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/service_type', async (req, res) => {
    try {
        const { service_typename } = req.body;
        if (!service_typename) {
            return res.status(400).json({ error: 'กรุณาระบุชื่อประเภทบริการ' });
        }
        const existing = await db.query(
            'SELECT service_typeid FROM service_type WHERE service_typename = $1',
            [service_typename]
        );
        if (existing.rows.length > 0) {
            return res.json({ service_typeid: existing.rows[0].service_typeid, service_typename });
        }
        const newId = await nextId('seq_service_type', 'st-', 5);
        await db.query(
            'INSERT INTO service_type (service_typeid, service_typename) VALUES ($1, $2)',
            [newId, service_typename]
        );
        res.json({ service_typeid: newId, service_typename });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/service_type/:id', async (req, res) => {
    try {
        const { service_typename } = req.body;
        await db.query(
            'UPDATE service_type SET service_typename = $1 WHERE service_typeid = $2',
            [service_typename, req.params.id]
        );
        res.json({ message: 'แก้ไขประเภทบริการสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/service_type/:id', async (req, res) => {
    try {
        const check = await db.query(
            'SELECT service_id FROM service WHERE service_typeid = $1',
            [req.params.id]
        );
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'ไม่สามารถลบได้ มีบริการที่ใช้ประเภทนี้อยู่' });
        }
        await db.query('DELETE FROM service_type WHERE service_typeid = $1', [req.params.id]);
        res.json({ message: 'ลบประเภทบริการสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
