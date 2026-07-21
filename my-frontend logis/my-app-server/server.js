const express = require('express');
const cors = require('cors');
const app = express();

// Import ไฟล์ api.js (ปรับ path ให้ตรง เช่น ./api หรือ ./routes/api)
const apiRoutes = require('./routes/api'); 
const dbconfig = require('./config/db');

app.use(cors());
app.use(express.json());

// นำ apiRoutes ไปผูกไว้ใต้พาท /api
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});