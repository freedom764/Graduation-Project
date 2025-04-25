// src/components/GameTranscriptSummarizer/SummaryResults.tsx
import React, { useMemo } from 'react';
import { SummaryResultsProps } from './types';

const SummaryResults: React.FC<SummaryResultsProps> = ({ summary, focusType, darkMode }) => {
  // Get focus label based on focus type
  const focusLabel = useMemo(() => {
    switch(focusType) {
      case 'gameplay': return 'Type of Game & Gameplay';
      case 'setting': return 'Setting & Atmosphere';
      case 'plot': return 'Key Plot Points';
      case 'mechanics': return 'Notable Game Mechanics';
      default: return 'Summary';
    }
  }, [focusType]);

  // Calculate word count of the summary
  const wordCount = useMemo(() => {
    return summary ? summary.trim().split(/\s+/).filter(Boolean).length : 0;
  }, [summary]);

  return (
    <section className="summary-results-section animate-fadeIn" aria-label="Summary Results">
      <div className="results-separator" role="separator"></div>
      
      <div className="summary-results-content">
        {/* Header with focus type */}
        <div className="summary-header">
          <div className="summary-title-container">
            <h3 className="summary-title">Game Summary</h3>
            <p className="summary-focus">Focus: {focusLabel}</p>
          </div>
          <div className="summary-stats">
            <span className="summary-word-count">{wordCount} words</span>
          </div>
        </div>
        
        {/* Summary content box with direct styling */}
        <div 
          style={{
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid',
            borderColor: darkMode ? '#1e293b' : '#e2e8f0',
            backgroundColor: darkMode ? 'rgba(51, 65, 85, 0.3)' : '#ffffff',
            minHeight: '200px'
          }}
        >
          {/* Text with forced color to ensure visibility */}
          <div
            style={{
              fontSize: '0.95rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-line',
              color: darkMode ? '#e2e8f0' : '#334155',
              wordBreak: 'break-word'
            }}
          >
            {summary || "No summary text is available."}
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(SummaryResults);