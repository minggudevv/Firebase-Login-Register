import { auth, googleProvider, database } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    signInWithPopup,
    isSignInWithEmailLink,
    updateProfile 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

// Google Sign In
document.getElementById('googleSignIn').addEventListener('click', async () => {
    try {
        // Show loading state
        const button = document.getElementById('googleSignIn');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connecting...';

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Get credentials (optional)
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // Store user info in database
        await set(ref(database, `users/${user.uid}/profile`), {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString(),
            provider: 'google',
            lastSignInTime: user.metadata.lastSignInTime
        });

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        console.error('Google Sign In Error:', error);
        
        // Handle specific errors
        if (error.code === 'auth/popup-blocked') {
            showAlert('signin', 'Please allow popups for this website');
        } else if (error.code === 'auth/popup-closed-by-user') {
            showAlert('signin', 'Sign in cancelled');
        } else {
            showAlert('signin', error.message);
        }
        
        // Reset button state
        const button = document.getElementById('googleSignIn');
        button.disabled = false;
        button.innerHTML = '<i class="fab fa-google me-2"></i>Google';
    }
});

// Forgot Password
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('resetEmail').value;

    try {
        await sendPasswordResetEmail(auth, email);
        showAlert('reset', 'Password reset email sent!', 'success');
    } catch (error) {
        showAlert('reset', error.message);
    }
});

// Passwordless Sign In - Step 1: Send Link
document.getElementById('passwordlessSignIn').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('passwordlessEmail').value;
    
    const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true
    };

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        showAlert('passwordless', 'Sign-in link sent to your email!', 'success');
    } catch (error) {
        showAlert('passwordless', error.message);
    }
});

// Passwordless Sign In - Step 2: Complete Sign In
window.addEventListener('load', async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
        let email = window.localStorage.getItem('emailForSignIn');
        
        if (!email) {
            email = window.prompt('Please provide your email for confirmation');
        }

        try {
            await signInWithEmailLink(auth, email, window.location.href);
            window.localStorage.removeItem('emailForSignIn');
            window.location.href = 'dashboard.html';
        } catch (error) {
            showAlert('signin', error.message);
        }
    }
});

// Enhanced alert function
function showAlert(formType, message, type = 'danger') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} mt-3`;
    alertDiv.textContent = message;
    
    const container = document.getElementById(`${formType}Form`) || 
                     document.querySelector('.card-body');
    container.appendChild(alertDiv);
    
    setTimeout(() => alertDiv.remove(), 3000);
}
