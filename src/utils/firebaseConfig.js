import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyCqcAV6h7oFCmR6EvzFPnNuXwtxNTEaaM8",
  authDomain: "sporelinkapp.firebaseapp.com",
  projectId: "sporelinkapp",
  storageBucket: "sporelinkapp.firebasestorage.app",
  messagingSenderId: "852787405966",
  appId: "1:852787405966:web:acf3a876ea16cb8ef4d5df",
  measurementId: "G-57L8N8RD3C"
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