// src/components/Navbar/index.tsx
import React, { useRef, useEffect, useState } from 'react';
import GameController from '../GameTranscriptAnalyzer/GameController';
import './styles.css';
import { PageType } from '../../App';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentPage: PageType;
  onNavigate: (page: PageType) => void;
  onLogoClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  darkMode, 
  onToggleDarkMode, 
  currentPage,
  onNavigate,
  onLogoClick
}) => {
  // Refs for each button to measure their position
  const analyzerRef = useRef<HTMLButtonElement>(null);
  const summarizerRef = useRef<HTMLButtonElement>(null);
  const questionnaireRef = useRef<HTMLButtonElement>(null);
  
  // State to store indicator position
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0
  });

  // Update indicator position when currentPage changes
  useEffect(() => {
    let activeButton: HTMLButtonElement | null = null;
    
    if (currentPage === 'analyzer') {
      activeButton = analyzerRef.current;
    } else if (currentPage === 'summarizer') {
      activeButton = summarizerRef.current;
    } else if (currentPage === 'questionnaire') {
      activeButton = questionnaireRef.current;
    }
    
    if (activeButton) {
      const parentLeft = activeButton.parentElement?.getBoundingClientRect().left || 0;
      const buttonRect = activeButton.getBoundingClientRect();
      
      setIndicatorStyle({
        left: buttonRect.left - parentLeft,
        width: buttonRect.width
      });
    }
  }, [currentPage]);

  // Also update on window resize to ensure correct positioning
  useEffect(() => {
    const handleResize = () => {
      // Trigger the same logic as when currentPage changes
      let activeButton: HTMLButtonElement | null = null;
      
      if (currentPage === 'analyzer') {
        activeButton = analyzerRef.current;
      } else if (currentPage === 'summarizer') {
        activeButton = summarizerRef.current;
      } else if (currentPage === 'questionnaire') {
        activeButton = questionnaireRef.current;
      }
      
      if (activeButton) {
        const parentLeft = activeButton.parentElement?.getBoundingClientRect().left || 0;
        const buttonRect = activeButton.getBoundingClientRect();
        
        setIndicatorStyle({
          left: buttonRect.left - parentLeft,
          width: buttonRect.width
        });
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentPage]);

  return (
    <nav className={`navbar ${darkMode ? 'dark' : 'light'}`}>
      <div className="navbar-container">
        <div className="navbar-left">
          <button 
            ref={analyzerRef}
            className={`nav-button ${currentPage === 'analyzer' ? 'active' : ''}`}
            onClick={() => onNavigate('analyzer')}
            aria-current={currentPage === 'analyzer' ? 'page' : undefined}
          >
            Analyzer
          </button>
          <button 
            ref={summarizerRef}
            className={`nav-button ${currentPage === 'summarizer' ? 'active' : ''}`}
            onClick={() => onNavigate('summarizer')}
            aria-current={currentPage === 'summarizer' ? 'page' : undefined}
          >
            Summarizer
          </button>
          <button 
            ref={questionnaireRef}
            className={`nav-button ${currentPage === 'questionnaire' ? 'active' : ''}`}
            onClick={() => onNavigate('questionnaire')}
            aria-current={currentPage === 'questionnaire' ? 'page' : undefined}
          >
            Questionnaire
          </button>
          
          {/* Animated indicator */}
          <div 
            className="navbar-indicator" 
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`
            }}
          />
        </div>
        
        <div className="navbar-center">
          <div 
            className="nav-logo-container"
            onClick={onLogoClick}
            role="button"
            tabIndex={0}
            aria-label="Home"
          >
            <GameController className="nav-logo" />
          </div>
        </div>
        
        <div className="navbar-right">
          <button 
            onClick={onToggleDarkMode}
            className="theme-toggle"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="theme-icon sun" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="theme-icon moon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;