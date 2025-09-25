// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBr72AwEKrlR9ATBu7-anEYHNNjTWEQo-I",
  authDomain: "shop-stock-manager-8aa62.firebaseapp.com",
  projectId: "shop-stock-manager-8aa62",
  storageBucket: "shop-stock-manager-8aa62.firebasestorage.app",
  messagingSenderId: "664002180956",
  appId: "1:664002180956:web:43e717d1cebe2a2ee53399",
  measurementId: "G-CPDYT4PNV4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);