import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Index from './pages/Index';
import ManageAccounts from './pages/ManageAccounts';
import ToastProvider from './components/ToastProvider';

function App() {
  return (
    <React.Fragment> {/* Use a fragment to host both ToastProvider and Router */}
      <ToastProvider /> {/* Render ToastProvider as a self-closing component */}
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="manage-accounts" element={<ManageAccounts />} />
            {/* Add other routes here */}
          </Route>
        </Routes>
      </Router>
    </React.Fragment>
  );
}

export default App;