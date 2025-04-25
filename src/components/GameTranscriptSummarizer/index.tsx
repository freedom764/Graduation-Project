// src/components/GameTranscriptSummarizer/index.tsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import './styles.css';
import SummaryResults from './SummaryResults';
import { summarizeTranscript } from '../../services/summarizer';
import { SummaryFocusType } from './types';

interface GameTranscriptSummarizerProps {
  darkMode: boolean;
}

const GameTranscriptSummarizer: React.FC<GameTranscriptSummarizerProps> = ({ darkMode }) => {
  // State for transcript text
  const [transcript, setTranscript] = useState('');
  
  // State for processing status
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for summary results - using a plain string now
  const [summary, setSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  
  // Separate states for selected focus and displayed focus
  const [selectedFocusType, setSelectedFocusType] = useState<SummaryFocusType>('gameplay');
  const [displayedFocusType, setDisplayedFocusType] = useState<SummaryFocusType>('gameplay');
  
  // Reference to the textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height
      textarea.style.height = 'auto';
      
      // Get max height in pixels (25rem is approximately 400px)
      const maxHeight = 400;
      
      // Calculate new height
      const scrollHeight = textarea.scrollHeight;
      
      // Only show scrollbar if content exceeds max height
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden'; // Hide scrollbar when auto-growing
      }
    }
  }, []);

  // Handle textarea change with auto-resize
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value);
  }, []);

  // Call autoResize whenever transcript changes
  useEffect(() => {
    autoResizeTextarea();
  }, [transcript, autoResizeTextarea]);

  // Handle focus type selection - only changes the selected focus, not displayed focus
  const handleFocusChange = useCallback((focus: SummaryFocusType) => {
    setSelectedFocusType(focus);
  }, []);

  // Summarization function - simplified with direct string handling
  const handleSummarize = useCallback(() => {
    setIsProcessing(true);
    
    // Call the API with transcript and selected focus type
    summarizeTranscript(transcript, selectedFocusType)
      .then(summaryText => {
        // Set the summary directly as a string
        console.log("Received summary:", summaryText);
        setSummary(summaryText);
        setShowSummary(true);
        // Update the displayed focus type to match the selected focus type
        setDisplayedFocusType(selectedFocusType);
        setIsProcessing(false);
      })
      .catch(error => {
        console.error('Summarization error:', error);
        setIsProcessing(false);
        // Set a fallback summary if there's an error
        const errorMsg = "Failed to generate summary. Please try again later.";
        setSummary(errorMsg);
        setShowSummary(true);
      });
  }, [transcript, selectedFocusType]);

  // Form submission handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (transcript.trim().length > 0) {
      handleSummarize();
    }
  }, [transcript, handleSummarize]);

  // Memoize word count calculation
  const wordCount = useMemo(() => {
    return transcript.trim().split(/\s+/).filter(Boolean).length;
  }, [transcript]);
  
  // Focus type options
  const focusOptions: Array<{value: SummaryFocusType, label: string}> = [
    { value: 'gameplay', label: 'Gameplay' },
    { value: 'setting', label: 'Setting & Atmosphere' },
    { value: 'plot', label: 'Plot Points' },
    { value: 'mechanics', label: 'Game Mechanics' }
  ];
  
  const theme = darkMode ? 'dark' : 'light';

  return (
    <div className={`summarizer-container ${theme}`}>
      {/* Background patterns */}
      <div className="bg-patterns">
        <div className="bg-orb top-right gpu-accelerated"></div>
        <div className="bg-orb bottom-left gpu-accelerated"></div>
        <div className="bg-grid"></div>
      </div>

      <div className="content-container">        
        {/* Main card */}
        <main className="main-card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <div className={`modern-textarea-container ${isProcessing ? 'processing' : ''} ${transcript ? 'has-content' : ''}`}>
                <textarea
                  ref={textareaRef}
                  id="transcript"
                  className="modern-textarea"
                  placeholder="Paste game transcript for AI summarization..."
                  value={transcript}
                  onChange={handleTextareaChange}
                  disabled={isProcessing}
                  aria-label="Game transcript"
                ></textarea>
              </div>
            </div>
      
            {/* Focus selector in a 2x2 grid above the submit button */}
            <div className="focus-grid-container">
              <p className="focus-label">Choose summary focus:</p>
              <div className={`focus-grid ${isProcessing ? 'disabled' : ''}`}>
                {focusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`focus-grid-option ${selectedFocusType === option.value ? 'active' : ''}`}
                    onClick={() => handleFocusChange(option.value)}
                    disabled={isProcessing}
                    aria-pressed={selectedFocusType === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="button-container">
              <button
                type="submit"
                disabled={isProcessing || transcript.trim().length === 0}
                className={`submit-button ${isProcessing || transcript.trim().length === 0 ? 'disabled' : ''} gpu-accelerated`}
              >
                {isProcessing ? (
                  <div className="processing-text" aria-live="polite">
                    <div className="modern-loader">
                      <div className="bar-container">
                        <div className="bar bar1"></div>
                        <div className="bar bar2"></div>
                        <div className="bar bar3"></div>
                        <div className="bar bar4"></div>
                        <div className="bar bar5"></div>
                      </div>
                    </div>
                    <span className="processing-label">Summarizing<span className="dots">...</span></span>
                  </div>
                ) : (
                  'Generate Summary'
                )}
              </button>
              
              {/* Word counter on the right */}
              <div className="word-counter" aria-live="polite">
                <span className="counter-value">{wordCount}</span>
                <span className="counter-label">words</span>
              </div>
            </div>
          </form>
          
          {/* Only render the summary component if we have a summary to show */}
          {showSummary && summary && (
            <SummaryResults 
              summary={summary} 
              focusType={displayedFocusType} 
              darkMode={darkMode} 
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default React.memo(GameTranscriptSummarizer);