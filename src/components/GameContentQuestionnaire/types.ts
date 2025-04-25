// src/components/GameContentQuestionnaire/types.ts

// Define content flags interface
export interface ContentFlags {
    // Violence
    mild_cartoon_violence?: 0 | 1;
    mild_fantasy_violence?: 0 | 1;
    mild_violence?: 0 | 1;
    cartoon_violence?: 0 | 1;
    fantasy_violence?: 0 | 1;
    moderate_violence?: 0 | 1;
    intense_violence?: 0 | 1;
    
    // Blood
    mild_blood?: 0 | 1;
    animated_blood?: 0 | 1;
    blood?: 0 | 1;
    blood_and_gore?: 0 | 1;
    
    // Language
    mild_lyrics?: 0 | 1;
    mild_language?: 0 | 1;
    lyrics?: 0 | 1;
    language?: 0 | 1;
    strong_language?: 0 | 1;
    
    // Sexual Content
    mild_suggestive_themes?: 0 | 1;
    sexual_themes?: 0 | 1;
    partial_nudity?: 0 | 1;
    sexual_content?: 0 | 1;
    nudity?: 0 | 1;
    strong_sexual_content?: 0 | 1;
    
    // Substance Use
    alcohol_reference?: 0 | 1;
    drug_reference?: 0 | 1;
    use_of_alcohol?: 0 | 1;
    use_of_drugs_and_alcohol?: 0 | 1;
    
    // Humor
    crude_humor?: 0 | 1;
    mature_humor?: 0 | 1;
    
    // Gambling
    simulated_gambling?: 0 | 1;
    
    // Other
    no_descriptors?: 0 | 1;
  }
  
  // Questionnaire state interface
  export interface QuestionnaireState {
    contentFlags: ContentFlags;
    currentStep: 'form' | 'results';
    isSubmitting: boolean;
    completedCategories: {
      violence: boolean;
      blood: boolean;
      language: boolean;
      sexualContent: boolean;
      substances: boolean;
      humor: boolean;
      gambling: boolean;
    };
    expandedCategories: {
      violence: boolean;
      blood: boolean;
      language: boolean;
      sexualContent: boolean;
      substances: boolean;
      humor: boolean;
      gambling: boolean;
    };
  }
  
  // Props for the QuestionnaireForm component
  export interface QuestionnaireFormProps {
    contentFlags: ContentFlags;
    updateContentFlag: (flag: keyof ContentFlags, value: 0 | 1) => void;
    expandedCategories: QuestionnaireState['expandedCategories'];
    toggleCategory: (category: keyof QuestionnaireState['expandedCategories']) => void;
    completedCategories: QuestionnaireState['completedCategories'];
    completeCategory: (category: keyof QuestionnaireState['completedCategories'], isComplete: boolean) => void;
    completionPercentage: number;
    isFormComplete: boolean;
    isSubmitting: boolean;
    onSubmit: () => void;
    darkMode: boolean;
  }