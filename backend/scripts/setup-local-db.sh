#!/bin/bash

echo "=== Local Database Setup ==="
echo ""

# Create local database
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE convite_dev;

-- Create user
CREATE USER convite_dev_user WITH PASSWORD 'dev_password_123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE convite_dev TO convite_dev_user;

-- Connect to database and grant schema privileges
\c convite_dev
GRANT ALL ON SCHEMA public TO convite_dev_user;

EOF

echo ""
echo "✅ Local database created!"
echo ""
echo "Add this to backend/.env:"
echo "DATABASE_URL=postgresql://convite_dev_user:dev_password_123@localhost:5432/convite_dev"
echo "DATABASE_SSL=false"
echo ""
