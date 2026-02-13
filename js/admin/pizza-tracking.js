import { db } from '../firebase-config.js';
import { 
    collection, 
    doc,
    getDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// STATE

let allPizzaSelections = [];
let filteredPizzaSelections = [];

// PIZZA DISPLAY NAMES

const pizzaTypes = {
    'margherita': 'Margherita',
    'gluten-free-margherita': 'Margherita (gluten free)',
    'vegetarian': 'Vegetarian',
    'tuna': 'Tuna',
    'mushroom': 'Mushroom',
    'capricciosa': 'Capricciosa'
};

const pizzaEmojis = {
    'margherita': '🍅',
    'gluten-free-margherita': '🌾',
    'vegetarian': '🥬',
    'tuna': '🐟',
    'mushroom': '🍄',
    'capricciosa': '🍕'
};

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

function getPizzaDisplay(pizzaId) {
    if (!pizzaId) return { name: 'Not selected', emoji: '❌', class: 'bg-secondary' };
    const emoji = pizzaEmojis[pizzaId] || '🍕';
    const name = pizzaTypes[pizzaId] || pizzaId;
    return { name, emoji, class: 'bg-success' };
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// FILTER LOGIC

function applyPizzaFilters() {
    const searchTerm = (document.getElementById('pizzaSearchInput')?.value || '').toLowerCase().trim();
    
    filteredPizzaSelections = allPizzaSelections.filter(selection => {
        if (!searchTerm) return true;
        return (selection.userName || '').toLowerCase().includes(searchTerm);
    });
    
    renderPizzaSelections();
}

// RENDER FUNCTIONS

function renderPizzaSelections() {
    const noResults = document.getElementById('noPizzaSelectionsFound');
    
    if (filteredPizzaSelections.length === 0) {
        noResults?.classList.remove('d-none');
        document.getElementById('userPizzasTableBody').innerHTML = '';
        document.getElementById('mobilePizzaCards').innerHTML = '';
    } else {
        noResults?.classList.add('d-none');
        renderPizzaDesktopTable(filteredPizzaSelections);
        renderPizzaMobileCards(filteredPizzaSelections);
    }
}

function renderPizzaDesktopTable(data) {
    const tbody = document.getElementById('userPizzasTableBody');
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">No selections</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(selection => {
        const pizza = getPizzaDisplay(selection.day2);
        return `
            <tr>
                <td>${escapeHtml(selection.userName)}</td>
                <td>
                    <span class="badge ${pizza.class}">
                        ${pizza.emoji} ${escapeHtml(pizza.name)}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPizzaMobileCards(data) {
    const container = document.getElementById('mobilePizzaCards');
    if (!container) return;
    
    if (data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">No selections</div>';
        return;
    }
    
    container.innerHTML = data.map(selection => {
        const pizza = getPizzaDisplay(selection.day2);
        return `
            <div class="mobile-pizza-card">
                <div class="pizza-card-content">
                    <div class="pizza-user-info">
                        <div class="pizza-user-name">${escapeHtml(selection.userName)}</div>
                    </div>
                    <div class="pizza-selection">
                        <span class="badge ${pizza.class}">
                            ${pizza.emoji} ${escapeHtml(pizza.name)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// LOAD FUNCTIONS

async function loadPizzaSummaries() {
    try {
        const summaryElem = document.getElementById('day2Summary');
        if (!summaryElem) return;
        
        summaryElem.innerHTML = '<tr><td colspan="2" class="text-center">Loading...</td></tr>';
        
        const summaryRef = doc(db, "pizzaSummary", "day2");
        const summarySnap = await getDoc(summaryRef);
        
        if (summarySnap.exists()) {
            const data = summarySnap.data();
            let tableHtml = '';
            let totalCount = 0;
            
            Object.keys(pizzaTypes).forEach(pizzaId => {
                const count = data[pizzaId] || 0;
                totalCount += count;
                const emoji = pizzaEmojis[pizzaId] || '🍕';
                
                tableHtml += `
                    <tr>
                        <td>${emoji} ${pizzaTypes[pizzaId]}</td>
                        <td><strong>${count}</strong></td>
                    </tr>
                `;
            });
            
            tableHtml += `
                <tr class="table-active">
                    <td><strong>Total</strong></td>
                    <td><strong>${totalCount}</strong></td>
                </tr>
            `;
            
            summaryElem.innerHTML = tableHtml;
        } else {
            summaryElem.innerHTML = '<tr><td colspan="2" class="text-center">No data available</td></tr>';
        }
        
    } catch (error) {
        console.error("Error loading pizza summaries:", error);
        const summaryElem = document.getElementById('day2Summary');
        if (summaryElem) {
            summaryElem.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Error loading data</td></tr>';
        }
    }
}

async function loadUserPizzaSelections() {
    try {
        const tableBody = document.getElementById('userPizzasTableBody');
        const mobileCards = document.getElementById('mobilePizzaCards');
        
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="2" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</td></tr>';
        }
        if (mobileCards) {
            mobileCards.innerHTML = '<div class="text-center p-4"><div class="spinner-border spinner-border-sm me-2"></div>Loading...</div>';
        }
        
        const selectionsRef = collection(db, "pizzaSelections");
        const selectionsSnap = await getDocs(selectionsRef);
        
        if (selectionsSnap.empty) {
            allPizzaSelections = [];
            filteredPizzaSelections = [];
            renderPizzaSelections();
            return;
        }
        
        allPizzaSelections = [];
        selectionsSnap.forEach(selectionDoc => {
            const data = selectionDoc.data();
            
            let userName = 'Unknown User';
            if (data.fullName && data.fullName.trim()) {
                userName = data.fullName;
            } else if (data.firstName || data.lastName) {
                userName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
            }
            
            allPizzaSelections.push({
                id: selectionDoc.id,
                userName: userName,
                day2: data.day2 || null
            });
        });
        
        // Sort by name
        allPizzaSelections.sort((a, b) => a.userName.localeCompare(b.userName));
        
        console.log(`Loaded ${allPizzaSelections.length} pizza selections`);
        applyPizzaFilters();
        
    } catch (error) {
        console.error("Error loading user pizza selections:", error);
        const tableBody = document.getElementById('userPizzasTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="2" class="text-center text-danger">Error loading selections</td></tr>';
        }
    }
}

// INIT

document.addEventListener('DOMContentLoaded', function() {
    const userRole = localStorage.getItem('userRole');
    if (userRole !== 'admin') {
        console.log("Not an admin, pizza tracking features disabled");
        return;
    }
    
    console.log("Pizza tracking admin module loaded");
    
    // Event listeners
    document.getElementById('refreshPizzaSummary')?.addEventListener('click', loadPizzaSummaries);
    document.getElementById('refreshUserPizzas')?.addEventListener('click', loadUserPizzaSelections);
    document.getElementById('pizzaSearchInput')?.addEventListener('input', debounce(applyPizzaFilters, 300));
    
    // Initial load
    loadPizzaSummaries();
    loadUserPizzaSelections();
});