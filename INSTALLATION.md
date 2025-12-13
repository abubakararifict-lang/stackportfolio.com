# Portfolio Website - Installation Guide

## Quick Setup (5 Minutes)

### 1. Server Requirements
- Node.js 16+ 
- MySQL 8.0+
- 1GB RAM minimum

### 2. Installation Steps

```bash
# 1. Extract the files
unzip portfolio-website.zip
cd portfolio-website

# 2. Install dependencies
npm install

# 3. Setup database
mysql -u root -p
CREATE DATABASE portfolio_db;
USE portfolio_db;
SOURCE database.sql;

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Start the server
npm start