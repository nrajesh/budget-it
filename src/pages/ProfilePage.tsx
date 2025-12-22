import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage: React.FC = () => {
  const { user, isLoadingUser } = useUser();
  const navigate = useNavigate();

  if (isLoadingUser) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    navigate('/login'); // Assuming a login route exists
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">User Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {user.email}</p>
          <p>User ID: {user.id}</p>
          {/* Profile form and avatar modal placeholders would go here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;