const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'กรุณากรอกอีเมลและรหัสผ่าน' 
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const result = await db.query(
            `SELECT user_id, username, email, full_name, role, department 
             FROM users 
             WHERE (LOWER(email) = $1 OR LOWER(username) = $1) AND password = $2`,
            [cleanEmail, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
            });
        }

        const user = result.rows[0];
        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                department: user.department
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/users - รายชื่อผู้ใช้ทั้งหมด (ไม่แสดง password)
router.get('/users', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT user_id, username, email, full_name, role, department, created_at FROM users ORDER BY user_id'
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
