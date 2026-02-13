import { db } from './firebase-config.js';
import { 
    doc, 
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("User profile loaded");
    
    // Load user profile data
    loadUserProfile();
    
    // Load pizza selection
    loadPizzaSelection();
    
    // Add logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Clear all localStorage data
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            
            // Redirect to main index page
            window.location.href = '../index.html';
        });
    }
    
    async function loadUserProfile() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                const userData = userSnap.data();
                
                // Populate profile fields with plain text
                document.getElementById('firstName').textContent = userData.firstName || 'Not provided';
                document.getElementById('lastName').textContent = userData.lastName || 'Not provided';
                document.getElementById('email').textContent = userData.email || 'Not provided';
                document.getElementById('affiliation').textContent = userData.affiliation || 'Not provided';
            }
        } catch (error) {
            console.error("Error loading user profile:", error);
            showAlert('Error loading profile data', 'danger');
        }
    }
    
    async function loadPizzaSelection() {
        const userId = localStorage.getItem('userId');
        const pizzaContainer = document.getElementById('pizzaSelectionSummary');
        
        if (!userId) return;
        
        try {
            // Get current user's name
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                pizzaContainer.innerHTML = `
                    <div class="alert alert-danger">
                        <h6><i class="bi bi-exclamation-circle me-2"></i>Error</h6>
                        <p class="mb-0">Unable to load user information.</p>
                    </div>
                `;
                return;
            }
            
            const userData = userSnap.data();
            const firstName = userData.firstName || '';
            const lastName = userData.lastName || '';
            
            // Search for pizza selection by matching first and last name
            const pizzaQuery = query(
                collection(db, "pizzaSelections"),
                where("firstName", "==", firstName),
                where("lastName", "==", lastName)
            );
            
            const pizzaSnapshot = await getDocs(pizzaQuery);
            
            if (!pizzaSnapshot.empty) {
                // Found pizza selection
                const pizzaDoc = pizzaSnapshot.docs[0];
                const pizzaData = pizzaDoc.data();
                
                const pizzaNames = {
                    'margherita': '🍅 Margherita',
                    'pepperoni': '🍕 Pepperoni',
                    'vegetarian': '🥬 Vegetarian',
                    'quattro-formaggi': '🧀 Quattro Formaggi',
                    'prosciutto': '🥓 Prosciutto',
                    'gluten-free': '🌾 Gluten Free'
                };
                
                pizzaContainer.innerHTML = `
                    <div class="alert alert-success">
                        <h6><i class="bi bi-check-circle me-2"></i>Selection Confirmed</h6>
                        <p class="mb-1"><strong>${pizzaNames[pizzaData.pizzaType] || pizzaData.pizzaType}</strong></p>
                        <small class="text-muted">Selected on ${pizzaData.timestamp ? new Date(pizzaData.timestamp.seconds * 1000).toLocaleDateString() : 'Unknown'}</small>
                    </div>
                `;
            } else {
                // No pizza selection found
                pizzaContainer.innerHTML = `
                    <div class="alert alert-warning">
                        <h6><i class="bi bi-exclamation-triangle me-2"></i>No Pizza Selection</h6>
                        <p class="mb-0">You haven't selected your pizza preference yet.</p>
                        <small class="text-muted">Please make your selection for Day 2 lunch in the Schedule tab.</small>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error loading pizza selection:", error);
            pizzaContainer.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="bi bi-exclamation-circle me-2"></i>Error</h6>
                    <p class="mb-0">Unable to load pizza selection.</p>
                </div>
            `;
        }
    }
    
    // Show alert message
    function showAlert(message, type) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        alertContainer.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 150);
        }, 5000);
    }
});
