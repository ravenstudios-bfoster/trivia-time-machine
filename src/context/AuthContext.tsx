import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "firebase/auth";
import { onAuthStateChange, loginWithEmail, logoutUser } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  isSuperAdmin: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);

      // Check user roles
      if (user) {
        try {
          // Check if user exists in adminUsers collection
          const userRef = doc(db, "adminUsers", user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            // User exists in adminUsers collection
            setIsAdmin(true);
            setIsSuperAdmin(userDoc.data().role === "super_admin");

            // Update last login time
            await setDoc(
              userRef,
              {
                lastLogin: new Date(),
              },
              { merge: true }
            );
          } else {
            // For this app, we'll assume all authenticated users are at least admins
            // In a production app, you would be more restrictive
            setIsAdmin(true);
            setIsSuperAdmin(false);

            // Create a record for this admin user if it doesn't exist
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || null,
              role: "admin",
              createdAt: new Date(),
              lastLogin: new Date(),
            });
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // Default to admin access if there's an error
          setIsAdmin(true);
          setIsSuperAdmin(false);
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await loginWithEmail(email, password);
      toast.success("Logged in successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to login";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await logoutUser();
      toast.success("Logged out successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to logout";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isAdmin,
    isSuperAdmin,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
