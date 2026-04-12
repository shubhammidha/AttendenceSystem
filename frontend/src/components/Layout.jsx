import React from 'react';

const Layout = ({ children, centered = false }) => {
  return (
    <div className="page-wrapper">
      <div className={`app-container ${centered ? 'centered-content' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
