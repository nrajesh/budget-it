import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = () => {
  const { user, isLoadingUser } = useUser();

  if (isLoadingUser) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;