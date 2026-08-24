const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'do-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit
});

async function nextId(seq, prefix, pad) {
    const r = await db.query(`SELECT nextval('${seq}') AS n`);
    return prefix + String(r.rows[0].n).padStart(pad, '0');
}

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

        const finalCustId = customer_id || await nextId('seq_customer', 'cust-', 5);
        const sql = `INSERT INTO customers (customer_id, customer_name, tax_id, address, phone, email, contact_person) VALUES ($1, $2, $3, $4, $5, $6, $7)`;

        await db.query(sql, [
            finalCustId,
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
        const { driver_id, full_name, phone, email, license_number, assigned_car_id, notes } = req.body;
        const finalDriverId = driver_id || await nextId('seq_driver', 'd-', 6);
        await db.query(
            'INSERT INTO driver (driver_id, full_name, phone, email, license_number, assigned_car_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [finalDriverId, full_name, phone, email || null, license_number || null, assigned_car_id || null, notes || null]
        );
        if (assigned_car_id) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = $1 WHERE car_id = $2',
                [finalDriverId, assigned_car_id]
            );
        }
        res.json({ message: 'เพิ่มคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/driver/:id', async (req, res) => {
    try {
        const { full_name, phone, email, license_number, assigned_car_id, notes } = req.body;
        const oldResult = await db.query('SELECT assigned_car_id FROM driver WHERE driver_id = $1', [req.params.id]);
        const oldCarId = oldResult.rows[0]?.assigned_car_id || null;
        await db.query(
            'UPDATE driver SET full_name=$1, phone=$2, email=$3, license_number=$4, assigned_car_id=$5, notes=$6 WHERE driver_id=$7',
            [full_name, phone, email || null, license_number || null, assigned_car_id || null, notes || null, req.params.id]
        );
        const newCarId = assigned_car_id || null;
        if (oldCarId && oldCarId !== newCarId) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = NULL WHERE car_id = $1 AND assigned_driver_id = $2',
                [oldCarId, req.params.id]
            );
        }
        if (newCarId) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = $1 WHERE car_id = $2',
                [req.params.id, newCarId]
            );
        }
        res.json({ message: 'แก้ไขคนขับสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/driver/:id', async (req, res) => {
    try {
        const driverResult = await db.query('SELECT assigned_car_id FROM driver WHERE driver_id = $1', [req.params.id]);
        const carId = driverResult.rows[0]?.assigned_car_id || null;
        await db.query('DELETE FROM driver WHERE driver_id = $1', [req.params.id]);
        if (carId) {
            await db.query(
                'UPDATE cars SET assigned_driver_id = NULL WHERE car_id = $1 AND assigned_driver_id = $2',
                [carId, req.params.id]
            );
        }
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
                typeId = await nextId('seq_service_type', 'st-', 5);
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
                resolvedServiceId = await nextId('seq_service', 'sv-', 5);
                await db.query(
                    `INSERT INTO service (service_id, service_typeid, description) VALUES ($1, $2, $3)`,
                    [resolvedServiceId, typeId, service_typename]
                );
            }
        }
        const finalDocId = document_id || await nextId('seq_document', 'doc-', 6);
        const finalGrandTotal = grand_total || total_amount || null;
        const sql = `
            INSERT INTO document (
                document_id, document_type, document_no, document_date,
                account_no, customer_id,
                st_no, st_date, re_no, re_date,
                withholding_percent, withholding_amount,
                grand_total, net_total, remark,
                driver_id, car_id, do_no, do_date,
                consigner_id, consignee_id, service_id,
                sale_name, job_name, valid_until, currency
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6,
                $7, $8, $9, $10,
                $11, $12,
                $13, $14, $15,
                $16, $17, $18, $19,
                $20, $21, $22,
                $23, $24, $25, $26
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
            grand_total, net_total, remark,
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
                grand_total=$12, net_total=$13, remark=$14,
                driver_id=$15, car_id=$16, do_no=$17, do_date=$18,
                consigner_id=$19, consignee_id=$20, service_id=$21,
                sale_name=$22, job_name=$23, valid_until=$24, currency=$25
            WHERE document_id=$26
        `;
        await db.query(sql, [
            document_type, document_no, document_date,
            account_no, customer_id,
            st_no, st_date, re_no, re_date,
            withholding_percent, withholding_amount,
            grand_total, net_total, remark,
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
        const itemId = await nextId('seq_document_items', 'di-', 6);
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

        const finalServiceId = service_id || await nextId('seq_service', 'sv-', 5);
        await db.query(
            `INSERT INTO service (service_id, service_typeID, description, quantity, unit_quantity, default_price, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [finalServiceId, service_typeID || null, description || null, quantity || null, unit_quantity || null, default_price || null, unit || null]
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
// ==========================================
// BOOKING & ATTACHMENT ROUTES
// ==========================================
let isBookingTableInit = false;

async function initBookingTables() {
    if (isBookingTableInit) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                booking_id VARCHAR(50) PRIMARY KEY,
                booking_no VARCHAR(50) NOT NULL UNIQUE,
                customer_id VARCHAR(50),
                customer_name VARCHAR(255),
                pickup_date DATE,
                delivery_date DATE,
                car_id VARCHAR(50),
                truck_name VARCHAR(100),
                status VARCHAR(50) DEFAULT 'Pending',
                remark TEXT,
                cargo_details JSONB,
                sender_details JSONB,
                receiver_details JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cargo_details JSONB;`);
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sender_details JSONB;`);
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS receiver_details JSONB;`);

        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_attachments (
                attachment_id VARCHAR(50) PRIMARY KEY,
                booking_id VARCHAR(50) REFERENCES bookings(booking_id) ON DELETE CASCADE,
                file_name VARCHAR(255),
                original_name VARCHAR(255),
                file_path TEXT,
                file_type VARCHAR(100),
                file_size INT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const countRes = await db.query(`SELECT COUNT(*) FROM bookings`);
        if (parseInt(countRes.rows[0].count) === 0) {
            const defaultBookings = [
                {
                    booking_id: 'bk-1001',
                    booking_no: 'BK-20260805-3387',
                    customer_name: 'Bangkok Logistics Partners',
                    pickup_date: '2026-08-05',
                    delivery_date: '2026-08-16',
                    truck_name: '65-3456 (Trailer (20ft))',
                    status: 'Active'
                },
                {
                    booking_id: 'bk-1002',
                    booking_no: 'BK-20260723-4478',
                    customer_name: 'Thai Global Trading Co., Ltd.',
                    pickup_date: '2026-07-23',
                    delivery_date: '2026-07-25',
                    truck_name: '80-5678 (Trailer (40ft))',
                    status: 'Active'
                },
                {
                    booking_id: 'bk-1003',
                    booking_no: 'BK-20260723-003',
                    customer_name: 'Eastern Seaboard Manufacturing',
                    pickup_date: '2026-07-22',
                    delivery_date: '2026-07-23',
                    truck_name: '— Select truck —',
                    status: 'Pending'
                },
                {
                    booking_id: 'bk-1004',
                    booking_no: 'BK-20260723-002',
                    customer_name: 'Bangkok Logistics Partners',
                    pickup_date: '2026-07-24',
                    delivery_date: '2026-07-25',
                    truck_name: '80-5678 (Trailer (40ft))',
                    status: 'Active'
                },
                {
                    booking_id: 'bk-1005',
                    booking_no: 'BK-20260723-001',
                    customer_name: 'Thai Global Trading Co., Ltd.',
                    pickup_date: '2026-07-25',
                    delivery_date: '2026-07-26',
                    truck_name: '70-1234 (10-Wheeler)',
                    status: 'Active'
                },
                {
                    booking_id: 'bk-1006',
                    booking_no: 'BK-20260723-004',
                    customer_name: 'Thai Global Trading Co., Ltd.',
                    pickup_date: '2026-07-18',
                    delivery_date: '2026-07-19',
                    truck_name: '— Select truck —',
                    status: 'Pending'
                },
                {
                    booking_id: 'bk-1007',
                    booking_no: 'BK-20260723-005',
                    customer_name: 'Bangkok Logistics Partners',
                    pickup_date: '2026-07-28',
                    delivery_date: '2026-07-29',
                    truck_name: '— Select truck —',
                    status: 'Pending'
                }
            ];

            for (const item of defaultBookings) {
                await db.query(
                    `INSERT INTO bookings (booking_id, booking_no, customer_name, pickup_date, delivery_date, truck_name, status) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [item.booking_id, item.booking_no, item.customer_name, item.pickup_date, item.delivery_date, item.truck_name, item.status]
                );
            }

            await db.query(
                `INSERT INTO booking_attachments (attachment_id, booking_id, file_name, original_name, file_path, file_type, file_size) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                ['att-4478', 'bk-1002', 'DO_BK-20260723-4478.pdf', 'Delivery_Order_ThaiGlobal_4478.pdf', '/uploads/DO_BK-20260723-4478.pdf', 'application/pdf', 245000]
            );
        }

        isBookingTableInit = true;
    } catch (err) {
        console.error('Error initializing booking tables:', err.message);
    }
}

// GET ALL BOOKINGS WITH ATTACHMENTS
router.get('/bookings', async (req, res) => {
    try {
        await initBookingTables();
        const bookingsRes = await db.query(`
            SELECT b.*, 
              COALESCE(b.customer_name, c.customer_name) AS customer_name,
              ca.car_number, ca.car_type
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.customer_id
            LEFT JOIN cars ca ON b.car_id = ca.car_id
            ORDER BY b.created_at DESC, b.booking_id DESC
        `);
        const attachmentsRes = await db.query(`SELECT * FROM booking_attachments ORDER BY uploaded_at ASC`);

        const attachmentsMap = {};
        attachmentsRes.rows.forEach(att => {
            if (!attachmentsMap[att.booking_id]) attachmentsMap[att.booking_id] = [];
            attachmentsMap[att.booking_id].push(att);
        });

        const result = bookingsRes.rows.map(b => ({
            ...b,
            attachments: attachmentsMap[b.booking_id] || []
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE NEW BOOKING
router.post('/bookings', async (req, res) => {
    try {
        await initBookingTables();
        const { booking_no, customer_id, customer_name, pickup_date, delivery_date, car_id, truck_name, status, remark, cargo_details, sender_details, receiver_details } = req.body;
        const booking_id = 'bk-' + Date.now();
        const finalBookingNo = booking_no || `BK-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

        await db.query(
            `INSERT INTO bookings (booking_id, booking_no, customer_id, customer_name, pickup_date, delivery_date, car_id, truck_name, status, remark, cargo_details, sender_details, receiver_details) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                booking_id, 
                finalBookingNo, 
                customer_id || null, 
                customer_name || 'Unassigned Customer', 
                pickup_date || null, 
                delivery_date || null, 
                car_id || null, 
                truck_name || '— Select truck —', 
                status || 'Pending', 
                remark || null,
                cargo_details ? JSON.stringify(cargo_details) : null,
                sender_details ? JSON.stringify(sender_details) : null,
                receiver_details ? JSON.stringify(receiver_details) : null
            ]
        );

        res.json({ message: 'สร้าง Booking สำเร็จ', booking_id, booking_no: finalBookingNo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE BOOKING DETAILS OR TRUCK ASSIGNMENT
router.put('/bookings/:id', async (req, res) => {
    try {
        await initBookingTables();
        const { booking_no, customer_id, customer_name, pickup_date, delivery_date, car_id, truck_name, status, remark, cargo_details, sender_details, receiver_details } = req.body;
        
        await db.query(
            `UPDATE bookings SET 
                booking_no = COALESCE($1, booking_no),
                customer_id = COALESCE($2, customer_id),
                customer_name = COALESCE($3, customer_name),
                pickup_date = COALESCE($4, pickup_date),
                delivery_date = COALESCE($5, delivery_date),
                car_id = COALESCE($6, car_id),
                truck_name = COALESCE($7, truck_name),
                status = COALESCE($8, status),
                remark = COALESCE($9, remark),
                cargo_details = CASE WHEN $10::jsonb IS NOT NULL THEN $10::jsonb ELSE cargo_details END,
                sender_details = CASE WHEN $11::jsonb IS NOT NULL THEN $11::jsonb ELSE sender_details END,
                receiver_details = CASE WHEN $12::jsonb IS NOT NULL THEN $12::jsonb ELSE receiver_details END
             WHERE booking_id = $13`,
            [
                booking_no || null, 
                customer_id || null, 
                customer_name || null, 
                pickup_date || null, 
                delivery_date || null, 
                car_id || null, 
                truck_name || null, 
                status || null, 
                remark || null, 
                cargo_details ? JSON.stringify(cargo_details) : null,
                sender_details ? JSON.stringify(sender_details) : null,
                receiver_details ? JSON.stringify(receiver_details) : null,
                req.params.id
            ]
        );

        res.json({ message: 'แก้ไข Booking สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE BOOKING
router.delete('/bookings/:id', async (req, res) => {
    try {
        await initBookingTables();
        const atts = await db.query(`SELECT file_path FROM booking_attachments WHERE booking_id = $1`, [req.params.id]);
        atts.rows.forEach(att => {
            if (att.file_path) {
                const fullPath = path.join(__dirname, '..', att.file_path);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) {}
                }
            }
        });

        await db.query(`DELETE FROM booking_attachments WHERE booking_id = $1`, [req.params.id]);
        await db.query(`DELETE FROM bookings WHERE booking_id = $1`, [req.params.id]);
        res.json({ message: 'ลบ Booking และไฟล์แนบสำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPLOAD ATTACHMENT(S) FOR A BOOKING
router.post('/bookings/:id/attachments', upload.array('files', 10), async (req, res) => {
    try {
        await initBookingTables();
        const booking_id = req.params.id;
        const uploadedFiles = req.files || [];

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์ที่ต้องการแนบ' });
        }

        const savedAttachments = [];
        for (const file of uploadedFiles) {
            const attachment_id = 'att-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            const relativePath = '/uploads/' + file.filename;
            
            await db.query(
                `INSERT INTO booking_attachments (attachment_id, booking_id, file_name, original_name, file_path, file_type, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [attachment_id, booking_id, file.filename, file.originalname, relativePath, file.mimetype, file.size]
            );

            savedAttachments.push({
                attachment_id,
                booking_id,
                file_name: file.filename,
                original_name: file.originalname,
                file_path: relativePath,
                file_type: file.mimetype,
                file_size: file.size,
                uploaded_at: new Date()
            });
        }

        res.json({ message: 'แนบไฟล์สำเร็จ', attachments: savedAttachments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE ATTACHMENT
router.delete('/attachments/:id', async (req, res) => {
    try {
        await initBookingTables();
        const attRes = await db.query(`SELECT file_path FROM booking_attachments WHERE attachment_id = $1`, [req.params.id]);
        if (attRes.rows.length > 0 && attRes.rows[0].file_path) {
            const fullPath = path.join(__dirname, '..', attRes.rows[0].file_path);
            if (fs.existsSync(fullPath)) {
                try { fs.unlinkSync(fullPath); } catch (e) {}
            }
        }
        await db.query(`DELETE FROM booking_attachments WHERE attachment_id = $1`, [req.params.id]);
        res.json({ message: 'ลบไฟล์แนบเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
