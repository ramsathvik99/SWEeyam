const mysql = require('mysql2');
const XLSX = require('xlsx');

// SAME DB CONFIG AS server.js
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ramsathvik',
  database: 'sweeyam2026'
});

// Connect to DB
db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }

  console.log('Connected to MySQL');

  // Fetch data
  db.query(
    'SELECT * FROM registrations ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        console.error('Query failed:', err);
        return;
      }

      // Convert MySQL data → Excel
      const worksheet = XLSX.utils.json_to_sheet(results);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

      // Save Excel file
      XLSX.writeFile(workbook, 'registrations.xlsx');

      console.log('registrations.xlsx created successfully');
      process.exit();
    }
  );
});
