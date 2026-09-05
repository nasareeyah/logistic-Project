const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');
const upload = require('../middlewares/upload');
const path = require('path');
const fs = require('fs');

let isBookingTableInit = false;

async function saveConsignerFromBooking(sender) {
    if (!sender) return null;
    const consigner_name = sender.company_name || null;
    const address_line = sender.address_line || null;
    const city = sender.city || null;
    const state = sender.state || sender.province || null;
    const province = sender.province || sender.state || null;
    const postal_code = sender.postal_code || null;
    const country = sender.country || 'Thailand';

    if (!address_line && !consigner_name) return null;

    let existing;
    if (address_line) {
        existing = await db.query(
            'SELECT consigner_id FROM consigner WHERE address_line = $1 AND (city = $2 OR city IS NULL) LIMIT 1',
            [address_line, city]
        );
    } else if (consigner_name) {
        existing = await db.query('SELECT consigner_id FROM consigner WHERE consigner_name = $1 LIMIT 1', [consigner_name]);
    } else {
        existing = { rows: [] };
    }

    if (existing.rows.length > 0) {
        const existId = existing.rows[0].consigner_id;
        if (address_line || city || state || postal_code) {
            await db.query(
                `UPDATE consigner SET
                    consigner_name = COALESCE(NULLIF($1, ''), consigner_name),
                    address_line = COALESCE(NULLIF($2, ''), address_line),
                    city = COALESCE(NULLIF($3, ''), city),
                    state = COALESCE(NULLIF($4, ''), state),
                    province = COALESCE(NULLIF($5, ''), province),
                    postal_code = COALESCE(NULLIF($6, ''), postal_code),
                    country = COALESCE(NULLIF($7, ''), country)
                WHERE consigner_id = $8`,
                [consigner_name, address_line, city, state, province, postal_code, country, existId]
            );
        }
        return existId;
    }

    const finalId = await nextId('seq_consigner', 'cgr-', 5);
    await db.query(
        `INSERT INTO consigner (
            consigner_id, consigner_name, address_line, city, state, province, postal_code, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [finalId, consigner_name, address_line, city, state, province, postal_code, country]
    );
    return finalId;
}

async function saveConsigneeFromBooking(receiver) {
    if (!receiver) return null;
    const consignee_name = receiver.company_name || null;
    const address_line = receiver.address_line || null;
    const city = receiver.city || null;
    const state = receiver.state || receiver.province || null;
    const province = receiver.province || receiver.state || null;
    const postal_code = receiver.postal_code || null;
    const country = receiver.country || 'Thailand';

    if (!address_line && !consignee_name) return null;

    let existing;
    if (address_line) {
        existing = await db.query(
            'SELECT consignee_id FROM consignee WHERE address_line = $1 AND (city = $2 OR city IS NULL) LIMIT 1',
            [address_line, city]
        );
    } else if (consignee_name) {
        existing = await db.query('SELECT consignee_id FROM consignee WHERE consignee_name = $1 LIMIT 1', [consignee_name]);
    } else {
        existing = { rows: [] };
    }

    if (existing.rows.length > 0) {
        const existId = existing.rows[0].consignee_id;
        if (address_line || city || state || postal_code) {
            await db.query(
                `UPDATE consignee SET
                    consignee_name = COALESCE(NULLIF($1, ''), consignee_name),
                    address_line = COALESCE(NULLIF($2, ''), address_line),
                    city = COALESCE(NULLIF($3, ''), city),
                    state = COALESCE(NULLIF($4, ''), state),
                    province = COALESCE(NULLIF($5, ''), province),
                    postal_code = COALESCE(NULLIF($6, ''), postal_code),
                    country = COALESCE(NULLIF($7, ''), country)
                WHERE consignee_id = $8`,
                [consignee_name, address_line, city, state, province, postal_code, country, existId]
            );
        }
        return existId;
    }

    const finalId = await nextId('seq_consignee', 'cge-', 5);
    await db.query(
        `INSERT INTO consignee (
            consignee_id, consignee_name, address_line, city, state, province, postal_code, country
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [finalId, consignee_name, address_line, city, state, province, postal_code, country]
    );
    return finalId;
}

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consigner_id VARCHAR(50);`);
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS consignee_id VARCHAR(50);`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking_cargo;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking_attachment;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_upload_filename;`);
        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_cargo (
                cargo_id VARCHAR(50) PRIMARY KEY,
                booking_id VARCHAR(50) REFERENCES bookings(booking_id) ON DELETE CASCADE,
                product_name VARCHAR(255),
                quantity NUMERIC,
                unit VARCHAR(50),
                weight NUMERIC,
                wt_unit VARCHAR(50),
                remark TEXT,
                load_from VARCHAR(255),
                destination VARCHAR(255),
                country VARCHAR(100)
            );
        `);
        await db.query(`ALTER TABLE booking_cargo ADD COLUMN IF NOT EXISTS load_from VARCHAR(255);`);
        await db.query(`ALTER TABLE booking_cargo ADD COLUMN IF NOT EXISTS destination VARCHAR(255);`);
        await db.query(`ALTER TABLE booking_cargo ADD COLUMN IF NOT EXISTS country VARCHAR(100);`);

        await db.query(`ALTER TABLE consigner ADD COLUMN IF NOT EXISTS address_line VARCHAR(255);`);
        await db.query(`ALTER TABLE consigner ADD COLUMN IF NOT EXISTS city VARCHAR(100);`);
        await db.query(`ALTER TABLE consigner ADD COLUMN IF NOT EXISTS state VARCHAR(100);`);
        await db.query(`ALTER TABLE consigner ADD COLUMN IF NOT EXISTS province VARCHAR(100);`);
        await db.query(`ALTER TABLE consigner ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);`);
        await db.query(`ALTER TABLE consigner ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Thailand';`);

        await db.query(`ALTER TABLE consignee ADD COLUMN IF NOT EXISTS address_line VARCHAR(255);`);
        await db.query(`ALTER TABLE consignee ADD COLUMN IF NOT EXISTS city VARCHAR(100);`);
        await db.query(`ALTER TABLE consignee ADD COLUMN IF NOT EXISTS state VARCHAR(100);`);
        await db.query(`ALTER TABLE consignee ADD COLUMN IF NOT EXISTS province VARCHAR(100);`);
        await db.query(`ALTER TABLE consignee ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);`);
        await db.query(`ALTER TABLE consignee ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Thailand';`);

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
              cgr.consigner_name,
              cgr.address_line AS consigner_address,
              cgr.address_line AS consigner_address_line,
              cgr.city AS consigner_city,
              cgr.state AS consigner_state,
              cgr.province AS consigner_province,
              cgr.postal_code AS consigner_postal_code,
              cgr.country AS consigner_country,
              cge.consignee_name,
              cge.address_line AS consignee_address,
              cge.address_line AS consignee_address_line,
              cge.city AS consignee_city,
              cge.state AS consignee_state,
              cge.province AS consignee_province,
              cge.postal_code AS consignee_postal_code,
              cge.country AS consignee_country,
              COALESCE(b.customer_name, c.customer_name) AS customer_name,
              ca.car_number, ca.car_type
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.customer_id
            LEFT JOIN cars ca ON b.car_id = ca.car_id
            LEFT JOIN consigner cgr ON b.consigner_id = cgr.consigner_id
            LEFT JOIN consignee cge ON b.consignee_id = cge.consignee_id
            ORDER BY b.created_at DESC, b.booking_id DESC
        `);
        const attachmentsRes = await db.query(`SELECT * FROM booking_attachments ORDER BY uploaded_at ASC`);
        const cargoRes = await db.query(`SELECT * FROM booking_cargo`);

        const attachmentsMap = {};
        attachmentsRes.rows.forEach(att => {
            if (!attachmentsMap[att.booking_id]) attachmentsMap[att.booking_id] = [];
            attachmentsMap[att.booking_id].push(att);
        });

        const cargoMap = {};
        cargoRes.rows.forEach(item => {
            if (!cargoMap[item.booking_id]) cargoMap[item.booking_id] = [];
            cargoMap[item.booking_id].push(item);
        });

        const result = bookingsRes.rows.map(b => {
            const pickupDateText = b.pickup_date ? new Date(b.pickup_date).toISOString().slice(0, 10) : '';
            const deliveryDateText = b.delivery_date ? new Date(b.delivery_date).toISOString().slice(0, 10) : '';
            return {
                ...b,
                sender_details: b.consigner_id ? [{
                    company_name: b.consigner_name,
                    address_line: b.consigner_address_line || b.consigner_address || '',
                    city: b.consigner_city || '',
                    state: b.consigner_state || b.consigner_province || '',
                    province: b.consigner_province || b.consigner_state || '',
                    postal_code: b.consigner_postal_code || '',
                    country: b.consigner_country || 'Thailand',
                    pickup_date: pickupDateText
                }] : [],
                receiver_details: b.consignee_id ? [{
                    company_name: b.consignee_name,
                    address_line: b.consignee_address_line || b.consignee_address || '',
                    city: b.consignee_city || '',
                    state: b.consignee_state || b.consignee_province || '',
                    province: b.consignee_province || b.consignee_state || '',
                    postal_code: b.consignee_postal_code || '',
                    country: b.consignee_country || 'Thailand',
                    delivery_date: deliveryDateText
                }] : [],
                cargo_details: cargoMap[b.booking_id] || [],
                attachments: attachmentsMap[b.booking_id] || []
            };
        });

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
        
        const booking_id = await nextId('seq_booking', 'bk-', 5);
        
        // Generate daily resetting booking number (BK-YYYYMMDD-XXXX)
        let finalBookingNo = booking_no;
        if (!finalBookingNo) {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, ''); // e.g. "20260827"
            const prefix = `BK-${todayStr}-`;
            const lastBookingRes = await db.query(
                `SELECT booking_no FROM bookings WHERE booking_no LIKE $1 ORDER BY booking_no DESC LIMIT 1`,
                [`${prefix}%`]
            );
            
            let nextNumber = 1;
            if (lastBookingRes.rows.length > 0) {
                const lastNo = lastBookingRes.rows[0].booking_no;
                const parts = lastNo.split('-');
                const lastSeqStr = parts[parts.length - 1]; // e.g. "0001"
                const lastSeq = parseInt(lastSeqStr, 10);
                if (!isNaN(lastSeq)) {
                    nextNumber = lastSeq + 1;
                }
            }
            finalBookingNo = `${prefix}${String(nextNumber).padStart(4, '0')}`;
        }

        // Save senders to consigner table and get the first one's ID
        let firstConsignerId = null;
        if (Array.isArray(sender_details) && sender_details.length > 0) {
            for (let i = 0; i < sender_details.length; i++) {
                const sId = await saveConsignerFromBooking(sender_details[i]);
                if (i === 0) firstConsignerId = sId;
            }
        } else if (sender_details && typeof sender_details === 'object') {
            firstConsignerId = await saveConsignerFromBooking(sender_details);
        }

        // Save receivers to consignee table and get the first one's ID
        let firstConsigneeId = null;
        if (Array.isArray(receiver_details) && receiver_details.length > 0) {
            for (let i = 0; i < receiver_details.length; i++) {
                const rId = await saveConsigneeFromBooking(receiver_details[i]);
                if (i === 0) firstConsigneeId = rId;
            }
        } else if (receiver_details && typeof receiver_details === 'object') {
            firstConsigneeId = await saveConsigneeFromBooking(receiver_details);
        }

        await db.query(
            `INSERT INTO bookings (booking_id, booking_no, customer_id, customer_name, pickup_date, delivery_date, car_id, truck_name, status, remark, consigner_id, consignee_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
                firstConsignerId,
                firstConsigneeId
            ]
        );

        // Save cargo details to booking_cargo table
        if (Array.isArray(cargo_details) && cargo_details.length > 0) {
            for (let i = 0; i < cargo_details.length; i++) {
                const item = cargo_details[i];
                const cId = await nextId('seq_booking_cargo', 'cg-', 6);
                await db.query(
                    `INSERT INTO booking_cargo (cargo_id, booking_id, product_name, quantity, unit, weight, wt_unit, remark, load_from, destination, country) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        cId,
                        booking_id,
                        item.product_name || null,
                        item.quantity ? parseFloat(item.quantity) : null,
                        item.unit || null,
                        item.weight ? parseFloat(item.weight) : null,
                        item.wt_unit || null,
                        item.remark || null,
                        item.load_from || null,
                        item.destination || null,
                        item.country || null
                    ]
                );
            }
        }

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

        // Save senders to consigner table and get the first one's ID
        let firstConsignerId = null;
        if (Array.isArray(sender_details) && sender_details.length > 0) {
            for (let i = 0; i < sender_details.length; i++) {
                const sId = await saveConsignerFromBooking(sender_details[i]);
                if (i === 0) firstConsignerId = sId;
            }
        } else if (sender_details && typeof sender_details === 'object') {
            firstConsignerId = await saveConsignerFromBooking(sender_details);
        }

        // Save receivers to consignee table and get the first one's ID
        let firstConsigneeId = null;
        if (Array.isArray(receiver_details) && receiver_details.length > 0) {
            for (let i = 0; i < receiver_details.length; i++) {
                const rId = await saveConsigneeFromBooking(receiver_details[i]);
                if (i === 0) firstConsigneeId = rId;
            }
        } else if (receiver_details && typeof receiver_details === 'object') {
            firstConsigneeId = await saveConsigneeFromBooking(receiver_details);
        }

        const hasCarId = req.body.hasOwnProperty('car_id');

        await db.query(
            `UPDATE bookings SET 
                booking_no = COALESCE(NULLIF($1, ''), booking_no),
                customer_id = COALESCE(NULLIF($2, ''), customer_id),
                customer_name = COALESCE(NULLIF($3, ''), customer_name),
                pickup_date = COALESCE(NULLIF($4, '')::date, pickup_date),
                delivery_date = COALESCE(NULLIF($5, '')::date, delivery_date),
                car_id = CASE WHEN $12::boolean THEN NULLIF($6, '') ELSE car_id END,
                truck_name = COALESCE(NULLIF($7, ''), truck_name),
                status = COALESCE(NULLIF($8, ''), status),
                remark = COALESCE(NULLIF($9, ''), remark),
                consigner_id = COALESCE($10, consigner_id),
                consignee_id = COALESCE($11, consignee_id)
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
                firstConsignerId,
                firstConsigneeId,
                hasCarId,
                req.params.id
            ]
        );

        // Update cargo details (delete old ones and insert new ones)
        if (cargo_details !== undefined) {
            await db.query(`DELETE FROM booking_cargo WHERE booking_id = $1`, [req.params.id]);
            if (Array.isArray(cargo_details) && cargo_details.length > 0) {
                for (let i = 0; i < cargo_details.length; i++) {
                    const item = cargo_details[i];
                    const cId = await nextId('seq_booking_cargo', 'cg-', 6);
                    await db.query(
                        `INSERT INTO booking_cargo (cargo_id, booking_id, product_name, quantity, unit, weight, wt_unit, remark, load_from, destination, country) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                        [
                            cId,
                            req.params.id,
                            item.product_name || null,
                            item.quantity ? parseFloat(item.quantity) : null,
                            item.unit || null,
                            item.weight ? parseFloat(item.weight) : null,
                            item.wt_unit || null,
                            item.remark || null,
                            item.load_from || null,
                            item.destination || null,
                            item.country || null
                        ]
                    );
                }
            }
        }

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
                    try { fs.unlinkSync(fullPath); } catch (e) { }
                }
            }
        });
        await db.query(`DELETE FROM booking_attachments WHERE booking_id = $1`, [req.params.id]);
        await db.query('DELETE FROM bookings WHERE booking_id = $1', [req.params.id]);
        res.json({ message: 'ลบ Booking สำเร็จ' });
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
            const attachment_id = await nextId('seq_booking_attachment', 'att-', 5);
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
                try { fs.unlinkSync(fullPath); } catch (e) { }
            }
        }
        await db.query(`DELETE FROM booking_attachments WHERE attachment_id = $1`, [req.params.id]);
        res.json({ message: 'ลบไฟล์แนบเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initial database tables setup on startup
initBookingTables();

module.exports = router;
