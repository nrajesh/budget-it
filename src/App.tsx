import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Accounts from '@/pages/Accounts';
import Vendors from '@/pages/Vendors';
import Categories from '@/pages/Categories';
import Dashboard from '@/pages/Dashboard';
import Layout from '@/components/Layout';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;