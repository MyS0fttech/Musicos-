import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import configJson from '../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: configJson.apiKey || process.env.VITE_FIREBASE_API_KEY,
  authDomain: configJson.authDomain || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: configJson.projectId || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: configJson.storageBucket || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: configJson.messagingSenderId || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: configJson.appId || process.env.VITE_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const databaseId = configJson.firestoreDatabaseId && configJson.firestoreDatabaseId !== ''
  ? configJson.firestoreDatabaseId
  : '(default)';

export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
