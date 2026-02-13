import { messaging, getToken, onMessage } from './firebase-config.js';
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { db } from './firebase-config.js';

class PushNotificationManager {
    constructor() {
        // VAPID key for push notifications (generated from Firebase Console)
        this.vapidKey = 'BE5EFzA_GhOcHnGPXQi3KRLzwL11CS5g80A4fLyCzhd7oICLYAvCTB2vZZQBiyRe-gxYmAsvw0ib_F21XVm7L5Q';
        this.isSupported = this.checkSupport();
        this.init();
    }

    checkSupport() {
        return 'serviceWorker' in navigator && 
               'PushManager' in window && 
               'Notification' in window &&
               messaging;
    }

    async init() {
        if (!this.isSupported) {
            console.warn('Push notifications are not supported in this browser');
            return;
        }

        try {
            // Register service worker
            await this.registerServiceWorker();
            
            // Request permission and get token
            await this.requestPermissionAndGetToken();
            
            // Listen for foreground messages
            this.setupForegroundMessageHandler();
            
        } catch (error) {
            console.error('Error initializing push notifications:', error);
        }
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Register the Firebase messaging service worker
                let registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
                    scope: '/'
                });
                
                // Wait for service worker to be ready
                await navigator.serviceWorker.ready;
                
                console.log('Firebase messaging service worker registered:', registration);
                
                // For mobile compatibility, also set the service worker registration for messaging
                if (messaging && 'useServiceWorker' in messaging) {
                    messaging.useServiceWorker(registration);
                }
                
                return registration;
            } catch (error) {
                console.error('Service worker registration failed:', error);
                throw error;
            }
        }
    }

    async requestPermissionAndGetToken() {
        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                console.log('Notification permission granted');
                
                // Get FCM token
                const token = await getToken(messaging, { 
                    vapidKey: this.vapidKey 
                });
                
                if (token) {
                    console.log('FCM Token:', token);
                    await this.saveTokenToDatabase(token);
                    return token;
                } else {
                    console.warn('No registration token available');
                }
            } else {
                console.warn('Notification permission denied');
            }
        } catch (error) {
            console.error('Error getting permission or token:', error);
        }
    }

    async saveTokenToDatabase(token) {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const tokenRef = doc(db, "fcmTokens", userId);
            await setDoc(tokenRef, {
                token: token,
                userId: userId,
                updatedAt: serverTimestamp(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
                notificationPermission: Notification.permission,
                pushManagerSupported: 'PushManager' in window,
                serviceWorkerSupported: 'serviceWorker' in navigator
            }, { merge: true });
            
            console.log('FCM token saved to database for mobile device');
        } catch (error) {
            console.error('Error saving token to database:', error);
        }
    }

    setupForegroundMessageHandler() {
        onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            
            // Show in-app notification
            this.showInAppNotification(payload);
            
            // Also show browser notification if page is not focused
            if (document.hidden) {
                this.showBrowserNotification(payload);
            }
        });
    }

    showInAppNotification(payload) {
        // Trigger the existing notification system
        const notificationEvent = new CustomEvent('fcmNotification', {
            detail: {
                title: payload.notification?.title || 'New Notification',
                body: payload.notification?.body || '',
                data: payload.data || {}
            }
        });
        
        document.dispatchEvent(notificationEvent);
    }

    showBrowserNotification(payload) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const title = payload.notification?.title || 'BioMedix';
            const options = {
                body: payload.notification?.body || '',
                icon: '/icons/ikona(svitla).png',
                badge: '/favicon.ico',
                tag: 'biomedix-notification',
                requireInteraction: true
            };

            new Notification(title, options);
        }
    }

    // Method to manually refresh token (call this when user logs in)
    async refreshToken() {
        if (this.isSupported) {
            await this.requestPermissionAndGetToken();
        }
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if user is logged in
    const userId = localStorage.getItem('userId');
    if (userId) {
        window.pushNotificationManager = new PushNotificationManager();
    }
});

// Listen for custom FCM notifications and update UI
document.addEventListener('fcmNotification', (event) => {
    const { title, body, data } = event.detail;
    
    // Update notification badge/counter
    const notificationBadges = document.querySelectorAll('.notification-badge');
    notificationBadges.forEach(badge => {
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        badge.classList.remove('d-none');
    });
    
    // Show alert if notifications panel is not visible
    const notificationsPanel = document.getElementById('notificationsPanel');
    if (!notificationsPanel || notificationsPanel.style.display === 'none') {
        // Show a small toast notification
        showNotificationToast(title, body);
    }
});

function showNotificationToast(title, body) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast notification-toast position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="toast-header">
            <i class="bi bi-bell text-primary me-2"></i>
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
        </div>
        <div class="toast-body">
            ${body}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    bsToast.show();
    
    // Remove from DOM after hiding
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

export { PushNotificationManager };
