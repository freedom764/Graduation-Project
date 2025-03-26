// src/components/PlaceholderPage/index.tsx
import React from 'react';
import './styles.css';

interface PlaceholderPageProps {
  pageName: string;
  darkMode: boolean;
  message: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  pageName, 
  darkMode,
  message 
}) => {
  const theme = darkMode ? 'dark' : 'light';
  
  return (
    <div className={`placeholder-container ${theme}`}>
      {/* Background patterns */}
      <div className="bg-patterns">
        <div className="bg-orb top-right"></div>
        <div className="bg-orb bottom-left"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="content-container">
        {/* Main card */}
        <main className="placeholder-card">
          <div className="placeholder-content">
            <div className="placeholder-icon">
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                {/* Add some decorative elements */}
                <path d="M12 21.5V22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                <path d="M12 1.5V2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                <path d="M21.5 12H22.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
                <path d="M1.5 12H2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
              </svg>
            </div>
            <h2 className="placeholder-title">Coming Soon</h2>
            <p className="placeholder-message">{message}</p>
            <p className="placeholder-feature-name">
              <span className="feature-badge">{pageName}</span> functionality is under development.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PlaceholderPage;