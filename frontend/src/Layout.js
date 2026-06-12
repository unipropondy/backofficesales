import React from 'react';
import Sidebar from './components/Sidebar';  // ← இந்த வரியை சேர்க்கவும்

function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        {children}
      </main>
    </div>
  );
}

export default Layout;