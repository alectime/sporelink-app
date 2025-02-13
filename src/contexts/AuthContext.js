import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../utils/firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { ActivityIndicator, View, Platform } from 'react-native';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth listener...');
    let unsubscribe;

    const initializeAuth = async () => {
      try {
        if (Platform.OS === 'web') {
          // Try to set up browser persistence
          try {
            await setPersistence(auth, browserLocalPersistence);
            console.log('Browser local persistence initialized');
          } catch (persistenceError) {
            console.warn('Failed to set local persistence, trying session persistence:', persistenceError);
            try {
              await setPersistence(auth, browserSessionPersistence);
              console.log('Browser session persistence initialized');
            } catch (sessionError) {
              console.warn('Failed to set session persistence, falling back to in-memory:', sessionError);
              await setPersistence(auth, inMemoryPersistence);
              console.log('In-memory persistence initialized');
            }
          }
        }

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

  const login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'An error occurred during login.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
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
          errorMessage = 'Too many login attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      let errorMessage = 'An error occurred during signup.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'An account already exists with this email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (!initialized) {
      throw new Error('Authentication system not initialized');
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
      const errorMessage = 'Failed to sign out. Please try again.';
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      setError(enhancedError);
      throw enhancedError;
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    signup,
    initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 