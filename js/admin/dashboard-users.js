import { db } from '../firebase-config.js';
import { 
    collection, 
    getDocs, 
    doc, 
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// STATE

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let perPage = 10;

// HELPERS

function getRoleBadgeClass(role) {
    switch(role) {
        case 'admin': return 'bg-danger';
        case 'organizer': return 'bg-warning text-dark';
        default: return 'bg-secondary';
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// FILTERS

function applyFilters() {
    const searchTerm = (document.getElementById('userSearchInput')?.value || '').toLowerCase().trim();
    const roleFilter = document.getElementById('userRoleFilter')?.value || '';
    const approvalFilter = document.getElementById('userApprovalFilter')?.value || '';
    const showedUpFilter = document.getElementById('userShowedUpFilter')?.value || '';
    
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = !searchTerm || 
            (user.firstName || '').toLowerCase().includes(searchTerm) ||
            (user.lastName || '').toLowerCase().includes(searchTerm) ||
            (user.email || '').toLowerCase().includes(searchTerm) ||
            (user.affiliation || '').toLowerCase().includes(searchTerm);
        
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesApproval = !approvalFilter || 
            (approvalFilter === 'approved' && user.approved === true) ||
            (approvalFilter === 'pending' && user.approved === false);
        const matchesShowedUp = !showedUpFilter || String(user.showedUp) === showedUpFilter;
        
        return matchesSearch && matchesRole && matchesApproval && matchesShowedUp;
    });
    
    currentPage = 1;
    renderPaginatedUsers();
}

// RENDER

function renderPaginatedUsers() {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageData = filteredUsers.slice(start, end);
    
    const noResults = document.getElementById('noUsersFound');
    
    if (filteredUsers.length === 0) {
        noResults?.classList.remove('d-none');
        document.getElementById('userTableBody').innerHTML = '';
        document.getElementById('mobileUserCards').innerHTML = '';
    } else {
        noResults?.classList.add('d-none');
        renderDesktopTable(pageData);
        renderMobileCards(pageData);
    }
    
    renderPagination();
}

function renderDesktopTable(data) {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(user => `
        <tr class="${user.approved === false ? 'user-pending' : ''}">
            <td class="text-center">
                <span class="${user.approved === true ? 'badge-approved' : 'badge-pending'}">
                    <i class="bi ${user.approved === true ? 'bi-check-circle' : 'bi-clock'}"></i>
                    ${user.approved === true ? 'Approved' : 'Pending'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-name-btn" 
                        data-id="${user.id}" 
                        data-first-name="${escapeHtml(user.firstName)}" 
                        data-last-name="${escapeHtml(user.lastName)}">
                    <i class="bi bi-pencil"></i>
                </button>
                ${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1 edit-affiliation-btn" 
                        data-id="${user.id}" data-name="${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}" 
                        data-current-affiliation="${escapeHtml(user.affiliation)}">
                    <i class="bi bi-pencil"></i>
                </button>
                ${escapeHtml(user.affiliation) || '<span class="text-muted">-</span>'}
            </td>
            <td><span class="badge ${getRoleBadgeClass(user.role)}">${user.role || 'general'}</span></td>
            <td>
                <button class="change-role-btn" 
                        data-id="${user.id}" data-name="${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}" 
                        data-current-role="${user.role || 'general'}">
                    <i class="bi bi-person-gear"></i><span class="btn-text ms-1">Role</span>
                </button>
                ${user.approved === false ? `
                <button class="btn-approve approve-user-btn" 
                        data-id="${user.id}" data-name="${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}">
                    <i class="bi bi-check-lg"></i><span class="btn-text ms-1">Approve</span>
                </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
    
    addTableEventListeners();
}

function renderMobileCards(data) {
    const container = document.getElementById('mobileUserCards');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">No users</div>';
        return;
    }
    
    container.innerHTML = data.map(user => `
        <div class="mobile-user-card ${user.approved === false ? 'pending' : ''}" data-user-id="${user.id}">
            <div class="card-header-row" onclick="toggleUserCard('${user.id}')">
                <button class="expand-btn" id="expandBtn-${user.id}" type="button">
                    <i class="bi bi-chevron-down"></i>
                </button>
                <div class="status-indicator ${user.approved === true ? 'approved' : 'pending'}"></div>
                <div class="card-preview">
                    <div class="name">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</div>
                    <div class="subtitle">${escapeHtml(user.email)}</div>
                </div>
                <span class="${user.approved === true ? 'badge-approved' : 'badge-pending'}">
                    <i class="bi ${user.approved === true ? 'bi-check-circle' : 'bi-clock'}"></i>
                    ${user.approved === true ? 'Approved' : 'Pending'}
                </span>
            </div>
            ${user.approved === false ? `
            <div class="mobile-approve-section">
                <div class="approve-message">
                    <i class="bi bi-exclamation-circle"></i>
                    This user is waiting for approval
                </div>
                <div class="mobile-approve-buttons">
                    <button class="btn-approve approve-user-btn" 
                            data-id="${user.id}" data-name="${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}">
                        <i class="bi bi-check-lg"></i>
                        <span class="btn-text">Approve User</span>
                    </button>
                </div>
            </div>
            ` : ''}
            <div class="card-details" id="details-${user.id}">
                <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${escapeHtml(user.email)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Affiliation</span>
                    <span class="detail-value">
                        ${escapeHtml(user.affiliation) || '<span class="text-muted">Not provided</span>'}
                        <button class="btn btn-sm btn-link p-0 ms-2 edit-affiliation-btn" 
                                data-id="${user.id}" data-name="${escapeHtml(user.firstName)}" 
                                data-current-affiliation="${escapeHtml(user.affiliation)}">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Role</span>
                    <span class="detail-value">
                        <span class="badge ${getRoleBadgeClass(user.role)}">${user.role || 'general'}</span>
                    </span>
                </div>
                <div class="card-actions">
                    <button class="change-role-btn" 
                            data-id="${user.id}" data-name="${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}" 
                            data-current-role="${user.role || 'general'}">
                        <i class="bi bi-person-gear"></i>
                        <span class="btn-text">Change Role</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    addMobileEventListeners();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredUsers.length / perPage);
    const container = document.getElementById('userPaginationControls');
    const countEl = document.getElementById('userTotalCount');
    
    if (countEl) countEl.textContent = filteredUsers.length;
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    
    let html = `<button class="btn btn-sm btn-outline-primary" onclick="goToUserPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-primary'}" onclick="goToUserPage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="px-2 text-muted">...</span>`;
        }
    }
    
    html += `<button class="btn btn-sm btn-outline-primary" onclick="goToUserPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;
    container.innerHTML = html;
}

// GLOBAL FUNCTIONS

window.goToUserPage = function(page) {
    const totalPages = Math.ceil(filteredUsers.length / perPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderPaginatedUsers();
};

window.toggleUserCard = function(id) {
    const details = document.getElementById(`details-${id}`);
    const btn = document.getElementById(`expandBtn-${id}`);
    
    document.querySelectorAll('.card-details.show').forEach(el => {
        if (el.id !== `details-${id}`) {
            el.classList.remove('show');
            const otherId = el.id.replace('details-', '');
            document.getElementById(`expandBtn-${otherId}`)?.classList.remove('expanded');
        }
    });
    
    details?.classList.toggle('show');
    btn?.classList.toggle('expanded');
};

// UPDATE FUNCTIONS

async function approveUser(userId, userName) {
    if (!confirm(`Approve user ${userName}? They will be able to log in after approval.`)) {
        return;
    }
    
    // Find and disable all approve buttons for this user
    const approveButtons = document.querySelectorAll(`.approve-user-btn[data-id="${userId}"]`);
    approveButtons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    });
    
    try {
        await updateDoc(doc(db, "users", userId), { approved: true });
        const user = allUsers.find(u => u.id === userId);
        if (user) user.approved = true;
        
        // Show success toast
        showApproveToast(`${userName} has been approved!`);
        
        applyFilters(); // Refresh the display
    } catch (error) {
        console.error("Error:", error);
        alert("Error approving user");
        
        // Re-enable buttons on error
        approveButtons.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg"></i><span class="btn-text ms-1">Approve</span>';
        });
    }
}

// Toast notification for approve success
function showApproveToast(message) {
    // Remove existing toast if any
    document.querySelector('.approve-success-toast')?.remove();
    
    const toast = document.createElement('div');
    toast.className = 'approve-success-toast';
    toast.innerHTML = `<i class="bi bi-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

async function updateUserField(userId, field, value) {
    try {
        await updateDoc(doc(db, "users", userId), { [field]: value });
        const user = allUsers.find(u => u.id === userId);
        if (user) user[field] = value;
        applyFilters();
    } catch (error) {
        console.error("Error:", error);
        alert(`Error updating ${field}`);
    }
}

// EVENT LISTENERS

function addTableEventListeners() {
    document.querySelectorAll('.user-table .edit-name-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openNameEditModal(this.dataset.id, this.dataset.firstName, this.dataset.lastName);
        });
    });
    
    document.querySelectorAll('.user-table .edit-affiliation-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const newValue = prompt(`Edit affiliation for ${this.dataset.name}:`, this.dataset.currentAffiliation || '');
            if (newValue !== null) updateUserField(this.dataset.id, 'affiliation', newValue);
        });
    });
    
    document.querySelectorAll('.user-table .change-role-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openRoleChangeModal(this.dataset.id, this.dataset.name, this.dataset.currentRole);
        });
    });
    
    document.querySelectorAll('.user-table .approve-user-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            approveUser(this.dataset.id, this.dataset.name);
        });
    });
}

function addMobileEventListeners() {
    document.querySelectorAll('#mobileUserCards .edit-affiliation-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const newValue = prompt(`Edit affiliation:`, this.dataset.currentAffiliation || '');
            if (newValue !== null) updateUserField(this.dataset.id, 'affiliation', newValue);
        });
    });
    
    document.querySelectorAll('#mobileUserCards .change-role-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            openRoleChangeModal(this.dataset.id, this.dataset.name, this.dataset.currentRole);
        });
    });
    
    // Approve buttons - both in mobile-approve-section and card-details
    document.querySelectorAll('#mobileUserCards .approve-user-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            approveUser(this.dataset.id, this.dataset.name);
        });
    });
}

// MODALS

function openNameEditModal(userId, firstName, lastName) {
    document.getElementById('editNameModal')?.remove();
    
    const modalHtml = `
        <div class="modal fade" id="editNameModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit User Name</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">First Name</label>
                            <input type="text" class="form-control" id="editFirstName" value="${firstName || ''}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="editLastName" value="${lastName || ''}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveNameBtn">Save</button>
                    </div>
                </div>
            </div>
        </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modalEl = document.getElementById('editNameModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
    
    document.getElementById('saveNameBtn').addEventListener('click', async function() {
        const newFirst = document.getElementById('editFirstName').value.trim();
        const newLast = document.getElementById('editLastName').value.trim();
        if (newFirst || newLast) {
            try {
                await updateDoc(doc(db, "users", userId), { firstName: newFirst, lastName: newLast });
                const user = allUsers.find(u => u.id === userId);
                if (user) { user.firstName = newFirst; user.lastName = newLast; }
                modal.hide();
                applyFilters();
            } catch (error) {
                alert("Error updating name");
            }
        }
    });
    
    modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

function openRoleChangeModal(userId, userName, currentRole) {
    document.getElementById('selectedUserName').textContent = userName;
    document.getElementById('roleSelect').value = currentRole;
    document.getElementById('changeRoleModal').dataset.userId = userId;
    new bootstrap.Modal(document.getElementById('changeRoleModal')).show();
}

async function handleRoleChangeConfirm() {
    const modal = document.getElementById('changeRoleModal');
    const userId = modal.dataset.userId;
    const newRole = document.getElementById('roleSelect').value;
    
    if (!userId || !newRole) return;
    
    try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        const user = allUsers.find(u => u.id === userId);
        if (user) user.role = newRole;
        bootstrap.Modal.getInstance(modal).hide();
        applyFilters();
    } catch (error) {
        alert("Error updating role");
    }
}

// LOAD DATA

async function loadUsers() {
    const tableBody = document.getElementById('userTableBody');
    const mobileCards = document.getElementById('mobileUserCards');
    
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</td></tr>';
    if (mobileCards) mobileCards.innerHTML = '<div class="text-center p-4"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, "users"));
        
        allUsers = [];
        querySnapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        
        allUsers.sort((a, b) => {
            const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
            const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        console.log(`Loaded ${allUsers.length} users`);
        applyFilters();
        
    } catch (error) {
        console.error("Error:", error);
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

// INIT

document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') return;
    
    console.log("Dashboard users.js loaded");
    
    document.getElementById('refreshUserList')?.addEventListener('click', loadUsers);
    document.getElementById('userSearchInput')?.addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('userRoleFilter')?.addEventListener('change', applyFilters);
    document.getElementById('userApprovalFilter')?.addEventListener('change', applyFilters);
    document.getElementById('userShowedUpFilter')?.addEventListener('change', applyFilters);
    document.getElementById('userPerPageSelect')?.addEventListener('change', function() {
        perPage = parseInt(this.value);
        currentPage = 1;
        renderPaginatedUsers();
    });
    document.getElementById('confirmRoleChange')?.addEventListener('click', handleRoleChangeConfirm);
    
    loadUsers();
});