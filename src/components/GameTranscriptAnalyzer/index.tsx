// src/components/GameTranscriptAnalyzer/index.tsx
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import './styles.css';
import AnalysisResults from './AnalysisResults';
import { analyzeTranscript } from '../../services/analyzer';
import { AnalysisResult, GameTranscriptAnalyzerProps, ApiModelType } from './types';

const GameTranscriptAnalyzer: React.FC<GameTranscriptAnalyzerProps> = ({ 
  darkMode, 
  onToggleDarkMode 
}) => {
  // Use a single state object for related state
  const [state, setState] = useState({
    transcript: '',
    isAnalyzing: false,
    // Always extended - no focus mode toggle
    focusMode: false
  });

  // Add API model choice state
  const [modelChoice, setModelChoice] = useState<ApiModelType>('gpt');
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // Reference to the textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Auto-resize textarea function
  const autoResizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height and scrollbar visibility
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
    updateState({ transcript: e.target.value });
  }, [updateState]);

  // Call autoResize whenever transcript changes
  useEffect(() => {
    autoResizeTextarea();
  }, [state.transcript, autoResizeTextarea]);

  // Analysis function - now passes the model choice
  const handleAnalyze = useCallback(() => {
    updateState({ isAnalyzing: true });
    
    analyzeTranscript(state.transcript, modelChoice)
      .then(analysisResult => {
        setResult(analysisResult);
        setShowResult(true);
        updateState({ isAnalyzing: false });
      })
      .catch(error => {
        console.error('Analysis error:', error);
        updateState({ isAnalyzing: false });
      });
  }, [state.transcript, updateState, modelChoice]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (state.transcript.trim().length > 0) {
      setShowResult(false);
      handleAnalyze();
    }
  }, [state.transcript, handleAnalyze]);

  // Model choice handlers - Optimized to prevent re-renders on theme change
  const selectGpt = useCallback(() => {
    if (!state.isAnalyzing) {
      setModelChoice('gpt');
    }
  }, [state.isAnalyzing]);

  const selectGemini = useCallback(() => {
    if (!state.isAnalyzing) {
      setModelChoice('gemini');
    }
  }, [state.isAnalyzing]);

  // Memoize word count calculation
  const wordCount = useMemo(() => {
    return state.transcript.trim().split(/\s+/).filter(Boolean).length;
  }, [state.transcript]);
  
  const theme = darkMode ? 'dark' : 'light';

  return (
    <div className={`analyzer-container ${theme}`}>
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
              <div className={`modern-textarea-container ${state.isAnalyzing ? 'analyzing' : ''} ${state.transcript ? 'has-content' : ''}`}>
                <textarea
                  ref={textareaRef}
                  id="transcript"
                  className="modern-textarea"
                  placeholder="Paste game transcript for ESRB rating prediction..."
                  value={state.transcript}
                  onChange={handleTextareaChange}
                  disabled={state.isAnalyzing}
                  aria-label="Game transcript"
                ></textarea>
              </div>
            </div>
      
            <div className="button-container">
              {/* API Model toggle on the left - Zero-lag implementation */}
              <div className="model-selector">
                <div className={`model-toggle-container ${state.isAnalyzing ? 'disabled' : ''}`}>
                  {/* Sliding indicator */}
                  <div className={`toggle-indicator ${modelChoice === 'gemini' ? 'gemini' : ''}`}></div>
                  
                  {/* Toggle options - Optimized with separate click handlers */}
                  <div 
                    className={`toggle-option ${modelChoice === 'gpt' ? 'active' : ''}`}
                    onClick={selectGpt}
                    aria-label="Use GPT API for evidence collection"
                    title="Use GPT API (25K token limit)"
                  >
                    GPT
                  </div>
                  <div 
                    className={`toggle-option ${modelChoice === 'gemini' ? 'active' : ''}`}
                    onClick={selectGemini}
                    aria-label="Use Gemini API for evidence collection"
                    title="Use Gemini API (no token limit)"
                  >
                    Gemini
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={state.isAnalyzing || state.transcript.trim().length === 0}
                className={`submit-button ${state.isAnalyzing || state.transcript.trim().length === 0 ? 'disabled' : ''} gpu-accelerated`}
              >
                {state.isAnalyzing ? (
                  <div className="analyzing-text" aria-live="polite">
                    <div className="modern-loader">
                      <div className="bar-container">
                        <div className="bar bar1"></div>
                        <div className="bar bar2"></div>
                        <div className="bar bar3"></div>
                        <div className="bar bar4"></div>
                        <div className="bar bar5"></div>
                      </div>
                    </div>
                    <span className="analyzing-label">Analyzing<span className="dots">...</span></span>
                  </div>
                ) : (
                  'Predict Rating'
                )}
              </button>
              
              {/* Word counter on the right */}
              <div className="word-counter" aria-live="polite">
                <span className="counter-value">{wordCount}</span>
                <span className="counter-label">words</span>
              </div>
            </div>
          </form>
          
          {/* Pass darkMode to AnalysisResults */}
          {showResult && result && <AnalysisResults result={result} darkMode={darkMode} />}
        </main>
      </div>
    </div>
  );
};

export default React.memo(GameTranscriptAnalyzer);