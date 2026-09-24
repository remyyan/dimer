"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
  userData: UserData | null;
  updateUserData: (newData: Partial<UserData>) => Promise<void>;
}

export interface UserData {
  dimerRating: number;
  unlimitedStreak: number;
  
  // Existing local storage stats
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: Record<number | "fail", number>;
  history: Array<{
    date: string;
    won: boolean;
    guesses: number;
    answer: string;
    identity?: string;
  }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  userData: null,
  updateUserData: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUserData = async (newData: Partial<UserData>) => {
    if (!user || !userData) return;
    const merged = { ...userData, ...newData };
    setUserData(merged);
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, merged, { merge: true });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch or create user data in Firestore
        const userDocRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          setUserData(userSnap.data() as UserData);
        } else {
          // Initialize new user, potentially migrating from local storage
          let existingLocalStats: any = null;
          try {
            if (typeof window !== "undefined") {
              const saved = localStorage.getItem("dimer_user_stats");
              if (saved) existingLocalStats = JSON.parse(saved);
            }
          } catch (e) {}

          const newUserData: UserData = {
            dimerRating: 1000,
            unlimitedStreak: 0,
            currentStreak: existingLocalStats?.currentStreak || 0,
            maxStreak: existingLocalStats?.maxStreak || 0,
            gamesPlayed: existingLocalStats?.gamesPlayed || 0,
            gamesWon: existingLocalStats?.gamesWon || 0,
            guessDistribution: existingLocalStats?.guessDistribution || {
              1: 0, 2: 0, 3: 0, 4: 0, fail: 0
            },
            history: existingLocalStats?.history || [],
          };
          await setDoc(userDocRef, newUserData);
          setUserData(newUserData);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing in with Email:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error("Error signing up with Email:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, userData, updateUserData 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

