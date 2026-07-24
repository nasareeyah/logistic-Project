const express = require('express');
const cors = require('cors');
const app = express();

const apiRoutes = require('./routes/api');
require('./config/db');

app.use(cors());
app.use(express.json());


console.log('Mounting API routes at /api');
app.use('/api', apiRoutes);



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});