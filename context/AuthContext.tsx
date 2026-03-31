'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider
} from 'firebase/auth';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  uid?: string;
}

interface AuthContextType {
  user: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const syncUser = useMutation(api.users.syncUser);

  useEffect(() => {
    if (!auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.email}`,
        };
        setUser(userData);
        
        try {
          // Sync with Convex
          await syncUser({
            uid: userData.uid,
            email: userData.email,
            name: userData.name,
            picture: userData.avatar,
          });
        } catch (error) {
          console.error('Error syncing user to backend:', error);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncUser]);

  const logout = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      console.error('Firebase Auth is not initialized due to missing API keys');
      return;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Google Login for Android/iOS
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        if (result.credential?.idToken) {
          const credential = GoogleAuthProvider.credential(result.credential.idToken);
          await signInWithCredential(auth, credential);
        }
      } else {
        // Standard Web Login for Browser
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loginWithGoogle,
      logout,
      isAuthenticated: !!user,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
