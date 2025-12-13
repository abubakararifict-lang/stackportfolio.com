-- Database Schema for Portfolio with Admin Panel

-- Users Table (for admin/customer login)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer', -- 'admin', 'customer'
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Projects Table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'web', -- 'web', 'mobile', 'ai', 'blockchain'
    tech_stack TEXT[],
    image_url TEXT,
    live_url TEXT,
    github_url TEXT,
    year INT,
    featured BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table (from contact form)
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'unread', -- 'unread', 'read', 'replied', 'archived'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table (for customer customization)
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(50) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- 'string', 'json', 'boolean', 'number'
    category VARCHAR(50) DEFAULT 'general',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Table (for tracking)
CREATE TABLE analytics (
    id SERIAL PRIMARY KEY,
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(50),
    device_type VARCHAR(50),
    session_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: Admin123!)
INSERT INTO users (username, email, password_hash, role, full_name) 
VALUES ('admin', 'admin@example.com', '$2b$10$YourHashedPasswordHere', 'admin', 'System Administrator');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, category) VALUES
('site_title', 'My Portfolio', 'string', 'general'),
('site_description', 'Professional Portfolio Website', 'string', 'general'),
('contact_email', 'abubakararif.ict@gmail.com', 'string', 'contact'),
('phone_number', '+923190535614', 'string', 'contact'),
('address', 'Kotli Bhutta, p/o Kotli loharan, Sialkot', 'string', 'contact'),
('social_links', '{"github":"#","linkedin":"#","twitter":"#","codepen":"#"}', 'json', 'social'),
('theme_colors', '{"primary":"#6C63FF","secondary":"#FF6584","accent":"#36D1DC"}', 'json', 'theme');