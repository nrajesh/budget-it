"use client";

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useSession } from './hooks/useSession';

import Index from './pages/Index';
import Login from './pages/Login';

const queryClient = new QueryClient();

function App() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={session ? <Index /> : <Navigate to="/login" />} />
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          {/* Add other routes here */}
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;