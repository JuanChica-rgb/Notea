import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Tus credenciales reales de la consola de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDHITVzEr4UNDyCPkvmllFkBk0LfIJvv24",
  authDomain: "notea-6a76e.firebaseapp.com",
  projectId: "notea-6a76e",
  storageBucket: "notea-6a76e.firebasestorage.app",
  messagingSenderId: "984539531091",
  appId: "1:984539531091:web:5f107f09c9442c02ba43a6",
  measurementId: "G-6C7GME2BL5"
};


// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Exportar los servicios listos para usarlos en Notea
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);