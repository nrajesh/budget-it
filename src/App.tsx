import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import ManageAccounts from './pages/ManageAccounts';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />
          <Route path="manage-accounts" element={<ManageAccounts />} />
          {/* Add other routes here */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;