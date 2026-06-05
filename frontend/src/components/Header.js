import React, { useState } from 'react';
import './Header.css';

function Header() {
  const [showPopup, setShowPopup] = useState(false);

  const togglePopup = () => {
    setShowPopup(prev => !prev);
  };

  return (
    <header className="app-header" onClick={togglePopup}>
      <h1 className="app-title">Back Office</h1>
      {showPopup && (
        <div className="header-popup" role="dialog" aria-modal="true">
          <p>Welcome to the Back Office dashboard! 🎉</p>
        </div>
      )}
    </header>
  );
}

export default Header;
