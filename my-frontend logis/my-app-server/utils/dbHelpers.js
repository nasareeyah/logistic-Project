const db = require('../config/db');

async function nextId(seq, prefix, pad) {
    try {
        const r = await db.query(`SELECT nextval('${seq}') AS n`);
        return prefix + String(r.rows[0].n).padStart(pad, '0');
    } catch (err) {
        if (err.code === '42P01') {
            await db.query(`CREATE SEQUENCE IF NOT EXISTS ${seq} START WITH 1`);
            const r = await db.query(`SELECT nextval('${seq}') AS n`);
            return prefix + String(r.rows[0].n).padStart(pad, '0');
        }
        throw err;
    }
}

module.exports = { nextId };
