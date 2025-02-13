import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  setPersistence,
  connectAuthEmulator,
  onAuthStateChanged
} from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  connectFirestoreEmulator,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  setLogLevel,
  enableMultiTabIndexedDbPersistence,
  waitForPendingWrites
} from "firebase/firestore";
import { 
  getStorage, 
  ref as storageRef,
  connectStorageEmulator 
} from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDatabase, ref, onValue } from 'firebase/database';

// Enable detailed logging in development
if (__DEV__) {
  setLogLevel('debug');
}

console.log('Starting Firebase initialization...');

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

// Initialize base app first
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase app:', error);
  throw error;
}

// Initialize auth with appropriate persistence
let auth;
try {
  if (Platform.OS === 'web') {
    auth = getAuth(app);
    console.log('Web auth initialized');
    
    // Check if we're in an iframe
    const isIframe = window.self !== window.top;
    
    if (!isIframe) {
      // Only try persistence if we're not in an iframe
      setPersistence(auth, browserSessionPersistence)
        .then(() => {
          console.log('Web auth session persistence initialized');
        })
        .catch((error) => {
          console.warn('Failed to set session persistence, falling back to in-memory:', error);
          setPersistence(auth, inMemoryPersistence)
            .catch((error) => console.error('Failed to set in-memory persistence:', error));
        });
    } else {
      console.log('Running in iframe, using in-memory persistence');
      setPersistence(auth, inMemoryPersistence)
        .catch((error) => console.error('Failed to set in-memory persistence:', error));
    }
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
    console.log('Mobile auth initialized with persistence');
  }
} catch (error) {
  console.error('Error initializing auth:', error);
  // Fallback to basic auth without persistence
  auth = getAuth(app);
}

// Initialize Firestore with appropriate settings
let db;
try {
  const firestoreSettings = {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
    ignoreUndefinedProperties: true,
    // Add retry settings
    maxAttempts: 5,
    retryDelayMultiplier: 2,
    initialRetryDelayMillis: 1000,
    maxRetryDelayMillis: 10000
  };

  db = initializeFirestore(app, firestoreSettings);
  console.log('Firestore initialized with settings');

  if (Platform.OS === 'web') {
    // Enable multi-tab persistence for web platform
    enableMultiTabIndexedDbPersistence(db)
      .then(() => {
        console.log('Multi-tab IndexedDB persistence enabled successfully');
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, fallback to single-tab persistence
          return enableIndexedDbPersistence(db, {
            synchronizeTabs: false,
            forceOwnership: true
          });
        } else if (err.code === 'unimplemented') {
          console.warn('Browser doesnt support persistence');
        }
        throw err;
      })
      .catch((err) => {
        console.error('Error enabling persistence:', err);
      });

    // Add connection state listener
    const connectedRef = ref(getDatabase(app), '.info/connected');
    onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        console.log('Connected to Firebase');
        // Sync pending writes when connection is restored
        waitForPendingWrites(db)
          .then(() => console.log('Pending writes synchronized'))
          .catch(err => console.warn('Error syncing pending writes:', err));
      } else {
        console.log('Not connected to Firebase');
      }
    });
  }
} catch (error) {
  console.error('Error initializing Firestore:', error);
  db = getFirestore(app);
}

// Initialize Firebase Storage
let storage;
try {
  storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Storage:', error);
}

// Connect to emulators in development
if (__DEV__ && Platform.OS === 'web' && window.location.hostname === 'localhost') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('Connected to Firebase emulators');
  } catch (error) {
    console.warn('Failed to connect to emulators:', error);
  }
}

// Set up auth state listener
onAuthStateChanged(auth, (user) => {
  console.log('Auth state changed:', user ? 'User signed in' : 'User signed out');
});

export { app, auth, db, storage }; 