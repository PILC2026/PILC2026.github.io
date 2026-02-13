import { db } from './firebase-config.js';
import { 
    collection,
    doc,
    setDoc,
    addDoc,
    query,
    where,
    getDocs,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

class MassageReminderService {
    constructor() {
        this.init();
    }

    init() {
        // Listen for massage reminder notifications
        this.setupMassageReminderListener();
        
        // Automatic massage reminder checking disabled
        console.log('Automatic massage reminders are disabled');
        
        // Check for upcoming massage appointments every minute - disabled
        // setInterval(() => {
        //     this.checkUpcomingMassageAppointments();
        // }, 60000); // 1 minute
        
        // Also check immediately - disabled
        // this.checkUpcomingMassageAppointments();
    }

    setupMassageReminderListener() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // Listen for massage reminder notifications for this user
        const remindersRef = collection(db, "massageReminders");
        const userRemindersQuery = query(remindersRef, where("userId", "==", userId));
        
        onSnapshot(userRemindersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const reminderData = change.doc.data();
                    console.log('Massage reminder received:', reminderData);
                    
                    // Check if reminder should be shown now
                    const reminderTime = reminderData.scheduledFor.toDate();
                    const now = new Date();
                    
                    if (Math.abs(now.getTime() - reminderTime.getTime()) < 120000) { // Within 2 minutes
                        this.showMassageReminder(reminderData);
                    }
                }
            });
        });
    }

    async checkUpcomingMassageAppointments() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            // Get user's massage booking
            const bookingsQuery = query(
                collection(db, "massageBookings"), 
                where("userId", "==", userId)
            );
            const bookingsSnapshot = await getDocs(bookingsQuery);
            
            if (bookingsSnapshot.empty) return;

            const booking = bookingsSnapshot.docs[0].data();
            const timeSlot = booking.timeSlot;
            
            // Create appointment time for July 17, 2025
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const appointmentTime = new Date('2025-07-17T' + timeSlot + ':00');
            const reminderTime = new Date(appointmentTime.getTime() - 10 * 60000); // 10 minutes before
            
            const now = new Date();
            
            // Check if we should send reminder now (within 2 minute window)
            const timeDiff = Math.abs(now.getTime() - reminderTime.getTime());
            
            if (timeDiff < 120000) { // Within 2 minutes
                const reminderId = `massage-reminder-${userId}-${timeSlot}`;
                
                // Check if reminder already sent
                const sentReminders = await getDocs(
                    query(collection(db, "sentNotifications"), where("notificationId", "==", reminderId))
                );
                
                if (sentReminders.empty) {
                    await this.sendMassageReminder(booking, reminderId);
                }
            }
            
        } catch (error) {
            console.error('Error checking massage appointments:', error);
        }
    }

    async sendMassageReminder(booking, reminderId) {
        try {
            const userId = booking.userId;
            const timeSlot = booking.timeSlot;
            const chairInfo = booking.chairNumber ? ` (Chair ${booking.chairNumber})` : '';
            
            // Mark as sent
            await setDoc(doc(db, "sentNotifications", reminderId), {
                notificationId: reminderId,
                userId: userId,
                sentAt: serverTimestamp(),
                type: 'massage_reminder'
            });

            // Create notification
            const notificationData = {
                title: "Massage Appointment Reminder",
                message: `Your physio massage appointment${chairInfo} is starting in 10 minutes at ${timeSlot}. Please head to the massage area at Coworking Pula.`,
                timestamp: serverTimestamp(),
                type: 'massage_reminder',
                userId: userId,
                timeSlot: timeSlot,
                createdBy: 'system'
            };

            await addDoc(collection(db, "notifications"), notificationData);

            // Show browser notification if permission granted
            if (Notification.permission === 'granted') {
                this.showBrowserNotification(notificationData);
            }

            console.log(`Massage reminder sent for ${timeSlot}`);
            
        } catch (error) {
            console.error('Error sending massage reminder:', error);
        }
    }

    showMassageReminder(reminderData) {
        // Show in-app notification
        const title = reminderData.title;
        const message = reminderData.message;
        
        // Show browser notification
        if (Notification.permission === 'granted') {
            this.showBrowserNotification({ title, message });
        }
        
        // Show toast notification
        this.showToastNotification(title, message);
    }

    showBrowserNotification(data) {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Use service worker to show notification
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                payload: {
                    title: data.title,
                    body: data.message,
                    icon: '/icons/ikona(svitla).png',
                    badge: '/favicon.ico',
                    tag: 'massage-reminder',
                    requireInteraction: true,
                    vibrate: [200, 100, 200],
                    actions: [
                        {
                            action: 'open',
                            title: 'Open App'
                        }
                    ]
                }
            });
        } else {
            // Fallback to regular notification
            new Notification(data.title, {
                body: data.message,
                icon: '/icons/ikona(svitla).png',
                tag: 'massage-reminder'
            });
        }
    }

    showToastNotification(title, message) {
        // Create toast element if Bootstrap is available
        if (typeof bootstrap !== 'undefined') {
            const toast = document.createElement('div');
            toast.className = 'toast position-fixed top-0 end-0 m-3';
            toast.style.zIndex = '9999';
            toast.innerHTML = `
                <div class="toast-header">
                    <i class="bi bi-heart-pulse text-danger me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Show toast
            const bsToast = new bootstrap.Toast(toast, {
                autohide: true,
                delay: 10000 // Show for 10 seconds
            });
            bsToast.show();
            
            // Remove from DOM after hiding
            toast.addEventListener('hidden.bs.toast', () => {
                toast.remove();
            });
        }
    }
}

// Initialize massage reminder service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
        console.log('Massage reminder service initializing...');
        window.massageReminderService = new MassageReminderService();
    }
});

export { MassageReminderService };
