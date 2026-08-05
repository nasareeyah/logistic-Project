const express = require('express');
const router = express.Router();
const db = require('../config/db');

console.log("api route loaded");
// --- CUSTOMERS ---
router.get('/customers', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM customers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/customers', async (req, res) => {
    try {
        const { customer_id, customer_name, tax_id, address, phone, email, contact_person } = req.body;

        if (!customer_name) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อลูกค้า' });
        }

        const sql = `INSERT INTO customers (customer_id, customer_name, tax_id, address, phone, email, contact_person) VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        await db.query(sql, [
            customer_id || null,
            customer_name || null,
            tax_id || null,
            address || null,
            phone || null,
            email || null,
            contact_person || null
        ]);

        return res.json({ message: 'เพิ่มข้อมูลลูกค้าสำเร็จ' });
    } catch (err) {
        console.error('Database Error:', err);
        return res.status(200).json({ error: err.message });
    }
});

router.put('/customers/:id', async (req, res) => {
    try {
        const { customer_name, tax_id, address, phone, email, contact_person } = req.body;
        const sql = `UPDATE customers SET customer_name=$1, tax_id=$2, address=$3, phone=$4, email=$5, contact_person=$6 WHERE customer_id=$7`;
        await db.query(sql, [customer_name, tax_id, address, phone, email, contact_person, req.params.id]);
        res.json({ message: 'แก้ไขข้อมูลลูกค้าสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/customers/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM customers WHERE customer_id = $1', [req.params.id]);
        res.json({ message: 'ลบลูกค้าสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- CARS ---
router.get('/cars', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM cars');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/cars', async (req, res) => {
    try {
        const { car_id, car_number, car_type, capacity, capacity_unit, status, assigned_driver_id, notes } = req.body;
        await db.query(
            'INSERT INTO cars (car_id, car_number, car_type, capacity, capacity_unit, status, assigned_driver_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [car_id, car_number, car_type, capacity ? parseFloat(capacity) : null, capacity_unit || null, status || 'Available', assigned_driver_id || null, notes || null]
        );
        res.json({ message: 'เพิ่มข้อมูลรถสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/cars/:id', async (req, res) => {
    try {
        const { car_number, car_type, capacity, capacity_unit, status, assigned_driver_id, notes } = req.body;
        await db.query(
            'UPDATE cars SET car_number=$1, car_type=$2, capacity=$3, capacity_unit=$4, status=$5, assigned_driver_id=$6, notes=$7 WHERE car_id=$8',
            [car_number, car_type, capacity ? parseFloat(capacity) : null, capacity_unit || null, status || 'Available', assigned_driver_id || null, notes || null, req.params.id]
        );
        res.json({ message: 'แก้ไขข้อมูลรถสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/cars/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM cars WHERE car_id = $1', [req.params.id]);
        res.json({ message: 'ลบรถสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DRIVERS ---
router.get('/driver', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM driver');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/driver', async (req, res) => {
    try {
        const { driver_id, full_name, phone, email, license_number, status, assigned_car_id, notes } = req.body;
        await db.query(
            'INSERT INTO driver (driver_id, full_name, phone, email, license_number, status, assigned_car_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [driver_id, full_name, phone, email || null, license_number || null, status || 'Available', assigned_car_id || null, notes || null]
        );
        res.json({ message: 'เพิ่มคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/driver/:id', async (req, res) => {
    try {
        const { full_name, phone, email, license_number, status, assigned_car_id, notes } = req.body;
        await db.query(
            'UPDATE driver SET full_name=$1, phone=$2, email=$3, license_number=$4, status=$5, assigned_car_id=$6, notes=$7 WHERE driver_id=$8',
            [full_name, phone, email || null, license_number || null, status || 'Available', assigned_car_id || null, notes || null, req.params.id]
        );
        res.json({ message: 'แก้ไขคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/driver/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM driver WHERE driver_id = $1', [req.params.id]);
        res.json({ message: 'ลบคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DOCUMENTS & DOCUMENT ITEMS ---
router.get('/document', async (req, res) => {
    try {
        const query = `
            SELECT d.*, s.description AS service_name, st.service_typename,
                   cgr.address AS consigner_address,
                   cge.address AS consignee_address
            FROM document d
            LEFT JOIN service s ON d.service_id = s.service_id
            LEFT JOIN service_type st ON s.service_typeid = st.service_typeid
            LEFT JOIN consigner cgr ON d.consigner_id = cgr.consigner_id
            LEFT JOIN consignee cge ON d.consignee_id = cge.consignee_id
            ORDER BY d.document_date DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/document', async (req, res) => {
    const {
        document_id,
        document_type,
        document_no,
        document_date,
        account_no,
        customer_id,
        st_no, st_date,
        re_no, re_date,
        withholding_percent, withholding_amount,
        grand_total, net_total, total_amount,
        status,
        remark,
        driver_id, car_id,
        do_no, do_date,
        consigner_id, consignee_id,
        service_id,
        service_typename,
        sale_name, job_name, valid_until, currency
    } = req.body;

    try {
        let resolvedServiceId = service_id || null;

        if (service_typename && !service_id) {
            const stResult = await db.query(
                `SELECT service_typeid FROM service_type WHERE service_typename = $1`,
                [service_typename]
            );
            let typeId = stResult.rows[0]?.service_typeid;

            if (!typeId) {
                typeId = 'st-' + Math.floor(10000 + Math.random() * 90000);
                await db.query(
                    `INSERT INTO service_type (service_typeid, service_typename) VALUES ($1, $2)`,
                    [typeId, service_typename]
                );
            }

            const svResult = await db.query(
                `SELECT service_id FROM service WHERE service_typeid = $1`,
                [typeId]
            );
            resolvedServiceId = svResult.rows[0]?.service_id;

            if (!resolvedServiceId) {
                resolvedServiceId = 'srv-' + Math.floor(10000 + Math.random() * 90000);
                await db.query(
                    `INSERT INTO service (service_id, service_typeid, description) VALUES ($1, $2, $3)`,
                    [resolvedServiceId, typeId, service_typename]
                );
            }
        }
        const finalDocId = document_id || ('doc-' + Math.floor(100000 + Math.random() * 900000));
        const finalGrandTotal = grand_total || total_amount || null;
        const sql = `
            INSERT INTO document (
                document_id, document_type, document_no, document_date,
                account_no, customer_id,
                st_no, st_date, re_no, re_date,
                withholding_percent, withholding_amount,
                grand_total, net_total, status, remark,
                driver_id, car_id, do_no, do_date,
                consigner_id, consignee_id, service_id,
                sale_name, job_name, valid_until, currency
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6,
                $7, $8, $9, $10,
                $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19, $20,
                $21, $22, $23,
                $24, $25, $26, $27
            )
        `;
        await db.query(sql, [
            finalDocId,
            document_type || null,
            document_no || null,
            document_date || null,
            account_no || null,
            customer_id || null,
            st_no || null, st_date || null,
            re_no || null, re_date || null,
            withholding_percent || null, withholding_amount || null,
            finalGrandTotal, net_total || null,
            status || 'รอดำเนินการ',
            remark || null,
            driver_id || null, car_id || null,
            do_no || null, do_date || null,
            consigner_id || null, consignee_id || null,
            resolvedServiceId,
            sale_name || null, job_name || null,
            valid_until || null, currency || 'THB'
        ]);

        res.json({ message: 'บันทึกเอกสารสำเร็จ', data: { document_id: finalDocId } });
    } catch (err) {
        console.error('POST document error:', err);
        res.status(500).json({ error: err.message });
    }
});

router.put('/document/:id', async (req, res) => {
    try {
        const {
            document_type, document_no, document_date,
            account_no, customer_id,
            st_no, st_date, re_no, re_date,
            withholding_percent, withholding_amount,
            grand_total, net_total, status, remark,
            driver_id, car_id, do_no, do_date,
            consigner_id, consignee_id, service_id,
            sale_name, job_name, valid_until, currency
        } = req.body;

        const sql = `
            UPDATE document SET
                document_type=$1, document_no=$2, document_date=$3,
                account_no=$4, customer_id=$5,
                st_no=$6, st_date=$7, re_no=$8, re_date=$9,
                withholding_percent=$10, withholding_amount=$11,
                grand_total=$12, net_total=$13, status=$14, remark=$15,
                driver_id=$16, car_id=$17, do_no=$18, do_date=$19,
                consigner_id=$20, consignee_id=$21, service_id=$22,
                sale_name=$23, job_name=$24, valid_until=$25, currency=$26
            WHERE document_id=$27
        `;
        await db.query(sql, [
            document_type, document_no, document_date,
            account_no, customer_id,
            st_no, st_date, re_no, re_date,
            withholding_percent, withholding_amount,
            grand_total, net_total, status, remark,
            driver_id, car_id, do_no, do_date,
            consigner_id, consignee_id, service_id,
            sale_name, job_name, valid_until, currency,
            req.params.id
        ]);
        res.json({ message: 'แก้ไขเอกสารสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/document/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM document_items WHERE document_id = $1', [req.params.id]);
        await db.query('DELETE FROM document WHERE document_id = $1', [req.params.id]);
        res.json({ message: 'ลบเอกสารสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/document_items', async (req, res) => {
    try {
        const { document_id } = req.query;
        const sql = `SELECT di.*, s.description, s.quantity AS item_quantity, s.unit_quantity AS unit,
                            s.default_price AS unit_price, st.service_typename
                     FROM document_items di
                     LEFT JOIN service s ON di.service_id = s.service_id
                     LEFT JOIN service_type st ON s.service_typeid = st.service_typeid`;
        let result;
        if (document_id) {
            result = await db.query(sql + ' WHERE di.document_id = $1', [document_id]);
        } else {
            result = await db.query(sql);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/document_items', async (req, res) => {
    try {
        const { document_id, service_id } = req.body;
        const itemId = 'di-' + Math.floor(100000 + Math.random() * 900000);
        await db.query(
            `INSERT INTO document_items (document_items_id, document_id, service_id) VALUES ($1, $2, $3)`,
            [itemId, document_id, service_id || null]
        );
        res.json({ message: 'บันทึกรายการสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/document_items/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM document_items WHERE document_items_id = $1', [req.params.id]);
        res.json({ message: 'ลบรายการสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/service', async (req, res) => {
    try {
        const { service_id, service_typeID, description, quantity, unit_quantity, default_price, unit } = req.body;
        
        // ถ้า service_typeID ไม่มีในตาราง ให้สร้างใหม่อัตโนมัติ
        const stCheck = await db.query('SELECT service_typeid FROM service_type WHERE service_typeid = $1', [service_typeID]);
        if (stCheck.rows.length === 0) {
            await db.query('INSERT INTO service_type (service_typeid, service_typename) VALUES ($1, $2)', [service_typeID, description || 'ทั่วไป']);
        }

        await db.query(
            `INSERT INTO service (service_id, service_typeID, description, quantity, unit_quantity, default_price, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [service_id, service_typeID || null, description || null, quantity || null, unit_quantity || null, default_price || null, unit || null]
        );
        res.json({ message: 'สร้าง service สำเร็จ', service_id });
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
        const newId = 'st-' + Math.floor(10000 + Math.random() * 90000);
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
        const finalId = consigner_id || ('cgr-' + Math.floor(10000 + Math.random() * 90000));
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
        const finalId = consignee_id || ('cge-' + Math.floor(10000 + Math.random() * 90000));
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
