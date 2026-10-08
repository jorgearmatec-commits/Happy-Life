import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';

// Default / fallback Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyHappyLifeDuoSafeApp12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "happy-life-duo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "happy-life-duo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "happy-life-duo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "201184583742",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:201184583742:web:happyduo9988"
};

let app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  db = getFirestore(app);
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { db, collection, doc, setDoc, getDoc, onSnapshot, query, orderBy, serverTimestamp };

export async function loginWithGoogle() {
  try {
    // Only attempt real popup if a valid real key is provided
    if (import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('Dummy')) {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
    return null;
  } catch (err: unknown) {
    console.warn("Google Sign-In notice (fallback enabled):", err);
    return null;
  }
}

export async function logoutUser() {
  try {
    await fbSignOut(auth);
  } catch (err) {
    console.error("Sign-out error:", err);
  }
}

export { onAuthStateChanged, type FirebaseUser };
