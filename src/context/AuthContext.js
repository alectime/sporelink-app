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

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up persistence
  useEffect(() => {
    if (Platform.OS === 'web') {
      setPersistence(auth, browserLocalPersistence)
        .catch(error => {
          console.error('Error setting auth persistence:', error);
        });
    }
  }, []);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      try {
        if (user) {
          // Get user profile data from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            console.log('User profile data found');
            setUser({
              ...user,
              profile: userDoc.data()
            });
          } else {
            console.log('No user profile found, creating default profile');
            const defaultProfile = {
              email: user.email,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, defaultProfile);
            setUser({
              ...user,
              profile: defaultProfile
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Still set the basic user object if profile operations fail
        setUser(user);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Auth state change error:', error);
      setError(error);
      setLoading(false);
    });

    return unsubscribe;
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
    setError(null);
    console.log('Attempting login...');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      
      // Update last login time
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        lastLogin: new Date().toISOString()
      }, { merge: true });

      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error);
      throw error;
    }
  };

  const logout = async () => {
    setError(null);
    console.log('Attempting logout...');
    try {
      if (user) {
        // Update last activity before logging out
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          lastLogout: new Date().toISOString()
        }, { merge: true });
      }
      await signOut(auth);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      setError(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      signup,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 