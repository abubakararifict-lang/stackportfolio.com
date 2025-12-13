// Contact form submission with validation
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
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                subject: document.getElementById('subject').value.trim(),
                message: document.getElementById('message').value.trim()
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
                // Try to save message to admin panel
                if (typeof window.PortfolioAdmin !== 'undefined') {
                    window.PortfolioAdmin.addMessage(formData);
                    console.log('Message saved to admin panel');
                }
                
                // Save to localStorage for admin access
                saveMessageToLocal(formData);
                
                // Simulate API call (for demo)
                setTimeout(() => {
                    showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
                    contactForm.reset();
                    resetButton(submitBtn, originalText);
                }, 1500);
                
            } catch (error) {
                showNotification('Error sending message. Please try again.', 'error');
                console.error('Contact form error:', error);
                resetButton(submitBtn, originalText);
            }
        });
    }
    
    function showNotification(message, type = 'info') {
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
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
    
    function saveMessageToLocal(formData) {
        try {
            const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
            messages.unshift({
                ...formData,
                id: Date.now(),
                timestamp: new Date().toISOString(),
                read: false
            });
            localStorage.setItem('portfolio_messages', JSON.stringify(messages));
            return true;
        } catch (error) {
            console.error('Failed to save message locally:', error);
            return false;
        }
    }
});
