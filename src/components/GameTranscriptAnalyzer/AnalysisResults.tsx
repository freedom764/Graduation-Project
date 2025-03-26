// src/components/GameTranscriptAnalyzer/AnalysisResults.tsx
import React, { useMemo, useState, useCallback } from 'react';
import RatingBadge from '../ui/RatingBadge';
import ProgressBar from '../ui/ProgressBar';
import { AnalysisResultsProps, ThemeColor, RatingType } from './types';

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, darkMode }) => {
  // State to track if summary is expanded
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  
  // State to track expanded descriptors
  const [expandedDescriptors, setExpandedDescriptors] = useState<{[key: string]: boolean}>({});
  
  // Toggle descriptor expansion
  const toggleDescriptor = useCallback((category: string, descriptor: string) => {
    const key = `${category}-${descriptor}`;
    setExpandedDescriptors(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  }, []);
  
  // Check if a descriptor is expanded
  const isDescriptorExpanded = useCallback((category: string, descriptor: string) => {
    const key = `${category}-${descriptor}`;
    return expandedDescriptors[key] || false;
  }, [expandedDescriptors]);
  
  // Get description for a descriptor from the result
  const getDescriptorExplanation = useCallback((descriptor: string) => {
    if (result.descriptorExplanations && result.descriptorExplanations[descriptor]) {
      return result.descriptorExplanations[descriptor];
    }
    return "This is the description of the content descriptor. It could be mild or severe, depending on the content.";
  }, [result.descriptorExplanations]);
  
  // Get evidence for a descriptor from the result
  const getDescriptorEvidence = useCallback((descriptor: string) => {
    if (result.descriptorEvidences && result.descriptorEvidences[descriptor]) {
      return result.descriptorEvidences[descriptor];
    }
    return undefined;
  }, [result.descriptorEvidences]);
  
  // Rating information mapping
  const ratingLabels: Record<RatingType, string> = {
    'E': 'Everyone',
    'ET': 'Everyone 10+',
    'T': 'Teen',
    'M': 'Mature 17+'
  };

  // Get theme color based on rating
  const getThemeColor = useCallback((rating: string): ThemeColor => {
    switch(rating) {
      case 'E': return 'emerald';
      case 'ET': return 'teal';
      case 'T': return 'amber';
      case 'M': return 'rose';
      default: return 'emerald';
    }
  }, []);

  // Rating guide pills data
  const ratingGuide = useMemo(() => [
    { rating: 'E' as RatingType, desc: 'Everyone', color: 'emerald' as ThemeColor },
    { rating: 'ET' as RatingType, desc: 'Everyone 10+', color: 'teal' as ThemeColor },
    { rating: 'T' as RatingType, desc: 'Teen', color: 'amber' as ThemeColor },
    { rating: 'M' as RatingType, desc: 'Mature 17+', color: 'rose' as ThemeColor }
  ], []);

  // Get level (low, medium, high) based on value
  const getLevel = useCallback((value: number) => value > 75 ? 'high' : value > 50 ? 'medium' : value > 0 ? 'low': 'none', []);
  
  // Get color based on level
  const getLevelColor = useCallback((value: number): ThemeColor => 
    value > 75 ? 'rose' : value > 50 ? 'amber' : 'emerald', []);

  const themeColor = useMemo(() => getThemeColor(result.rating), [result.rating, getThemeColor]);

  // Type-safe function to check if a category has descriptors
  const hasCategoryDescriptors = useCallback((category: string): boolean => {
    if (!result.descriptors) return false;
    
    const descriptors = result.descriptors[category as keyof typeof result.descriptors];
    if (!descriptors) return false;
    if (!Array.isArray(descriptors)) return false;
    if (descriptors.length === 0) return false;
    if (descriptors.length === 1 && descriptors[0] === "None") return false;
    
    return true;
  }, [result.descriptors]);

  // Type-safe function to get descriptors for a category
  const getCategoryDescriptors = useCallback((category: string): string[] => {
    if (!result.descriptors) return [];
    
    const descriptors = result.descriptors[category as keyof typeof result.descriptors];
    if (!descriptors || !Array.isArray(descriptors)) return [];
    
    return descriptors.filter(descriptor => descriptor !== "None");
  }, [result.descriptors]);
  
  // Render descriptors for a category if they exist
  const renderDescriptors = useCallback((category: keyof typeof result.factors, factorColor: ThemeColor) => {
    // Skip if no descriptors for this category
    if (!hasCategoryDescriptors(category)) {
      return null;
    }
    
    // Get filtered descriptors list
    const descriptors = getCategoryDescriptors(category);

    return (
      <div className="descriptors-section">
        {descriptors.map((descriptor) => (
          <div key={`${category}-${descriptor}`} className="descriptor-item">
            <button 
              className={`descriptor-toggle ${isDescriptorExpanded(category, descriptor) ? 'expanded' : ''}`}
              onClick={() => toggleDescriptor(category, descriptor)}
              aria-expanded={isDescriptorExpanded(category, descriptor)}
              aria-controls={`descriptor-content-${category}-${descriptor}`}
            >
              <span className="descriptor-badge" style={{backgroundColor: `var(--color-${factorColor})`}}>
                {descriptor.charAt(0).toUpperCase()}
              </span>
              <span className="descriptor-name">{descriptor}</span>
              <svg 
                className="descriptor-toggle-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 9L12 16L5 9" 
                  stroke={darkMode ? "#e2e8f0" : "#334155"} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div 
              id={`descriptor-content-${category}-${descriptor}`}
              className={`descriptor-content ${isDescriptorExpanded(category, descriptor) ? 'expanded' : ''} animation-gpu`}
              aria-hidden={!isDescriptorExpanded(category, descriptor)}
            >
              <div className="descriptor-text">
                {getDescriptorExplanation(descriptor)}
                
                {/* Add evidence section with color class */}
                {result.descriptorEvidences && result.descriptorEvidences[descriptor] && (
                  <div className={`descriptor-evidence color-${factorColor}`}>
                    <h4 className="evidence-title">Evidence</h4>
                    <ul className="evidence-list">
                      {result.descriptorEvidences[descriptor].examples.map((example, index) => {
                        // Remove brackets if they exist in the example
                        const cleanedExample = example.replace(/^\[|\]$|\{|\}|\(|\)/g, '').trim();
                        return (
                          <li key={index} className="evidence-item">"{cleanedExample}"</li>
                        );
                      })}
                    </ul>
                    
                    <h4 className="evidence-title">Top Words</h4>
                    <div className="top-words">
                      {result.descriptorEvidences[descriptor].topWords
                        .sort((a, b) => b.count - a.count) // Sort by frequency
                        .map((word, index) => (
                          <span key={index} className="top-word">
                            {word.word} <span className="word-count">({word.count})</span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }, [hasCategoryDescriptors, getCategoryDescriptors, isDescriptorExpanded, toggleDescriptor, getDescriptorExplanation, darkMode, result.descriptorEvidences]);

  return (
    <section className="results-section animate-fadeIn" aria-label="Analysis Results">
      <div className="results-separator" role="separator"></div>
      
      <div className="results-grid">
        {/* Rating badge area */}
        <div className="rating-column">
          <div className="rating-stack gpu-accelerated">
            <div className="rating-shadow shadow-1"></div>
            <RatingBadge rating={result.rating} />
          </div>
          
          <div className="rating-name">
            <span className="rating-label">Rating</span>
            <h3 className="rating-title">
              {ratingLabels[result.rating as keyof typeof ratingLabels]}
            </h3>
          </div>
          
          {/* Alternative Rating section */}
          {result.top2_classes && result.top2_classes.length > 1 && result.top2_probs && (
            <div className="alt-rating-container">
              <p className="alt-rating-label">Alternative Rating</p>
              <div className="alt-rating-badge-container">
                <div className={`alt-rating-badge alt-rating-${result.top2_classes[1].toLowerCase()}`}>
                  {result.top2_classes[1]}
                </div>
              </div>
              <p className="alt-rating-confidence">
                {Math.round(result.top2_probs[1] * 100)}% confidence
              </p>
            </div>
          )}
        </div>
        
        {/* Results content */}
        <div className="results-content">
          {/* Confidence meter */}
          <div className="confidence-meter">
            <div className="meter-header">
              <h3 className="meter-title">Confidence Score</h3>
              <span className={`confidence-value color-${themeColor}`}>
                {result.confidence}%
              </span>
            </div>
            <ProgressBar 
              value={result.confidence} 
              color={themeColor} 
              size="md" 
              showLabel={false} 
            />
          </div>
          
          {/* Description card */}
          <div className="description-card">
            <p className="description-text">{result.description}</p>
          </div>
          
          {/* Summary section */}
          <div className="summary-section">
            <button 
              className={`summary-toggle ${isSummaryExpanded ? 'expanded' : ''}`}
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              aria-expanded={isSummaryExpanded}
              aria-controls="summary-content"
            >
              <span className="summary-toggle-text">Summary</span>
              <svg 
                className="summary-toggle-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  d="M19 9L12 16L5 9" 
                  stroke={darkMode ? "#e2e8f0" : "#334155"} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            <div 
              id="summary-content"
              className={`summary-content ${isSummaryExpanded ? 'expanded' : ''} animation-gpu`}
              aria-hidden={!isSummaryExpanded}
            >
              <div className="summary-text">
                {result.summary ? (
                  <div>
                    {result.summary.split('\n').map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p>
                    Analysis was performed using AI-powered content detection.
                    The system evaluates violence, language, substance use, and suggestive content
                    to determine the most appropriate content rating.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Content factors */}
          <div className="factors-section">
            <h3 className="factors-title">Content Analysis</h3>
            <div className="factors-grid">
              {Object.entries(result.factors).map(([factor, value]) => {
                const level = getLevel(value);
                const color = getLevelColor(value);
                const category = factor.replace(/([A-Z])/g, ' $1').trim();
                
                return (
                  <div key={factor} className="factor-card">
                    <div className="factor-header">
                      <span className="factor-name">
                        {category}
                      </span>
                      <span className={`factor-level level-${level}`}>
                        {level === 'high' ? 'High' : level === 'medium' ? 'Moderate' : level === 'low' ? 'Low' : 'None'}
                      </span>
                    </div>
                    <ProgressBar 
                      value={value} 
                      color={color} 
                      size="sm"
                    />
                    
                    {/* Render descriptor toggles for this category */}
                    {renderDescriptors(factor as keyof typeof result.factors, color)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating guide */}
      <div className="rating-guide">
        <div className="guide-pills">
          {ratingGuide.map(item => (
            <div 
              key={item.rating} 
              className={`guide-pill ${result.rating === item.rating ? `active-${item.color}` : ''} gpu-accelerated`}
            >
              <div className={`pill-badge bg-${item.color}`}>
                {item.rating}
              </div>
              <span className="pill-text">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(AnalysisResults);