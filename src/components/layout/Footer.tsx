import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-background border-t py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Money Manager. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;