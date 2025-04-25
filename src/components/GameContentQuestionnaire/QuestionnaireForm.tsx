// src/components/GameContentQuestionnaire/QuestionnaireForm.tsx
import React, { useCallback, useEffect, useMemo } from 'react';
import { ContentFlags, QuestionnaireFormProps } from './types';

// Questions for each content descriptor
const questionnaireData = {
  violence: {
    title: 'Violence',
    description: 'Evaluate the game for violent content and actions.',
    questions: [
      {
        id: 'mild_cartoon_violence',
        question: 'Does the game contain mild cartoon violence?',
        description: 'Mild cartoon depictions of violence that may be comical and unrealistic.'
      },
      {
        id: 'mild_fantasy_violence',
        question: 'Does the game contain mild fantasy violence?',
        description: 'Mild violent actions of a fantasy nature, involving human or non-human characters.'
      },
      {
        id: 'mild_violence',
        question: 'Does the game contain mild violence?',
        description: 'Depictions of realistic violence that do not result in blood or death.'
      },
      {
        id: 'cartoon_violence',
        question: 'Does the game contain cartoon violence?',
        description: 'Violent actions involving cartoon-like characters.'
      },
      {
        id: 'fantasy_violence',
        question: 'Does the game contain fantasy violence?',
        description: 'Violent actions of a fantasy nature, involving human or non-human characters.'
      },
      {
        id: 'moderate_violence',
        question: 'Does the game contain moderate violence?',
        description: 'More intense violent sequences that may show injury but not prolonged death.'
      },
      {
        id: 'intense_violence',
        question: 'Does the game contain intense violence?',
        description: 'Graphic and realistic-looking depictions of physical conflict.'
      }
    ]
  },
  blood: {
    title: 'Blood',
    description: 'Evaluate the game for blood and gore content.',
    questions: [
      {
        id: 'mild_blood',
        question: 'Does the game contain mild blood?',
        description: 'Small amounts of blood or discoloration shown briefly.'
      },
      {
        id: 'animated_blood',
        question: 'Does the game contain animated blood?',
        description: 'Discolored and/or unrealistic depictions of blood.'
      },
      {
        id: 'blood',
        question: 'Does the game contain blood?',
        description: 'Depictions of blood or the mutilation of body parts.'
      },
      {
        id: 'blood_and_gore',
        question: 'Does the game contain blood and gore?',
        description: 'Depictions of blood or the mutilation of body parts in a realistic and graphic manner.'
      }
    ]
  },
  language: {
    title: 'Language',
    description: 'Evaluate the game for profanity and language content.',
    questions: [
      {
        id: 'mild_lyrics',
        question: 'Does the game contain mild lyrics?',
        description: 'Mild references to profanity, sexuality, violence, alcohol, or drug use in music.'
      },
      {
        id: 'mild_language',
        question: 'Does the game contain mild language?',
        description: 'Mild to moderate use of profanity.'
      },
      {
        id: 'lyrics',
        question: 'Does the game contain lyrics with mature themes?',
        description: 'Moderate references to profanity, sex, violence, alcohol, or drug use in music.'
      },
      {
        id: 'language',
        question: 'Does the game contain moderate to strong language?',
        description: 'Moderate to strong use of profanity.'
      },
      {
        id: 'strong_language',
        question: 'Does the game contain strong language?',
        description: 'Explicit and/or frequent use of profanity.'
      }
    ]
  },
  sexualContent: {
    title: 'Sexual Content',
    description: 'Evaluate the game for sexual themes and nudity.',
    questions: [
      {
        id: 'mild_suggestive_themes',
        question: 'Does the game contain mild suggestive themes?',
        description: 'Mild provocative references or materials.'
      },
      {
        id: 'sexual_themes',
        question: 'Does the game contain sexual themes?',
        description: 'References to sex or sexuality.'
      },
      {
        id: 'partial_nudity',
        question: 'Does the game contain partial nudity?',
        description: 'Brief and/or mild depictions of nudity.'
      },
      {
        id: 'sexual_content',
        question: 'Does the game contain sexual content?',
        description: 'Non-explicit depictions of sexual behavior, possibly including partial nudity.'
      },
      {
        id: 'nudity',
        question: 'Does the game contain nudity?',
        description: 'Graphic or prolonged depictions of nudity.'
      },
      {
        id: 'strong_sexual_content',
        question: 'Does the game contain strong sexual content?',
        description: 'Explicit and/or frequent depictions of sexual behavior, possibly including nudity.'
      }
    ]
  },
  substances: {
    title: 'Substances',
    description: 'Evaluate the game for alcohol, drugs, and tobacco content.',
    questions: [
      {
        id: 'alcohol_reference',
        question: 'Does the game contain alcohol references?',
        description: 'Reference to and/or images of alcoholic beverages.'
      },
      {
        id: 'drug_reference',
        question: 'Does the game contain drug references?',
        description: 'Reference to and/or images of illegal drugs.'
      },
      {
        id: 'use_of_alcohol',
        question: 'Does the game depict the use of alcohol?',
        description: 'The consumption of alcoholic beverages.'
      },
      {
        id: 'use_of_drugs_and_alcohol',
        question: 'Does the game depict the use of drugs and alcohol?',
        description: 'The consumption of drugs and/or alcohol.'
      }
    ]
  },
  humor: {
    title: 'Humor',
    description: 'Evaluate the game for crude and mature humor.',
    questions: [
      {
        id: 'crude_humor',
        question: 'Does the game contain crude humor?',
        description: 'Depictions or dialogue involving vulgar antics.'
      },
      {
        id: 'mature_humor',
        question: 'Does the game contain mature humor?',
        description: 'Depictions or dialogue involving adult humor.'
      }
    ]
  },
  gambling: {
    title: 'Gambling',
    description: 'Evaluate the game for gambling content.',
    questions: [
      {
        id: 'simulated_gambling',
        question: 'Does the game contain simulated gambling?',
        description: 'Player can gamble without betting or wagering real cash or currency.'
      }
    ]
  }
};

const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  contentFlags,
  updateContentFlag,
  expandedCategories,
  toggleCategory,
  completedCategories,
  completeCategory,
  completionPercentage,
  isFormComplete,
  isSubmitting,
  onSubmit,
  darkMode
}) => {
  // Check if a category is complete (all questions answered)
  const checkCategoryCompletion = useCallback((category: keyof typeof completedCategories) => {
    const questions = questionnaireData[category as keyof typeof questionnaireData].questions;
    
    // Check if ALL questions have been answered (either Yes=1 or No=0)
    const isComplete = questions.every(q => {
      const questionId = q.id as keyof ContentFlags;
      // Must be explicitly 0 or 1, not undefined
      return contentFlags[questionId] === 0 || contentFlags[questionId] === 1;
    });
    
    if (isComplete !== completedCategories[category]) {
      completeCategory(category, isComplete);
    }
  }, [contentFlags, completedCategories, completeCategory]);
  
  // Handle answer selection (Yes/No)
  const handleAnswer = useCallback((questionId: keyof ContentFlags, value: 0 | 1, category: keyof typeof completedCategories) => {
    updateContentFlag(questionId, value);
    
    // Small delay to ensure state update occurs before we check completion
    setTimeout(() => {
      checkCategoryCompletion(category);
    }, 50);
  }, [updateContentFlag, checkCategoryCompletion]);
  
  // Check all categories for completion after every content flag update
  useEffect(() => {
    // Check completion for all categories
    Object.keys(completedCategories).forEach(category => {
      checkCategoryCompletion(category as keyof typeof completedCategories);
    });
  }, [contentFlags, checkCategoryCompletion, completedCategories]);
  
  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (isFormComplete && !isSubmitting) {
      onSubmit();
    }
  }, [isFormComplete, isSubmitting, onSubmit]);
  
  // Helper to get progress color based on percentage
  const getProgressColor = useMemo(() => {
    if (completionPercentage < 30) return 'rose';
    if (completionPercentage < 70) return 'amber';
    return 'emerald';
  }, [completionPercentage]);
  
  return (
    <form className="questionnaire-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h1 className="form-title">Game Content Questionnaire</h1>
        <p className="form-description">
          Answer the following questions about your game's content to receive an ESRB rating prediction.
        </p>
        
        {/* Progress bar - Updated with new class names */}
        <div className="questionnaire-progress-section">
          <div className="questionnaire-progress-header">
            <span className="questionnaire-progress-label">Questionnaire Progress</span>
            <span className={`questionnaire-progress-percentage color-${getProgressColor}`}>
              {completionPercentage}%
            </span>
          </div>
          <div className="questionnaire-progress-track">
            <div 
              className={`questionnaire-progress-fill color-${getProgressColor}`}
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="categories-container">
        {/* Render each category */}
        {Object.entries(questionnaireData).map(([categoryKey, category]) => {
          const catKey = categoryKey as keyof typeof completedCategories;
          const isExpanded = expandedCategories[catKey];
          const isComplete = completedCategories[catKey];
          
          return (
            <div key={categoryKey} className={`category-section ${isExpanded ? 'expanded' : ''}`}>
              <button
                type="button"
                className={`category-header ${isComplete ? 'completed' : ''}`}
                onClick={() => toggleCategory(catKey)}
                aria-expanded={isExpanded}
                aria-controls={`category-content-${categoryKey}`}
              >
                <div className="category-header-content">
                  <h2 className="category-title">{category.title}</h2>
                  <p className="category-description">{category.description}</p>
                </div>
                
                <div className="category-controls">
                  {isComplete && (
                    <span className="completion-badge">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12L10 17L19 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                  <svg 
                    className="toggle-icon" 
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
                </div>
              </button>
              
              <div 
                id={`category-content-${categoryKey}`}
                className={`category-content ${isExpanded ? 'expanded' : ''}`}
                aria-hidden={!isExpanded}
              >
                {category.questions.map((question) => (
                  <div key={question.id} className="question-item">
                    <div className="question-content">
                      <h3 className="question-text">{question.question}</h3>
                      <p className="question-description">{question.description}</p>
                    </div>
                    
                    <div className="question-actions">
                      <div className="toggle-buttons">
                        <button
                          type="button"
                          className={`toggle-button no ${contentFlags[question.id as keyof ContentFlags] === 0 ? 'selected' : ''}`}
                          onClick={() => handleAnswer(question.id as keyof ContentFlags, 0, catKey)}
                          aria-pressed={contentFlags[question.id as keyof ContentFlags] === 0}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          className={`toggle-button yes ${contentFlags[question.id as keyof ContentFlags] === 1 ? 'selected' : ''}`}
                          onClick={() => handleAnswer(question.id as keyof ContentFlags, 1, catKey)}
                          aria-pressed={contentFlags[question.id as keyof ContentFlags] === 1}
                        >
                          Yes
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="form-actions">
        <button
          type="submit"
          className={`questionnaire-submit-button ${!isFormComplete || isSubmitting ? 'disabled' : ''}`}
          disabled={!isFormComplete || isSubmitting}
        >
          {isSubmitting ? (
            <div className="analyzing-text">
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
            'Generate Rating Prediction'
          )}
        </button>
        
        {!isFormComplete && (
          <p className="incomplete-message">
            Please answer all questions to generate a rating prediction.
          </p>
        )}
      </div>
    </form>
  );
};

export default React.memo(QuestionnaireForm);