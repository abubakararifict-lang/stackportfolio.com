// Contact form submission with validation - FIXED VERSION
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const notification = document.getElementById('notification');
    
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            
            // Disable button and show loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            // Get form data
            const formData = {
                id: Date.now(), // Unique ID
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim() || 'No Subject',
                message: document.getElementById('message').value.trim(),
                timestamp: new Date().toISOString(),
                read: false,
                ip: 'N/A', // Can add IP tracking if needed
                page: window.location.href
            };
            
            // Validation
            if (!formData.name || !formData.email || !formData.message) {
                showNotification('Please fill in all required fields', 'error');
                resetButton(submitBtn, originalText);
                return;
            }
            
            if (!validateEmail(formData.email)) {
                showNotification('Please enter a valid email address', 'error');
                resetButton(submitBtn, originalText);
                return;
            }
            
            try {
                // Save message to localStorage
                const success = saveMessageToStorage(formData);
                
                if (success) {
                    // Also save to admin storage if exists
                    if (typeof window.PortfolioAdmin !== 'undefined') {
                        window.PortfolioAdmin.addMessage(formData);
                    }
                    
                    // Simulate sending (for demo)
                    setTimeout(() => {
                        showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                        contactForm.reset();
                        resetButton(submitBtn, originalText);
                        
                        // Update admin badge if on same domain
                        updateAdminBadge();
                    }, 1000);
                    
                } else {
                    showNotification('Failed to save message. Please try again.', 'error');
                    resetButton(submitBtn, originalText);
                }
                
            } catch (error) {
                console.error('Contact form error:', error);
                showNotification('An error occurred. Please try again.', 'error');
                resetButton(submitBtn, originalText);
            }
        });
    }
    
    function saveMessageToStorage(messageData) {
        try {
            // Get existing messages
            const existingMessages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
            
            // Add new message
            existingMessages.unshift(messageData);
            
            // Save back to localStorage (keep only last 100 messages)
            const limitedMessages = existingMessages.slice(0, 100);
            localStorage.setItem('portfolio_messages', JSON.stringify(limitedMessages));
            
            // Also save to a backup key for reliability
            localStorage.setItem('contact_messages_backup', JSON.stringify(limitedMessages));
            
            console.log('Message saved:', messageData);
            return true;
            
        } catch (error) {
            console.error('Error saving message:', error);
            
            // Try alternative storage method
            try {
                // Fallback: Store in sessionStorage
                const fallbackMessages = JSON.parse(sessionStorage.getItem('portfolio_messages_temp') || '[]');
                fallbackMessages.unshift(messageData);
                sessionStorage.setItem('portfolio_messages_temp', JSON.stringify(fallbackMessages));
                return true;
            } catch (fallbackError) {
                console.error('Fallback storage also failed:', fallbackError);
                return false;
            }
        }
    }
    
    function showNotification(message, type = 'info') {
        if (!notification) {
            // Create notification if it doesn't exist
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function resetButton(button, originalText) {
        button.innerHTML = originalText;
        button.disabled = false;
    }
    
    function updateAdminBadge() {
        // Dispatch storage event to update other tabs/pages
        const event = new StorageEvent('storage', {
            key: 'portfolio_messages_updated',
            newValue: Date.now().toString()
        });
        window.dispatchEvent(event);
        
        // Also try to trigger admin update
        if (window.adminUpdateMessageCount) {
            window.adminUpdateMessageCount();
        }
    }
    
    // Test if localStorage is working
    function testLocalStorage() {
        try {
            const testKey = 'portfolio_test';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage not available:', error);
            return false;
        }
    }
    
    // Initialize
    if (!testLocalStorage()) {
        console.warn('localStorage may not be available. Messages may not persist.');
    }
});
