import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Utility functions for managing read notifications
function getReadNotifications() {
    const stored = localStorage.getItem('readNotifications');
    return stored ? JSON.parse(stored) : [];
}

function markNotificationAsRead(notificationId) {
    const readNotifications = getReadNotifications();
    if (!readNotifications.includes(notificationId)) {
        readNotifications.push(notificationId);
        localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
        console.log(`Marked notification ${notificationId} as read`);
    }
}

function markAllNotificationsAsRead(notificationIds) {
    const readNotifications = getReadNotifications();
    let hasNewReads = false;
    
    notificationIds.forEach(id => {
        if (!readNotifications.includes(id)) {
            readNotifications.push(id);
            hasNewReads = true;
        }
    });
    
    if (hasNewReads) {
        localStorage.setItem('readNotifications', JSON.stringify(readNotifications));
        console.log(`Marked ${notificationIds.length} notifications as read`);
    }
}

function cleanupOldReadNotifications(currentNotificationIds) {
    // Remove read notification IDs that are no longer in the current notifications
    // This prevents localStorage from growing indefinitely
    const readNotifications = getReadNotifications();
    const cleanedReadNotifications = readNotifications.filter(id => 
        currentNotificationIds.includes(id)
    );
    
    if (cleanedReadNotifications.length !== readNotifications.length) {
        localStorage.setItem('readNotifications', JSON.stringify(cleanedReadNotifications));
        console.log(`Cleaned up ${readNotifications.length - cleanedReadNotifications.length} old read notification records`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Notifications.js loaded");
    
    // Find UI elements
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsBtnDesktop = document.getElementById('notificationsBtnDesktop');
    const notificationBadge = document.querySelector('.notification-badge');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsTabPanel = document.getElementById('notificationsTabPanel');
    
    if (!notificationsBtn && !notificationsBtnDesktop) {
        console.log("Notification elements not found on page");
        return;
    }
    
    // Function to handle notification button clicks
    function handleNotificationClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (notificationsPanel.style.display === 'none') {
            notificationsPanel.style.display = 'block';
            console.log('Notifications panel opened');
            
            // Mark all current notifications as read when panel is opened
            markAllCurrentNotificationsAsRead();
            
        } else {
            notificationsPanel.style.display = 'none';
            console.log('Notifications panel closed');
        }
    }
    
    // Add manual dropdown toggle for both buttons
    if (notificationsPanel) {
        if (notificationsBtn) {
            notificationsBtn.addEventListener('click', handleNotificationClick);
        }
        if (notificationsBtnDesktop) {
            notificationsBtnDesktop.addEventListener('click', handleNotificationClick);
        }
        
        // Close panel when clicking outside
        document.addEventListener('click', function(e) {
            const isNotificationBtn = (notificationsBtn && notificationsBtn.contains(e.target)) || 
                                    (notificationsBtnDesktop && notificationsBtnDesktop.contains(e.target));
            
            if (!isNotificationBtn && !notificationsPanel.contains(e.target)) {
                notificationsPanel.style.display = 'none';
            }
        });
    }
    
    // Handle notifications tab functionality
    if (notificationsTabPanel) {
        const notificationsTab = document.getElementById('notifications-tab');
        if (notificationsTab) {
            notificationsTab.addEventListener('shown.bs.tab', function() {
                // Mark all notifications as read when tab is opened
                markAllCurrentNotificationsAsRead();
                // Update the tab panel with current notifications
                updateNotificationsTabPanel();
            });
        }
        
        // Handle clear all notifications button
        const clearAllBtn = document.getElementById('clearAllNotificationsBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', function() {
                if (confirm('Are you sure you want to clear all notifications? This will mark all notifications as read.')) {
                    clearAllNotifications();
                }
            });
        }
    }
    
    // Keep track of current notifications for marking as read
    let currentNotificationIds = [];
    
    function markAllCurrentNotificationsAsRead() {
        if (currentNotificationIds.length > 0) {
            markAllNotificationsAsRead(currentNotificationIds);
            // Update badge immediately
            updateNotificationBadge();
        }
    }
    
    // Set up notifications listener
    setupNotificationsListener();
    
    // Initialize badge state immediately
    updateNotificationBadge();
    
    function setupNotificationsListener() {
        console.log("Setting up notifications listener");
        
        // Create a query for notifications, sorted by timestamp
        const notificationsRef = collection(db, "notifications");
        const q = query(
            notificationsRef,
            orderBy("timestamp", "desc"),
            limit(10)
        );
        
        // Listen for notifications in real time
        onSnapshot(q, async (snapshot) => {
            console.log(`Received ${snapshot.size} notifications`);
            let notifications = [];
            
            if (snapshot.empty) {
                currentNotificationIds = [];
                if (notificationsPanel) {
                    notificationsPanel.innerHTML = '<div class="notifications-content"><div class="text-center p-3">No notifications</div></div>';
                }
                updateNotificationBadge();
                return;
            }
            
            const readNotifications = getReadNotifications();
            
            // Accommodation status checking removed
            
            // Process all notifications and filter based on target audience
            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Check if notification should be shown to this user
                const targetAudience = data.targetAudience;
                
                // Accommodation filtering removed
                
                notifications.push({
                    id: doc.id,
                    title: data.title || 'Notification',
                    message: data.message || '',
                    timestamp: data.timestamp,
                    targetAudience: targetAudience,
                    isRead: readNotifications.includes(doc.id)
                });
            });
            
            // Update current notification IDs
            currentNotificationIds = notifications.map(n => n.id);
            currentNotifications = notifications; // Store for tab panel
            
            // Clean up old read notification records
            cleanupOldReadNotifications(currentNotificationIds);
            
            // Update badge with unread count
            updateNotificationBadge();
            
            // Update notifications panel
            if (notificationsPanel) {
                updateNotificationsPanel(notifications);
            }
            
            // Update notifications tab panel if it exists
            if (notificationsTabPanel) {
                updateNotificationsTabPanel(notifications);
            }
            
        }, (error) => {
            console.error("Error getting notifications:", error);
        });
    }
    
    function updateNotificationBadge() {
        const readNotifications = getReadNotifications();
        const unreadCount = currentNotificationIds.filter(id => !readNotifications.includes(id)).length;
        
        console.log(`Unread notifications count: ${unreadCount}`);
        
        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.classList.remove('d-none');
        } else {
            notificationBadge.classList.add('d-none');
        }
    }
    
    // Function to update the notifications panel UI
    function updateNotificationsPanel(notifications) {
        if (!notificationsPanel) return;
        
        // Clear current content
        notificationsPanel.innerHTML = '';
        
        if (notifications.length === 0) {
            notificationsPanel.innerHTML = '<div class="notifications-content"><div class="text-center p-3">No notifications</div></div>';
            return;
        }
        
        // Create container
        const container = document.createElement('div');
        container.className = 'notifications-content';
        
        // Add each notification
        notifications.forEach(notification => {
            // Format date
            let formattedDate = "Recent";
            if (notification.timestamp) {
                const date = notification.timestamp.toDate ? 
                    notification.timestamp.toDate() : 
                    new Date(notification.timestamp.seconds * 1000);
                
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
                
                if (isToday) {
                    formattedDate = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (isYesterday) {
                    formattedDate = `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                } else {
                    formattedDate = date.toLocaleDateString([], { day: 'numeric', month: 'short' });
                }
            }
            
            // Style based on read status
            const headerBgColor = notification.isRead ? '#f8f9fa' : '#fff';
            const unreadIndicator = notification.isRead ? '' : '<span style="color: #007bff; font-weight: bold; margin-left: 5px;">•</span>';
            
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-expandable';
            notificationItem.innerHTML = `
                <div class="notification-header" style="cursor: pointer; padding: 10px; border-bottom: 1px solid #eee; background-color: ${headerBgColor}; color: #333;">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong style="color: #333;">${notification.title}${unreadIndicator}</strong>
                        <small class="text-muted" style="color: #666;">${formattedDate}</small>
                    </div>
                    <i class="bi bi-chevron-down mt-1" style="color: #333;"></i>
                </div>
                <div class="notification-details" style="display: none; padding: 10px; background-color: #f8f9fa; border-bottom: 1px solid #eee; color: #555;">
                    <p class="mb-0" style="color: #555;">${notification.message}</p>
                </div>
            `;
            
            // Add click handler for expanding
            const header = notificationItem.querySelector('.notification-header');
            const details = notificationItem.querySelector('.notification-details');
            const icon = notificationItem.querySelector('i');
            
            header.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Mark this notification as read when expanded
                if (!notification.isRead) {
                    markNotificationAsRead(notification.id);
                    notification.isRead = true;
                    
                    // Update visual style
                    header.style.backgroundColor = '#f8f9fa';
                    const unreadDot = header.querySelector('span');
                    if (unreadDot) {
                        unreadDot.remove();
                    }
                    
                    // Update badge
                    updateNotificationBadge();
                }
                
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            
            container.appendChild(notificationItem);
        });
        
        notificationsPanel.appendChild(container);
    }
    
    // Function to update the notifications tab panel UI
    function updateNotificationsTabPanel(notifications = currentNotifications) {
        if (!notificationsTabPanel) return;
        
        // Clear current content
        notificationsTabPanel.innerHTML = '';
        
        if (!notifications || notifications.length === 0) {
            notificationsTabPanel.innerHTML = `
                <div class="text-center p-5">
                    <i class="bi bi-bell-slash fs-1 text-muted mb-3"></i>
                    <h5 class="text-muted">No notifications</h5>
                    <p class="text-muted">Conference notifications will appear here when available.</p>
                </div>
            `;
            return;
        }
        
        // Create container
        const container = document.createElement('div');
        container.className = 'notifications-content';
        
        // Add each notification with enhanced styling for tab view
        notifications.forEach(notification => {
            // Format date
            let formattedDate = "Recent";
            if (notification.timestamp) {
                const date = notification.timestamp.toDate ? 
                    notification.timestamp.toDate() : 
                    new Date(notification.timestamp.seconds * 1000);
                
                const now = new Date();
                const isToday = date.toDateString() === now.toDateString();
                const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
                
                if (isToday) {
                    formattedDate = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } else if (isYesterday) {
                    formattedDate = `Yesterday, ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                } else {
                    formattedDate = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
                }
            }
            
            // Style based on read status
            const headerBgColor = notification.isRead ? '#f8f9fa' : '#fff';
            const unreadIndicator = notification.isRead ? '' : '<span style="color: #007bff; font-weight: bold; margin-left: 8px;">•</span>';
            const borderColor = notification.isRead ? '#e9ecef' : '#007bff';
            
            const notificationCard = document.createElement('div');
            notificationCard.className = 'card mb-3';
            notificationCard.style.borderLeft = `4px solid ${borderColor}`;
            notificationCard.innerHTML = `
                <div class="card-header notification-tab-header" style="cursor: pointer; background-color: ${headerBgColor};">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${notification.title}${unreadIndicator}</h6>
                        <div class="d-flex align-items-center">
                            <small class="text-muted me-2">${formattedDate}</small>
                            <i class="bi bi-chevron-down"></i>
                        </div>
                    </div>
                </div>
                <div class="card-body notification-tab-details" style="display: none;">
                    <p class="card-text">${notification.message}</p>
                </div>
            `;
            
            // Add click handler for expanding
            const header = notificationCard.querySelector('.notification-tab-header');
            const details = notificationCard.querySelector('.notification-tab-details');
            const icon = notificationCard.querySelector('i');
            
            header.addEventListener('click', function(e) {
                e.stopPropagation();
                
                // Mark this notification as read when expanded
                if (!notification.isRead) {
                    markNotificationAsRead(notification.id);
                    notification.isRead = true;
                    
                    // Update visual style
                    header.style.backgroundColor = '#f8f9fa';
                    notificationCard.style.borderLeft = '4px solid #e9ecef';
                    const unreadDot = header.querySelector('span');
                    if (unreadDot) {
                        unreadDot.remove();
                    }
                    
                    // Update badge
                    updateNotificationBadge();
                }
                
                if (details.style.display === 'none') {
                    details.style.display = 'block';
                    icon.classList.remove('bi-chevron-down');
                    icon.classList.add('bi-chevron-up');
                } else {
                    details.style.display = 'none';
                    icon.classList.remove('bi-chevron-up');
                    icon.classList.add('bi-chevron-down');
                }
            });
            
            container.appendChild(notificationCard);
        });
        
        notificationsTabPanel.appendChild(container);
    }
    
    // Keep reference to current notifications for tab panel
    let currentNotifications = [];
    
    // Function to clear all notifications for the user
    function clearAllNotifications() {
        const readNotifications = getReadNotifications();
        
        // Mark all current notifications as read
        if (currentNotificationIds.length > 0) {
            markAllNotificationsAsRead(currentNotificationIds);
        }
        
        // Update UI immediately
        updateNotificationBadge();
        
        // Update notification panels to show all as read
        if (notificationsPanel) {
            updateNotificationsPanel(currentNotifications);
        }
        if (notificationsTabPanel) {
            updateNotificationsTabPanel(currentNotifications);
        }
        
        console.log('All notifications cleared for user');
    }
});
