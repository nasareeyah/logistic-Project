require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
app.use(cors());
app.use(express.json());

// เรียกใช้งาน routes ที่แยกไป โดยให้ขึ้นต้นด้วย /api
app.use('/api', apiRoutes);

const PORT = parseInt(process.env.PORT || '3000');
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
});