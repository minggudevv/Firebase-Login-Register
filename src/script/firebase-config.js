// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCWBio9oVFy0a2yySsmQ3fU5VKYl7ITMN8",
    authDomain: "login-and-register-e66b9.firebaseapp.com",
    databaseURL: "https://login-and-register-e66b9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "login-and-register-e66b9",
    storageBucket: "login-and-register-e66b9.firebasestorage.app",
    messagingSenderId: "797192484811",
    appId: "1:797192484811:web:bc974960cde85ebb5be84e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const storage = getStorage(app);
export const database = getDatabase(app);