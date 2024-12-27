import { auth, database } from './firebase-config.js';
import { ref, set, get, query, orderByChild, limitToLast, remove, push } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Wait for DOM and Bootstrap to be ready
const initializeSecurityFeatures = () => {
    let pinModal;
    
    // Initialize modal after ensuring the element exists
    const initModal = () => {
        const modalElement = document.getElementById('pinModal');
        if (modalElement) {
            pinModal = new bootstrap.Modal(modalElement, {
                backdrop: 'static',
                keyboard: false
            });
        }
    };

    // Check if PIN is required
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Initialize modal if not already done
                if (!pinModal) {
                    initModal();
                }

                const userRef = ref(database, `users/${user.uid}/security`);
                const snapshot = await get(userRef);
                
                // If user has PIN set and we're not on dashboard already
                if (snapshot.exists() && 
                    snapshot.val().pin && 
                    !window.location.pathname.includes('dashboard.html') &&
                    pinModal) {
                    pinModal.show();
                }

                // Save login history
                saveLoginHistory(user);
            } catch (error) {
                console.error('Security check error:', error);
            }
        }
    });

    // Handle PIN submission
    const pinForm = document.getElementById('pinForm');
    if (pinForm) {
        pinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const pin = document.getElementById('pinInput').value;
            const user = auth.currentUser;
            
            if (!user || !pinModal) return;

            try {
                const userRef = ref(database, `users/${user.uid}/security`);
                const snapshot = await get(userRef);
                
                if (snapshot.exists() && snapshot.val().pin === pin) {
                    pinModal.hide();
                    window.location.href = 'dashboard.html';
                } else {
                    showPinError('Invalid PIN');
                }
            } catch (error) {
                console.error('PIN verification error:', error);
                showPinError('Error verifying PIN');
            }
        });
    }
};

// Save login history with limit
async function saveLoginHistory(user) {
    const lastLoginKey = `lastLogin_${user.uid}`;
    const lastLoginTime = localStorage.getItem(lastLoginKey);
    const now = new Date();
    const currentTime = now.getTime();

    // Prevent multiple entries within 1 minute
    if (lastLoginTime && (currentTime - parseInt(lastLoginTime)) < 60000) {
        return;
    }

    try {
        const userAgent = navigator.userAgent;
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;
        
        const now = new Date();
        const timestamp = now.getTime();
        
        // Reference to user's login history
        const historyRef = ref(database, `users/${user.uid}/loginHistory`);
        
        // Add new entry first
        const newEntryRef = push(historyRef);
        await set(newEntryRef, {
            timestamp,
            formattedDate: now.toLocaleDateString(),
            formattedTime: now.toLocaleTimeString(),
            ip,
            userAgent
        });

        // Get and clean up old entries
        const orderedRef = query(historyRef, orderByChild('timestamp'));
        const snapshot = await get(orderedRef);
        
        if (snapshot.exists()) {
            const entries = [];
            snapshot.forEach((child) => {
                entries.push({
                    key: child.key,
                    timestamp: child.val().timestamp
                });
            });

            // Keep only the latest 20 entries
            if (entries.length > 20) {
                entries.sort((a, b) => b.timestamp - a.timestamp);
                const entriesToDelete = entries.slice(20);
                
                // Delete old entries
                for (const entry of entriesToDelete) {
                    await remove(ref(database, `users/${user.uid}/loginHistory/${entry.key}`));
                }
            }
        }

        // Update last login time
        localStorage.setItem(lastLoginKey, currentTime.toString());
    } catch (error) {
        console.error('Error saving login history:', error);
    }
}

// Show PIN error message
function showPinError(message) {
    const pinInput = document.getElementById('pinInput');
    if (!pinInput) return;

    pinInput.classList.add('is-invalid');
    
    // Create or update error message
    let errorDiv = document.querySelector('.pin-error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback pin-error-message';
        pinInput.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;

    // Clear error after 3 seconds
    setTimeout(() => {
        pinInput.classList.remove('is-invalid');
        errorDiv.remove();
    }, 3000);
}

// Initialize security features after DOM is loaded and Bootstrap is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a short moment to ensure Bootstrap is fully initialized
    setTimeout(initializeSecurityFeatures, 100);
});

// Add some CSS for better error display
const style = document.createElement('style');
style.textContent = `
    .pin-error-message {
        display: block;
        color: var(--error-color);
        margin-top: 0.5rem;
        font-size: 0.875rem;
    }
`;
document.head.appendChild(style);
