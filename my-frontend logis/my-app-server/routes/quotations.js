const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');
const { syncDocumentRegistry, removeDocumentRegistry } = require('../utils/documentRegistry');

// Helper to resolve / insert consigner from origin province or address
async function resolveConsignerId(origin, consignerId) {
    const cleanOrigin = (origin || '').trim();
    if (consignerId) {
        const check = await db.query('SELECT consigner_id FROM consigner WHERE consigner_id = $1', [consignerId]);
        if (check.rows.length > 0) {
            if (cleanOrigin) {
                await db.query(
                    `UPDATE consigner SET province = $1 WHERE consigner_id = $2`,
                    [cleanOrigin, consignerId]
                );
            }
            return consignerId;
        }
    }
    if (!cleanOrigin) return null;

    const newId = await nextId('seq_consigner', 'cgr-', 5);
    await db.query(
        `INSERT INTO consigner (consigner_id, consigner_name, address_line, province, country)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId, cleanOrigin, null, cleanOrigin, 'Thailand']
    );
    return newId;
}

// Helper to resolve / insert consignee from destination province or address
async function resolveConsigneeId(destination, consigneeId) {
    const cleanDest = (destination || '').trim();
    if (consigneeId) {
        const check = await db.query('SELECT consignee_id FROM consignee WHERE consignee_id = $1', [consigneeId]);
        if (check.rows.length > 0) {
            if (cleanDest) {
                await db.query(
                    `UPDATE consignee SET province = $1 WHERE consignee_id = $2`,
                    [cleanDest, consigneeId]
                );
            }
            return consigneeId;
        }
    }
    if (!cleanDest) return null;

    const newId = await nextId('seq_consignee', 'cge-', 5);
    await db.query(
        `INSERT INTO consignee (consignee_id, consignee_name, address_line, province, country)
         VALUES ($1, $2, $3, $4, $5)`,
        [newId, cleanDest, null, cleanDest, 'Thailand']
    );
    return newId;
}

// Helper to resolve / link service_id from items
async function resolveServiceId(items, providedServiceId) {
    if (providedServiceId) {
        const check = await db.query('SELECT service_id FROM service WHERE service_id = $1', [providedServiceId]);
        if (check.rows.length > 0) return providedServiceId;
    }
    const firstItem = Array.isArray(items) && items.length > 0 ? items[0] : null;
    const sTypeName = (firstItem?.serviceType || firstItem?.service_type || firstItem?.service_typename || 'ค่าขนส่ง').trim();

    // Check or create service_type
    let typeId;
    const stRes = await db.query('SELECT service_typeid FROM service_type WHERE LOWER(TRIM(service_typename)) = LOWER(TRIM($1)) LIMIT 1', [sTypeName]);
    if (stRes.rows.length > 0) {
        typeId = stRes.rows[0].service_typeid;
    } else {
        typeId = await nextId('seq_service_type', 'st-', 5);
        await db.query('INSERT INTO service_type (service_typeid, service_typename) VALUES ($1, $2)', [typeId, sTypeName]);
    }

    // Check or create service
    const svRes = await db.query('SELECT service_id FROM service WHERE service_typeid = $1 LIMIT 1', [typeId]);
    if (svRes.rows.length > 0) {
        return svRes.rows[0].service_id;
    } else {
        const newSvId = await nextId('seq_service', 'sv-', 5);
        await db.query(
            'INSERT INTO service (service_id, service_typeid, description, quantity, default_price, unit) VALUES ($1, $2, $3, $4, $5, $6)',
            [newSvId, typeId, sTypeName, firstItem?.quantity || 1, firstItem?.pricePerUnit || firstItem?.unit_price || 0, firstItem?.unitQuantity || firstItem?.unit || 'คัน']
        );
        return newSvId;
    }
}

// Helper to generate sequential Quotation No (e.g. QT-20261011-0001)
const generateQuotationNo = async (dateStr) => {
    let d = new Date();
    if (dateStr) {
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) d = parsed;
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const prefix = `QT-${year}${month}${day}-`;

    const result = await db.query(
        `SELECT quotation_no FROM quotations WHERE quotation_no LIKE $1 ORDER BY quotation_no DESC LIMIT 1`,
        [`${prefix}%`]
    );

    let nextSeq = 1;
    if (result.rows.length > 0 && result.rows[0].quotation_no) {
        const lastNo = result.rows[0].quotation_no;
        const lastPart = lastNo.slice(prefix.length);
        const parsedNum = parseInt(lastPart, 10);
        if (!isNaN(parsedNum)) nextSeq = parsedNum + 1;
    }
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
};

// GET next quotation number
router.get('/quotations/next-no', async (req, res) => {
    try {
        const { date } = req.query;
        const nextNo = await generateQuotationNo(date);
        res.json({ next_quotation_no: nextNo, next_no: nextNo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET all quotations with items
router.get('/quotations', async (req, res) => {
    try {
        const sql = `
            SELECT 
                q.*,
                q.quotation_id AS document_id,
                q.quotation_no AS document_no,
                q.quotation_date AS document_date,
                q.salesperson AS sale_name,
                q.project_name AS job_name,
                'Quotation' AS document_type,
                c.customer_name,
                c.contact_person,
                c.phone AS customer_phone,
                c.email AS customer_email,
                c.tax_id AS customer_tax_id,
                c.address AS customer_address,
                -- Consigner (Origin)
                cgr.consigner_name,
                COALESCE(cgr.province, cgr.address_line, cgr.consigner_name) AS origin,
                COALESCE(cgr.province, cgr.address_line, cgr.consigner_name) AS origin_address,
                COALESCE(cgr.province, cgr.address_line, cgr.consigner_name) AS consigner_address,
                cgr.province AS origin_province,
                cgr.address_line AS consigner_address_line,
                cgr.city AS consigner_city,
                cgr.postal_code AS consigner_postal_code,
                -- Consignee (Destination)
                cge.consignee_name,
                COALESCE(cge.province, cge.address_line, cge.consignee_name) AS destination,
                COALESCE(cge.province, cge.address_line, cge.consignee_name) AS destination_address,
                COALESCE(cge.province, cge.address_line, cge.consignee_name) AS consignee_address,
                cge.province AS destination_province,
                cge.address_line AS consignee_address_line,
                cge.city AS consignee_city,
                cge.postal_code AS consignee_postal_code,
                -- Service
                COALESCE(q.service_id, s.service_id) AS service_id,
                st.service_typename AS service_name,
                st.service_typename
            FROM quotations q
            LEFT JOIN customers c ON q.customer_id = c.customer_id
            LEFT JOIN consigner cgr ON q.consigner_id = cgr.consigner_id
            LEFT JOIN consignee cge ON q.consignee_id = cge.consignee_id
            LEFT JOIN service s ON q.service_id = s.service_id
            LEFT JOIN service_type st ON s.service_typeid = st.service_typeid
            ORDER BY q.quotation_date DESC, q.created_at DESC;
        `;
        const result = await db.query(sql);
        const quotations = result.rows;

        // Fetch items for all quotations
        const itemsRes = await db.query(`SELECT * FROM quotation_items ORDER BY item_id ASC`);
        const itemsMap = {};
        itemsRes.rows.forEach(item => {
            if (!itemsMap[item.quotation_id]) itemsMap[item.quotation_id] = [];
            itemsMap[item.quotation_id].push({
                item_id: item.item_id,
                serviceType: item.service_type,
                service_type: item.service_type,
                service_typename: item.service_type,
                description: item.description,
                quantity: parseFloat(item.quantity) || 1,
                item_quantity: parseFloat(item.quantity) || 1,
                unitQuantity: item.unit_quantity || '',
                unit: item.unit_quantity || 'คัน',
                pricePerUnit: parseFloat(item.unit_price) || 0,
                unit_price: parseFloat(item.unit_price) || 0,
                total: parseFloat(item.total_amount) || 0,
                total_amount: parseFloat(item.total_amount) || 0
            });
        });

        const fullQuotations = quotations.map(q => {
            const org = q.origin || q.consigner_address || '';
            const dst = q.destination || q.consignee_address || '';
            return {
                ...q,
                routes: [{ id: 1, origin: org, destination: dst, consigner_id: q.consigner_id, consignee_id: q.consignee_id }],
                items: itemsMap[q.quotation_id] || []
            };
        });

        res.json(fullQuotations);
    } catch (err) {
        console.error('Error fetching quotations:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET single quotation by ID
router.get('/quotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT 
                q.*,
                q.quotation_id AS document_id,
                q.quotation_no AS document_no,
                q.quotation_date AS document_date,
                q.salesperson AS sale_name,
                q.project_name AS job_name,
                'Quotation' AS document_type,
                c.customer_name,
                c.contact_person,
                c.phone AS customer_phone,
                c.email AS customer_email,
                c.tax_id AS customer_tax_id,
                c.address AS customer_address,
                -- Consigner (Origin)
                cgr.consigner_name,
                COALESCE(cgr.province, cgr.address_line, cgr.consigner_name) AS origin,
                COALESCE(cgr.province, cgr.address_line, cgr.consigner_name) AS origin_address,
                COALESCE(cgr.province, cgr.address_line, cgr.consigner_name) AS consigner_address,
                cgr.province AS origin_province,
                cgr.address_line AS consigner_address_line,
                cgr.city AS consigner_city,
                cgr.postal_code AS consigner_postal_code,
                -- Consignee (Destination)
                cge.consignee_name,
                COALESCE(cge.province, cge.address_line, cge.consignee_name) AS destination,
                COALESCE(cge.province, cge.address_line, cge.consignee_name) AS destination_address,
                COALESCE(cge.province, cge.address_line, cge.consignee_name) AS consignee_address,
                cge.province AS destination_province,
                cge.address_line AS consignee_address_line,
                cge.city AS consignee_city,
                cge.postal_code AS consignee_postal_code,
                -- Service
                COALESCE(q.service_id, s.service_id) AS service_id,
                st.service_typename AS service_name,
                st.service_typename
            FROM quotations q
            LEFT JOIN customers c ON q.customer_id = c.customer_id
            LEFT JOIN consigner cgr ON q.consigner_id = cgr.consigner_id
            LEFT JOIN consignee cge ON q.consignee_id = cge.consignee_id
            LEFT JOIN service s ON q.service_id = s.service_id
            LEFT JOIN service_type st ON s.service_typeid = st.service_typeid
            WHERE q.quotation_id = $1 OR q.quotation_no = $1 OR EXISTS (SELECT 1 FROM document d WHERE d.document_id = $1 AND (d.ref_id = q.quotation_id OR d.document_no = q.quotation_no))
            LIMIT 1;
        `;
        const result = await db.query(sql, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลใบเสนอราคา' });
        }

        const quotation = result.rows[0];
        const itemsRes = await db.query(
            `SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY item_id ASC`,
            [quotation.quotation_id]
        );
        quotation.items = itemsRes.rows.map(item => ({
            item_id: item.item_id,
            serviceType: item.service_type,
            service_type: item.service_type,
            service_typename: item.service_type,
            description: item.description,
            quantity: parseFloat(item.quantity) || 1,
            item_quantity: parseFloat(item.quantity) || 1,
            unitQuantity: item.unit_quantity || '',
            unit: item.unit_quantity || 'คัน',
            pricePerUnit: parseFloat(item.unit_price) || 0,
            unit_price: parseFloat(item.unit_price) || 0,
            total: parseFloat(item.total_amount) || 0,
            total_amount: parseFloat(item.total_amount) || 0
        }));

        const org = quotation.origin || quotation.consigner_address || '';
        const dst = quotation.destination || quotation.consignee_address || '';
        quotation.routes = [{
            id: 1,
            origin: org,
            destination: dst,
            consigner_id: quotation.consigner_id,
            consignee_id: quotation.consignee_id
        }];

        res.json(quotation);
    } catch (err) {
        console.error('Error fetching quotation detail:', err);
        res.status(500).json({ error: err.message });
    }
});

// CREATE quotation
router.post('/quotations', async (req, res) => {
    try {
        const body = req.body;
        const formData = body.formData || body;
        const routes = body.routes || [];
        const rawItems = body.items || [];
        const grandTotal = parseFloat(body.grandTotal !== undefined ? body.grandTotal : (body.grand_total || formData.total_amount || 0)) || 0;

        let quotationNo = formData.quotationNo || formData.documentNo || formData.quotation_no || formData.document_no;
        if (!quotationNo) {
            quotationNo = await generateQuotationNo(formData.issueDate || formData.quotation_date);
        }

        const quotationId = await nextId('seq_quotations', 'qt-', 5);
        const issueDate = formData.issueDate || formData.quotation_date || formData.document_date || new Date().toISOString().slice(0, 10);
        const expiryDate = formData.expiryDate || formData.valid_until || null;
        const customerId = formData.customerId || formData.customer_id || null;
        const salesperson = formData.salesperson || formData.sale_name || '';
        const projectName = formData.projectName || formData.job_name || '';
        const remark = formData.remark || '';
        const currency = formData.currency || 'THB';

        const origin = routes[0]?.origin || formData.origin || formData.consigner_address || '';
        const destination = routes[0]?.destination || formData.destination || formData.consignee_address || '';

        // 1. Resolve and save to consigner and consignee tables (new quotation -> always new consigner/consignee)
        const consignerId = await resolveConsignerId(origin, null);
        const consigneeId = await resolveConsigneeId(destination, null);

        // 2. Resolve service_id from items
        const resolvedServiceId = await resolveServiceId(rawItems, formData.service_id);

        // 3. Insert into quotations table (without origin_address and destination_address columns)
        await db.query(`
            INSERT INTO quotations (
                quotation_id, quotation_no, customer_id, quotation_date,
                valid_until, salesperson, project_name, consigner_id,
                consignee_id, service_id, subtotal, grand_total,
                currency, remark
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14
            )
        `, [
            quotationId, quotationNo, customerId, issueDate,
            expiryDate, salesperson, projectName, consignerId,
            consigneeId, resolvedServiceId, grandTotal, grandTotal,
            currency, remark
        ]);

        // 4. Insert items into quotation_items
        if (Array.isArray(rawItems) && rawItems.length > 0) {
            for (const it of rawItems) {
                const sType = it.serviceType || it.service_type || it.service_typename || 'ค่าขนส่ง';
                const desc = it.description || sType;
                const qty = parseFloat(it.quantity || it.item_quantity) || 1;
                const unitQ = it.unitQuantity || it.unit || 'คัน';
                const uPrice = parseFloat(it.pricePerUnit !== undefined ? it.pricePerUnit : it.unit_price) || 0;
                const tAmt = parseFloat(it.total !== undefined ? it.total : it.total_amount) || (qty * uPrice);

                await db.query(`
                    INSERT INTO quotation_items (
                        quotation_id, service_type, description,
                        quantity, unit_quantity, unit_price, total_amount
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [quotationId, sType, desc, qty, unitQ, uPrice, tAmt]);
            }
        }

        // 5. Auto-sync to Central Document Registry
        let customerName = formData.customerName || formData.customer_name || '';
        if (!customerName && customerId) {
            const cRes = await db.query('SELECT customer_name FROM customers WHERE customer_id = $1', [customerId]);
            if (cRes.rows.length > 0) customerName = cRes.rows[0].customer_name;
        }

        await syncDocumentRegistry({
            documentType: 'Quotation',
            refId: quotationId,
            documentNo: quotationNo,
            customerId: customerId,
            customerName: customerName,
            documentDate: issueDate,
            grandTotal: grandTotal,
            status: 'Active',
            remark: remark
        });

        res.status(201).json({
            message: 'สร้างใบเสนอราคาสำเร็จ',
            quotation_id: quotationId,
            document_id: quotationId,
            quotation_no: quotationNo,
            document_no: quotationNo,
            consigner_id: consignerId,
            consignee_id: consigneeId,
            service_id: resolvedServiceId
        });
    } catch (err) {
        console.error('Error creating quotation:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE quotation
router.put('/quotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const formData = body.formData || body;
        const routes = body.routes || [];
        const rawItems = body.items || [];
        const grandTotal = parseFloat(body.grandTotal !== undefined ? body.grandTotal : (body.grand_total || formData.total_amount || 0)) || 0;

        const check = await db.query(`
            SELECT quotation_id, quotation_no, consigner_id, consignee_id, service_id 
            FROM quotations 
            WHERE quotation_id = $1 OR quotation_no = $1 
               OR EXISTS (SELECT 1 FROM document d WHERE d.document_id = $1 AND (d.ref_id = quotations.quotation_id OR d.document_no = quotations.quotation_no))
        `, [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบใบเสนอราคาที่ต้องการแก้ไข' });
        }
        const targetId = check.rows[0].quotation_id;
        const quotationNo = formData.quotationNo || formData.documentNo || formData.quotation_no || check.rows[0].quotation_no;

        const issueDate = formData.issueDate || formData.quotation_date || formData.document_date || new Date().toISOString().slice(0, 10);
        const expiryDate = formData.expiryDate || formData.valid_until || null;
        const customerId = formData.customerId || formData.customer_id || null;
        const salesperson = formData.salesperson || formData.sale_name || '';
        const projectName = formData.projectName || formData.job_name || '';
        const remark = formData.remark || '';
        const currency = formData.currency || 'THB';

        const origin = routes[0]?.origin || formData.origin || formData.consigner_address || '';
        const destination = routes[0]?.destination || formData.destination || formData.consignee_address || '';

        // 1. Resolve and save to consigner and consignee tables
        const consignerId = await resolveConsignerId(origin, formData.consigner_id || routes[0]?.consigner_id || check.rows[0].consigner_id);
        const consigneeId = await resolveConsigneeId(destination, formData.consignee_id || routes[0]?.consignee_id || check.rows[0].consignee_id);

        // 2. Resolve service_id from items
        const resolvedServiceId = await resolveServiceId(rawItems, formData.service_id || check.rows[0].service_id);

        // 3. Update quotations table (without origin_address and destination_address columns)
        await db.query(`
            UPDATE quotations SET
                quotation_no = $1, customer_id = $2, quotation_date = $3,
                valid_until = $4, salesperson = $5, project_name = $6,
                consigner_id = $7, consignee_id = $8, service_id = $9,
                subtotal = $10, grand_total = $11, currency = $12,
                remark = $13, updated_at = CURRENT_TIMESTAMP
            WHERE quotation_id = $14
        `, [
            quotationNo, customerId, issueDate,
            expiryDate, salesperson, projectName,
            consignerId, consigneeId, resolvedServiceId,
            grandTotal, grandTotal, currency,
            remark, targetId
        ]);

        // 4. Replace items in quotation_items
        await db.query('DELETE FROM quotation_items WHERE quotation_id = $1', [targetId]);
        if (Array.isArray(rawItems) && rawItems.length > 0) {
            for (const it of rawItems) {
                const sType = it.serviceType || it.service_type || it.service_typename || 'ค่าขนส่ง';
                const desc = it.description || sType;
                const qty = parseFloat(it.quantity || it.item_quantity) || 1;
                const unitQ = it.unitQuantity || it.unit || 'คัน';
                const uPrice = parseFloat(it.pricePerUnit !== undefined ? it.pricePerUnit : it.unit_price) || 0;
                const tAmt = parseFloat(it.total !== undefined ? it.total : it.total_amount) || (qty * uPrice);

                await db.query(`
                    INSERT INTO quotation_items (
                        quotation_id, service_type, description,
                        quantity, unit_quantity, unit_price, total_amount
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [targetId, sType, desc, qty, unitQ, uPrice, tAmt]);
            }
        }

        // 5. Sync to Central Document Registry
        let customerName = formData.customerName || formData.customer_name || '';
        if (!customerName && customerId) {
            const cRes = await db.query('SELECT customer_name FROM customers WHERE customer_id = $1', [customerId]);
            if (cRes.rows.length > 0) customerName = cRes.rows[0].customer_name;
        }

        await syncDocumentRegistry({
            documentType: 'Quotation',
            refId: targetId,
            documentNo: quotationNo,
            customerId: customerId,
            customerName: customerName,
            documentDate: issueDate,
            grandTotal: grandTotal,
            status: 'Active',
            remark: remark
        });

        res.json({
            message: 'แก้ไขใบเสนอราคาสำเร็จ',
            quotation_id: targetId,
            consigner_id: consignerId,
            consignee_id: consigneeId,
            service_id: resolvedServiceId
        });
    } catch (err) {
        console.error('Error updating quotation:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE quotation
router.delete('/quotations/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const check = await db.query(`
            SELECT quotation_id, quotation_no 
            FROM quotations 
            WHERE quotation_id = $1 OR quotation_no = $1 
               OR EXISTS (SELECT 1 FROM document d WHERE d.document_id = $1 AND (d.ref_id = quotations.quotation_id OR d.document_no = quotations.quotation_no))
        `, [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบใบเสนอราคาที่ต้องการลบ' });
        }
        const targetId = check.rows[0].quotation_id;
        const targetNo = check.rows[0].quotation_no;

        // Cascade deletes quotation_items automatically via foreign key
        await db.query('DELETE FROM quotations WHERE quotation_id = $1', [targetId]);

        // Remove from Central Document Registry
        await removeDocumentRegistry(targetId);
        await removeDocumentRegistry(targetNo);

        res.json({ message: 'ลบใบเสนอราคาสำเร็จ' });
    } catch (err) {
        console.error('Error deleting quotation:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
