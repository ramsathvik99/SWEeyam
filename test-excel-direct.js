/**
 * Direct test of Excel saving functionality
 */

const { saveRegistrationToExcel } = require('./excelHandler');

const testData = {
  fullName: 'Direct Test User',
  email: 'directtest@example.com',
  phone: '555-123-4567',
  institution: 'Test University',
  degreeOrTitle: 'Computer Science',
  graduationYear: '2026',
  yearsOfExperience: null,
  linkedin: '',
  github: '',
  registrationType: 'student',
  hasTeam: 'no',
  teamMembers: '',
  teamName: '',
  trackSelection: 'web-development',
  secondChoice: '',
  programmingLanguages: '',
  expertiseAreas: [],
  hackathonExperience: '',
  portfolioLinks: '',
  preferredEngagement: [],
  availability: '',
  company: '',
  dietaryRestrictions: '',
  accessibilityRequirements: '',
  questions: '',
  howDidYouHear: ''
};

console.log('Testing Excel save directly...\n');

saveRegistrationToExcel(testData)
  .then(result => {
    console.log('\n=== RESULT ===');
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    if (result.error) {
      console.log('Error:', result.error);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n=== FATAL ERROR ===');
    console.error(error);
    process.exit(1);
  });

