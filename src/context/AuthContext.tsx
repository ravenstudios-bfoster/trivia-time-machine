import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { UserRole, AppUser } from "@/types";
import { useGame } from "@/context/GameContext";
import { Timestamp } from "firebase/firestore";

interface AuthContextType {
  currentUser: AppUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { dispatch } = useGame();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const getUserData = async (firebaseUser: User): Promise<AppUser | null> => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const appUser = {
          id: firebaseUser.uid,
          displayName: userData.displayName || firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          role: userData.role || "user",
          createdAt: userData.createdAt?.toDate() || new Date(),
          lastLogin: new Date(),
          gamesParticipated: userData.gamesParticipated || 0,
        };

        // Initialize player in GameContext
        dispatch({
          type: "SET_PLAYER",
          payload: {
            id: appUser.id,
            name: appUser.displayName,
            email: appUser.email,
            sessions: [],
            highestLevelAchieved: 1,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          },
        });

        return appUser;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user data:", error);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUserData(firebaseUser);
        setCurrentUser(userData);
        if (userData) {
          setUserRole(userData.role);
          setIsAdmin(userData.role === "admin" || userData.role === "super_admin");
          setIsSuperAdmin(userData.role === "super_admin");
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUserData(userCredential.user);
      if (userData) {
        setCurrentUser(userData);
        setUserRole(userData.role);
        setIsAdmin(userData.role === "admin" || userData.role === "super_admin");
        setIsSuperAdmin(userData.role === "super_admin");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAdmin,
    isSuperAdmin,
    userRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
