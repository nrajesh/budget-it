import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { showError, showSuccess } from '@/utils/toast';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  email: string | null;
  default_currency: string | null; // Added default_currency
}

interface UserContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoadingUser: boolean;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateDefaultCurrencyInProfile: (currencyCode: string) => Promise<void>; // New function
}

export const UserContext = React.createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  const fetchUserProfile = React.useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      setUser(authUser);

      if (authUser) {
        const { data, error: profileError } = await supabase
          .from('user_profile')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          throw profileError;
        }

        if (data) {
          setUserProfile(data as UserProfile);
        } else {
          // If no profile exists, create a basic one
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profile')
            .insert({
              id: authUser.id,
              email: authUser.email,
              first_name: authUser.user_metadata?.first_name || null,
              last_name: authUser.user_metadata?.last_name || null,
              avatar_url: authUser.user_metadata?.avatar_url || null,
              default_currency: 'USD', // Default currency on new profile creation
            })
            .select('*')
            .single();

          if (insertError) throw insertError;
          setUserProfile(newProfile as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
    } catch (error: any) {
      console.error("Error fetching user or profile:", error.message);
      showError(`Failed to load user data: ${error.message}`);
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const updateUserProfile = React.useCallback(async (updates: Partial<UserProfile>) => {
    if (!user?.id) {
      showError("User not authenticated.");
      return;
    }
    try {
      const { error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      showSuccess("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating user profile:", error.message);
      showError(`Failed to update profile: ${error.message}`);
    }
  }, [user]);

  const updateDefaultCurrencyInProfile = React.useCallback(async (currencyCode: string) => {
    await updateUserProfile({ default_currency: currencyCode });
  }, [updateUserProfile]);

  React.useEffect(() => {
    fetchUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile();
      } else {
        setUser(null);
        setUserProfile(null);
        setIsLoadingUser(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const value = React.useMemo(() => ({
    user,
    userProfile,
    isLoadingUser,
    fetchUserProfile,
    updateUserProfile,
    updateDefaultCurrencyInProfile,
  }), [user, userProfile, isLoadingUser, fetchUserProfile, updateUserProfile, updateDefaultCurrencyInProfile]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = React.useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};