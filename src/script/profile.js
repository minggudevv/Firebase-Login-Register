import { auth, database } from './firebase-config.js';
import { updateProfile } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";

// Handle URL update
document.getElementById('updatePhotoBtn').addEventListener('click', async () => {
    const photoUrl = document.getElementById('photoUrl').value;
    if (!photoUrl) {
        alert('Please enter an image URL');
        return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
        // Validate URL
        await validateImageUrl(photoUrl);

        // Update user profile
        await updateProfile(user, {
            photoURL: photoUrl
        });

        // Store in Firebase Database
        await set(ref(database, `users/${user.uid}/profile`), {
            photoURL: photoUrl,
            lastUpdated: new Date().toISOString()
        });

        // Update UI
        document.getElementById('profilePhoto').src = photoUrl;
        document.querySelector('#userInfo img').src = photoUrl;
        document.getElementById('photoUrl').value = '';
        
        // Show success message
        showAlert('success', 'Profile photo updated successfully!');

    } catch (error) {
        console.error('Error:', error);
        showAlert('error', 'Invalid image URL or network error');
    }
});

// Validate image URL
async function validateImageUrl(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Invalid image URL'));
        img.src = url;
    });
}

// Show alert message
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'success' ? 'success' : 'danger'} mt-3`;
    alertDiv.textContent = message;
    
    const urlControls = document.querySelector('.url-controls');
    urlControls.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 3000);
}

// Initial load of user photo
auth.onAuthStateChanged((user) => {
    if (user) {
        const userRef = ref(database, `users/${user.uid}/profile`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.photoURL) {
                    document.getElementById('profilePhoto').src = data.photoURL;
                } else if (user.photoURL) {
                    document.getElementById('profilePhoto').src = user.photoURL;
                }
            }
        });
    }
});
