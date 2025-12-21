import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import ManageAccounts from './pages/ManageAccounts';
import Vendors from './pages/Vendors';
import Categories from './pages/Categories';
import ToastProvider from './components/ToastProvider'; // Corrected import path

function App() {
  return (
    <React.Fragment>
      <ToastProvider />
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="manage-accounts" element={<ManageAccounts />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="categories" element={<Categories />} />
            {/* Add other routes here */}
          </Route>
        </Routes>
      </Router>
    </React.Fragment>
  );
}

export default App;