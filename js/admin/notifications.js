import { db } from '../firebase-config.js';
import { 
    collection, 
    addDoc, 
    doc,
    deleteDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Function to create a new notification (for admin use)
export async function createNotification(title, message) {
    try {
        console.log("Creating notification:", title);
        
        const notificationData = {
            title,
            message,
            timestamp: serverTimestamp(),
            createdBy: localStorage.getItem('userId') || 'system'
        };
        
        const notificationsRef = collection(db, "notifications");
        const docRef = await addDoc(notificationsRef, notificationData);
        
        console.log("Notification created with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating notification:", error);
        return { success: false, error: error.message };
    }
}

// Function to delete all notifications (admin only)
export async function clearAllNotifications() {
    try {
        console.log("Clearing all notifications...");
        
        // Get all notifications
        const notificationsRef = collection(db, "notifications");
        const querySnapshot = await getDocs(notificationsRef);
        
        if (querySnapshot.empty) {
            return { success: true, deletedCount: 0 };
        }
        
        // Delete all notifications
        const deletePromises = [];
        querySnapshot.forEach((doc) => {
            deletePromises.push(deleteDoc(doc.ref));
        });
        
        await Promise.all(deletePromises);
        
        console.log(`Successfully deleted ${querySnapshot.size} notifications`);
        return { success: true, deletedCount: querySnapshot.size };
    } catch (error) {
        console.error("Error clearing all notifications:", error);
        return { success: false, error: error.message };
    }
}

// Function to delete a notification (for admin use)
export async function deleteNotification(notificationId) {
    try {
        console.log("Deleting notification:", notificationId);
        
        const notificationRef = doc(db, "notifications", notificationId);
        await deleteDoc(notificationRef);
        
        console.log("Notification deleted successfully");
        return { success: true };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { success: false, error: error.message };
    }
}

// Example usage (for testing)
document.addEventListener('DOMContentLoaded', function() {
    // Admin-only functionality
    if (localStorage.getItem('userRole') !== 'admin') return;
      // If on admin page, set up notification creation form
    const notificationForm = document.getElementById('sendNotificationForm');
    if (notificationForm) {
        notificationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const title = document.getElementById('notificationTitle').value.trim();
            // Get content from TinyMCE editor instead of textarea directly
            let message;
            if (window.tinymce && tinymce.get('notificationMessage')) {
                message = tinymce.get('notificationMessage').getContent().trim();
            } else {
                message = document.getElementById('notificationMessage').value.trim();
            }
            const target = document.getElementById('notificationTarget').value;
            
            if (!title || !message) {
                alert('Both title and message are required');
                return;
            }
            
            let result;
            // Accommodation targeting removed
            } else {
                result = await createNotification(title, message);
                if (result.success) {
                    alert('Notification created successfully');
                } else {
                    alert(`Error creating notification: ${result.error}`);
                }
            }
            
            if (result.success) {
                notificationForm.reset();
                // Clear TinyMCE editor content
                if (window.tinymce && tinymce.get('notificationMessage')) {
                    tinymce.get('notificationMessage').setContent('');
                }
                // Reload recent notifications if element exists
                loadRecentNotifications();
            }
        });
    }

    // Load recent notifications if applicable
    if (document.getElementById('recentNotifications')) {
        loadRecentNotifications();
    }
    
    // Add clear all notifications button functionality
    const clearAllNotificationsBtn = document.getElementById('adminClearAllNotificationsBtn');
    if (clearAllNotificationsBtn) {
        clearAllNotificationsBtn.addEventListener('click', async function() {
            if (!confirm('Are you sure you want to delete ALL notifications? This action cannot be undone.')) {
                return;
            }
            
            try {
                const result = await clearAllNotifications();
                if (result.success) {
                    alert(`Successfully deleted ${result.deletedCount} notifications`);
                    loadRecentNotifications(); // Reload the list
                } else {
                    alert(`Error deleting notifications: ${result.error}`);
                }
            } catch (error) {
                console.error('Error clearing all notifications:', error);
                alert(`Error clearing notifications: ${error.message}`);
            }
        });
    }
});

// Function to load recent notifications
async function loadRecentNotifications() {
    try {
        console.log("Loading recent notifications...");
        
        const recentNotificationsElement = document.getElementById('recentNotifications');
        if (!recentNotificationsElement) return;
        
        // Show loading state
        recentNotificationsElement.innerHTML = '<div class="list-group-item text-center">Loading notifications...</div>';
        
        // Create query to get recent notifications
        const notificationsRef = collection(db, "notifications");
        const q = query(
            notificationsRef,
            orderBy("timestamp", "desc"),
            limit(20)
        );
        
        // Get notifications
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            recentNotificationsElement.innerHTML = '<div class="list-group-item text-center text-muted">No notifications found</div>';
            return;
        }
        
        // Build notifications list
        let notificationsHtml = '';
        
        querySnapshot.forEach((doc) => {
            const notification = doc.data();
            const notificationId = doc.id;
            
            // Format timestamp
            let formattedDate = "Recent";
            if (notification.timestamp) {
                try {
                    const date = notification.timestamp.toDate();
                    formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                } catch (e) {
                    console.warn("Error formatting date:", e);
                }
            }
            
            // Truncate message for preview (strip HTML for preview)
            const messageText = notification.message.replace(/<[^>]*>/g, ''); // Strip HTML tags for preview
            const messagePreview = messageText.length > 100 
                ? messageText.substring(0, 100) + '...' 
                : messageText;
            
            notificationsHtml += `
                <div class="list-group-item notification-item" data-id="${notificationId}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="notification-header" style="cursor: pointer; flex-grow: 1;" onclick="toggleNotificationContent('${notificationId}')">
                            <h6 class="mb-1">${notification.title}</h6>
                            <p class="mb-1 text-muted notification-preview" id="preview-${notificationId}">${messagePreview}</p>
                            <small class="text-muted">${formattedDate}</small>
                        </div>
                        <div class="ms-2">
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteNotificationFromList('${notificationId}')" title="Delete notification">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="notification-full-content d-none mt-2" id="content-${notificationId}">
                        <div class="alert alert-light">
                            <strong>Full Message:</strong><br>
                            <div style="margin-top: 8px;">${notification.message}</div>
                        </div>
                        <small class="text-muted">
                            <i class="bi bi-person"></i> Created by: ${notification.createdBy || 'Unknown'}
                        </small>
                    </div>
                </div>
            `;
        });
        
        recentNotificationsElement.innerHTML = notificationsHtml;
        
        console.log(`Loaded ${querySnapshot.size} notifications`);
        
    } catch (error) {
        console.error("Error loading notifications:", error);
        const recentNotificationsElement = document.getElementById('recentNotifications');
        if (recentNotificationsElement) {
            recentNotificationsElement.innerHTML = `
                <div class="list-group-item text-center text-danger">
                    Error loading notifications: ${error.message}
                </div>
            `;
        }
    }
}

// Send a new notification
async function sendNotification(e) {
    e.preventDefault();
    
    const titleInput = document.getElementById('notificationTitle');
    const messageInput = document.getElementById('notificationMessage');
    
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!title || !message) {
        alert("Please enter both a title and message");
        return;
    }
    
    try {
        // Add the notification to Firestore
        await addDoc(collection(db, "notifications"), {
            title,
            message,
            timestamp: serverTimestamp(),
            sentBy: localStorage.getItem('userId') || 'unknown'
        });
        
        // Clear the form
        titleInput.value = '';
        messageInput.value = '';
        
        // Show success message
        alert("Notification sent successfully");
        
        // Refresh the notifications list
        loadRecentNotifications();
        
    } catch (error) {
        console.error("Error sending notification:", error);
        alert(`Error sending notification: ${error.message}`);
    }
}

// Accommodation notification function removed
// export async function sendNotificationToAccommodationUsers(title, message) {
    try {
        const { collection, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js");
        const { db } = await import("../firebase-config.js");
        
        // Use a single query with array-contains or exists check instead of multiple != queries
        // This approach avoids the Firebase limitation of multiple != filters
        const usersRef = collection(db, "users");
        
        // Get all users and filter for accommodation info on the client side
        // This is more reliable than trying to create complex Firebase queries
        const allUsersQuery = await getDocs(usersRef);
        
        // Count users with accommodation info (non-empty accommodation field)
        let accommodationUsersCount = 0;
        allUsersQuery.forEach((doc) => {
            const userData = doc.data();
            if (userData.accommodation && userData.accommodation.trim() !== "") {
                accommodationUsersCount++;
            }
        });
        
        console.log(`Found ${accommodationUsersCount} users with accommodation information`);
        
        // Create notification data
        const notificationData = {
            title,
            message,
            timestamp: serverTimestamp(),
            targetAudience: 'accommodation_users',
            createdBy: localStorage.getItem('userId') || 'admin'
        };
        
        // Add notification to database
        const notificationsRef = collection(db, "notifications");
        const docRef = await addDoc(notificationsRef, notificationData);
        
        console.log("Accommodation-specific notification created with ID:", docRef.id);
        return { success: true, id: docRef.id, userCount: accommodationUsersCount };
    } catch (error) {
        console.error("Error sending notification to accommodation users:", error);
        return { success: false, error: error.message };
    }
}

// Global functions for notification interaction
window.toggleNotificationContent = function(notificationId) {
    const previewElement = document.getElementById(`preview-${notificationId}`);
    const contentElement = document.getElementById(`content-${notificationId}`);
    
    if (contentElement.classList.contains('d-none')) {
        // Show full content
        contentElement.classList.remove('d-none');
        previewElement.style.display = 'none';
    } else {
        // Hide full content
        contentElement.classList.add('d-none');
        previewElement.style.display = 'block';
    }
};

window.deleteNotificationFromList = async function(notificationId) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        const result = await deleteNotification(notificationId);
        
        if (result.success) {
            // Remove from UI
            const notificationElement = document.querySelector(`[data-id="${notificationId}"]`);
            if (notificationElement) {
                notificationElement.remove();
            }
            
            console.log('Notification deleted successfully');
        } else {
            alert(`Error deleting notification: ${result.error}`);
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        alert(`Error deleting notification: ${error.message}`);
    }
};
