import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} = Constants.manifest?.extra || {};

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || "AIzaSyCqcAV6h7oFCmR6EvzFPnNuXwtxNTEaaM8",
  authDomain: FIREBASE_AUTH_DOMAIN || "sporelinkapp.firebaseapp.com",
  projectId: FIREBASE_PROJECT_ID || "sporelinkapp",
  storageBucket: FIREBASE_STORAGE_BUCKET || "sporelinkapp.firebasestorage.app",
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || "852787405966",
  appId: FIREBASE_APP_ID || "1:852787405966:web:acf3a876ea16cb8ef4d5df",
  measurementId: FIREBASE_MEASUREMENT_ID || "G-57L8N8RD3C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

const db = getFirestore(app);

console.log('Firebase initialized:', !!app);
console.log('Auth initialized:', !!auth);
console.log('Firestore initialized:', !!db);

export { auth, db }; 