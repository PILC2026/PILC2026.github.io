let allMassageBookings = [];
let filteredMassageBookings = [];

// HELPER FUNCTIONS

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(timestamp) {
    if (!timestamp) return 'Unknown';
    try {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString();
    } catch {
        return 'Unknown';
    }
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// FILTER LOGIC

function applyMassageFilters() {
    const searchTerm = (document.getElementById('massageSearchInput')?.value || '').toLowerCase().trim();
    
    filteredMassageBookings = allMassageBookings.filter(booking => {
        if (!searchTerm) return true;
        return (booking.userName || '').toLowerCase().includes(searchTerm) ||
               (booking.timeSlot || '').toLowerCase().includes(searchTerm);
    });
    
    renderMassageBookings();
}

// RENDER FUNCTIONS

function renderMassageBookings() {
    const noResults = document.getElementById('noMassageBookingsFound');
    
    // Update total count
    const totalCountEl = document.getElementById('massageTotalCount');
    if (totalCountEl) {
        totalCountEl.textContent = `Total bookings: ${filteredMassageBookings.length}`;
    }
    
    if (filteredMassageBookings.length === 0) {
        noResults?.classList.remove('d-none');
        document.getElementById('massageTableBody').innerHTML = '';
        document.getElementById('mobileMassageCards').innerHTML = '';
    } else {
        noResults?.classList.add('d-none');
        renderMassageDesktopTable(filteredMassageBookings);
        renderMassageMobileCards(filteredMassageBookings);
    }
    
    // Update stats
    updateMassageStats();
}

function renderMassageDesktopTable(data) {
    const tbody = document.getElementById('massageTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No bookings</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(booking => `
        <tr>
            <td><strong>${escapeHtml(booking.timeSlot)}</strong></td>
            <td>${escapeHtml(booking.userName)}</td>
            <td><small class="text-muted">${escapeHtml(booking.userId)}</small></td>
            <td><small>${formatDate(booking.bookedAt)}</small></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteMassageBooking('${booking.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderMassageMobileCards(data) {
    const container = document.getElementById('mobileMassageCards');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">No bookings</div>';
        return;
    }
    
    container.innerHTML = data.map(booking => `
        <div class="mobile-massage-card" data-booking-id="${booking.id}">
            <div class="massage-card-header" onclick="toggleMassageCard('${booking.id}')">
                <div class="massage-time-badge">
                    <i class="bi bi-clock"></i>
                    ${escapeHtml(booking.timeSlot)}
                </div>
                <div class="massage-card-preview">
                    <div class="massage-user-name">${escapeHtml(booking.userName)}</div>
                </div>
                <button class="expand-btn" id="massageExpandBtn-${booking.id}" type="button">
                    <i class="bi bi-chevron-down"></i>
                </button>
            </div>
            
            <div class="massage-card-details" id="massageDetails-${booking.id}">
                <div class="massage-detail-row">
                    <span class="massage-detail-label">Time Slot</span>
                    <span class="massage-detail-value"><strong>${escapeHtml(booking.timeSlot)}</strong></span>
                </div>
                <div class="massage-detail-row">
                    <span class="massage-detail-label">Participant</span>
                    <span class="massage-detail-value">${escapeHtml(booking.userName)}</span>
                </div>
                <div class="massage-detail-row">
                    <span class="massage-detail-label">User ID</span>
                    <span class="massage-detail-value"><small class="text-muted">${escapeHtml(booking.userId)}</small></span>
                </div>
                <div class="massage-detail-row">
                    <span class="massage-detail-label">Booked At</span>
                    <span class="massage-detail-value"><small>${formatDate(booking.bookedAt)}</small></span>
                </div>
                <div class="massage-detail-row massage-actions">
                    <button class="btn btn-danger btn-sm w-100" onclick="deleteMassageBooking('${booking.id}')">
                        <i class="bi bi-trash me-2"></i>Delete Booking
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateMassageStats() {
    const statsEl = document.getElementById('massageBookingStats');
    if (!statsEl) return;
    
    const totalBookings = allMassageBookings.length;
    const totalSlots = 28; // 14 time slots × 2 chairs
    const remaining = totalSlots - totalBookings;
    const utilization = Math.round((totalBookings / totalSlots) * 100);
    
    statsEl.innerHTML = `
        <li><strong>Total Appointments:</strong> ${totalBookings}</li>
        <li><strong>Available Slots:</strong> ${totalSlots} (14 time slots × 2 chairs)</li>
        <li><strong>Remaining Slots:</strong> ${remaining}</li>
        <li><strong>Utilization:</strong> ${utilization}%</li>
    `;
}

// GLOBAL FUNCTIONS

window.toggleMassageCard = function(id) {
    const details = document.getElementById(`massageDetails-${id}`);
    const btn = document.getElementById(`massageExpandBtn-${id}`);
    
    // Close all other cards (accordion behavior)
    document.querySelectorAll('.massage-card-details.show').forEach(el => {
        if (el.id !== `massageDetails-${id}`) {
            el.classList.remove('show');
            const otherId = el.id.replace('massageDetails-', '');
            const otherBtn = document.getElementById(`massageExpandBtn-${otherId}`);
            if (otherBtn) otherBtn.classList.remove('expanded');
        }
    });
    
    // Toggle current card
    if (details) details.classList.toggle('show');
    if (btn) btn.classList.toggle('expanded');
};

window.deleteMassageBooking = async function(bookingId) {
    if (!confirm('Are you sure you want to delete this massage booking?')) {
        return;
    }
    
    try {
        const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js");
        const { db } = await import("../firebase-config.js");
        
        await deleteDoc(doc(db, "massageBookings", bookingId));
        
        console.log("Massage booking deleted:", bookingId);
        
        // Remove from local array
        allMassageBookings = allMassageBookings.filter(b => b.id !== bookingId);
        applyMassageFilters();
        
        alert('Massage booking deleted successfully');
    } catch (error) {
        console.error("Error deleting massage booking:", error);
        alert(`Error deleting booking: ${error.message}`);
    }
};

// LOAD FUNCTION

async function loadMassageBookings() {
    try {
        const { collection, getDocs, orderBy, query } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js");
        const { db } = await import("../firebase-config.js");
        
        const tableBody = document.getElementById('massageTableBody');
        const mobileCards = document.getElementById('mobileMassageCards');
        
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</td></tr>';
        }
        if (mobileCards) {
            mobileCards.innerHTML = '<div class="text-center p-4"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</div>';
        }
        
        const bookingsQuery = query(collection(db, "massageBookings"), orderBy("timeSlot"));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        
        if (bookingsSnapshot.empty) {
            allMassageBookings = [];
            filteredMassageBookings = [];
            renderMassageBookings();
            return;
        }
        
        allMassageBookings = [];
        bookingsSnapshot.forEach(doc => {
            const data = doc.data();
            allMassageBookings.push({
                id: doc.id,
                timeSlot: data.timeSlot || 'Unknown',
                userName: data.userName || 'Unknown User',
                userId: data.userId || 'Unknown',
                bookedAt: data.bookedAt || null
            });
        });
        
        console.log(`Loaded ${allMassageBookings.length} massage bookings`);
        applyMassageFilters();
        
    } catch (error) {
        console.error("Error loading massage bookings:", error);
        const tableBody = document.getElementById('massageTableBody');
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error: ${error.message}</td></tr>`;
        }
    }
}

// INIT

document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        console.log("Not an admin, massage tracking features disabled");
        return;
    }
    
    console.log("Massage tracking admin module loaded");
    
    // Event listeners
    document.getElementById('refreshMassageBookings')?.addEventListener('click', loadMassageBookings);
    document.getElementById('massageSearchInput')?.addEventListener('input', debounce(applyMassageFilters, 300));
    
    // Initial load
    loadMassageBookings();
});

export { loadMassageBookings };