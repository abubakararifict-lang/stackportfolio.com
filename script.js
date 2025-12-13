// Theme Toggle
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'light') {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.className = 'fas fa-moon';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            if (themeIcon) themeIcon.className = 'fas fa-sun';
        }
    });
}

// Scroll Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Animate elements on scroll
document.querySelectorAll('.stack-item, .floating-card, .hero-text').forEach(el => {
    observer.observe(el);
});

// Particle Animation for Background
function createParticles() {
    const container = document.querySelector('.bg-animation');
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.width = Math.random() * 5 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(108, 99, 255, 0.5)';
        particle.style.position = 'absolute';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = Math.random() * 100 + 'vh';
        particle.style.borderRadius = '50%';
        particle.style.animation = `float ${Math.random() * 10 + 10}s infinite ease-in-out`;
        container.appendChild(particle);
    }
}

// Initialize particles
window.addEventListener('load', createParticles);

// Typing Effect
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

// Initialize typing on hero description
const heroDesc = document.querySelector('.hero-desc');
if (heroDesc) {
    const text = heroDesc.textContent;
    typeWriter(heroDesc, text, 30);
}

// 3D Card Tilt Effect
document.querySelectorAll('.floating-card, .stack-item').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateY = (x - centerX) / 25;
        const rotateX = (centerY - y) / 25;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

// Performance optimization: Debounce scroll events
let scrollTimeout;
window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateScrollEffects, 10);
});

function updateScrollEffects() {
    const scrolled = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = 1 - scrolled / 1000;
    }

}



// ================================================
// ADD THIS CODE TO YOUR EXISTING script.js FILE
// ================================================

// Admin Panel Integration
// --------------------------------------------------

// Check and load admin settings
function loadAdminSettings() {
    try {
        // Check if settings exist in localStorage
        const savedSettings = localStorage.getItem('portfolio_admin_settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Apply theme colors if they exist
            if (settings.theme) {
                document.documentElement.style.setProperty('--primary', settings.theme.primary || '#6C63FF');
                document.documentElement.style.setProperty('--secondary', settings.theme.secondary || '#FF6584');
                document.documentElement.style.setProperty('--accent', settings.theme.accent || '#36D1DC');
            }
            
            // Update contact info on the page
            updateContactInfo(settings);
            
            // Update social links if on contact page
            if (window.location.pathname.includes('contact.html')) {
                updateSocialLinks(settings.social);
            }
        }
    } catch (error) {
        console.log('No admin settings found or error loading:', error);
    }
}

// Update contact information dynamically
function updateContactInfo(settings) {
    // Update email
    if (settings.contactEmail) {
        document.querySelectorAll('[data-email]').forEach(el => {
            el.textContent = settings.contactEmail;
            if (el.tagName === 'A') el.href = `mailto:${settings.contactEmail}`;
        });
    }
    
    // Update phone
    if (settings.phone) {
        document.querySelectorAll('[data-phone]').forEach(el => {
            el.textContent = settings.phone;
            if (el.tagName === 'A') el.href = `tel:${settings.phone}`;
        });
    }
    
    // Update address
    if (settings.address) {
        document.querySelectorAll('[data-address]').forEach(el => {
            el.textContent = settings.address;
        });
    }
    
    // Update site title
    if (settings.siteTitle) {
        document.title = settings.siteTitle + (document.title.includes('|') ? document.title.substring(document.title.indexOf('|')) : '');
        const titleEl = document.querySelector('[data-site-title]');
        if (titleEl) titleEl.textContent = settings.siteTitle;
    }
}

// Update social links
function updateSocialLinks(social) {
    if (!social) return;
    
    const socialMap = {
        'github': '.fa-github',
        'linkedin': '.fa-linkedin',
        'twitter': '.fa-twitter',
        'codepen': '.fa-codepen'
    };
    
    for (const [platform, selector] of Object.entries(socialMap)) {
        if (social[platform]) {
            document.querySelectorAll(selector).forEach(icon => {
                const link = icon.closest('a');
                if (link) link.href = social[platform];
            });
        }
    }
}

// Admin authentication helper
function isAdminLoggedIn() {
    return localStorage.getItem('portfolio_admin_logged_in') === 'true';
}

// Function to handle contact form data storage
function saveContactMessage(formData) {
    try {
        // Get existing messages or create new array
        const messages = JSON.parse(localStorage.getItem('portfolio_contact_messages') || '[]');
        
        // Add new message
        messages.unshift({
            id: Date.now(),
            ...formData,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Save back to localStorage (limit to 100 messages)
        localStorage.setItem('portfolio_contact_messages', 
            JSON.stringify(messages.slice(0, 100))
        );
        
        // Update message count badge if admin is viewing
        updateMessageBadge();
        
        return true;
    } catch (error) {
        console.error('Failed to save message:', error);
        return false;
    }
}

// Update message badge count
function updateMessageBadge() {
    if (window.location.pathname.includes('admin')) {
        try {
            const messages = JSON.parse(localStorage.getItem('portfolio_contact_messages') || '[]');
            const unreadCount = messages.filter(m => !m.read).length;
            
            const badge = document.getElementById('messageBadge') || 
                         document.querySelector('.message-badge');
            
            if (badge) {
                badge.textContent = unreadCount > 0 ? unreadCount : '';
                badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
            }
        } catch (error) {
            console.error('Failed to update badge:', error);
        }
    }
}

// Project data management
function getProjects() {
    try {
        return JSON.parse(localStorage.getItem('portfolio_projects') || '[]');
    } catch (error) {
        console.error('Failed to load projects:', error);
        return [];
    }
}

function saveProjects(projects) {
    try {
        localStorage.setItem('portfolio_projects', JSON.stringify(projects));
        return true;
    } catch (error) {
        console.error('Failed to save projects:', error);
        return false;
    }
}

// Initialize admin features on page load
function initAdminFeatures() {
    // Load settings on all pages
    loadAdminSettings();
    
    // If on admin pages, check authentication
    if (window.location.pathname.includes('admin-')) {
        checkAdminAuth();
    }
    
    // If on contact page, add message saving
    if (window.location.pathname.includes('contact.html')) {
        setupContactForm();
    }
    
    // If on projects page, load from localStorage
    if (window.location.pathname.includes('projects.html')) {
        loadProjectsFromStorage();
    }
}

// Check admin authentication
function checkAdminAuth() {
    // Skip login page
    if (window.location.pathname.includes('admin-login.html')) return;
    
    // Check if logged in
    if (!isAdminLoggedIn()) {
        window.location.href = 'admin-login.html';
    }
}

// Setup contact form to save messages
function setupContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // Store original submit handler
    const originalSubmit = contactForm.onsubmit;
    
    contactForm.addEventListener('submit', function(e) {
        // Get form data
        const formData = {
            name: document.getElementById('name')?.value.trim(),
            email: document.getElementById('email')?.value.trim(),
            subject: document.getElementById('subject')?.value.trim() || 'No subject',
            message: document.getElementById('message')?.value.trim()
        };
        
        // Save to localStorage
        if (formData.name && formData.email && formData.message) {
            saveContactMessage(formData);
        }
        
        // Call original submit handler if it exists
        if (originalSubmit) {
            return originalSubmit.call(this, e);
        }
    });
}

// Load projects from localStorage
function loadProjectsFromStorage() {
    const projectsContainer = document.getElementById('projectsContainer');
    if (!projectsContainer) return;
    
    const storedProjects = getProjects();
    if (storedProjects.length > 0) {
        // You can add logic here to update projects display
        console.log('Loaded projects from storage:', storedProjects.length);
    }
}

// ================================================
// EVENT LISTENERS - Add these at the end
// ================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize admin features
    initAdminFeatures();
    
    // Listen for settings updates from admin panel
    window.addEventListener('storage', function(e) {
        if (e.key === 'portfolio_admin_settings') {
            loadAdminSettings();
        }
        if (e.key === 'portfolio_contact_messages') {
            updateMessageBadge();
        }
    });
    
    // Custom event for settings update
    window.addEventListener('portfolioSettingsUpdated', function(e) {
        if (e.detail) {
            localStorage.setItem('portfolio_admin_settings', JSON.stringify(e.detail));
            loadAdminSettings();
        }
    });
});

// Make functions available globally for admin panel
window.AdminHelper = {
    loadSettings: loadAdminSettings,
    saveMessage: saveContactMessage,
    getMessages: function() {
        try {
            return JSON.parse(localStorage.getItem('portfolio_contact_messages') || '[]');
        } catch {
            return [];
        }
    },
    markMessageRead: function(messageId) {
        const messages = this.getMessages();
        const message = messages.find(m => m.id === messageId);
        if (message) {
            message.read = true;
            localStorage.setItem('portfolio_contact_messages', JSON.stringify(messages));
            updateMessageBadge();
        }
    }
};
