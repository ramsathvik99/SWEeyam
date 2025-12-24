-- Create database
CREATE DATABASE IF NOT EXISTS sweeyam2026;
USE sweeyam2026;

-- Create registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    degree_or_title VARCHAR(255) NOT NULL,
    graduation_year VARCHAR(10),
    years_of_experience VARCHAR(10),
    linkedin VARCHAR(500),
    github VARCHAR(500),
    registration_type ENUM('student', 'conference', 'alumni', 'industry') NOT NULL,
    has_team ENUM('yes', 'no'),
    team_members TEXT,
    team_name VARCHAR(255),
    track_selection VARCHAR(50),
    second_choice VARCHAR(50),
    programming_languages TEXT,
    expertise_areas JSON,
    hackathon_experience TEXT,
    portfolio_links TEXT,
    preferred_engagement JSON,
    availability TEXT,
    company VARCHAR(255),
    dietary_restrictions TEXT,
    accessibility_requirements TEXT,
    questions TEXT,
    how_did_you_hear VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_registration_type (registration_type),
    INDEX idx_track_selection (track_selection)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create admin table (optional - for future admin panel)
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample query to view all registrations
-- SELECT * FROM registrations ORDER BY created_at DESC;

-- Sample query to count registrations by type
-- SELECT registration_type, COUNT(*) as count FROM registrations GROUP BY registration_type;
