import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 p-4 text-center text-sm text-gray-500">
      © {new Date().getFullYear()} Budget-It. All rights reserved.
    </footer>
  );
};

export default Footer;