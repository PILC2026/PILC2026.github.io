/**
 * Simple authentication check script
 * Include this at the top of all protected pages
 */

// Execute immediately
(function() {
    console.log("Auth check running...");
    
    // Skip check on login/register page
    if (window.location.pathname.endsWith('index.html') || 
        window.location.pathname === '/' || 
        window.location.pathname.endsWith('/')) {
        console.log("On login page, skipping auth check");
        return;
    }
    
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
        console.log("No user ID found, redirecting to login");
        
        // Determine redirect path based on current location
        let redirectPath;
        if (window.location.pathname.includes('/app/')) {
            redirectPath = '../index.html';
        } else if (window.location.pathname.includes('/admin/')) {
            redirectPath = '../../index.html';
        } else {
            redirectPath = 'index.html';
        }
        
        // Redirect to login page
        window.location.href = redirectPath;
    } else {
        console.log("User authenticated:", userId);
        
        // Debug role information
        console.log("User role:", localStorage.getItem('userRole') || 'general');
        
        // Apply role-based access
        const userRole = localStorage.getItem('userRole') || 'general';
        
        // Show admin elements for admin users
        if (userRole === 'admin') {
            console.log("Admin user detected, displaying admin elements");
            setTimeout(() => {
                document.querySelectorAll('.admin-only').forEach(el => {
                    el.classList.remove('d-none');
                    console.log("Unhiding admin element:", el);
                });
            }, 100);
        }
        
        // Show organizer elements for organizer or admin users
        if (userRole === 'admin' || userRole === 'organizer') {
            console.log("Organizer privileges detected, displaying organizer elements");
            setTimeout(() => {
                document.querySelectorAll('.organizer-only').forEach(el => {
                    el.classList.remove('d-none');
                });
                
                // Show elements for both organizers and admins
                document.querySelectorAll('.organizer-admin-only').forEach(el => {
                    el.classList.remove('d-none');
                });
            }, 100);
        }
    }
})();
