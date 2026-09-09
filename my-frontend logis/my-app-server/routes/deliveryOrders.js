const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

let isTableInitialized = false;

async function initDeliveryOrdersTable() {
    if (isTableInitialized) return;
    try {
        await db.query(`CREATE SEQUENCE IF NOT EXISTS seq_delivery_order;`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS do_no VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS cargo_id VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS consigner_id VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS consignee_id VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS car_id VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS driver_id VARCHAR(50);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS date_of_load DATE;`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS eta DATE;`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100);`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS remark TEXT;`);
        await db.query(`ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

        isTableInitialized = true;
    } catch (err) {
        console.error('Error initializing delivery_orders table:', err);
    }
}

// Helper query to fetch a DO with joined cargo, consigner, consignee, car, and driver data
const DO_SELECT_QUERY = `
    SELECT 
        d.*,
        d.delivery_orders_id AS do_id,
        -- Cargo details from booking_cargo
        COALESCE(bc.inv_no, '') AS invoice_no,
        bc.product_name,
        bc.quantity,
        bc.unit,
        bc.weight,
        bc.wt_unit,
        bc.load_from,
        bc.destination,
        bc.remark AS cargo_remark,
        -- Consigner details from consigner
        cgr.consigner_name,
        cgr.consigner_name AS consignor_name,
        cgr.address_line AS consigner_address,
        cgr.address_line AS consigner_address_line,
        cgr.address_line AS consignor_address,
        cgr.city AS consigner_city,
        cgr.city AS consignor_city,
        COALESCE(cgr.state, cgr.province) AS consigner_state,
        COALESCE(cgr.state, cgr.province) AS consignor_state,
        cgr.postal_code AS consigner_postal_code,
        cgr.postal_code AS consignor_postal_code,
        cgr.country AS consigner_country,
        cgr.country AS consignor_country,
        -- Consignee details from consignee
        cge.consignee_name,
        cge.address_line AS consignee_address,
        cge.address_line AS consignee_address_line,
        cge.city AS consignee_city,
        COALESCE(cge.state, cge.province) AS consignee_state,
        cge.postal_code AS consignee_postal_code,
        cge.country AS consignee_country,
        -- Truck details from cars
        c.car_number AS truck_number,
        c.car_type,
        -- Dates synced with booking
        COALESCE(bk.pickup_date, d.date_of_load) AS date_of_load,
        COALESCE(bk.delivery_date, d.eta) AS eta,
        -- Driver details from driver
        dr.full_name AS driver_name,
        dr.phone AS driver_phone
    FROM delivery_orders d
    LEFT JOIN bookings bk ON d.booking_id = bk.booking_id
    LEFT JOIN booking_cargo bc ON d.cargo_id = bc.cargo_id
    LEFT JOIN consigner cgr ON d.consigner_id = cgr.consigner_id
    LEFT JOIN consignee cge ON d.consignee_id = cge.consignee_id
    LEFT JOIN cars c ON d.car_id = c.car_id
    LEFT JOIN driver dr ON d.driver_id = dr.driver_id
`;

// GET next available DO number for today (DO-YYYYMMDD-XXXX)
router.get('/delivery-orders/next-no', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, '');
        const prefix = `DO-${todayStr}-`;
        const lastDoRes = await db.query(
            `SELECT do_no FROM delivery_orders WHERE do_no LIKE $1 ORDER BY do_no DESC LIMIT 1`,
            [`${prefix}%`]
        );
        let nextNumber = 1;
        if (lastDoRes.rows.length > 0) {
            const lastNo = lastDoRes.rows[0].do_no;
            const parts = lastNo.split('-');
            const lastSeqStr = parts[parts.length - 1];
            const lastSeq = parseInt(lastSeqStr, 10);
            if (!isNaN(lastSeq)) {
                nextNumber = lastSeq + 1;
            }
        }
        const nextDoNo = `${prefix}${String(nextNumber).padStart(4, '0')}`;
        res.json({ next_do_no: nextDoNo });
    } catch (err) {
        console.error('Error getting next DO number:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET all delivery orders
router.get('/delivery-orders', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const result = await db.query(
            `${DO_SELECT_QUERY} ORDER BY d.created_at DESC, d.delivery_orders_id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching delivery orders:', err);
        res.status(500).json({ error: err.message });
    }
});

// CREATE delivery order
router.post('/delivery-orders', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const {
            delivery_orders_id,
            do_id,
            do_no,
            booking_id,
            cargo_id,
            consigner_id,
            consignee_id,
            car_id,
            driver_id,
            customer_name,
            date_of_load,
            eta,
            warehouse,
            remark,
            goods_items
        } = req.body;

        let finalDoNo = do_no;
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }).replace(/-/g, '');
        const prefix = `DO-${todayStr}-`;

        // If no do_no or if do_no is not matching today's prefix, or already exists, generate sequential number
        let shouldGenerateSeq = !finalDoNo || !finalDoNo.startsWith(prefix);
        if (finalDoNo) {
            const existingCheck = await db.query(
                `SELECT 1 FROM delivery_orders WHERE do_no = $1`,
                [finalDoNo]
            );
            if (existingCheck.rows.length > 0) {
                shouldGenerateSeq = true;
            }
        }

        if (shouldGenerateSeq) {
            const lastDoRes = await db.query(
                `SELECT do_no FROM delivery_orders WHERE do_no LIKE $1 ORDER BY do_no DESC LIMIT 1`,
                [`${prefix}%`]
            );
            let nextNumber = 1;
            if (lastDoRes.rows.length > 0) {
                const lastNo = lastDoRes.rows[0].do_no;
                const parts = lastNo.split('-');
                const lastSeqStr = parts[parts.length - 1];
                const lastSeq = parseInt(lastSeqStr, 10);
                if (!isNaN(lastSeq)) {
                    nextNumber = lastSeq + 1;
                }
            }
            finalDoNo = `${prefix}${String(nextNumber).padStart(4, '0')}`;
        }

        const finalId = delivery_orders_id || do_id || await nextId('seq_delivery_order', 'do-', 5);

        let resolvedCargoId = cargo_id || null;
        let resolvedConsignerId = consigner_id || null;
        let resolvedConsigneeId = consignee_id || null;
        let resolvedCarId = car_id || null;
        let resolvedDriverId = driver_id || null;
        let resolvedDateOfLoad = date_of_load ? date_of_load : null;
        let resolvedEta = eta ? eta : null;

        // Auto-resolve missing IDs and dates from booking if booking_id is provided
        if (booking_id) {
            const bkRes = await db.query(
                `SELECT consigner_id, consignee_id, car_id, truck_name, pickup_date, delivery_date FROM bookings WHERE booking_id = $1`,
                [booking_id]
            );
            if (bkRes.rows.length > 0) {
                if (!resolvedConsignerId) resolvedConsignerId = bkRes.rows[0].consigner_id;
                if (!resolvedConsigneeId) resolvedConsigneeId = bkRes.rows[0].consignee_id;
                if (!resolvedCarId && bkRes.rows[0].car_id) resolvedCarId = bkRes.rows[0].car_id;
                if (!resolvedCarId && bkRes.rows[0].truck_name) {
                    const matchedCar = await db.query(
                        `SELECT car_id FROM cars WHERE car_number = $1 LIMIT 1`,
                        [bkRes.rows[0].truck_name]
                    );
                    if (matchedCar.rows.length > 0) {
                        resolvedCarId = matchedCar.rows[0].car_id;
                    }
                }
                if (!resolvedDateOfLoad && bkRes.rows[0].pickup_date) {
                    resolvedDateOfLoad = bkRes.rows[0].pickup_date;
                }
                if (!resolvedEta && bkRes.rows[0].delivery_date) {
                    resolvedEta = bkRes.rows[0].delivery_date;
                }
            }
            if (!resolvedCargoId) {
                const cgRes = await db.query(
                    `SELECT cargo_id FROM booking_cargo WHERE booking_id = $1 ORDER BY cargo_id ASC LIMIT 1`,
                    [booking_id]
                );
                if (cgRes.rows.length > 0) {
                    resolvedCargoId = cgRes.rows[0].cargo_id;
                }
            }
        }

        // Auto-resolve driver_id from car if car is set but driver_id is not
        if (resolvedCarId && !resolvedDriverId) {
            const carRes = await db.query(
                `SELECT assigned_driver_id FROM cars WHERE car_id = $1`,
                [resolvedCarId]
            );
            if (carRes.rows.length > 0 && carRes.rows[0].assigned_driver_id) {
                resolvedDriverId = carRes.rows[0].assigned_driver_id;
            }
        }

        // Sync edited goods_items back to booking_cargo if cargo_id is resolved
        if (resolvedCargoId && Array.isArray(goods_items) && goods_items.length > 0) {
            const firstGood = goods_items[0];
            const pName = firstGood.description !== undefined ? firstGood.description : null;
            const pQty = firstGood.quantity !== undefined && firstGood.quantity !== '' ? parseFloat(firstGood.quantity) : null;
            const pLoadFrom = firstGood.load_from !== undefined ? firstGood.load_from : null;
            const pDestination = firstGood.destination !== undefined ? firstGood.destination : null;

            await db.query(
                `UPDATE booking_cargo SET
                    product_name = COALESCE($1, product_name),
                    quantity = COALESCE($2, quantity),
                    load_from = COALESCE($3, load_from),
                    destination = COALESCE($4, destination)
                 WHERE cargo_id = $5`,
                [pName, pQty, pLoadFrom, pDestination, resolvedCargoId]
            );
        }

        await db.query(
            `INSERT INTO delivery_orders (
                delivery_orders_id,
                booking_id,
                cargo_id,
                consigner_id,
                consignee_id,
                car_id,
                driver_id,
                do_no,
                customer_name,
                date_of_load,
                eta,
                warehouse,
                remark
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                $11, $12, $13
            )`,
            [
                finalId,
                booking_id || null,
                resolvedCargoId,
                resolvedConsignerId,
                resolvedConsigneeId,
                resolvedCarId,
                resolvedDriverId,
                finalDoNo,
                customer_name || 'Unassigned Customer',
                resolvedDateOfLoad,
                resolvedEta,
                warehouse || null,
                remark || null
            ]
        );

        const fullRes = await db.query(
            `${DO_SELECT_QUERY} WHERE d.delivery_orders_id = $1`,
            [finalId]
        );

        res.status(201).json({
            message: 'สร้างเอกสาร Delivery Order สำเร็จ',
            data: fullRes.rows[0],
            do_id: finalId,
            delivery_orders_id: finalId,
            do_no: finalDoNo,
            cargo_id: resolvedCargoId,
            consigner_id: resolvedConsignerId,
            consignee_id: resolvedConsigneeId,
            car_id: resolvedCarId,
            driver_id: resolvedDriverId
        });
    } catch (err) {
        console.error('Error creating delivery order:', err);
        res.status(500).json({ error: err.message });
    }
});

// UPDATE delivery order
router.put('/delivery-orders/:id', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const { id } = req.params;
        const {
            booking_id,
            cargo_id,
            consigner_id,
            consignee_id,
            car_id,
            driver_id,
            customer_name,
            date_of_load,
            eta,
            warehouse,
            remark,
            goods_items
        } = req.body;

        await db.query(
            `UPDATE delivery_orders SET
                booking_id = COALESCE($1, booking_id),
                cargo_id = COALESCE($2, cargo_id),
                consigner_id = COALESCE($3, consigner_id),
                consignee_id = COALESCE($4, consignee_id),
                car_id = COALESCE($5, car_id),
                driver_id = COALESCE($6, driver_id),
                customer_name = COALESCE($7, customer_name),
                date_of_load = COALESCE($8, date_of_load),
                eta = COALESCE($9, eta),
                warehouse = COALESCE($10, warehouse),
                remark = COALESCE($11, remark)
             WHERE delivery_orders_id = $12 OR do_no = $12`,
            [
                booking_id !== undefined ? booking_id : null,
                cargo_id !== undefined ? cargo_id : null,
                consigner_id !== undefined ? consigner_id : null,
                consignee_id !== undefined ? consignee_id : null,
                car_id !== undefined ? car_id : null,
                driver_id !== undefined ? driver_id : null,
                customer_name !== undefined ? customer_name : null,
                date_of_load ? date_of_load : null,
                eta ? eta : null,
                warehouse !== undefined ? warehouse : null,
                remark !== undefined ? remark : null,
                id
            ]
        );

        // Sync edited goods_items to booking_cargo if target cargo_id exists
        let targetCargoId = cargo_id;
        if (!targetCargoId) {
            const currentDo = await db.query(
                `SELECT cargo_id FROM delivery_orders WHERE delivery_orders_id = $1 OR do_no = $1`,
                [id]
            );
            if (currentDo.rows.length > 0) {
                targetCargoId = currentDo.rows[0].cargo_id;
            }
        }
        if (targetCargoId && Array.isArray(goods_items) && goods_items.length > 0) {
            const firstGood = goods_items[0];
            const pName = firstGood.description !== undefined ? firstGood.description : null;
            const pQty = firstGood.quantity !== undefined && firstGood.quantity !== '' ? parseFloat(firstGood.quantity) : null;
            const pLoadFrom = firstGood.load_from !== undefined ? firstGood.load_from : null;
            const pDestination = firstGood.destination !== undefined ? firstGood.destination : null;

            await db.query(
                `UPDATE booking_cargo SET
                    product_name = COALESCE($1, product_name),
                    quantity = COALESCE($2, quantity),
                    load_from = COALESCE($3, load_from),
                    destination = COALESCE($4, destination)
                 WHERE cargo_id = $5`,
                [pName, pQty, pLoadFrom, pDestination, targetCargoId]
            );
        }

        const fullRes = await db.query(
            `${DO_SELECT_QUERY} WHERE d.delivery_orders_id = $1 OR d.do_no = $1`,
            [id]
        );

        res.json({ message: 'แก้ไข Delivery Order สำเร็จ', data: fullRes.rows[0] });
    } catch (err) {
        console.error('Error updating delivery order:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE delivery order
router.delete('/delivery-orders/:id', async (req, res) => {
    try {
        await initDeliveryOrdersTable();
        const { id } = req.params;
        await db.query(`DELETE FROM delivery_orders WHERE delivery_orders_id = $1 OR do_no = $1`, [id]);
        res.json({ message: 'ลบ Delivery Order สำเร็จ' });
    } catch (err) {
        console.error('Error deleting delivery order:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
