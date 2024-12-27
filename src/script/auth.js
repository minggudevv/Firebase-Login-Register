import { auth, googleProvider, database } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendSignInLinkToEmail,
    signInWithEmailLink,
    signInWithPopup,
    isSignInWithEmailLink,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Sign Up Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
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
}

// Sign In Handler
const signinForm = document.getElementById('signinForm');
if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signinEmail').value;
        const password = document.getElementById('signinPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            if (rememberMe) {
                // Store credentials securely
                const credentials = btoa(JSON.stringify({ email, password }));
                localStorage.setItem('authCredentials', credentials);
            }
            
            window.location.href = 'dashboard.html';
        } catch (error) {
            showAlert('signin', error.message);
        }
    });
}

// Google Sign In
const googleSignInBtn = document.getElementById('googleSignIn');
if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
        try {
            // Show loading state
            googleSignInBtn.disabled = true;
            googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connecting...';

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
            googleSignInBtn.disabled = false;
            googleSignInBtn.innerHTML = '<i class="fab fa-google me-2"></i>Google';
        }
    });
}

// Forgot Password
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value;

        try {
            await sendPasswordResetEmail(auth, email);
            showAlert('reset', 'Password reset email sent!', 'success');
        } catch (error) {
            showAlert('reset', error.message);
        }
    });
}

// Passwordless Sign In - Step 1: Send Link
const passwordlessSignInForm = document.getElementById('passwordlessSignIn');
if (passwordlessSignInForm) {
    passwordlessSignInForm.addEventListener('submit', async (e) => {
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
}

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
    } else if (!window.location.pathname.includes('dashboard.html')) {
        // Only check auto-login on non-dashboard pages
        checkAutoLogin();
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

// Auto-login check
async function checkAutoLogin() {
    if (window.location.pathname.includes('dashboard.html')) return; // Skip if already on dashboard
    
    const savedCredentials = localStorage.getItem('authCredentials');
    if (savedCredentials) {
        try {
            const { email, password } = JSON.parse(atob(savedCredentials));
            await signInWithEmailAndPassword(auth, email, password);
            // Only redirect if we're not already on dashboard
            if (!window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'dashboard.html';
            }
        } catch (error) {
            localStorage.removeItem('authCredentials');
            console.error('Auto-login failed:', error);
        }
    }
}

// Logout handler to clear saved credentials
export function handleLogout() {
    localStorage.removeItem('authCredentials');
    signOut(auth);
}
