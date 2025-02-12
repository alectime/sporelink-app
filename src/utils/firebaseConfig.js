import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
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

console.log('Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
    // Set persistence for web
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Web auth persistence set to local');
      })
      .catch((error) => {
        console.error('Error setting auth persistence:', error);
      });
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  }
  console.log('Auth initialized successfully for platform:', Platform.OS);
} catch (error) {
  console.error('Error initializing auth:', error);
  // Fallback to basic auth with more detailed error logging
  console.error('Falling back to basic auth. Error details:', error.message);
  auth = getAuth(app);
}

const db = getFirestore(app);

// Enable offline persistence for Firestore
if (Platform.OS === 'web') {
  enableIndexedDbPersistence(db, {
    synchronizeTabs: true
  })
    .then(() => {
      console.log('Firestore offline persistence enabled for web');
    })
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence');
      }
      console.error('Firestore persistence error:', err);
    });
}

// Add error event listener for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in:', user.uid);
  } else {
    console.log('User is signed out');
  }
}, (error) => {
  console.error('Auth state change error:', error);
});

console.log('Firebase initialized:', !!app);
console.log('Auth initialized:', !!auth);
console.log('Firestore initialized:', !!db);

export { auth, db }; 