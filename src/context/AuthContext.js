import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../utils/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { ActivityIndicator, View } from 'react-native';

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  initialized: false
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state listener
  useEffect(() => {
    console.log('AuthContext: Setting up auth listener...');
    let unsubscribe;
    
    const initializeAuth = async () => {
      try {
        // Set up web persistence first
        if (Platform.OS === 'web') {
          await setPersistence(auth, browserLocalPersistence);
          console.log('Web auth persistence initialized');
        }

        // Set up auth state listener
        unsubscribe = onAuthStateChanged(auth, 
          (user) => {
            console.log('AuthContext: Auth state changed:', user ? 'User signed in' : 'User signed out');
            setUser(user);
            setLoading(false);
            setInitialized(true);
          },
          (error) => {
            console.error('AuthContext: Auth state change error:', error);
            setError(error);
            setLoading(false);
            setInitialized(true);
          }
        );
      } catch (error) {
        console.error('AuthContext: Failed to initialize auth:', error);
        setError(error);
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        console.log('AuthContext: Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, []);

  const signup = async (email, password, profileData) => {
    setError(null);
    console.log('Starting signup process...');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user.uid);

      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        ...profileData,
        createdAt: new Date().toISOString(),
        email: userCredential.user.email,
        lastLogin: new Date().toISOString()
      };

      console.log('Creating user profile...');
      await setDoc(userDocRef, userData);
      console.log('User profile created successfully');

      return userCredential.user;
    } catch (error) {
      console.error('Signup error:', error);
      setError(error);
      throw error;
    }
  };

  const login = async (email, password) => {
    if (!initialized) {
      console.error('AuthContext: Cannot login - auth not initialized');
      throw new Error('Authentication not initialized');
    }

    console.log('AuthContext: Attempting login...');
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthContext: Login successful');
      setUser(userCredential.user);
      return userCredential.user;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      setError(error);
      
      // Provide more user-friendly error messages
      let errorMessage = 'An error occurred during login.';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
      }
      
      error.message = errorMessage;
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!initialized) {
      console.error('AuthContext: Cannot logout - auth not initialized');
      throw new Error('Authentication not initialized');
    }

    console.log('AuthContext: Attempting logout...');
    setLoading(true);
    setError(null);

    try {
      await signOut(auth);
      setUser(null);
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 