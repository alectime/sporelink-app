import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyCqcAV6h7oFCmR6EvzFPnNuXwtxNTEaaM8",
  authDomain: "sporelinkapp.firebaseapp.com",
  projectId: "sporelinkapp",
  storageBucket: "sporelinkapp.firebasestorage.app",
  messagingSenderId: "852787405966",
  appId: "1:852787405966:web:acf3a876ea16cb8ef4d5df",
  measurementId: "G-57L8N8RD3C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 