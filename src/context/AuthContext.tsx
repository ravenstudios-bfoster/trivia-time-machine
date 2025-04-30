import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { UserRole } from "@/types";

interface AuthContextType {
  currentUser: User | null;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const checkUserRole = async (user: User) => {
    try {
      // Use email as the document ID
      const userRef = doc(db, "users", user.uid!);
      console.log("user email:", user.email);
      console.log("user uid:", user.uid);
      const userDoc = await getDoc(userRef);
      console.log("User doc data:", userDoc.data()); // Debug log

      if (userDoc.exists()) {
        const role = userDoc.data().role as UserRole;
        console.log("Found role:", role); // Debug log
        setUserRole(role);
        setIsAdmin(role === "admin" || role === "super_admin");
        setIsSuperAdmin(role === "super_admin");
      } else {
        console.log("No user document found"); // Debug log
        setUserRole("user");
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      setUserRole("user");
      setIsAdmin(false);
      setIsSuperAdmin(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await checkUserRole(user);
      } else {
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
      await checkUserRole(userCredential.user);
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
