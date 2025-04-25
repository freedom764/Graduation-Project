// src/App.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './App.css';
import GameTranscriptAnalyzer from './components/GameTranscriptAnalyzer';
import GameTranscriptSummarizer from './components/GameTranscriptSummarizer';
import GameContentQuestionnaire from './components/GameContentQuestionnaire';
import Navbar from './components/Navbar';
import PlaceholderPage from './components/PlaceholderPage';

// Define the possible pages
export type PageType = 'analyzer' | 'summarizer' | 'questionnaire';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('analyzer');
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Enhanced theme toggle function with animation - converted to useCallback
  const toggleDarkMode = useCallback(() => {
    // First set the transition flag
    setIsThemeChanging(true);
    
    // Toggle the theme after a tiny delay to ensure animation starts
    setTimeout(() => {
      setDarkMode(prevMode => !prevMode);
    }, 10);
    
    // Reset the transition flag when animation is complete
    setTimeout(() => {
      setIsThemeChanging(false);
    }, 600); // slightly longer than animation duration
  }, []);
  
  // Apply theme class to document element for global transitions
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
    }
  }, [darkMode]);

  // Handle navigation - converted to useCallback
  const navigateTo = useCallback((page: PageType) => {
    // Only navigate if not already on the page
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  }, [currentPage]);

  // Handler for logo click - go to default page (analyzer) - converted to useCallback
  const handleLogoClick = useCallback(() => {
    navigateTo('analyzer');
  }, [navigateTo]);

  // Memoize rendered pages to prevent unnecessary re-renders
  const currentPageComponent = useMemo(() => {
    switch(currentPage) {
      case 'analyzer':
        return (
          <GameTranscriptAnalyzer 
            darkMode={darkMode} 
            onToggleDarkMode={toggleDarkMode} 
          />
        );
      case 'summarizer':
        return (
          <GameTranscriptSummarizer 
            darkMode={darkMode}
          />
        );
      case 'questionnaire':
        return (
          <GameContentQuestionnaire
            darkMode={darkMode}
          />
        );
      default:
        return (
          <GameTranscriptAnalyzer 
            darkMode={darkMode} 
            onToggleDarkMode={toggleDarkMode} 
          />
        );
    }
  }, [currentPage, darkMode, toggleDarkMode]);

  return (
    <div className={`app-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <Navbar 
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        currentPage={currentPage}
        onNavigate={navigateTo}
        onLogoClick={handleLogoClick}
      />
      {currentPageComponent}
      
      {/* Theme transition overlay */}
      <div className={`theme-transition-overlay ${isThemeChanging ? 'active' : ''}`}></div>
    </div>
  );
}

export default App;