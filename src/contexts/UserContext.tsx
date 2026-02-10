import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
  const [user, setUser] = useState<Session["user"] | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const fetchUserProfile = React.useCallback(async () => {
    // In local mode, we just use the session mock
    setIsLoadingUser(false);
  }, []);

  useEffect(() => {
    if (session?.user) {
      setUser(session.user);
      setUserProfile({
        id: session.user.id,
        first_name:
          session.user.user_metadata?.full_name?.split(" ")[0] || "Local",
        last_name:
          session.user.user_metadata?.full_name?.split(" ")[1] || "User",
        avatar_url: session.user.user_metadata?.avatar_url || null,
        email: session.user.email || null,
        updated_at: new Date().toISOString(),
      });
    }
    setIsLoadingUser(false);
  }, [session]);

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
