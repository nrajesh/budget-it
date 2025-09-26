import React from 'react';
import { Link } from 'react-router-dom';

const UpdatePasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Update Password</h1>
        <p className="text-muted-foreground mb-4">
          This is a placeholder page. Please use the login page.
        </p>
        <Link to="/login" className="text-primary hover:underline">
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;