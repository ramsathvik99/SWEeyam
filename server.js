const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { saveRegistrationToExcel } = require('./excelHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files (CSS, JS, images) from current directory
app.use(express.static(__dirname));

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ramsathvik',
  database: process.env.DB_NAME || 'sweeyam2026'
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
    console.log('Please make sure MySQL is running and database exists.');
  } else {
    console.log('Connected to MySQL database');
  }
});

// Routes for serving HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/conference', (req, res) => {
  res.sendFile(path.join(__dirname, 'conference.html'));
});

app.get('/alumni', (req, res) => {
  res.sendFile(path.join(__dirname, 'alumni.html'));
});

app.get('/hackathon', (req, res) => {
  res.sendFile(path.join(__dirname, 'hackathon.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// API Route: Submit Registration
app.post('/api/register', (req, res) => {
  console.log('Registration request received');
  console.log('Request body:', req.body);
  
  // Check database connection
  if (db.state === 'disconnected') {
    console.error('Database is disconnected');
    return res.status(500).json({ 
      success: false, 
      message: 'Database connection lost. Please try again.',
      error: 'Database disconnected'
    });
  }

  const {
    fullName,
    email,
    phone,
    institution,
    degreeOrTitle,
    graduationYear,
    yearsOfExperience,
    yearOrExp, // Fallback for dynamic field
    linkedin,
    github,
    registrationType,
    hasTeam,
    teamMembers,
    teamName,
    trackSelection,
    secondChoice,
    programmingLanguages,
    expertiseAreas,
    hackathonExperience,
    portfolioLinks,
    preferredEngagement,
    availability,
    company,
    dietaryRestrictions,
    accessibilityRequirements,
    questions,
    howDidYouHear,
    expertiseAreasText
  } = req.body;

  // Handle graduation year or years of experience
  const finalGraduationYear = graduationYear || (registrationType === 'student' ? yearOrExp : null);
  const finalYearsOfExperience = yearsOfExperience || (registrationType !== 'student' ? yearOrExp : null);
  
  // Handle expertise areas - use array if provided, otherwise use text field
  const finalExpertiseAreas = (expertiseAreas && expertiseAreas.length > 0) 
    ? expertiseAreas 
    : (expertiseAreasText ? [expertiseAreasText] : []);

  const sql = `INSERT INTO registrations (
    full_name, email, phone, institution, degree_or_title, graduation_year,
    years_of_experience, linkedin, github, registration_type, has_team,
    team_members, team_name, track_selection, second_choice, programming_languages,
    expertise_areas, hackathon_experience, portfolio_links, preferred_engagement,
    availability, company, dietary_restrictions, accessibility_requirements,
    questions, how_did_you_hear, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

  const values = [
    fullName,
    email,
    phone,
    institution,
    degreeOrTitle,
    finalGraduationYear,
    finalYearsOfExperience,
    linkedin || null,
    github || null,
    registrationType,
    hasTeam || null,
    teamMembers || null,
    teamName || null,
    trackSelection || null,
    secondChoice || null,
    programmingLanguages || null,
    JSON.stringify(finalExpertiseAreas),
    hackathonExperience || null,
    portfolioLinks || null,
    JSON.stringify(preferredEngagement || []),
    availability || null,
    company || null,
    dietaryRestrictions || null,
    accessibilityRequirements || null,
    questions || null,
    howDidYouHear || null
  ];

  console.log('Executing SQL query with values:', values);
  
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Database query error:', err);
      console.error('Error code:', err.code);
      console.error('Error SQL state:', err.sqlState);
      console.error('Error message:', err.message);
      
      // Provide more specific error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.code === 'ER_NO_SUCH_TABLE') {
        errorMessage = 'Database table not found. Please run database.sql to create the tables.';
      } else if (err.code === 'ER_DUP_ENTRY') {
        errorMessage = 'This email is already registered. Please use a different email address.';
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
        errorMessage = 'Cannot connect to database. Please check your database connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      res.status(500).json({ 
        success: false, 
        message: errorMessage,
        error: err.message,
        code: err.code
      });
    } else {
      console.log('Registration successful, ID:', result.insertId);
      
      // Prepare data for Excel export (using the same data structure)
      const excelData = {
        id: result.insertId, // Include the database ID
        fullName,
        email,
        phone,
        institution,
        degreeOrTitle,
        graduationYear: finalGraduationYear,
        yearsOfExperience: finalYearsOfExperience,
        linkedin: linkedin || '',
        github: github || '',
        registrationType,
        hasTeam: hasTeam || '',
        teamMembers: teamMembers || '',
        teamName: teamName || '',
        trackSelection: trackSelection || '',
        secondChoice: secondChoice || '',
        programmingLanguages: programmingLanguages || '',
        expertiseAreas: finalExpertiseAreas,
        hackathonExperience: hackathonExperience || '',
        portfolioLinks: portfolioLinks || '',
        preferredEngagement: preferredEngagement || [],
        availability: availability || '',
        company: company || '',
        dietaryRestrictions: dietaryRestrictions || '',
        accessibilityRequirements: accessibilityRequirements || '',
        questions: questions || '',
        howDidYouHear: howDidYouHear || ''
      };
      
      // Automatically save to Excel file (non-blocking)
      // This runs asynchronously and won't block the response
      console.log('\n=== ATTEMPTING TO SAVE TO EXCEL ===');
      console.log('Excel data prepared:', Object.keys(excelData).length, 'fields');
      
      saveRegistrationToExcel(excelData)
        .then((excelResult) => {
          console.log('\n=== EXCEL SAVE RESULT ===');
          if (excelResult.success) {
            console.log('✓ SUCCESS: Registration saved to Excel successfully');
            console.log('File location:', require('./excelHandler').EXCEL_FILE_PATH);
          } else {
            console.error('✗ FAILED: Could not save to Excel');
            console.error('Error:', excelResult.error);
            console.error('Message:', excelResult.message);
            // Note: We don't fail the registration if Excel save fails
            // The database save is the primary storage mechanism
          }
          console.log('=== END EXCEL SAVE RESULT ===\n');
        })
        .catch((excelError) => {
          console.error('\n=== EXCEL SAVE EXCEPTION ===');
          console.error('Exception caught:', excelError);
          console.error('Error message:', excelError.message);
          console.error('Error stack:', excelError.stack);
          console.error('=== END EXCEL SAVE EXCEPTION ===\n');
          // Continue even if Excel save fails
        });
      
      // Respond to client immediately (don't wait for Excel save)
      res.json({ 
        success: true, 
        message: 'Registration submitted successfully!',
        registrationId: result.insertId
      });
    }
  });
});

// API Route: Get Registration Stats (for admin - optional)
app.get('/api/stats', (req, res) => {
  const sql = `
    SELECT 
      registration_type,
      COUNT(*) as count
    FROM registrations
    GROUP BY registration_type
  `;

  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(results);
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Make sure MySQL database '${process.env.DB_NAME || 'sweeyam2026'}' exists and is running.`);
});
