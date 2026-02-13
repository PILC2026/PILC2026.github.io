import { db } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Schedule the pizza reminder notification
export async function schedulePizzaReminder() {
    try {
        console.log("Scheduling pizza reminder notification");
        
        // Create notification for July 17, 2025 at 11:00 AM
        const reminderDate = new Date('2025-07-17T11:00:00');
        
        const notificationData = {
            title: "Pizza Selection Reminder",
            message: "Don't forget to select your pizza choice for today's lunch! Please make your selection as soon as possible to ensure we have your preferred option available.",
            timestamp: Timestamp.fromDate(reminderDate),
            scheduledFor: Timestamp.fromDate(reminderDate),
            type: 'pizza_reminder',
            createdBy: 'system',
            createdAt: serverTimestamp()
        };
        
        const notificationsRef = collection(db, "notifications");
        const docRef = await addDoc(notificationsRef, notificationData);
        
        console.log("Pizza reminder notification scheduled with ID:", docRef.id);
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error scheduling pizza reminder:", error);
        return { success: false, error: error.message };
    }
}

// Call this when the app loads (for admin users to set up notifications)
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
});
