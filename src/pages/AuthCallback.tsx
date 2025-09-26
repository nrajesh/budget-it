import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the session storage. Redirect user to home page.
    navigate('/');
  }, [navigate]);

  return <div>Loading...</div>;
};

export default AuthCallback;