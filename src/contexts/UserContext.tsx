import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { User } from '@supabase/supabase-js'; // Import User type

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  updated_at: string | null;
}

interface UserContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoadingUser: boolean;
  fetchUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const fetchUserProfile = React.useCallback(async () => {
    setIsLoadingUser(true);
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Error fetching auth user:", authError.message);
      setUser(null);
      setUserProfile(null);
      setIsLoadingUser(false);
      return;
    }

    setUser(authUser);

    if (authUser) {
      const { data, error } = await supabase
        .from("user_profile")
        .select("id, first_name, last_name, avatar_url, email, updated_at")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error.message);
        // If profile not found, create a basic one with available user info
        setUserProfile({
          id: authUser.id,
          first_name: null,
          last_name: null,
          avatar_url: null,
          email: authUser.email,
          updated_at: null,
        });
      } else if (data) {
        setUserProfile(data);
      }
    } else {
      setUserProfile(null);
    }
    setIsLoadingUser(false);
  }, []); // Dependencies removed, as it only uses stable supabase client and state setters

  useEffect(() => {
    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUserProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const value = React.useMemo(() => ({
    user,
    userProfile,
    isLoadingUser,
    fetchUserProfile,
  }), [user, userProfile, isLoadingUser, fetchUserProfile]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};