import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../utils/firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        try {
          // Get user profile data from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          console.log('User profile data:', userDoc.data());
          
          setUser({
            ...user,
            profile: userDoc.data()
          });
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Still set the user even if profile fetch fails
          setUser(user);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, profileData) => {
    console.log('Starting signup process in AuthContext...');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user.uid);

      // Create user profile in Firestore
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userData = {
        ...profileData,
        createdAt: new Date().toISOString(),
        email: userCredential.user.email
      };

      console.log('Creating user profile:', userData);
      await setDoc(userDocRef, userData);
      console.log('User profile created successfully');

      return userCredential.user;
    } catch (error) {
      console.error('Signup error in AuthContext:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    console.log('Attempting login...');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful');
      return result.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Attempting logout...');
    try {
      await signOut(auth);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signup,
      login,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 