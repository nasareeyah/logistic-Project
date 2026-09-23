const pool = require('../config/db');

async function seed() {
    try {
        await pool.query(`CREATE SEQUENCE IF NOT EXISTS seq_bank START 1;`);
        const existingBanks = await pool.query('SELECT COUNT(*) FROM bank');
        if (parseInt(existingBanks.rows[0].count, 10) === 0) {
            await pool.query(`
                INSERT INTO bank (bank_id, bank_name) VALUES
                ('bnk-001', 'ธนาคารกสิกรไทย (Kasikornbank)'),
                ('bnk-002', 'ธนาคารไทยพาณิชย์ (SCB)'),
                ('bnk-003', 'ธนาคารกรุงเทพ (Bangkok Bank)'),
                ('bnk-004', 'ธนาคารกรุงไทย (Krungthai Bank)')
                ON CONFLICT DO NOTHING;
            `);
            await pool.query(`
                INSERT INTO account (account_no, account_name, bank_branch, bank_id) VALUES
                ('123-4-56789-0', 'บริษัท เอสที แทรนสปอร์ต แอนด์ โลจิสติกส์ จำกัด', 'สาขาบางนา-ตราด', 'bnk-001')
                ON CONFLICT DO NOTHING;
            `);
            await pool.query(`SELECT setval('seq_bank', 5, false);`);
            console.log('Seeded sample bank & account successfully');
        } else {
            console.log('Bank table already has records');
        }
    } catch (err) {
        console.error('Error seeding bank & account:', err);
    } finally {
        process.exit(0);
    }
}

seed();
