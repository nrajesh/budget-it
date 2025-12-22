import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { AddTransactionDialog } from './AddTransactionDialog';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
      <Footer />
      <AddTransactionDialog onOpenChange={() => {}} />
    </div>
  );
};

export default Layout;