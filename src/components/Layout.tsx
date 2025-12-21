import React from 'react';
import { Link, Outlet } from 'react-router-dom';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Finance App
          </Link>
          <nav className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              Home
            </Link>
            <Link to="/manage-accounts" className="text-gray-600 hover:text-blue-600">
              Accounts
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t mt-8 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Finance App
      </footer>
    </div>
  );
};

export default Layout;