"use client";

import React from "react";

const About = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">About Us</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-lg mb-4">
          This is a simple application to manage your finances.
        </p>
        <p className="text-gray-600">
          More information about the application will be available here soon.
        </p>
      </div>
    </div>
  );
};

export default About;