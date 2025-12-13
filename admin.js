// Static Admin Panel for GitHub Pages
class PortfolioAdmin {
    constructor() {
        this.storageKey = 'portfolio_admin_data';
        this.passwordKey = 'portfolio_admin_auth';
        
        // Default projects if none exist
        this.defaultProjects = [
            {
                id: 1,
                title: "AI Analytics Dashboard",
                description: "Real-time AI-powered analytics platform with predictive modeling",
                category: "web",
                tech: ["React", "Node.js", "MongoDB"],
                image: "https://images.unsplash.com/photo-1551650975-87deedd944c3",
                live_url: "#",
                github_url: "#",
                featured: true,
                created: new Date().toISOString()
            }
        ];
        
        this.defaultSettings = {
            siteTitle: "My Portfolio",
            contactEmail: "abubakararif.ict@gmail.com",
            phone: "+923190535614",
            address: "Kotli Bhutta, Sialkot",
            social: {
                github: "#",
                linkedin: "#",
                twitter: "#",
                codepen: "#"
            },
            theme: {
                primary: "#6C63FF",
                secondary: "#FF6584",
                accent: "#36D1DC"
            }
        };
        
        this.init();
    }
    
    init() {
        // Load existing data or create defaults
        if (!localStorage.getItem(this.storageKey)) {
            this.saveData({
                projects: this.defaultProjects,
                settings: this.defaultSettings,
                messages: []
            });
        }
        
        // Set default password if not set
        if (!localStorage.getItem(this.passwordKey)) {
            // Default password: "admin123" (hashed)
            localStorage.setItem(this.passwordKey, this.hashPassword("admin123"));
        }
    }
    
    // Simple password hashing (for demo only)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    verifyPassword(input) {
        const storedHash = localStorage.getItem(this.passwordKey);
        return this.hashPassword(input) === storedHash;
    }
    
    changePassword(oldPass, newPass) {
        if (this.verifyPassword(oldPass)) {
            localStorage.setItem(this.passwordKey, this.hashPassword(newPass));
            return true;
        }
        return false;
    }
    
    getData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }
    
    saveData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        this.triggerUpdate();
    }
    
    // Project Management
    addProject(projectData) {
        const data = this.getData();
        const newProject = {
            id: Date.now(),
            created: new Date().toISOString(),
            ...projectData
        };
        
        data.projects.unshift(newProject);
        this.saveData(data);
        return newProject;
    }
    
    updateProject(id, updates) {
        const data = this.getData();
        const index = data.projects.findIndex(p => p.id === id);
        
        if (index !== -1) {
            data.projects[index] = {
                ...data.projects[index],
                ...updates,
                updated: new Date().toISOString()
            };
            this.saveData(data);
            return true;
        }
        return false;
    }
    
    deleteProject(id) {
        const data = this.getData();
        data.projects = data.projects.filter(p => p.id !== id);
        this.saveData(data);
        return true;
    }
    
    // Settings Management
    updateSettings(newSettings) {
        const data = this.getData();
        data.settings = {
            ...data.settings,
            ...newSettings
        };
        this.saveData(data);
        
        // Update live site immediately
        this.applySettingsToSite();
        return true;
    }
    
    // Apply settings to the actual portfolio site
    applySettingsToSite() {
        const data = this.getData();
        const settings = data.settings;
        
        // Update CSS variables for theme
        if (settings.theme) {
            document.documentElement.style.setProperty('--primary', settings.theme.primary);
            document.documentElement.style.setProperty('--secondary', settings.theme.secondary);
            document.documentElement.style.setProperty('--accent', settings.theme.accent);
        }
        
        // Save settings for other pages
        localStorage.setItem('portfolio_settings', JSON.stringify(settings));
        
        // Dispatch event for other pages to update
        window.dispatchEvent(new CustomEvent('portfolioSettingsUpdated', {
            detail: settings
        }));
    }
    
    // Message Management
    addMessage(messageData) {
        const data = this.getData();
        const newMessage = {
            id: Date.now(),
            read: false,
            created: new Date().toISOString(),
            ...messageData
        };
        
        data.messages.unshift(newMessage);
        this.saveData(data);
        return newMessage;
    }
    
    markMessageRead(id) {
        const data = this.getData();
        const message = data.messages.find(m => m.id === id);
        if (message) {
            message.read = true;
            this.saveData(data);
        }
    }
    
    deleteMessage(id) {
        const data = this.getData();
        data.messages = data.messages.filter(m => m.id !== id);
        this.saveData(data);
    }
    
    // Export/Import
    exportData() {
        const data = this.getData();
        return JSON.stringify(data, null, 2);
    }
    
    importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            this.saveData(importedData);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            return false;
        }
    }
    
    // Sync with main portfolio
    triggerUpdate() {
        // Update the main portfolio pages
        if (window.updatePortfolioContent) {
            window.updatePortfolioContent(this.getData());
        }
        
        // Update settings on all pages
        this.applySettingsToSite();
    }
    
    // Statistics
    getStats() {
        const data = this.getData();
        return {
            totalProjects: data.projects.length,
            unreadMessages: data.messages.filter(m => !m.read).length,
            featuredProjects: data.projects.filter(p => p.featured).length
        };
    }
}

// Initialize and make globally available
window.PortfolioAdmin = new PortfolioAdmin();
