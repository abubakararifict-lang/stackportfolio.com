const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import database module
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(compression());
app.use(helmet());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=0');
        }
    }
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', apiLimiter);

// Body parsing
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Admin middleware
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// ==================== PUBLIC API ROUTES ====================

// Get portfolio data
app.get('/api/portfolio', async (req, res) => {
    try {
        const [portfolio] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM projects WHERE status = 'active') as total_projects,
                (SELECT COUNT(*) FROM messages WHERE DATE(created_at) = CURRENT_DATE) as messages_today,
                (SELECT setting_value FROM settings WHERE setting_key = 'site_title') as site_title
        `);
        
        const skills = await db.query('SELECT * FROM skills ORDER BY sort_order');
        const featuredProjects = await db.query(`
            SELECT * FROM projects 
            WHERE status = 'active' AND featured = true 
            ORDER BY sort_order LIMIT 6
        `);
        
        res.json({
            success: true,
            data: {
                portfolio: portfolio[0],
                skills: skills,
                featured_projects: featuredProjects
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// Contact form submission
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email and message are required' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    try {
        const result = await db.query(
            `INSERT INTO messages (name, email, subject, message, ip_address, user_agent) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, email, subject, message, req.ip, req.get('User-Agent')]
        );
        
        // Send email notification (you'd implement this)
        // await sendEmailNotification(name, email, subject, message);
        
        res.json({
            success: true,
            message: 'Message sent successfully!',
            data: { id: result.insertId, name, email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save message' });
    }
});

// Get all projects (public)
app.get('/api/projects', async (req, res) => {
    try {
        const { category, limit = 10, offset = 0 } = req.query;
        
        let query = `SELECT * FROM projects WHERE status = 'active'`;
        let params = [];
        
        if (category && category !== 'all') {
            query += ` AND category = ?`;
            params.push(category);
        }
        
        query += ` ORDER BY sort_order, created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        
        const projects = await db.query(query, params);
        const total = await db.query(`SELECT COUNT(*) as count FROM projects WHERE status = 'active'`);
        
        res.json({
            success: true,
            data: projects,
            pagination: {
                total: total[0].count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// ==================== ADMIN API ROUTES ====================

// Admin login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ? AND is_active = true', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
        
        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: user.full_name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Admin dashboard stats
app.get('/api/admin/dashboard', authenticateToken, adminOnly, async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM projects) as total_projects,
                (SELECT COUNT(*) FROM messages WHERE status = 'unread') as unread_messages,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM analytics WHERE DATE(created_at) = CURRENT_DATE) as today_visits
        `);
        
        const recentMessages = await db.query(`
            SELECT * FROM messages 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        const recentProjects = await db.query(`
            SELECT * FROM projects 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        res.json({
            success: true,
            data: {
                stats: stats[0],
                recent_messages: recentMessages,
                recent_projects: recentProjects
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// CRUD for Projects (Admin)
app.get('/api/admin/projects', authenticateToken, adminOnly, async (req, res) => {
    try {
        const projects = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
        res.json({ success: true, data: projects });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.post('/api/admin/projects', authenticateToken, adminOnly, async (req, res) => {
    const { title, description, category, tech_stack, image_url, live_url, github_url, year, featured } = req.body;
    
    try {
        const result = await db.query(
            `INSERT INTO projects (title, description, category, tech_stack, image_url, live_url, github_url, year, featured) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, description, category, JSON.stringify(tech_stack), image_url, live_url, github_url, year, featured]
        );
        
        res.json({ 
            success: true, 
            message: 'Project created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
    }
});

app.put('/api/admin/projects/:id', authenticateToken, adminOnly, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    try {
        const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updates), id];
        
        await db.query(`UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
        res.json({ success: true, message: 'Project updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update project' });
    }
});

app.delete('/api/admin/projects/:id', authenticateToken, adminOnly, async (req, res) => {
    const { id } = req.params;
    
    try {
        await db.query('UPDATE projects SET status = "deleted" WHERE id = ?', [id]);
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Message management (Admin)
app.get('/api/admin/messages', authenticateToken, adminOnly, async (req, res) => {
    try {
        const messages = await db.query('SELECT * FROM messages ORDER BY created_at DESC');
        res.json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.put('/api/admin/messages/:id', authenticateToken, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    try {
        await db.query('UPDATE messages SET status = ? WHERE id = ?', [status, id]);
        res.json({ success: true, message: 'Message status updated' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update message' });
    }
});

// Settings management (Admin)
app.get('/api/admin/settings', authenticateToken, adminOnly, async (req, res) => {
    try {
        const settings = await db.query('SELECT * FROM settings ORDER BY category, setting_key');
        res.json({ success: true, data: settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.put('/api/admin/settings', authenticateToken, adminOnly, async (req, res) => {
    const settings = req.body;
    
    try {
        for (const [key, value] of Object.entries(settings)) {
            await db.query(
                'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = CURRENT_TIMESTAMP',
                [key, value, value]
            );
        }
        
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Analytics data
app.get('/api/admin/analytics', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        let dateFilter = 'DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY)';
        if (period === '30d') dateFilter = 'DATE(created_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)';
        if (period === '1y') dateFilter = 'created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 1 YEAR)';
        
        const visits = await db.query(`
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM analytics 
            WHERE ${dateFilter}
            GROUP BY DATE(created_at) 
            ORDER BY date
        `);
        
        const popularPages = await db.query(`
            SELECT page_url, COUNT(*) as visits 
            FROM analytics 
            WHERE ${dateFilter}
            GROUP BY page_url 
            ORDER BY visits DESC 
            LIMIT 10
        `);
        
        res.json({
            success: true,
            data: {
                visits,
                popular_pages: popularPages
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Serve admin panel
app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🔐 JWT Secret: ${JWT_SECRET ? 'Set' : 'Not set - using default'}`);
});