// src/components/GameTranscriptAnalyzer/types.ts
export type RatingType = 'E' | 'ET' | 'T' | 'M';
export type ApiModelType = 'gpt' | 'gemini'; // Add this new type

export type ThemeColor = 'emerald' | 'teal' | 'amber' | 'rose' | 'slate';

export type LevelType = 'low' | 'medium' | 'high';

// Define explanation type for content descriptors
export interface DescriptorExplanation {
  [key: string]: string;
}

// Define evidence type for content descriptors
export interface TopWord {
  word: string;
  count: number;
}

export interface DescriptorEvidence {
  examples: string[];
  topWords: TopWord[];
}

// Update the AnalysisResult interface to include descriptor explanations
export interface AnalysisResult {
  rating: RatingType;
  confidence: number;
  factors: {
    violence: number;
    language: number;
    substances: number;
    suggestiveContent: number;
  };
  description: string;
  summary?: string;
  descriptors?: {
    violence: string[];
    language: string[];
    substances: string[];
    suggestiveContent: string[];
  };
  descriptorExplanations?: DescriptorExplanation;
  descriptorEvidences?: {
    [key: string]: DescriptorEvidence;
  };
  top2_classes?: RatingType[]; // Add alternative rating options
  top2_probs?: number[]; // Add probabilities for alternative ratings
}

export interface RatingInfo {
  rating: RatingType;
  name: string;
  color: ThemeColor;
  description: string;
}

export interface GameTranscriptAnalyzerProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export interface ProgressBarProps {
  value: number;
  color?: ThemeColor;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export interface RatingBadgeProps {
  rating: RatingType;
}

export interface AnalysisResultsProps {
  result: AnalysisResult;
  darkMode: boolean; // Add darkMode prop for icon color control
}

export interface GameControllerProps {
  className?: string;
}