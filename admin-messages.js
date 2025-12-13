// Admin Messages Management - COMPLETE WORKING VERSION
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!isAdminAuthenticated()) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Initialize messages system
    initializeMessages();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial messages
    loadMessages();
});

function isAdminAuthenticated() {
    return localStorage.getItem('admin_logged_in') === 'true';
}

function initializeMessages() {
    // Ensure messages array exists in localStorage
    if (!localStorage.getItem('portfolio_messages')) {
        localStorage.setItem('portfolio_messages', JSON.stringify([]));
    }
    
    // Check for backup storage
    const backupMessages = localStorage.getItem('contact_messages_backup');
    if (backupMessages) {
        try {
            const messages = JSON.parse(backupMessages);
            if (messages.length > 0) {
                localStorage.setItem('portfolio_messages', JSON.stringify(messages));
            }
        } catch (error) {
            console.warn('Could not load backup messages:', error);
        }
    }
}

function loadMessages() {
    try {
        // Get all messages
        const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
        
        // Sort by timestamp (newest first)
        messages.sort((a, b) => {
            const timeA = new Date(a.timestamp || a.created || 0).getTime();
            const timeB = new Date(b.timestamp || b.created || 0).getTime();
            return timeB - timeA;
        });
        
        // Update statistics
        updateStatistics(messages);
        
        // Render messages
        renderMessages(messages);
        
        // Update URL if needed
        updateUrlFromHash();
        
    } catch (error) {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
    }
}

function updateStatistics(messages) {
    // Total messages
    const totalMessages = messages.length;
    document.getElementById('totalMessages')?.textContent = totalMessages;
    
    // Unread messages
    const unreadMessages = messages.filter(msg => !msg.read).length;
    document.getElementById('unreadMessages')?.textContent = unreadMessages;
    
    // Today's messages
    const today = new Date().toDateString();
    const todayMessages = messages.filter(msg => {
        const msgDate = new Date(msg.timestamp || msg.created || Date.now()).toDateString();
        return msgDate === today;
    }).length;
    document.getElementById('todayMessages')?.textContent = todayMessages;
    
    // Update badges
    document.querySelectorAll('.unread-badge, .message-badge').forEach(badge => {
        badge.textContent = unreadMessages > 0 ? unreadMessages : '';
        badge.style.display = unreadMessages > 0 ? 'inline-block' : 'none';
    });
}

function renderMessages(messages) {
    const container = document.getElementById('messagesContainer') || 
                     document.getElementById('messageList') ||
                     document.getElementById('recentMessages');
    
    if (!container) {
        console.warn('Messages container not found');
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No messages yet</h3>
                <p>Contact form messages will appear here once sent</p>
                <button onclick="testAddSampleMessage()" class="test-btn" style="margin-top: 1rem;">
                    <i class="fas fa-plus"></i> Add Test Message
                </button>
            </div>
        `;
        return;
    }
    
    // Create message list
    messages.forEach((message, index) => {
        const time = new Date(message.timestamp || message.created || Date.now());
        const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = time.toLocaleDateString();
        const initials = getInitials(message.name);
        const isUnread = !message.read;
        const messageId = message.id || index;
        
        const messageHTML = `
            <div class="message-item ${isUnread ? 'unread' : 'read'}" 
                 data-id="${messageId}"
                 onclick="showMessageDetail(${messageId})">
                <div class="message-preview">
                    <div class="message-name">
                        ${message.name}
                        ${isUnread ? '<span class="new-badge">NEW</span>' : ''}
                    </div>
                    <div class="message-email">${message.email}</div>
                    <div class="message-subject">${message.subject || 'No Subject'}</div>
                </div>
                <div class="message-time">
                    <div>${dateStr}</div>
                    <div>${timeStr}</div>
                </div>
            </div>
        `;
        
        container.innerHTML += messageHTML;
    });
}

function getInitials(name) {
    return name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function showMessageDetail(messageId) {
    const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
    const message = messages.find(msg => (msg.id || msg.timestamp) == messageId);
    
    if (!message) {
        alert('Message not found');
        return;
    }
    
    // Mark as read
    if (!message.read) {
        message.read = true;
        localStorage.setItem('portfolio_messages', JSON.stringify(messages));
        
        // Update UI
        const messageElement = document.querySelector(`[data-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.remove('unread');
            messageElement.classList.add('read');
        }
        
        // Update statistics
        updateStatistics(messages);
    }
    
    // Show detail view
    showMessageDetailModal(message);
}

function showMessageDetailModal(message) {
    // Create or update modal
    let modal = document.getElementById('messageDetailModal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'messageDetailModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Message Details</h3>
                    <button class="modal-close" onclick="closeMessageDetail()">&times;</button>
                </div>
                <div class="modal-body" id="modalMessageContent"></div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="replyToMessage('${message.email}')">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn-danger" onclick="deleteMessage(${message.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn-primary" onclick="closeMessageDetail()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add modal styles
        addModalStyles();
    }
    
    // Fill modal content
    const time = new Date(message.timestamp || message.created || Date.now());
    const formattedTime = time.toLocaleString();
    
    document.getElementById('modalMessageContent').innerHTML = `
        <div class="message-detail-content">
            <div class="detail-row">
                <strong>From:</strong> ${message.name}
            </div>
            <div class="detail-row">
                <strong>Email:</strong> <a href="mailto:${message.email}">${message.email}</a>
            </div>
            <div class="detail-row">
                <strong>Subject:</strong> ${message.subject || 'No Subject'}
            </div>
            <div class="detail-row">
                <strong>Received:</strong> ${formattedTime}
            </div>
            <div class="detail-row">
                <strong>Message:</strong>
            </div>
            <div class="message-body">
                ${message.message.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;
    
    // Show modal
    modal.style.display = 'flex';
}

function addModalStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
            z-index: 10000;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .modal-content {
            background: var(--dark-secondary);
            border: 1px solid var(--glass-border);
            border-radius: 16px;
            width: 100%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease;
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .modal-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            color: var(--light);
        }
        
        .modal-close {
            background: none;
            border: none;
            color: var(--gray);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--light);
        }
        
        .modal-body {
            padding: 1.5rem;
        }
        
        .modal-footer {
            padding: 1.5rem;
            border-top: 1px solid var(--glass-border);
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        .message-detail-content {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .detail-row {
            display: flex;
            gap: 0.5rem;
            align-items: flex-start;
        }
        
        .detail-row strong {
            min-width: 80px;
            color: var(--primary);
        }
        
        .message-body {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            line-height: 1.6;
            white-space: pre-wrap;
        }
        
        .btn-primary, .btn-secondary, .btn-danger {
            padding: 0.5rem 1.5rem;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-family: inherit;
            font-weight: 500;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        
        .btn-secondary {
            background: var(--glass);
            border: 1px solid var(--glass-border);
            color: var(--light);
        }
        
        .btn-danger {
            background: rgba(239, 68, 68, 0.2);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #EF4444;
        }
        
        .btn-primary:hover, .btn-secondary:hover, .btn-danger:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .new-badge {
            background: #EF4444;
            color: white;
            font-size: 0.7rem;
            padding: 0.2rem 0.5rem;
            border-radius: 10px;
            margin-left: 0.5rem;
        }
    `;
    document.head.appendChild(style);
}

function closeMessageDetail() {
    const modal = document.getElementById('messageDetailModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function replyToMessage(email) {
    window.open(`mailto:${email}`, '_blank');
}

function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }
    
    try {
        const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
        const updatedMessages = messages.filter(msg => (msg.id || msg.timestamp) != messageId);
        
        localStorage.setItem('portfolio_messages', JSON.stringify(updatedMessages));
        
        // Close modal if open
        closeMessageDetail();
        
        // Reload messages
        loadMessages();
        
        // Show success message
        showSuccess('Message deleted successfully');
        
    } catch (error) {
        console.error('Error deleting message:', error);
        showError('Failed to delete message');
    }
}

function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterMessages(filter);
        });
    });
    
    // Mark all as read
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllAsRead);
    }
    
    // Export messages
    const exportBtn = document.getElementById('exportMessagesBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportMessages);
    }
    
    // Import messages
    const importBtn = document.getElementById('importMessagesBtn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            document.getElementById('importFileInput')?.click();
        });
    }
    
    // Listen for new messages from contact form
    window.addEventListener('storage', function(event) {
        if (event.key === 'portfolio_messages' || event.key === 'portfolio_messages_updated') {
            loadMessages();
        }
    });
}

function filterMessages(filter) {
    const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
    let filteredMessages = [...messages];
    
    switch(filter) {
        case 'unread':
            filteredMessages = filteredMessages.filter(msg => !msg.read);
            break;
        case 'read':
            filteredMessages = filteredMessages.filter(msg => msg.read);
            break;
        case 'today':
            const today = new Date().toDateString();
            filteredMessages = filteredMessages.filter(msg => {
                const msgDate = new Date(msg.timestamp || msg.created || Date.now()).toDateString();
                return msgDate === today;
            });
            break;
        // 'all' shows all messages
    }
    
    renderMessages(filteredMessages);
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });
}

function markAllAsRead() {
    try {
        const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
        messages.forEach(msg => msg.read = true);
        localStorage.setItem('portfolio_messages', JSON.stringify(messages));
        
        loadMessages();
        showSuccess('All messages marked as read');
        
    } catch (error) {
        console.error('Error marking messages as read:', error);
        showError('Failed to mark messages as read');
    }
}

function exportMessages() {
    try {
        const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
        const dataStr = JSON.stringify(messages, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `messages-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showSuccess('Messages exported successfully');
        
    } catch (error) {
        console.error('Error exporting messages:', error);
        showError('Failed to export messages');
    }
}

function importMessages(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedMessages = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedMessages)) {
                throw new Error('Invalid file format');
            }
            
            // Merge with existing messages
            const existingMessages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
            const allMessages = [...importedMessages, ...existingMessages];
            
            // Remove duplicates by ID/timestamp
            const uniqueMessages = [];
            const seen = new Set();
            
            allMessages.forEach(msg => {
                const key = msg.id || msg.timestamp || JSON.stringify(msg);
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueMessages.push(msg);
                }
            });
            
            localStorage.setItem('portfolio_messages', JSON.stringify(uniqueMessages));
            loadMessages();
            showSuccess('Messages imported successfully');
            
        } catch (error) {
            console.error('Error importing messages:', error);
            showError('Invalid file format');
        }
    };
    
    reader.readAsText(file);
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.admin-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .admin-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--dark-secondary);
            border: 1px solid var(--glass-border);
            border-radius: 10px;
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        }
        
        .admin-notification.success {
            border-left: 4px solid #10B981;
        }
        
        .admin-notification.error {
            border-left: 4px solid #EF4444;
        }
        
        .admin-notification i {
            font-size: 1.2rem;
        }
        
        .admin-notification.success i {
            color: #10B981;
        }
        
        .admin-notification.error i {
            color: #EF4444;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Test function - add sample message
function testAddSampleMessage() {
    const testMessage = {
        id: Date.now(),
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Message',
        message: 'This is a test message to verify the system is working.',
        timestamp: new Date().toISOString(),
        read: false
    };
    
    const messages = JSON.parse(localStorage.getItem('portfolio_messages') || '[]');
    messages.unshift(testMessage);
    localStorage.setItem('portfolio_messages', JSON.stringify(messages));
    
    loadMessages();
    showSuccess('Test message added successfully');
}

// Make functions available globally
window.showMessageDetail = showMessageDetail;
window.deleteMessage = deleteMessage;
window.closeMessageDetail = closeMessageDetail;
window.replyToMessage = replyToMessage;
window.testAddSampleMessage = testAddSampleMessage;
window.markAllAsRead = markAllAsRead;
window.exportMessages = exportMessages;

// Listen for messages from contact form
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'NEW_MESSAGE') {
        loadMessages();
    }
});
