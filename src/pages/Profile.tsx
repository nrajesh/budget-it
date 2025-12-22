import React from 'react';
import { useSession } from '@/context/SessionContext';

const ProfilePage: React.FC = () => {
  const { user } = useSession();

  if (!user) {
    return <div>Please sign in to view your profile.</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Email</h2>
          <p>{user.email}</p>
        </div>
        {/* Additional profile information can be added here */}
      </div>
    </div>
  );
};

export default ProfilePage;