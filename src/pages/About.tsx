"use client";

import React from 'react';

const About = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">About This Application</h1>
      <p className="text-lg">
        This application is a personal finance tracker built using React, TypeScript, Tailwind CSS, and Supabase.
      </p>
      <p className="mt-2 text-gray-600">
        It helps users manage transactions, accounts, categories, and budgets.
      </p>
    </div>
  );
};

export default About;