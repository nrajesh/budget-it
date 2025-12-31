import React from 'react';
import { Link } from 'react-router-dom';

const IndexPage: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Finance Tracker</h1>
      <p className="mb-4">Use the navigation to manage your finances.</p>
      <Link to="/accounts" className="text-blue-600 hover:underline">Go to Accounts Management</Link>
    </div>
  );
};

export default IndexPage;