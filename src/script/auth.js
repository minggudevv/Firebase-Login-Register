import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Sign Up Handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name
        });
        window.location.href = 'dashboard.html';
    } catch (error) {
        showAlert('signup', error.message);
    }
});

// Sign In Handler
document.getElementById('signinForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signinEmail').value;
    const password = document.getElementById('signinPassword').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        showAlert('signin', error.message);
    }
});

// Helper function to show alerts
function showAlert(formType, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger';
    alertDiv.textContent = message;
    
    const form = document.getElementById(`${formType}Form`);
    form.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 3000);
}
