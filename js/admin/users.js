import { db } from '../firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    console.log("Admin users.js loaded");
    
    // Check if user is admin
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        console.log("Non-admin access attempt to users.js");
        window.location.href = '../home.html';
        return;
    }
    
    // DOM elements
    const usersList = document.getElementById('usersList');
    const refreshBtn = document.getElementById('refreshUsersBtn');
    const selectAllCheckbox = document.getElementById('selectAll');
    const printSelectedBtn = document.getElementById('printSelectedBtn');
    const printAllBtn = document.getElementById('printAllBtn');
    const badgeContainer = document.getElementById('badgeContainer');
    const badgePrintArea = document.getElementById('badgePrintArea');
    
    // Add event listeners
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadUsers);
    }
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.user-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    // Add print button listeners
    if (printSelectedBtn) {
        printSelectedBtn.addEventListener('click', printSelectedBadges);
    }
    
    if (printAllBtn) {
        printAllBtn.addEventListener('click', printAllBadges);
    }
    
    // Load users on page load
    loadUsers();
    
    // Function to load all users
    async function loadUsers() {
        console.log("Loading users...");
        
        // Check if usersList element exists
        const usersList = document.getElementById('usersList');
        if (!usersList) {
            console.error("usersList element not found - This might be expected if not on the users admin page");
            return;
        }
        
        try {
            // Show loading message
            usersList.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border spinner-border-sm me-2" role="status"></div> Loading users...</td></tr>';
            
            // Get all users from Firestore
            const usersCollection = collection(db, "users");
            const querySnapshot = await getDocs(usersCollection);
            
            if (querySnapshot.empty) {
                usersList.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
                return;
            }
            
            // Build the table
            usersList.innerHTML = '';
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                
                // Create table row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="user-select" data-id="${doc.id}"></td>
                    <td>${userData.firstName || ''} ${userData.lastName || ''}</td>
                    <td>${userData.email || ''}</td>
                    <td>${userData.affiliation || ''}</td>
                    <td>${userData.country || ''}</td>
                    <td><span class="badge ${getRoleBadgeClass(userData.role)}">${userData.role || 'general'}</span></td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary edit-user" data-id="${doc.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-outline-danger delete-user" data-id="${doc.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                            <button class="btn btn-outline-secondary print-badge" data-id="${doc.id}">
                                <i class="bi bi-printer"></i>
                            </button>
                        </div>
                    </td>
                `;
                
                usersList.appendChild(row);
            });
            
            // Add event listeners to action buttons
            addActionButtonListeners();
            
            console.log("Users loaded successfully");
        } catch (error) {
            console.error("Error loading users:", error);
            if (usersList) {
                usersList.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading users: ${error.message}</td></tr>`;
            }
        }
    }
    
    // Helper function to get badge class based on role
    function getRoleBadgeClass(role) {
        switch(role) {
            case 'admin': return 'bg-danger';
            case 'organizer': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }
    
    // Add listeners to edit/delete/print buttons
    function addActionButtonListeners() {
        // Edit button listeners
        document.querySelectorAll('.edit-user').forEach(btn => {
            btn.addEventListener('click', async function() {
                const userId = this.dataset.id;
                await editUser(userId);
            });
        });
        
        // Delete button listeners
        document.querySelectorAll('.delete-user').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.dataset.id;
                deleteUser(userId);
            });
        });
        
        // Print badge listeners
        document.querySelectorAll('.print-badge').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.dataset.id;
                printSingleBadge(userId);
            });
        });
    }
    
    // Function to edit a user
    async function editUser(userId) {
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                alert("User not found!");
                return;
            }
            
            const userData = userSnap.data();
            
            // Set form values
            document.getElementById('editUserId').value = userId;
            document.getElementById('editFirstName').value = userData.firstName || '';
            document.getElementById('editLastName').value = userData.lastName || '';
            document.getElementById('editEmail').value = userData.email || '';
            document.getElementById('editAffiliation').value = userData.affiliation || '';
            document.getElementById('editCountry').value = userData.country || '';
            document.getElementById('editRole').value = userData.role || 'general';
            
            // Show modal
            const editModal = new bootstrap.Modal(document.getElementById('editUserModal'));
            editModal.show();
        } catch (error) {
            console.error("Error loading user for edit:", error);
            alert(`Error: ${error.message}`);
        }
    }
    
    // Function to save user edit form
    async function saveUserChanges() {
        const userId = document.getElementById('editUserId').value;
        if (!userId) return;
        
        try {
            const userRef = doc(db, "users", userId);
            
            // Get form data
            const updatedData = {
                firstName: document.getElementById('editFirstName').value,
                lastName: document.getElementById('editLastName').value,
                email: document.getElementById('editEmail').value,
                affiliation: document.getElementById('editAffiliation').value,
                country: document.getElementById('editCountry').value,
                role: document.getElementById('editRole').value,
                updatedAt: new Date().toISOString()
            };
            
            // Update the user in Firestore
            await updateDoc(userRef, updatedData);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
            modal.hide();
            
            // Reload users list
            loadUsers();
            
            alert("User updated successfully");
        } catch (error) {
            console.error("Error updating user:", error);
            alert(`Error updating user: ${error.message}`);
        }
    }
    
    // Function to delete a user
    async function deleteUser(userId) {
        if (!confirm("Are you sure you want to delete this user?")) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, "users", userId));
            alert("User deleted successfully");
            loadUsers(); // Reload the list
        } catch (error) {
            console.error("Error deleting user:", error);
            alert(`Error deleting user: ${error.message}`);
        }
    }
    
    // Function to print a user's badge
    function printSingleBadge(userId) {
        try {
            // Clear badge container
            if (!badgeContainer || !badgePrintArea) {
                alert('Badge printing elements not found in the page');
                return;
            }
            
            badgeContainer.innerHTML = '';
            
            // Get user data and create badge
            getDoc(doc(db, "users", userId))
                .then(userDoc => {
                    if (!userDoc.exists()) {
                        alert('User not found.');
                        return;
                    }
                    
                    const userData = userDoc.data();
                    createBadgeElement(userData);
                    
                    // Show print dialog
                    printBadges();
                })
                .catch(error => {
                    console.error('Error printing badge:', error);
                    alert(`Error printing badge: ${error.message}`);
                });
        } catch (error) {
            console.error('Error in printSingleBadge:', error);
            alert(`Error: ${error.message}`);
        }
    }
    
    // Function to print selected badges
    async function printSelectedBadges() {
        try {
            const selectedCheckboxes = document.querySelectorAll('.user-select:checked');
            
            if (selectedCheckboxes.length === 0) {
                alert('Please select at least one user to print their badge.');
                return;
            }
            
            if (!badgeContainer || !badgePrintArea) {
                alert('Badge printing elements not found in the page');
                return;
            }
            
            // Clear badge container
            badgeContainer.innerHTML = '';
            
            // Get all selected users data
            for (const checkbox of selectedCheckboxes) {
                const userId = checkbox.getAttribute('data-id');
                const userDoc = await getDoc(doc(db, "users", userId));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    createBadgeElement(userData);
                }
            }
            
            // Show print dialog
            printBadges();
        } catch (error) {
            console.error('Error printing badges:', error);
            alert(`Error printing badges: ${error.message}`);
        }
    }
    
    // Function to print all badges
    async function printAllBadges() {
        try {
            if (!badgeContainer || !badgePrintArea) {
                alert('Badge printing elements not found in the page');
                return;
            }
            
            // Clear badge container
            badgeContainer.innerHTML = '';
            
            const usersRef = collection(db, "users");
            const querySnapshot = await getDocs(usersRef);
            
            if (querySnapshot.empty) {
                alert('No users found.');
                return;
            }
            
            querySnapshot.forEach(doc => {
                const userData = doc.data();
                createBadgeElement(userData);
            });
            
            // Show print dialog
            printBadges();
        } catch (error) {
            console.error('Error printing all badges:', error);
            alert(`Error printing all badges: ${error.message}`);
        }
    }
    
    // Function to create badge element
    function createBadgeElement(userData) {
        if (!userData) return;
        
        const badge = document.createElement('div');
        badge.className = 'badge-print-card';
        badge.innerHTML = `
            <div class="text-center">
                <h3 class="badge-name">${userData.firstName || ''} ${userData.lastName || ''}</h3>
                <p class="badge-affiliation">${userData.affiliation || ''}</p>
                <p class="badge-country">${userData.country || ''}</p>
                <p class="badge-role text-muted">${userData.role || 'attendee'}</p>
            </div>
        `;
        
        badgeContainer.appendChild(badge);
    }
    
    // Function to print badges
    function printBadges() {
        // Show the print area
        badgePrintArea.classList.remove('d-none');
        
        // Print the badges
        setTimeout(() => {
            window.print();
            
            // Hide the print area after printing
            setTimeout(() => {
                badgePrintArea.classList.add('d-none');
            }, 500);
        }, 500);
    }
    
    // Save user button handler
    document.getElementById('saveUserBtn')?.addEventListener('click', saveUserChanges);
});
