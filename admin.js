// Frontend-only Admin Panel (using localStorage)
class StaticAdminPanel {
    constructor() {
        this.projects = JSON.parse(localStorage.getItem('portfolio_projects')) || [];
        this.settings = JSON.parse(localStorage.getItem('portfolio_settings')) || {
            siteTitle: 'My Portfolio',
            contactEmail: 'abubakararif.ict@gmail.com',
            socialLinks: {
                github: '#',
                linkedin: '#',
                twitter: '#'
            }
        };
    }

    // Check password (hardcoded for demo - change this!)
    login(password) {
        const hashedPassword = this.hashPassword(password);
        const storedHash = 'hashed_password_here'; // Change this!
        
        if (hashedPassword === storedHash) {
            localStorage.setItem('admin_logged_in', 'true');
            return true;
        }
        return false;
    }

    hashPassword(password) {
        // Simple hash for demo - use bcrypt in production
        return btoa(password);
    }

    addProject(project) {
        project.id = Date.now();
        project.created_at = new Date().toISOString();
        this.projects.push(project);
        this.saveProjects();
        return project;
    }

    updateProject(id, updates) {
        const index = this.projects.findIndex(p => p.id === id);
        if (index !== -1) {
            this.projects[index] = { ...this.projects[index], ...updates };
            this.saveProjects();
            return true;
        }
        return false;
    }

    deleteProject(id) {
        this.projects = this.projects.filter(p => p.id !== id);
        this.saveProjects();
    }

    saveProjects() {
        localStorage.setItem('portfolio_projects', JSON.stringify(this.projects));
        this.updateFrontend();
    }

    updateFrontend() {
        // Update the live website with new data
        if (window.updatePortfolioData) {
            window.updatePortfolioData({
                projects: this.projects,
                settings: this.settings
            });
        }
    }

    exportData() {
        const data = {
            projects: this.projects,
            settings: this.settings,
            export_date: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            this.projects = data.projects || [];
            this.settings = data.settings || {};
            this.saveProjects();
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Initialize admin
const admin = new StaticAdminPanel();

// Make available globally
window.PortfolioAdmin = admin;