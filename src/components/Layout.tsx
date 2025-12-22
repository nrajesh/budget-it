import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4">
        <nav className="container mx-auto flex justify-between items-center">
          <Link to="/" className="text-xl font-bold">Budget App</Link>
          <div className="flex space-x-4">
            <Link to="/accounts" className="hover:underline">Accounts</Link>
            <Link to="/vendors" className="hover:underline">Vendors</Link>
            <Link to="/categories" className="hover:underline">Categories</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1 container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-muted p-4 text-center text-sm text-muted-foreground">
        Budget App © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Layout;