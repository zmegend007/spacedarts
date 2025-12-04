// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBnKw1Q3YSVvFLMNhDnIcfLEAon4LorxLM",
    authDomain: "gen-lang-client-0524653742.firebaseapp.com",
    projectId: "gen-lang-client-0524653742",
    storageBucket: "gen-lang-client-0524653742.firebasestorage.app",
    messagingSenderId: "792572156290",
    appId: "1:792572156290:web:4ff95f1752c7af8bc1979b",
    measurementId: "G-BEWBX5FK40"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
