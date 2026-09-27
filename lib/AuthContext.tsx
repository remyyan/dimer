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
  migrationRatingChange: number | null;
  clearMigrationRatingChange: () => void;
}

export interface UserData {
  dimerRating: number;
  unlimitedStreak: number;
  username?: string;
  hasOnboarded?: boolean;
  country?: string;
  
  // Existing local storage stats
  currentStreak: number;
  maxStreak: number;
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: Record<number | "fail", number>;
  history: Array<{
    date: string;
    team: string;
    won: boolean;
    guessesCount: number;
    fullMatchup?: string;
  }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
  userData: null,
  updateUserData: async () => {},
  migrationRatingChange: null,
  clearMigrationRatingChange: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationRatingChange, setMigrationRatingChange] = useState<number | null>(null);

  const clearMigrationRatingChange = () => setMigrationRatingChange(null);

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
          const data = userSnap.data() as UserData;
          
          // SILENT PATCH: If a user migrated before the backfill script, their Elo is stuck at 1000.
          // Let's recalculate it if it's exactly 1000 but they have wins.
          if (data.dimerRating === 1000 && data.history && data.history.length > 0) {
            let recalc = 1000;
            const chronologicalHistory = [...data.history].reverse();
            for (const game of chronologicalHistory) {
              if (game.won) {
                const guesses = (game as Record<string, unknown>).guessesCount as number || (game as Record<string, unknown>).guesses as number;
                if (guesses === 1) recalc += 30;
                else if (guesses === 2) recalc += 20;
                else if (guesses === 3) recalc += 10;
                else if (guesses === 4) recalc += 5;
              } else {
                recalc = Math.max(0, recalc - 15);
              }
            }
            if (recalc > 1000) {
              data.dimerRating = recalc;
              await setDoc(userDocRef, { dimerRating: recalc }, { merge: true });
              setMigrationRatingChange(recalc - 1000);
            }
          }
          
          setUserData(data);
        } else {
          // Initialize new user, potentially migrating from local storage
          let existingLocalStats: Partial<UserData> | null = null;
          try {
            if (typeof window !== "undefined") {
              const saved = localStorage.getItem("dimer_user_stats");
              if (saved) existingLocalStats = JSON.parse(saved);
            }
          } catch {}

          let localRating = existingLocalStats?.dimerRating;
          if (localRating === undefined || localRating === null) {
            localRating = 1000;
            if (existingLocalStats?.history && Array.isArray(existingLocalStats.history)) {
              const chronologicalHistory = [...existingLocalStats.history].reverse();
              for (const game of chronologicalHistory) {
                if (game.won) {
                  const guesses = game.guessesCount || game.guesses;
                  if (guesses === 1) localRating += 30;
                  else if (guesses === 2) localRating += 20;
                  else if (guesses === 3) localRating += 10;
                  else if (guesses === 4) localRating += 5;
                } else {
                  localRating = Math.max(0, localRating - 15);
                }
              }
            }
          }
          
          const diff = localRating - 1000;
          if (diff !== 0) {
            setMigrationRatingChange(diff);
          }

          const newUserData: UserData = {
            dimerRating: localRating,
            unlimitedStreak: 0,
            username: "Anonymous Dimer", hasOnboarded: false,
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
      user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout, userData, updateUserData, migrationRatingChange, clearMigrationRatingChange 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

