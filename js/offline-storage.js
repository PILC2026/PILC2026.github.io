// Offline storage utilities for PWA functionality
class OfflineStorage {
    constructor() {
        this.dbName = 'BioMedixDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create notifications store
                if (!db.objectStoreNames.contains('notifications')) {
                    const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
                    notificationsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Create pizza selections store
                if (!db.objectStoreNames.contains('pizzaSelections')) {
                    const pizzaStore = db.createObjectStore('pizzaSelections', { keyPath: 'userId' });
                }
                
                // Create schedule events store
                if (!db.objectStoreNames.contains('scheduleEvents')) {
                    const scheduleStore = db.createObjectStore('scheduleEvents', { keyPath: 'id' });
                }
                
                // Create user settings store
                if (!db.objectStoreNames.contains('userSettings')) {
                    const settingsStore = db.createObjectStore('userSettings', { keyPath: 'key' });
                }
            };
        });
    }

    async saveNotification(notification) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            
            const request = store.put({
                id: notification.id || Date.now().toString(),
                title: notification.title,
                message: notification.message,
                timestamp: notification.timestamp || new Date(),
                read: false,
                synced: false
            });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getNotifications() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notifications'], 'readonly');
            const store = transaction.objectStore('notifications');
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async markNotificationAsRead(notificationId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            
            const getRequest = store.get(notificationId);
            
            getRequest.onsuccess = () => {
                const notification = getRequest.result;
                if (notification) {
                    notification.read = true;
                    const putRequest = store.put(notification);
                    putRequest.onsuccess = () => resolve();
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve();
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async savePizzaSelection(userId, selection) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pizzaSelections'], 'readwrite');
            const store = transaction.objectStore('pizzaSelections');
            
            const request = store.put({
                userId: userId,
                selection: selection,
                timestamp: new Date(),
                synced: false
            });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPizzaSelection(userId) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pizzaSelections'], 'readonly');
            const store = transaction.objectStore('pizzaSelections');
            
            const request = store.get(userId);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveScheduleEvents(events) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scheduleEvents'], 'readwrite');
            const store = transaction.objectStore('scheduleEvents');
            
            events.forEach(event => {
                store.put(event);
            });
            
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    async getScheduleEvents() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['scheduleEvents'], 'readonly');
            const store = transaction.objectStore('scheduleEvents');
            
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearOldData(daysOld = 7) {
        if (!this.db) await this.init();
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['notifications'], 'readwrite');
            const store = transaction.objectStore('notifications');
            const index = store.index('timestamp');
            
            const range = IDBKeyRange.upperBound(cutoffDate);
            const request = index.openCursor(range);
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }

    // Sync pending data when back online
    async syncData() {
        if (!navigator.onLine) return;
        
        try {
            // This would sync any unsynced data back to Firebase
            console.log('Syncing offline data...');
            
            // Mark all data as synced after successful sync
            // Implementation would depend on your specific sync requirements
            
        } catch (error) {
            console.error('Error syncing data:', error);
        }
    }
}

// Network status monitoring
class NetworkMonitor {
    constructor(offlineStorage) {
        this.offlineStorage = offlineStorage;
        this.isOnline = navigator.onLine;
        this.setupEventListeners();
        this.showNetworkStatus();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNetworkStatus();
            this.offlineStorage.syncData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkStatus();
        });
    }

    showNetworkStatus() {
        // Remove existing status
        const existingStatus = document.querySelector('.network-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        if (!this.isOnline) {
            // Show offline indicator
            const offlineIndicator = document.createElement('div');
            offlineIndicator.className = 'network-status alert alert-warning position-fixed';
            offlineIndicator.style.cssText = `
                top: 10px;
                right: 10px;
                z-index: 1060;
                margin: 0;
                padding: 8px 16px;
                font-size: 0.875rem;
            `;
            offlineIndicator.innerHTML = `
                <i class="bi bi-wifi-off me-2"></i>
                You're offline. Some features may not work.
            `;
            
            document.body.appendChild(offlineIndicator);
        }
    }
}

// Initialize offline functionality
if (typeof window !== 'undefined') {
    window.offlineStorage = new OfflineStorage();
    window.networkMonitor = new NetworkMonitor(window.offlineStorage);
}

export { OfflineStorage, NetworkMonitor };
