import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBr72AwEKrlR9ATBu7-anEYHNNjTWEQo-I",
  authDomain: "shop-stock-manager-8aa62.firebaseapp.com",
  projectId: "shop-stock-manager-8aa62",
  storageBucket: "shop-stock-manager-8aa62.firebasestorage.app",
  messagingSenderId: "664002180956",
  appId: "1:664002180956:web:43e717d1cebe2a2ee53399",
  measurementId: "G-CPDYT4PNV4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;