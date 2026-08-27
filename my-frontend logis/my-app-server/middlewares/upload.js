const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { nextId } = require('../utils/dbHelpers');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: async (req, file, cb) => {
        try {
            const nextSeqId = await nextId('seq_upload_filename', 'do-', 5);
            const ext = path.extname(file.originalname);
            cb(null, nextSeqId + ext);
        } catch (err) {
            cb(err);
        }
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit
});

module.exports = upload;
