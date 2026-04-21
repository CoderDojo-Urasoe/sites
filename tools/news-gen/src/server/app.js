const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (Frontend SPA)
app.use(express.static(path.join(__dirname, '../../public')));

// API Routes
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log('ブラウザで上記のURLを開いて、記事生成ツールにアクセスしてください。');
});
