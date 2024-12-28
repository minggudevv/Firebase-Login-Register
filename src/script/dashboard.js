import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, query, orderByChild, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { handleLogout } from './auth.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    let isInitialLoad = true;
    
    // Check authentication state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                const photoURL = user.photoURL || 'https://via.placeholder.com/100';
                userInfoElement.innerHTML = `
                    <div class="text-white">
                        <div class="d-flex align-items-center mb-3">
                            <div class="profile-header-photo me-3">
                                <img src="${photoURL}" alt="Profile" class="rounded-circle">
                            </div>
                            <div>
                                <h5 class="mb-0">${user.displayName || 'Not set'}</h5>
                                <p class="mb-0">${user.email}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            // Load login history only on initial load
            if (isInitialLoad) {
                loadLoginHistory();
                isInitialLoad = false;
            }
        } else if (!localStorage.getItem('authCredentials')) {
            // Only redirect if no stored credentials
            window.location.href = 'index.html';
        }
    });

    // Initialize event listeners
    const signoutBtn = document.getElementById('signoutBtn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
            try {
                await handleLogout();
                window.location.href = 'index.html';
            } catch (error) {
                alert('Error signing out: ' + error.message);
            }
        });
    }

    const loginHistoryModal = document.getElementById('loginHistoryModal');
    if (loginHistoryModal) {
        loginHistoryModal.addEventListener('show.bs.modal', function () {
            loadLoginHistory();
        });
    }
});

// Function to load login history
function loadLoginHistory() {
    const user = auth.currentUser;
    if (!user) return;

    const historyRef = ref(database, `users/${user.uid}/loginHistory`);
    const orderedRef = query(historyRef, orderByChild('timestamp'));
    
    onValue(orderedRef, (snapshot) => {
        const historyTable = document.getElementById('loginHistoryTable');
        if (!historyTable) return;
        
        historyTable.innerHTML = '';

        if (snapshot.exists()) {
            const entries = [];
            snapshot.forEach((child) => {
                entries.push(child.val());
            });

            if (entries.length === 0) {
                showEmptyState(historyTable);
                return;
            }

            entries
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20)
                .forEach(entry => {
                    const deviceInfo = getDeviceInfo(entry.userAgent);
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="date-column">
                            <div class="fw-medium">${formatDate(entry.formattedDate)}</div>
                            <small class="text-muted">${entry.formattedTime}</small>
                        </td>
                        <td class="ip-column">
                            <span class="ip-badge">
                                <i class="fas fa-globe me-2"></i>
                                ${entry.ip || 'N/A'}
                            </span>
                        </td>
                        <td class="device-column">
                            <div class="device-info">
                                <i class="${deviceInfo.icon}"></i>
                                <div class="details">
                                    <div class="fw-medium">${deviceInfo.browser}</div>
                                    <small class="text-muted">${deviceInfo.os}</small>
                                </div>
                            </div>
                        </td>
                    `;
                    historyTable.appendChild(row);
                });
        } else {
            showEmptyState(historyTable);
        }
    });
}

function showEmptyState(table) {
    table.innerHTML = `
        <tr>
            <td colspan="3" class="text-center p-5">
                <div class="empty-state">
                    <i class="fas fa-history fa-3x mb-3 text-muted"></i>
                    <h5 class="text-dark">No Login History</h5>
                    <p class="text-muted mb-0">Your login history will appear here</p>
                </div>
            </td>
        </tr>
    `;
}

function getDeviceInfo(userAgent) {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    
    let icon = 'fas fa-desktop';
    if (result.device.type === 'mobile') icon = 'fas fa-mobile-alt';
    else if (result.device.type === 'tablet') icon = 'fas fa-tablet-alt';
    
    return {
        browser: result.browser.name,
        os: result.os.name + ' ' + result.os.version,
        icon: icon
    };
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatUserAgent(ua) {
    if (!ua) return 'N/A';
    const parser = new UAParser(ua);
    const result = parser.getResult();
    return `${result.browser.name} on ${result.os.name}`;
}

function updateLastLogin(latest) {
    const lastLoginElement = document.getElementById('lastLogin');
    if (lastLoginElement && latest) {
        lastLoginElement.innerHTML = `
            <div>${formatDate(latest.formattedDate)}</div>
            <small>${latest.formattedTime}</small>
        `;
    }
}
