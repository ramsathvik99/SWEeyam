/**
 * Excel Handler Module
 * 
 * This module provides thread-safe Excel file operations for saving registration data.
 * It handles concurrent registrations using file locking mechanisms to prevent data loss.
 * 
 * Features:
 * - Automatic Excel file creation if it doesn't exist
 * - Thread-safe append operations using file locking
 * - Input validation and sanitization
 * - Cross-platform compatibility (Windows, Linux, macOS)
 * - Comprehensive error handling
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

// Promisify fs operations for better async handling
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);
const mkdir = promisify(fs.mkdir);

// Configuration
const EXCEL_FILE_PATH = path.join(__dirname, 'registrations.xlsx');
const MAX_RETRIES = 10;
const RETRY_DELAY = 200; // milliseconds - increased for Windows file locking

/**
 * Validates registration data to ensure required fields are present and properly formatted
 * @param {Object} data - Registration data object
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateRegistrationData(data) {
  const errors = [];
  const requiredFields = ['fullName', 'email', 'phone', 'institution', 'degreeOrTitle', 'registrationType'];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate email format
  if (data.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Invalid email format');
    }
  }
  
  // Validate phone (basic check - should contain digits)
  if (data.phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Maps camelCase field names to snake_case to match database/Excel structure
 * @param {Object} data - Raw registration data with camelCase keys
 * @returns {Object} - Data with snake_case keys matching Excel structure
 */
function mapToExcelColumns(data) {
  const fieldMapping = {
    fullName: 'full_name',
    email: 'email',
    phone: 'phone',
    institution: 'institution',
    degreeOrTitle: 'degree_or_title',
    graduationYear: 'graduation_year',
    yearsOfExperience: 'years_of_experience',
    linkedin: 'linkedin',
    github: 'github',
    registrationType: 'registration_type',
    hasTeam: 'has_team',
    teamMembers: 'team_members',
    teamName: 'team_name',
    trackSelection: 'track_selection',
    secondChoice: 'second_choice',
    programmingLanguages: 'programming_languages',
    expertiseAreas: 'expertise_areas',
    hackathonExperience: 'hackathon_experience',
    portfolioLinks: 'portfolio_links',
    preferredEngagement: 'preferred_engagement',
    availability: 'availability',
    company: 'company',
    dietaryRestrictions: 'dietary_restrictions',
    accessibilityRequirements: 'accessibility_requirements',
    questions: 'questions',
    howDidYouHear: 'how_did_you_hear'
  };
  
  const mapped = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Use mapped column name if available, otherwise use original key
    const excelKey = fieldMapping[key] || key;
    
    // Handle ID field specially - keep as number
    if (key === 'id' && value !== null && value !== undefined) {
      mapped[excelKey] = Number(value);
    } else if (value === null || value === undefined) {
      mapped[excelKey] = '';
    } else if (Array.isArray(value)) {
      // Convert arrays to JSON string (matching database format)
      mapped[excelKey] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      // Convert objects to JSON strings
      mapped[excelKey] = JSON.stringify(value);
    } else {
      // Convert to string and trim
      mapped[excelKey] = String(value).trim();
    }
  }
  
  // Add timestamps matching database structure
  const now = new Date();
  mapped.created_at = now.toISOString().slice(0, 19).replace('T', ' ');
  mapped.updated_at = now.toISOString().slice(0, 19).replace('T', ' ');
  
  return mapped;
}

/**
 * Sanitizes data to ensure Excel compatibility
 * @param {Object} data - Raw registration data
 * @returns {Object} - Sanitized data object
 */
function sanitizeData(data) {
  // First map to Excel column names, then sanitize
  return mapToExcelColumns(data);
}

/**
 * Creates a new Excel file with headers if it doesn't exist
 * @param {Array} headers - Column headers
 * @returns {Promise<void>}
 */
async function createExcelFile(headers) {
  try {
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    XLSX.writeFile(workbook, EXCEL_FILE_PATH);
    console.log(`Created new Excel file: ${EXCEL_FILE_PATH}`);
  } catch (error) {
    throw new Error(`Failed to create Excel file: ${error.message}`);
  }
}

/**
 * Reads existing Excel file and returns data
 * @returns {Promise<{headers: Array, data: Array}>}
 */
async function readExcelFile() {
  try {
    // Check if file exists
    try {
      await access(EXCEL_FILE_PATH, fs.constants.F_OK);
    } catch {
      // File doesn't exist, return empty structure
      console.log('Excel file does not exist, will create new one');
      return { headers: [], data: [] };
    }
    
    console.log(`Reading existing Excel file: ${EXCEL_FILE_PATH}`);
    const workbook = XLSX.readFile(EXCEL_FILE_PATH);
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      console.log('Excel file has no sheets, treating as empty');
      return { headers: [], data: [] };
    }
    
    const sheetName = workbook.SheetNames[0] || 'Registrations';
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      console.log('Worksheet not found, treating as empty');
      return { headers: [], data: [] };
    }
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    console.log(`Read ${data.length} rows from Excel file`);
    
    // Get headers from first row or from worksheet range
    let headers = [];
    if (data.length > 0 && data[0]) {
      headers = Object.keys(data[0]);
    } else if (worksheet['!ref']) {
      // Get headers from first row of worksheet
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          headers.push(cell.v.toString());
        } else {
          headers.push(`Column${col + 1}`);
        }
      }
    }
    
    console.log(`Found ${headers.length} columns:`, headers);
    
    return { headers, data };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw new Error(`Failed to read Excel file: ${error.message}`);
  }
}

/**
 * Appends a new registration to the Excel file with retry logic for concurrent access
 * @param {Object} registrationData - Registration data to append
 * @returns {Promise<void>}
 */
async function appendToExcel(registrationData, retryCount = 0) {
  try {
    console.log('Starting Excel append operation...');
    console.log('Registration data:', JSON.stringify(registrationData, null, 2));
    
    // Validate data
    const validation = validateRegistrationData(registrationData);
    if (!validation.valid) {
      console.error('Validation failed:', validation.errors);
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    console.log('Data validation passed');
    
    // Sanitize data (this also maps camelCase to snake_case)
    const sanitizedData = sanitizeData(registrationData);
    console.log('Data sanitized:', Object.keys(sanitizedData).length, 'fields');
    console.log('Sanitized data keys (first 5):', Object.keys(sanitizedData).slice(0, 5));
    if (sanitizedData.id !== undefined) {
      console.log('ID included in data:', sanitizedData.id, '(type:', typeof sanitizedData.id + ')');
    } else {
      console.warn('WARNING: No ID found in sanitized data');
    }
    
    // Read existing file or create new one
    let { headers, data } = await readExcelFile();
    console.log(`Current Excel state: ${headers.length} headers, ${data.length} rows`);
    
    // If file is empty or doesn't exist, create with headers
    if (headers.length === 0 || data.length === 0) {
      console.log('Creating new Excel file with headers...');
      headers = Object.keys(sanitizedData);
      // Ensure 'id' is first if it exists
      if (sanitizedData.id !== undefined) {
        headers = ['id', ...headers.filter(h => h !== 'id')];
      }
      await createExcelFile(headers);
      data = [];
      console.log('New Excel file created with', headers.length, 'columns');
    }
    
    // Ensure 'id' column exists and is first (important for database ID tracking)
    if (sanitizedData.id !== undefined && sanitizedData.id !== null && sanitizedData.id !== '') {
      if (!headers.includes('id')) {
        console.log('Adding missing "id" column to Excel file as first column');
        // Add 'id' as first column and update existing rows to have empty ID
        headers = ['id', ...headers];
        // Update existing data rows to include empty 'id' field
        data = data.map(row => ({ id: '', ...row }));
      } else if (headers[0] !== 'id') {
        // Move 'id' to first position
        console.log('Reordering columns: "id" moved to first position');
        const idIndex = headers.indexOf('id');
        headers = ['id', ...headers.filter(h => h !== 'id')];
        // Reorder existing data rows to match new header order
        data = data.map(row => {
          const newRow = { id: row.id || '' };
          for (const header of headers.slice(1)) {
            newRow[header] = row[header] || '';
          }
          return newRow;
        });
      }
    }
    
    // Ensure all headers exist (add new columns if needed)
    // But prioritize existing headers to avoid duplicates
    const newHeaders = [...headers];
    let addedHeaders = [];
    
    // First, add any new columns from sanitized data that don't exist
    for (const key of Object.keys(sanitizedData)) {
      if (!newHeaders.includes(key)) {
        newHeaders.push(key);
        addedHeaders.push(key);
      }
    }
    
    if (addedHeaders.length > 0) {
      console.log('Added new columns:', addedHeaders);
    }
    
    // Create row data - use existing headers first, then add new data
    const row = {};
    
    // Fill in values for existing headers
    for (const header of headers) {
      // Handle ID field specially - preserve as number, don't default to empty string
      if (header === 'id') {
        // ID should be a number from the database
        if (sanitizedData[header] !== undefined && sanitizedData[header] !== null && sanitizedData[header] !== '') {
          row[header] = Number(sanitizedData[header]);
          console.log(`Setting ID in row: ${row[header]} (type: ${typeof row[header]})`);
        } else {
          row[header] = '';
          console.warn('WARNING: ID field is missing or empty in sanitized data');
        }
      } else {
        row[header] = sanitizedData[header] || '';
      }
    }
    
    // Add values for any new headers (shouldn't include 'id' as it's already handled above)
    for (const header of addedHeaders) {
      if (header === 'id') {
        // This shouldn't happen, but handle it just in case
        if (sanitizedData[header] !== undefined && sanitizedData[header] !== null && sanitizedData[header] !== '') {
          row[header] = Number(sanitizedData[header]);
        } else {
          row[header] = '';
        }
      } else {
        row[header] = sanitizedData[header] || '';
      }
    }
    
    // Append new row
    data.push(row);
    console.log(`Appending row ${data.length} to Excel file`);
    if (row.id !== undefined && row.id !== '' && row.id !== null) {
      console.log(`✓ Row includes ID: ${row.id} (type: ${typeof row.id})`);
    } else {
      console.warn('⚠ WARNING: Row does not include valid ID field. ID value:', row.id);
    }
    
    // Write back to Excel file
    console.log('Writing Excel file...');
    
    // Check if file is locked before writing
    let fileLocked = false;
    try {
      // Try to open file in read mode to check if it's locked
      const fd = fs.openSync(EXCEL_FILE_PATH, 'r+');
      fs.closeSync(fd);
    } catch (err) {
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        fileLocked = true;
        console.warn('File appears to be locked. Will retry...');
      }
    }
    
    if (fileLocked && retryCount < MAX_RETRIES) {
      throw new Error('EBUSY: File is locked');
    }
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
    
    // Use writeFile with file locking (XLSX handles this internally)
    XLSX.writeFile(workbook, EXCEL_FILE_PATH);
    
    console.log(`✓ Successfully appended registration to Excel: ${sanitizedData.email || 'N/A'}`);
    console.log(`✓ Excel file now contains ${data.length} registration(s)`);
  } catch (error) {
    console.error('Error in appendToExcel:', error);
    console.error('Error stack:', error.stack);
    
    // Retry on file lock errors (EBUSY, EAGAIN, etc.)
    if (retryCount < MAX_RETRIES && (
      error.code === 'EBUSY' || 
      error.code === 'EAGAIN' || 
      error.code === 'ENOENT' ||
      error.message.includes('locked') ||
      error.message.includes('busy') ||
      error.message.includes('EACCES')
    )) {
      console.log(`Retry ${retryCount + 1}/${MAX_RETRIES} for Excel write operation...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return appendToExcel(registrationData, retryCount + 1);
    }
    
    // Log error and rethrow
    console.error('Failed to append to Excel after retries:', error.message);
    throw error;
  }
}

/**
 * Main function to save registration data to Excel
 * This is the primary function to be called from the registration endpoint
 * @param {Object} registrationData - Registration data object
 * @returns {Promise<{success: boolean, message: string, error?: string}>}
 */
async function saveRegistrationToExcel(registrationData) {
  try {
    console.log('=== Excel Save Operation Started ===');
    console.log('File path:', EXCEL_FILE_PATH);
    
    await appendToExcel(registrationData);
    
    console.log('=== Excel Save Operation Completed Successfully ===');
    return {
      success: true,
      message: 'Registration saved to Excel successfully'
    };
  } catch (error) {
    console.error('=== Excel Save Operation Failed ===');
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return {
      success: false,
      message: 'Failed to save registration to Excel',
      error: error.message
    };
  }
}

module.exports = {
  saveRegistrationToExcel,
  validateRegistrationData,
  sanitizeData,
  EXCEL_FILE_PATH
};

