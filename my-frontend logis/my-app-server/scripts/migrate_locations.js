const db = require('../config/db');
const { nextId } = require('../utils/dbHelpers');

async function migrate() {
    console.log('--- Migrating existing quotations origin/destination ---');
    const qts = await db.query('SELECT quotation_id, origin_address, destination_address, consigner_id, consignee_id FROM quotations');
    for (const q of qts.rows) {
        let consignerId = q.consigner_id;
        let consigneeId = q.consignee_id;

        if (!consignerId && q.origin_address) {
            const origin = q.origin_address.trim();
            const existCgr = await db.query('SELECT consigner_id FROM consigner WHERE province = $1 OR address_line = $1 LIMIT 1', [origin]);
            if (existCgr.rows.length > 0) {
                consignerId = existCgr.rows[0].consigner_id;
            } else {
                consignerId = await nextId('seq_consigner', 'cgr-', 5);
                await db.query(
                    'INSERT INTO consigner (consigner_id, consigner_name, address_line, province, country) VALUES ($1, $2, $3, $4, $5)',
                    [consignerId, origin, origin, origin, 'Thailand']
                );
            }
        }

        if (!consigneeId && q.destination_address) {
            const dest = q.destination_address.trim();
            const existCge = await db.query('SELECT consignee_id FROM consignee WHERE province = $1 OR address_line = $1 LIMIT 1', [dest]);
            if (existCge.rows.length > 0) {
                consigneeId = existCge.rows[0].consignee_id;
            } else {
                consigneeId = await nextId('seq_consignee', 'cge-', 5);
                await db.query(
                    'INSERT INTO consignee (consignee_id, consignee_name, address_line, province, country) VALUES ($1, $2, $3, $4, $5)',
                    [consigneeId, dest, dest, dest, 'Thailand']
                );
            }
        }

        await db.query('UPDATE quotations SET consigner_id = $1, consignee_id = $2 WHERE quotation_id = $3', [consignerId, consigneeId, q.quotation_id]);
        console.log('Updated quotation', q.quotation_id, 'consigner_id:', consignerId, 'consignee_id:', consigneeId);
    }

    console.log('--- Dropping origin_address and destination_address from quotations ---');
    await db.query('ALTER TABLE quotations DROP COLUMN IF EXISTS origin_address');
    await db.query('ALTER TABLE quotations DROP COLUMN IF EXISTS destination_address');
    console.log('Dropped columns successfully!');
    process.exit(0);
}

migrate().catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
});
