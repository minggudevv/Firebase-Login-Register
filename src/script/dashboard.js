import { auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        const photoURL = user.photoURL || 'https://via.placeholder.com/100';
        document.getElementById('userInfo').innerHTML = `
            <div class="text-white">
                <div class="d-flex align-items-center mb-3">
                    <div class="rounded-circle bg-white text-primary p-3 me-3">
                        <img src="${photoURL}" class="rounded-circle" width="50" height="50" alt="Profile">
                    </div>
                    <div>
                        <h5 class="mb-0">${user.displayName || 'Not set'}</h5>
                        <p class="mb-0">${user.email}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        window.location.href = 'index.html';
    }
});

// Sign Out Handler
document.getElementById('signoutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        alert('Error signing out: ' + error.message);
    }
});
