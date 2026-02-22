// 📁 firebase.js - Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 YOUR FIREBASE CONFIG - Replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAGbjPhygIFhSVFZMFXD5Q69c0Nm89OTrg",
  authDomain: "smart-hospital-d3aef.firebaseapp.com",
  projectId: "smart-hospital-d3aef",
  storageBucket: "smart-hospital-d3aef.firebasestorage.app",
  messagingSenderId: "653165104142",
  appId: "1:653165104142:web:15f7eeec22ca715fb405f",
  measurementId: "G-C9LDFJL14"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);

// Export for use in other files
export { db, auth };