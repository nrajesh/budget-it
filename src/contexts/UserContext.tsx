import * as React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showError } from '@/utils/toast';

export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  default_currency?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoadingUser: boolean;
  updateUserPreferences: (preferences: { default_currency: string }) => void;
}

export const UserContext = React.createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useQuery<UserProfile | null, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session?.user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, default_currency')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Return basic user info even if profile fetch fails
        return { id: session.user.id, email: session.user.email };
      }

      return {
        id: session.user.id,
        email: session.user.email,
        ...profile,
      };
    },
    staleTime: Infinity, // User data is stable, refetch on auth change
  });

  const updateUserMutation = useMutation({
    mutationFn: async (preferences: { default_currency: string }) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from('profiles')
        .update({ default_currency: preferences.default_currency })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Update the user data in the query cache
      queryClient.setQueryData(['user'], (oldUser: UserProfile | null) =>
        oldUser ? { ...oldUser, default_currency: data.default_currency } : null
      );
    },
    onError: (error) => {
      showError(`Failed to update preferences: ${error.message}`);
    },
  });

  const updateUserPreferences = (preferences: { default_currency: string }) => {
    updateUserMutation.mutate(preferences);
  };

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Invalidate user query on auth state change to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['user'] });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const value = React.useMemo(() => ({
    user,
    isLoadingUser,
    updateUserPreferences,
  }), [user, isLoadingUser]);

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