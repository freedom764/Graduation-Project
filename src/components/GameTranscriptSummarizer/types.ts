// src/components/GameTranscriptSummarizer/types.ts
export type SummaryFocusType = 'gameplay' | 'setting' | 'plot' | 'mechanics';

export interface SummaryResult {
  summary: string;
  focusType: SummaryFocusType;
  wordCount: number;
}

export interface SummaryResultsProps {
  summary: string;
  focusType: SummaryFocusType;
  darkMode: boolean;
}