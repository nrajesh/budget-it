import React from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { user, signOut } = useSession();

  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Money Manager
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/transactions" className="hover:underline">
                Transactions
              </Link>
              <Link to="/accounts" className="hover:underline">
                Accounts
              </Link>
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button>Sign In</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;