import { auth, database } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, query, orderByChild, limitToLast, onValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
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
            
            // Load login history
            loadLoginHistory();
        } else {
            window.location.href = 'index.html';
        }
    });

    // Initialize event listeners
    const signoutBtn = document.getElementById('signoutBtn');
    if (signoutBtn) {
        signoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
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

            // Sort by timestamp descending and limit to 20
            entries
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20)
                .forEach(entry => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <div>${entry.formattedDate || 'N/A'}</div>
                            <small class="text-muted">${entry.formattedTime || 'N/A'}</small>
                        </td>
                        <td>${entry.ip || 'N/A'}</td>
                        <td>
                            <small class="text-muted">${entry.userAgent || 'N/A'}</small>
                        </td>
                    `;
                    historyTable.appendChild(row);
                });

            // Update last login
            if (entries.length > 0) {
                const lastLoginElement = document.getElementById('lastLogin');
                if (lastLoginElement) {
                    const latest = entries[0];
                    lastLoginElement.textContent = `${latest.formattedDate} ${latest.formattedTime}`;
                }
            }
        } else {
            historyTable.innerHTML = `
                <tr><td colspan="3" class="text-center">No login history available</td></tr>
            `;
        }
    });
}
