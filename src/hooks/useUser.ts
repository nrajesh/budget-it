import { useSession } from '@/contexts/SessionContext';

export const useUser = () => {
  const { user, loading } = useSession();

  return {
    user,
    isLoadingUser: loading
  };
};