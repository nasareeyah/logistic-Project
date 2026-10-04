const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');
const upload = require('../middlewares/upload');
const path = require('path');
const fs = require('fs');

let isBookingTableInit = false;

// Decode original filename from latin1/utf8 if it was corrupted by multipart parsers
const fixOriginalName = (name) => {
    if (!name) return '';
    try {
        if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/.test(name)) {
            const decoded = Buffer.from(name, 'latin1').toString('utf8');
            if (decoded && !decoded.includes('\ufffd')) return decoded;
        }
    } catch (e) {}
    return name;
};

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

async function resolveBookingService({ service_id, quotation_id, service_items, service_typename, pricing_mode }) {
    // 1. If Quotation mode or quotation_id is provided, prioritize service from quotation
    if (pricing_mode === 'quotation' || quotation_id) {
        if (service_id) {
            return service_id;
        }
        if (quotation_id) {
            const qRes = await db.query('SELECT service_id FROM document WHERE document_id = $1', [quotation_id]);
            if (qRes.rows[0]?.service_id) {
                return qRes.rows[0].service_id;
            }
        }
    }

    // 2. If service_id is already provided and exists in DB, use it
    if (service_id) {
        const checkSv = await db.query('SELECT service_id FROM service WHERE service_id = $1', [service_id]);
        if (checkSv.rows.length > 0) {
            return service_id;
        }
    }

    // 3. Custom pricing (or without quotation):
    // Flow: save to service_type -> get service_typeid -> save to service -> get service_id -> return service_id
    const firstItem = Array.isArray(service_items) && service_items.length > 0 ? service_items[0] : null;
    const rawName = (service_typename || firstItem?.description || '').trim();
    const candidateName = rawName || 'ค่าขนส่ง';

    // Step A: Check/Insert service_type
    let typeId;
    const stCheck = await db.query(
        'SELECT service_typeid FROM service_type WHERE LOWER(TRIM(service_typename)) = LOWER(TRIM($1)) LIMIT 1',
        [candidateName]
    );
    if (stCheck.rows.length > 0) {
        typeId = stCheck.rows[0].service_typeid;
    } else {
        typeId = await nextId('seq_service_type', 'st-', 5);
        await db.query(
            'INSERT INTO service_type (service_typeid, service_typename) VALUES ($1, $2)',
            [typeId, candidateName]
        );
    }

    // Step B: Check/Insert service
    let resolvedServiceId;
    const svCheck = await db.query(
        'SELECT service_id FROM service WHERE service_typeid = $1 LIMIT 1',
        [typeId]
    );

    const finalQty = firstItem?.quantity ? parseFloat(firstItem.quantity) : 1;
    const finalPrice = firstItem?.unit_price ? parseFloat(firstItem.unit_price) : 0;
    const finalUnit = firstItem?.unit || 'trip';

    if (svCheck.rows.length > 0) {
        resolvedServiceId = svCheck.rows[0].service_id;
    } else {
        resolvedServiceId = await nextId('seq_service', 'sv-', 5);
        await db.query(
            `INSERT INTO service (service_id, service_typeid, description, quantity, default_price, unit)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [resolvedServiceId, typeId, candidateName, finalQty, finalPrice, finalUnit]
        );
    }

    return resolvedServiceId;
}

async function saveBookingServiceItems(booking_id, primaryServiceId, service_items, pricing_mode) {
    if (!Array.isArray(service_items) || service_items.length === 0) return;
    try {
        await db.query('DELETE FROM booking_services WHERE booking_id = $1', [booking_id]);
        for (let i = 0; i < service_items.length; i++) {
            const item = service_items[i];
            if (!item.description && !item.unit_price) continue;

            // Resolve or create service_type -> service for each individual service item!
            let itemServiceId = null;
            if (pricing_mode === 'quotation' && i === 0 && primaryServiceId) {
                itemServiceId = primaryServiceId;
            } else {
                itemServiceId = await resolveBookingService({
                    service_id: null,
                    quotation_id: null,
                    service_items: [item],
                    service_typename: item.description,
                    pricing_mode: 'custom'
                });
            }

            const bsId = await nextId('seq_booking_services', 'bs-', 6);
            const qty = item.quantity ? parseFloat(item.quantity) : 1;
            const price = item.unit_price ? parseFloat(item.unit_price) : 0;
            const total = item.total ? parseFloat(item.total) : (qty * price);
            await db.query(
                `INSERT INTO booking_services (booking_service_id, booking_id, service_id, description, quantity, unit, unit_price, total_amount)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    bsId,
                    booking_id,
                    itemServiceId || primaryServiceId || null,
                    item.description || null,
                    qty,
                    item.unit || 'trip',
                    price,
                    total
                ]
            );
        }
    } catch (err) {
        console.error('Error saving booking_services:', err.message);
    }
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
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id VARCHAR(50);`);
        await db.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS quotation_id VARCHAR(50);`);
        await db.query(`ALTER TABLE service ADD COLUMN IF NOT EXISTS description TEXT;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking_cargo;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking_attachment;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_upload_filename;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_service_type START WITH 1;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_service START WITH 1;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking_services START WITH 1;`);
        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_services (
                booking_service_id VARCHAR(50) PRIMARY KEY,
                booking_id VARCHAR(50) REFERENCES bookings(booking_id) ON DELETE CASCADE,
                service_id VARCHAR(50),
                description VARCHAR(255),
                quantity NUMERIC,
                unit VARCHAR(50),
                unit_price NUMERIC,
                total_amount NUMERIC
            );
        `);
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
        await db.query(`ALTER TABLE booking_cargo ADD COLUMN IF NOT EXISTS inv_no VARCHAR(100);`);

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

        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_cust_attachment START WITH 1;`);
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_booking_dofile START WITH 1;`);

        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_customer_attachments (
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

        await db.query(`
            CREATE TABLE IF NOT EXISTS booking_do_files (
                do_file_id VARCHAR(50) PRIMARY KEY,
                booking_id VARCHAR(50) REFERENCES bookings(booking_id) ON DELETE CASCADE,
                file_name VARCHAR(255),
                original_name VARCHAR(255),
                file_path TEXT,
                file_type VARCHAR(100),
                file_size INT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Backward compatibility: keep booking_attachments table and migrate existing records
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

        // Auto-migrate any existing records into separate tables
        try {
            const oldAtts = await db.query(`SELECT * FROM booking_attachments`);
            for (const att of oldAtts.rows) {
                const cleaned = fixOriginalName(att.original_name);
                const isDo = (cleaned || '').toLowerCase().includes('do') || (att.file_name || '').toLowerCase().includes('do');
                if (isDo) {
                    await db.query(`
                        INSERT INTO booking_do_files (do_file_id, booking_id, file_name, original_name, file_path, file_type, file_size, uploaded_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (do_file_id) DO NOTHING
                    `, [att.attachment_id, att.booking_id, att.file_name, cleaned, att.file_path, att.file_type, att.file_size, att.uploaded_at]);
                } else {
                    await db.query(`
                        INSERT INTO booking_customer_attachments (attachment_id, booking_id, file_name, original_name, file_path, file_type, file_size, uploaded_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (attachment_id) DO NOTHING
                    `, [att.attachment_id, att.booking_id, att.file_name, cleaned, att.file_path, att.file_type, att.file_size, att.uploaded_at]);
                }
            }
        } catch (e) {
            // ignore
        }

        // Auto-link existing booking bk-00041 to service if null
        try {
            await db.query(`
                UPDATE bookings 
                SET service_id = 'sv-00022' 
                WHERE booking_id = 'bk-00041' AND service_id IS NULL
            `);
        } catch (e) {
            // ignore
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
              COALESCE(st.service_typename, s.description, '') AS service_name,
              st.service_typename,
              qd.document_no AS quotation_no,
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
            LEFT JOIN service s ON b.service_id = s.service_id
            LEFT JOIN service_type st ON s.service_typeid = st.service_typeid
            LEFT JOIN document qd ON b.quotation_id = qd.document_id
            LEFT JOIN consigner cgr ON b.consigner_id = cgr.consigner_id
            LEFT JOIN consignee cge ON b.consignee_id = cge.consignee_id
            ORDER BY b.created_at DESC, b.booking_id DESC
        `);
        const custAttsRes = await db.query(`SELECT * FROM booking_customer_attachments ORDER BY uploaded_at ASC`);
        const doFilesRes = await db.query(`SELECT * FROM booking_do_files ORDER BY uploaded_at ASC`);
        const cargoRes = await db.query(`SELECT * FROM booking_cargo`);
        const bookingServicesRes = await db.query(`SELECT * FROM booking_services ORDER BY booking_service_id ASC`);

        const custAttsMap = {};
        custAttsRes.rows.forEach(att => {
            if (!custAttsMap[att.booking_id]) custAttsMap[att.booking_id] = [];
            custAttsMap[att.booking_id].push({
                ...att,
                original_name: fixOriginalName(att.original_name)
            });
        });

        const doFilesMap = {};
        doFilesRes.rows.forEach(file => {
            if (!doFilesMap[file.booking_id]) doFilesMap[file.booking_id] = [];
            doFilesMap[file.booking_id].push({
                ...file,
                original_name: fixOriginalName(file.original_name)
            });
        });

        const cargoMap = {};
        cargoRes.rows.forEach(item => {
            if (!cargoMap[item.booking_id]) cargoMap[item.booking_id] = [];
            cargoMap[item.booking_id].push(item);
        });

        const bookingServicesMap = {};
        bookingServicesRes.rows.forEach(item => {
            if (!bookingServicesMap[item.booking_id]) bookingServicesMap[item.booking_id] = [];
            bookingServicesMap[item.booking_id].push({
                id: item.booking_service_id,
                description: item.description,
                quantity: parseFloat(item.quantity) || 1,
                unit: item.unit || 'trip',
                unit_price: parseFloat(item.unit_price) || 0,
                total: parseFloat(item.total_amount) || 0
            });
        });

        const result = bookingsRes.rows.map(b => {
            const pickupDateText = b.pickup_date ? new Date(b.pickup_date).toISOString().slice(0, 10) : '';
            const deliveryDateText = b.delivery_date ? new Date(b.delivery_date).toISOString().slice(0, 10) : '';
            const custAtts = custAttsMap[b.booking_id] || [];
            const doFiles = doFilesMap[b.booking_id] || [];
            const bServices = bookingServicesMap[b.booking_id] || [];
            const allServiceNames = bServices.map(s => s.description).filter(Boolean);
            const primaryServiceName = allServiceNames.length > 0 
                ? allServiceNames.join(', ')
                : (b.service_name || b.service_typename || '-');

            return {
                ...b,
                service_name: primaryServiceName,
                service_typename: primaryServiceName,
                service_items: bServices,
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
                customer_attachments: custAtts,
                do_files: doFiles,
                attachments: custAtts // backwards compatibility alias
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
        const { 
            booking_no, customer_id, customer_name, pickup_date, delivery_date, 
            car_id, truck_name, status, remark, service_id, quotation_id, 
            cargo_details, sender_details, receiver_details,
            service_items, service_typename, pricing_mode 
        } = req.body;
        
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

        // Resolve service ID:
        // If quotation mode, use service from quotation
        // If custom pricing mode (no quotation), create/link service_type -> service -> service_id
        const finalQuotationId = pricing_mode === 'quotation' ? (quotation_id || null) : null;
        const resolvedServiceId = await resolveBookingService({
            service_id,
            quotation_id: finalQuotationId,
            service_items,
            service_typename,
            pricing_mode
        });

        await db.query(
            `INSERT INTO bookings (booking_id, booking_no, customer_id, customer_name, pickup_date, delivery_date, car_id, truck_name, status, remark, consigner_id, consignee_id, service_id, quotation_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
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
                firstConsigneeId,
                resolvedServiceId || null,
                finalQuotationId
            ]
        );

        // Save service items to booking_services table
        if (Array.isArray(service_items) && service_items.length > 0) {
            await saveBookingServiceItems(booking_id, resolvedServiceId, service_items, pricing_mode);
        }

        // Save cargo details to booking_cargo table
        if (Array.isArray(cargo_details) && cargo_details.length > 0) {
            for (let i = 0; i < cargo_details.length; i++) {
                const item = cargo_details[i];
                const cId = await nextId('seq_booking_cargo', 'cg-', 6);
                await db.query(
                    `INSERT INTO booking_cargo (cargo_id, booking_id, inv_no, product_name, quantity, unit, weight, wt_unit, remark, load_from, destination, country) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        cId,
                        booking_id,
                        item.inv_no || null,
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

        res.json({ message: 'สร้าง Booking สำเร็จ', booking_id, booking_no: finalBookingNo, service_id: resolvedServiceId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE BOOKING DETAILS OR TRUCK ASSIGNMENT
router.put('/bookings/:id', async (req, res) => {
    try {
        await initBookingTables();
        const { 
            booking_no, customer_id, customer_name, pickup_date, delivery_date, 
            car_id, truck_name, status, remark, service_id, quotation_id, 
            cargo_details, sender_details, receiver_details,
            service_items, service_typename, pricing_mode 
        } = req.body;

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

        const finalQuotationId = pricing_mode === 'quotation' ? (quotation_id || null) : (pricing_mode === 'custom' ? null : (quotation_id !== undefined ? quotation_id : null));

        let resolvedServiceId = null;
        if (pricing_mode === 'quotation') {
            resolvedServiceId = await resolveBookingService({
                service_id,
                quotation_id: finalQuotationId,
                pricing_mode: 'quotation'
            });
        } else if (pricing_mode === 'custom' || (!finalQuotationId && (service_items || service_typename))) {
            resolvedServiceId = await resolveBookingService({
                service_id: null,
                quotation_id: null,
                service_items,
                service_typename,
                pricing_mode: 'custom'
            });
        } else if (service_id) {
            resolvedServiceId = service_id;
        }

        const hasCarId = req.body.hasOwnProperty('car_id');
        const hasServiceId = req.body.hasOwnProperty('service_id') || resolvedServiceId !== null;
        const hasQuotationId = req.body.hasOwnProperty('quotation_id') || req.body.hasOwnProperty('pricing_mode');

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
                consignee_id = COALESCE($11, consignee_id),
                service_id = CASE WHEN $14::boolean THEN $13 ELSE service_id END,
                quotation_id = CASE WHEN $16::boolean THEN $15 ELSE quotation_id END
             WHERE booking_id = $17`,
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
                resolvedServiceId || null,
                hasServiceId,
                finalQuotationId,
                hasQuotationId,
                req.params.id
            ]
        );

        // Update service items in booking_services table
        if (service_items !== undefined) {
            await saveBookingServiceItems(req.params.id, resolvedServiceId, service_items, pricing_mode);
        }

        // Update cargo details (delete old ones and insert new ones)
        if (cargo_details !== undefined) {
            await db.query(`DELETE FROM booking_cargo WHERE booking_id = $1`, [req.params.id]);
            if (Array.isArray(cargo_details) && cargo_details.length > 0) {
                for (let i = 0; i < cargo_details.length; i++) {
                    const item = cargo_details[i];
                    const cId = await nextId('seq_booking_cargo', 'cg-', 6);
                    await db.query(
                        `INSERT INTO booking_cargo (cargo_id, booking_id, inv_no, product_name, quantity, unit, weight, wt_unit, remark, load_from, destination, country) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                        [
                            cId,
                            req.params.id,
                            item.inv_no || null,
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

        res.json({ message: 'แก้ไข Booking สำเร็จ', service_id: resolvedServiceId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE BOOKING
router.delete('/bookings/:id', async (req, res) => {
    try {
        await initBookingTables();
        const bookingId = req.params.id;

        // Clean up files from customer attachments
        const custAtts = await db.query(`SELECT file_path FROM booking_customer_attachments WHERE booking_id = $1`, [bookingId]);
        custAtts.rows.forEach(att => {
            if (att.file_path) {
                const fullPath = path.join(__dirname, '..', att.file_path);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) { }
                }
            }
        });

        // Clean up files from DO files
        const doFiles = await db.query(`SELECT file_path FROM booking_do_files WHERE booking_id = $1`, [bookingId]);
        doFiles.rows.forEach(file => {
            if (file.file_path) {
                const fullPath = path.join(__dirname, '..', file.file_path);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) { }
                }
            }
        });

        await db.query(`DELETE FROM booking_customer_attachments WHERE booking_id = $1`, [bookingId]);
        await db.query(`DELETE FROM booking_do_files WHERE booking_id = $1`, [bookingId]);
        await db.query(`DELETE FROM booking_attachments WHERE booking_id = $1`, [bookingId]);
        await db.query('DELETE FROM bookings WHERE booking_id = $1', [bookingId]);

        res.json({ message: 'ลบ Booking สำเร็จ' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// 1. CUSTOMER ATTACHMENTS (เอกสารเพิ่มเติมจากลูกค้า)
// ----------------------------------------------------
router.post('/bookings/:id/customer-attachments', upload.array('files', 10), async (req, res) => {
    try {
        await initBookingTables();
        const booking_id = req.params.id;
        const uploadedFiles = req.files || [];

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์ที่ต้องการแนบ' });
        }

        const savedAttachments = [];
        for (const file of uploadedFiles) {
            const attachment_id = await nextId('seq_cust_attachment', 'catt-', 5);
            const relativePath = '/uploads/' + file.filename;
            const originalName = fixOriginalName(file.originalname);

            await db.query(
                `INSERT INTO booking_customer_attachments (attachment_id, booking_id, file_name, original_name, file_path, file_type, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [attachment_id, booking_id, file.filename, originalName, relativePath, file.mimetype, file.size]
            );

            savedAttachments.push({
                attachment_id,
                booking_id,
                file_name: file.filename,
                original_name: originalName,
                file_path: relativePath,
                file_type: file.mimetype,
                file_size: file.size,
                uploaded_at: new Date()
            });
        }

        res.json({ message: 'แนบเอกสารลูกค้าสำเร็จ', attachments: savedAttachments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/customer-attachments/:id', async (req, res) => {
    try {
        await initBookingTables();
        const attRes = await db.query(`SELECT file_path FROM booking_customer_attachments WHERE attachment_id = $1`, [req.params.id]);
        if (attRes.rows.length > 0 && attRes.rows[0].file_path) {
            const fullPath = path.join(__dirname, '..', attRes.rows[0].file_path);
            if (fs.existsSync(fullPath)) {
                try { fs.unlinkSync(fullPath); } catch (e) { }
            }
        }
        await db.query(`DELETE FROM booking_customer_attachments WHERE attachment_id = $1`, [req.params.id]);
        res.json({ message: 'ลบเอกสารลูกค้าเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// 2. COMPLETED DO FILES (เอกสารใบ DO เมื่องานเสร็จสิ้น)
// ----------------------------------------------------
router.post('/bookings/:id/do-files', upload.array('files', 10), async (req, res) => {
    try {
        await initBookingTables();
        const booking_id = req.params.id;
        const uploadedFiles = req.files || [];

        if (uploadedFiles.length === 0) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์ DO ที่ต้องการแนบ' });
        }

        const savedDoFiles = [];
        for (const file of uploadedFiles) {
            const do_file_id = await nextId('seq_booking_dofile', 'dof-', 5);
            const relativePath = '/uploads/' + file.filename;
            const originalName = fixOriginalName(file.originalname);

            await db.query(
                `INSERT INTO booking_do_files (do_file_id, booking_id, file_name, original_name, file_path, file_type, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [do_file_id, booking_id, file.filename, originalName, relativePath, file.mimetype, file.size]
            );

            savedDoFiles.push({
                do_file_id,
                booking_id,
                file_name: file.filename,
                original_name: originalName,
                file_path: relativePath,
                file_type: file.mimetype,
                file_size: file.size,
                uploaded_at: new Date()
            });
        }

        res.json({ message: 'แนบไฟล์ DO ปิดงานสำเร็จ', do_files: savedDoFiles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/do-files/:id', async (req, res) => {
    try {
        await initBookingTables();
        const fileRes = await db.query(`SELECT file_path FROM booking_do_files WHERE do_file_id = $1`, [req.params.id]);
        if (fileRes.rows.length > 0 && fileRes.rows[0].file_path) {
            const fullPath = path.join(__dirname, '..', fileRes.rows[0].file_path);
            if (fs.existsSync(fullPath)) {
                try { fs.unlinkSync(fullPath); } catch (e) { }
            }
        }
        await db.query(`DELETE FROM booking_do_files WHERE do_file_id = $1`, [req.params.id]);
        res.json({ message: 'ลบไฟล์ DO เรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Backward compatibility endpoints for generic attachments
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
            const attachment_id = await nextId('seq_cust_attachment', 'catt-', 5);
            const relativePath = '/uploads/' + file.filename;
            const originalName = fixOriginalName(file.originalname);

            await db.query(
                `INSERT INTO booking_customer_attachments (attachment_id, booking_id, file_name, original_name, file_path, file_type, file_size)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [attachment_id, booking_id, file.filename, originalName, relativePath, file.mimetype, file.size]
            );

            savedAttachments.push({
                attachment_id,
                booking_id,
                file_name: file.filename,
                original_name: originalName,
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

router.delete('/attachments/:id', async (req, res) => {
    try {
        await initBookingTables();
        const attId = req.params.id;

        // Try deleting from customer attachments
        const custRes = await db.query(`SELECT file_path FROM booking_customer_attachments WHERE attachment_id = $1`, [attId]);
        if (custRes.rows.length > 0) {
            if (custRes.rows[0].file_path) {
                const fullPath = path.join(__dirname, '..', custRes.rows[0].file_path);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) { }
                }
            }
            await db.query(`DELETE FROM booking_customer_attachments WHERE attachment_id = $1`, [attId]);
            return res.json({ message: 'ลบไฟล์แนบเรียบร้อย' });
        }

        // Try deleting from DO files
        const doRes = await db.query(`SELECT file_path FROM booking_do_files WHERE do_file_id = $1`, [attId]);
        if (doRes.rows.length > 0) {
            if (doRes.rows[0].file_path) {
                const fullPath = path.join(__dirname, '..', doRes.rows[0].file_path);
                if (fs.existsSync(fullPath)) {
                    try { fs.unlinkSync(fullPath); } catch (e) { }
                }
            }
            await db.query(`DELETE FROM booking_do_files WHERE do_file_id = $1`, [attId]);
            return res.json({ message: 'ลบไฟล์แนบเรียบร้อย' });
        }

        res.json({ message: 'ลบไฟล์แนบเรียบร้อย' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Initial database tables setup on startup
initBookingTables();

module.exports = router;
