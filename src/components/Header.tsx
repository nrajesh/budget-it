import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Budget-It</h1>
        {/* Navigation and User Menu Placeholder */}
      </div>
    </header>
  );
};

export default Header;