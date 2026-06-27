const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'comet_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Basic route to check DB connection
app.get('/api/health', (req, res) => {
  db.query('SELECT 1', (err, results) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.json({ status: 'ok', message: 'Database connected' });
  });
});

// Example route: Get products
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM store_products', (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
