const { Pool } = require('pg');
const XLSX = require('xlsx');

/* =========================
   POSTGRESQL CONNECTION (LOCAL)
========================= */
const db = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_HOST !== 'localhost'
    ? { rejectUnauthorized: false }
    : false
});
async function exportToExcel() {
  try {
    console.log('Connected to PostgreSQL');

    // Fetch data
    const result = await db.query(
      'SELECT * FROM registrations ORDER BY created_at DESC'
    );

    const rows = result.rows;

    if (rows.length === 0) {
      console.log('No registrations found');
      process.exit();
    }

    // Convert PostgreSQL data → Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    // Save Excel file
    XLSX.writeFile(workbook, 'registrations.xlsx');

    console.log('registrations.xlsx created successfully');
    process.exit();

  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  }
}

exportToExcel();
