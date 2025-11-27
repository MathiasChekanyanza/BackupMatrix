-- BackupMatrix Database Setup
-- Run this script as PostgreSQL superuser

-- Create database
CREATE DATABASE backupmatrix;

-- Create user
CREATE USER backupmatrix_user WITH PASSWORD 'change_this_password_in_production';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE backupmatrix TO backupmatrix_user;

-- Connect to the database
\c backupmatrix

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO backupmatrix_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO backupmatrix_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO backupmatrix_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO backupmatrix_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO backupmatrix_user;

-- Display success message
\echo 'Database setup complete!'
\echo 'Database: backupmatrix'
\echo 'User: backupmatrix_user'
\echo 'IMPORTANT: Change the password in production!'
