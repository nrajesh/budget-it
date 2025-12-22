import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/user';

interface UserContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isLoadingUser: boolean; // Added for clarity in hooks
  userProfile: UserProfile | null;
  fetchUserProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('user_profile')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching user profile:', error);
    } else if (data) {
      setUserProfile(data as UserProfile);
    }
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
          // Fetch profile immediately after sign in
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            await fetchUserProfile();
          }
        } else {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }
        setIsLoading(false);
      }
    );

    // Initial session check and profile fetch
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        await fetchUserProfile();
      }
      setIsLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [user?.id]); // Depend on user.id to refetch profile if user object changes

  const value = {
    user,
    session,
    isLoading,
    isLoadingUser: isLoading, // Alias for compatibility with existing code
    userProfile,
    fetchUserProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};