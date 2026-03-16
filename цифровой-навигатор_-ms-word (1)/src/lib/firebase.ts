import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
// You can find this in the Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: "AIzaSyAfgqKn0v9xwyMkRBYR7snatyWJtTnl6Qg",
  authDomain: "diplom-kanban.firebaseapp.com",
  projectId: "diplom-kanban",
  storageBucket: "diplom-kanban.firebasestorage.app",
  messagingSenderId: "61279007429",
  appId: "1:61279007429:web:9c3c05d7218cd56eaaf6ac"
};

// Check if config is valid
const hasConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app;
let auth: Auth;
let db: Firestore;
let initialized = false;

if (hasConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    initialized = true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

if (!initialized) {
  console.warn("Firebase configuration missing or invalid. App will run in setup mode.");
  // Export dummy objects to prevent import errors, but they shouldn't be used
  auth = {} as Auth;
  db = {} as Firestore;
}

export const isFirebaseInitialized = initialized;
export { auth, db };
