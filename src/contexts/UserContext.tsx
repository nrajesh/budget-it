import React, { createContext, useContext, useState, ReactNode } from "react";
import { useSession, Session } from "@/hooks/useSession";

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  updated_at: string | null;
}

interface UserContextType {
  user: Session["user"] | null;
  userProfile: UserProfile | null;
  isLoadingUser: boolean;
  fetchUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const session = useSession();
  const user = session?.user || null;
  const userProfile = React.useMemo(() => {
    if (session?.user) {
      return {
        id: session.user.id,
        first_name:
          session.user.user_metadata?.full_name?.split(" ")[0] || "Local",
        last_name:
          session.user.user_metadata?.full_name?.split(" ")[1] || "User",
        avatar_url: session.user.user_metadata?.avatar_url || null,
        email: session.user.email || null,
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  }, [session]);

  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const fetchUserProfile = React.useCallback(async () => {
    // In local mode, we just use the session mock
    setIsLoadingUser(false);
  }, []);

  const value = React.useMemo(
    () => ({
      user,
      userProfile,
      isLoadingUser,
      fetchUserProfile,
    }),
    [user, userProfile, isLoadingUser, fetchUserProfile],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
