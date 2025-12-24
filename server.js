const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { saveRegistrationToExcel } = require('./excelHandler');

const app = express();
const PORT = 5000;

/* =========================
   Middleware
========================= */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* =========================
   POSTGRESQL CONNECTION (LOCAL)
   Works with pgAdmin
========================= */
const db = new Pool({
  host: 'localhost',
  user: 'postgres',        // change ONLY if your pgAdmin username is different
  password: 'ramsathvik',  // your PostgreSQL password
  database: 'sweeyam2026',
  port: 5432
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
      expertiseAreas && expertiseAreas.length > 0
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
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,CURRENT_TIMESTAMP
      )
      RETURNING id
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

    const result = await db.query(sql, values);

    // Save to Excel (non-blocking)
    saveRegistrationToExcel({
      id: result.rows[0].id,
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
      registrationId: result.rows[0].id
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

/* =========================
   API: STATS
========================= */
app.get('/api/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT registration_type, COUNT(*) AS count
      FROM registrations
      GROUP BY registration_type
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
  console.log(`Server running at http://localhost:${PORT}`);
});
