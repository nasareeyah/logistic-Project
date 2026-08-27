const db = require('../config/db');

async function nextId(seq, prefix, pad) {
    const r = await db.query(`SELECT nextval('${seq}') AS n`);
    return prefix + String(r.rows[0].n).padStart(pad, '0');
}

module.exports = { nextId };
