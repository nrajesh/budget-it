"use client";

import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return <div className="min-h-screen flex flex-col">{children}</div>;
};

export const LayoutHeader: React.FC<LayoutProps> = ({ children }) => {
  return <header className="bg-primary text-primary-foreground p-4 shadow-md">{children}</header>;
};

export const LayoutMain: React.FC<LayoutProps> = ({ children }) => {
  return <main className="flex-grow p-4">{children}</main>;
};

export const LayoutFooter: React.FC<LayoutProps> = ({ children }) => {
  return <footer className="bg-secondary text-secondary-foreground p-4 text-center text-sm shadow-inner">{children}</footer>;
};