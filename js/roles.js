// Simple role management without authentication
// Roles: general, organizer, admin

// Set role (to be used in admin panel)
function setUserRole(role) {
  if (['general', 'organizer', 'admin'].includes(role)) {
    localStorage.setItem('userRole', role);
    return true;
  }
  return false;
}

// Get current role
function getUserRole() {
  return localStorage.getItem('userRole') || 'general';
}

// Check if user has a specific role
function hasRole(role) {
  const currentRole = getUserRole();
  
  if (role === 'admin') {
    return currentRole === 'admin';
  }
  
  if (role === 'organizer') {
    return currentRole === 'admin' || currentRole === 'organizer';
  }
  
  return true; // Everyone has 'general' role
}

export { setUserRole, getUserRole, hasRole };
