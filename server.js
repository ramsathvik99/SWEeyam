const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { saveRegistrationToExcel } = require('./excelHandler');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname));

/* =========================
   MySQL CONNECTION POOL
   (CRITICAL FIX)
========================= */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* =========================
   Page Routes
========================= */
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

/* =========================
   API: REGISTER
========================= */
app.post('/api/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      institution,
      degreeOrTitle,
      graduationYear,
      yearsOfExperience,
      yearOrExp,
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
      expertiseAreasText,
      hackathonExperience,
      portfolioLinks,
      preferredEngagement,
      availability,
      company,
      dietaryRestrictions,
      accessibilityRequirements,
      questions,
      howDidYouHear
    } = req.body;

    const finalGraduationYear =
      graduationYear || (registrationType === 'student' ? yearOrExp : null);

    const finalYearsOfExperience =
      yearsOfExperience || (registrationType !== 'student' ? yearOrExp : null);

    const finalExpertiseAreas =
      expertiseAreas?.length > 0
        ? expertiseAreas
        : expertiseAreasText
        ? [expertiseAreasText]
        : [];

    const sql = `
      INSERT INTO registrations (
        full_name, email, phone, institution, degree_or_title,
        graduation_year, years_of_experience, linkedin, github,
        registration_type, has_team, team_members, team_name,
        track_selection, second_choice, programming_languages,
        expertise_areas, hackathon_experience, portfolio_links,
        preferred_engagement, availability, company,
        dietary_restrictions, accessibility_requirements,
        questions, how_did_you_hear, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

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

    const [result] = await db.query(sql, values);

    // Save to Excel (non-blocking)
    saveRegistrationToExcel({
      id: result.insertId,
      fullName,
      email,
      phone,
      institution,
      degreeOrTitle,
      graduationYear: finalGraduationYear,
      yearsOfExperience: finalYearsOfExperience,
      linkedin,
      github,
      registrationType,
      hasTeam,
      teamMembers,
      teamName,
      trackSelection,
      secondChoice,
      programmingLanguages,
      expertiseAreas: finalExpertiseAreas,
      hackathonExperience,
      portfolioLinks,
      preferredEngagement,
      availability,
      company,
      dietaryRestrictions,
      accessibilityRequirements,
      questions,
      howDidYouHear
    }).catch(err => console.error('Excel error:', err));

    res.json({
      success: true,
      message: 'Registration submitted successfully!',
      registrationId: result.insertId
    });

  } catch (err) {
    console.error('Registration error:', err);

    let msg = 'Registration failed. Please try again.';
    if (err.code === 'ER_DUP_ENTRY') msg = 'Email already registered.';
    if (err.code === 'ER_NO_SUCH_TABLE') msg = 'Database table missing.';

    res.status(500).json({
      success: false,
      message: msg
    });
  }
});

/* =========================
   API: STATS
========================= */
app.get('/api/stats', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT registration_type, COUNT(*) AS count
      FROM registrations
      GROUP BY registration_type
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
