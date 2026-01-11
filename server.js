// ==============================
// SWEeyam 2026 - server.js
// ==============================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
const { saveRegistrationToExcel } = require('./excelHandler');

const app = express();
const PORT = 5000;

/* =========================
   MIDDLEWARE
========================= */
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* =========================
   POSTGRESQL CONNECTION
========================= */
const db = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sweeyam2026',
  user: 'postgres',
  password: 'ramsathvik'
});

/* =========================
   PAGE ROUTES
========================= */
app.get('/', (_, res) =>
  res.sendFile(path.join(__dirname, 'index.html'))
);

app.get('/register', (_, res) =>
  res.sendFile(path.join(__dirname, 'register.html'))
);

/* =========================
   API: REGISTER
========================= */
app.post('/api/register', async (req, res) => {
  try {
    console.log('📥 Incoming registration:', req.body);

    const {
      fullName,
      email,
      phone,
      institution,
      role,       // participant | conference | alumni | industry
      details     // role-specific object
    } = req.body;

    /* ---------- VALIDATION ---------- */
    if (!fullName || !email || !phone || !institution || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    /* ---------- INSERT ---------- */
    const query = `
      INSERT INTO registrations
      (full_name, email, phone, institution, role, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id;
    `;

    const values = [
      fullName,
      email,
      phone,
      institution,
      role,
      JSON.stringify(details || {})
    ];

    const result = await db.query(query, values);
    const registrationId = result.rows[0].id;

    /* ---------- SAVE TO EXCEL (ASYNC) ---------- */
    saveRegistrationToExcel({
      id: registrationId,
      fullName,
      email,
      phone,
      institution,
      role,
      details
    }).catch(err => console.error('Excel error:', err));

    /* ---------- RESPONSE ---------- */
    res.json({
      success: true,
      message: 'Registration successful',
      registrationId
    });

  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

/* =========================
   API: STATS (OPTIONAL)
========================= */
app.get('/api/stats', async (_, res) => {
  try {
    const result = await db.query(`
      SELECT role, COUNT(*)::int AS count
      FROM registrations
      GROUP BY role
      ORDER BY role;
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
