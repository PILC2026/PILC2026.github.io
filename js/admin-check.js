/**
 * Admin authorization check script
 * This script checks if the current user has admin privileges
 * and redirects non-admin users to the home page
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth check running...");
    
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.log("No user ID found, redirecting to login page");
        window.location.href = getLoginPagePath();
        return;
    }

    // Check user role
    const userRole = localStorage.getItem('userRole');
    console.log("User authenticated:", userId);
    console.log("User role:", userRole);
    
    // If not admin, redirect to home
    if (userRole !== 'admin') {
        console.log("User is not an admin, redirecting to home page");
        window.location.href = '../home.html';
        return;
    }
    
    console.log("Admin user detected, displaying admin elements");
    
    // Unhide admin elements
    document.querySelectorAll('.admin-only').forEach(el => {
        console.log("Unhiding admin element:", el);
        el.classList.remove('d-none');
    });
    
    // Organizers can see organizer elements too
    if (userRole === 'admin' || userRole === 'organizer') {
        console.log("Organizer privileges detected, displaying organizer elements");
        document.querySelectorAll('.organizer-only').forEach(el => {
            el.classList.remove('d-none');
        });
        
        // Show elements for both organizers and admins
        document.querySelectorAll('.organizer-admin-only').forEach(el => {
            el.classList.remove('d-none');
        });
    }
});

// Helper function to determine the correct path to the login page
function getLoginPagePath() {
    // If we're in an app subfolder, we need to go up one level
    if (window.location.pathname.includes('/app/')) {
        return '../index.html';
    }
    // If we're in the admin subfolder, we need to go up two levels
    if (window.location.pathname.includes('/admin/')) {
        return '../../index.html';
    }
    // Otherwise we're at the root
    return 'index.html';
}
