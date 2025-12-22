import { useSession } from '@/context/SessionContext';

export const useUser = () => {
  const { user, loading } = useSession();

  return {
    user,
    isLoadingUser: loading
  };
};