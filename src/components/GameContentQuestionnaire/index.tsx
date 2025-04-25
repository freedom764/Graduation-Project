// src/components/GameContentQuestionnaire/index.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import './styles.css';
import QuestionnaireForm from './QuestionnaireForm';
import { AnalysisResult, ApiModelType } from '../GameTranscriptAnalyzer/types';
import { ContentFlags, QuestionnaireState } from './types';

// Initial state for all content flags (all undefined/unanswered)
const initialContentFlags: ContentFlags = {
  // Violence
  mild_cartoon_violence: undefined,
  mild_fantasy_violence: undefined,
  mild_violence: undefined,
  cartoon_violence: undefined,
  fantasy_violence: undefined,
  moderate_violence: undefined,
  intense_violence: undefined,
  
  // Blood
  mild_blood: undefined,
  animated_blood: undefined,
  blood: undefined,
  blood_and_gore: undefined,
  
  // Language
  mild_lyrics: undefined,
  mild_language: undefined,
  lyrics: undefined,
  language: undefined,
  strong_language: undefined,
  
  // Sexual Content
  mild_suggestive_themes: undefined,
  sexual_themes: undefined,
  partial_nudity: undefined,
  sexual_content: undefined,
  nudity: undefined,
  strong_sexual_content: undefined,
  
  // Substance Use
  alcohol_reference: undefined,
  drug_reference: undefined,
  use_of_alcohol: undefined,
  use_of_drugs_and_alcohol: undefined,
  
  // Humor
  crude_humor: undefined,
  mature_humor: undefined,
  
  // Gambling
  simulated_gambling: undefined,
  
  // Other
  no_descriptors: undefined
};

interface GameContentQuestionnaireProps {
  darkMode: boolean;
}

const GameContentQuestionnaire: React.FC<GameContentQuestionnaireProps> = ({ darkMode }) => {
  // Questionnaire state
  const [state, setState] = useState<QuestionnaireState>({
    contentFlags: initialContentFlags,
    currentStep: 'form', // 'form' or 'results'
    isSubmitting: false,
    completedCategories: {
      violence: false,
      blood: false,
      language: false,
      sexualContent: false,
      substances: false,
      humor: false,
      gambling: false
    },
    expandedCategories: {
      violence: true, // First category starts expanded
      blood: false,
      language: false,
      sexualContent: false,
      substances: false,
      humor: false,
      gambling: false
    }
  });
  
  // Analysis results
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  // Calculate overall completion percentage
  const completionPercentage = useMemo(() => {
    const categories = Object.values(state.completedCategories);
    const completedCount = categories.filter(Boolean).length;
    return Math.round((completedCount / categories.length) * 100);
  }, [state.completedCategories]);
  
  // Check if all categories are completed
  const isFormComplete = useMemo(() => {
    return Object.values(state.completedCategories).every(Boolean);
  }, [state.completedCategories]);
  
  // Toggle category expansion
  const toggleCategory = useCallback((category: keyof typeof state.expandedCategories) => {
    setState(prev => ({
      ...prev,
      expandedCategories: {
        ...prev.expandedCategories,
        [category]: !prev.expandedCategories[category]
      }
    }));
  }, []);
  
  // Mark a category as completed and auto-expand the next category
  const completeCategory = useCallback((category: keyof typeof state.completedCategories, isComplete: boolean) => {
    setState(prev => {
      // Define the order of categories
      const categoryOrder = [
        'violence', 'blood', 'language', 'sexualContent', 
        'substances', 'humor', 'gambling'
      ] as const;
      
      // Find the current and next categories
      const currentIndex = categoryOrder.indexOf(category);
      const nextCategory = currentIndex < categoryOrder.length - 1 
        ? categoryOrder[currentIndex + 1] 
        : null;
      
      // Update expanded categories - collapse current, expand next
      const newExpandedCategories = { ...prev.expandedCategories };
      
      // Only auto-collapse/expand if we're marking as complete
      if (isComplete && nextCategory) {
        newExpandedCategories[category] = false;
        newExpandedCategories[nextCategory] = true;
      }
      
      return {
        ...prev,
        completedCategories: {
          ...prev.completedCategories,
          [category]: isComplete
        },
        expandedCategories: newExpandedCategories
      };
    });
  }, []);
  
  // Update a content flag
  const updateContentFlag = useCallback((flag: keyof ContentFlags, value: 0 | 1) => {
    setState(prev => {
      // Create updated content flags
      const updatedFlags = {
        ...prev.contentFlags,
        [flag]: value
      };
      
      return {
        ...prev,
        contentFlags: updatedFlags
      };
    });
  }, []);
  
  // Reset to initial state
  const resetQuestionnaire = useCallback(() => {
    setState({
      contentFlags: initialContentFlags,
      currentStep: 'form',
      isSubmitting: false,
      completedCategories: {
        violence: false,
        blood: false,
        language: false,
        sexualContent: false,
        substances: false,
        humor: false,
        gambling: false
      },
      expandedCategories: {
        violence: true,
        blood: false,
        language: false,
        sexualContent: false,
        substances: false,
        humor: false,
        gambling: false
      }
    });
    setResult(null);
  }, []);
  
  // Submit questionnaire for analysis
  const submitQuestionnaire = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isSubmitting: true }));
      
      // Debug: Check what flags we're sending
      console.log("Submitting content flags:", state.contentFlags);
      
      // Create a sanitized copy of content flags where undefined values are converted to 0
      const sanitizedFlags = Object.entries(state.contentFlags).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? 0 : value;
        return acc;
      }, {} as Record<string, number>);
      
      // Debug: Check sanitized flags
      console.log("Sanitized flags:", sanitizedFlags);
      
      // Send the questionnaire data directly to the backend
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: 'QUESTIONNAIRE_GENERATED',
          model: 'gpt',
          fromQuestionnaire: true,
          contentFlags: sanitizedFlags
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Received API response:", data);
      
      // Create an AnalysisResult object from the API response
      const analysisResult: AnalysisResult = {
        rating: data.rating,
        confidence: data.confidence,
        factors: {
          violence: data.factors.violence,
          language: data.factors.language,
          substances: data.factors.substances,
          suggestiveContent: data.factors.suggestiveContent
        },
        description: data.description,
        descriptors: data.descriptors,
        descriptorExplanations: {}, // No explanations needed for questionnaire
        top2_classes: data.top2_classes,
        top2_probs: data.top2_probs
      };
      
      // Debug: Log the result we're setting
      console.log("Setting result:", analysisResult);
      
      // Update results
      setResult(analysisResult);
      
      // Show results view
      setState(prev => ({ 
        ...prev, 
        currentStep: 'results',
        isSubmitting: false 
      }));
      
    } catch (error) {
      console.error('Questionnaire analysis error:', error);
      setState(prev => ({ ...prev, isSubmitting: false }));
      alert('Error analyzing questionnaire. Please try again.');
    }
  }, [state.contentFlags]);
  
  // Go back to form
  const goBackToForm = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: 'form' }));
  }, []);
  
  // Theme class
  const theme = darkMode ? 'dark' : 'light';
  
  return (
    <div className={`questionnaire-container ${theme}`}>
      {/* Background patterns (reusing from analyzer) */}
      <div className="bg-patterns">
        <div className="bg-orb top-right gpu-accelerated"></div>
        <div className="bg-orb bottom-left gpu-accelerated"></div>
        <div className="bg-grid"></div>
      </div>
      
      <div className="content-container">
        {state.currentStep === 'form' ? (
          <main className="main-card">
            {/* Questionnaire Form */}
            <QuestionnaireForm 
              contentFlags={state.contentFlags}
              updateContentFlag={updateContentFlag}
              expandedCategories={state.expandedCategories}
              toggleCategory={toggleCategory}
              completedCategories={state.completedCategories}
              completeCategory={completeCategory}
              completionPercentage={completionPercentage}
              isFormComplete={isFormComplete}
              isSubmitting={state.isSubmitting}
              onSubmit={submitQuestionnaire}
              darkMode={darkMode}
            />
          </main>
        ) : (
          <main className="main-card">
            {/* Results View - Updated with new class names */}
            <div className="questionnaire-results">
              <div className="results-header">
                <h2>Rating Prediction Results</h2>
                <p className="results-description">
                  Based on your questionnaire responses, we predict the following ESRB rating:
                </p>
                <div className="results-actions">
                  <button 
                    className="back-to-form-button"
                    onClick={goBackToForm}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Edit Responses</span>
                  </button>
                  <button 
                    className="reset-button"
                    onClick={resetQuestionnaire}
                  >
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 4V9H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 20V15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12C21 16.9706 16.9706 21 12 21C10.2926 21 8.68804 20.5181 7.34143 19.6801M3 12C3 7.02944 7.02944 3 12 3C13.7074 3 15.312 3.48195 16.6586 4.31992" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Start New Questionnaire</span>
                  </button>
                </div>
              </div>
              
              {/* Results display for questionnaire - Updated with new class names */}
              {result && (
                <div className="questionnaire-results-content">
                  <div className="rating-display">
                    <div className={`questionnaire-rating-badge rating-${result.rating.toLowerCase()}`}>
                      {result.rating}
                    </div>
                    <div className="rating-info">
                      <h3 className="rating-name">
                        {result.rating === 'E' ? 'Everyone' : 
                         result.rating === 'ET' ? 'Everyone 10+' :
                         result.rating === 'T' ? 'Teen' : 'Mature 17+'}
                      </h3>
                      <div className="questionnaire-confidence-meter">
                        <span className="confidence-label">Confidence:</span>
                        <span className="confidence-value">{result.confidence}%</span>
                      </div>
                    </div>
                    
                    {/* Alternative rating */}
                    {result.top2_classes && result.top2_classes.length > 1 && (
                      <div className="alt-rating">
                        <span className="alt-rating-label">Alternative:</span>
                        <div className={`alt-rating-badge alt-${result.top2_classes[1].toLowerCase()}`}>
                          {result.top2_classes[1]}
                        </div>
                        <span className="alt-confidence">
                          {Math.round(result.top2_probs![1] * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="rating-description">
                    <p>{result.description}</p>
                  </div>
                  
                  <div className="content-factors">
                    <h3 className="factors-title">Content Analysis</h3>
                    <div className="factors-grid">
                      {Object.entries(result.factors).map(([factor, value]) => {
                        const category = factor.replace(/([A-Z])/g, ' $1').trim();
                        const level = value > 75 ? 'High' : value > 50 ? 'Moderate' : value > 0 ? 'Low' : 'None';
                        const levelClass = level.toLowerCase();
                        
                        // Get the descriptors for this category
                        const descriptors = result.descriptors?.[factor as keyof typeof result.descriptors] || [];
                        const hasDescriptors = descriptors.length > 0 && descriptors[0] !== "None";
                        
                        return (
                          <div key={factor} className="factor-item">
                            <div className="factor-header">
                              <span className="factor-name">{category}</span>
                              <span className={`factor-level level-${levelClass}`}>{level}</span>
                            </div>
                            
                            {/* Show the severity percentage */}
                            <div className="factor-severity">
                              <span className="severity-value">{value}%</span>
                            </div>
                            
                            <div className="factor-bar-container">
                              <div 
                                className={`factor-bar bar-${levelClass}`} 
                                style={{width: `${value}%`}}
                              ></div>
                            </div>
                            
                            {/* Show descriptors if available */}
                            {hasDescriptors && (
                              <div className="factor-descriptors">
                                {descriptors.map((descriptor, index) => (
                                  <span key={index} className={`descriptor-tag color-${levelClass}`}>
                                    {descriptor}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}
      </div>
    </div>
  );
};

export default React.memo(GameContentQuestionnaire);