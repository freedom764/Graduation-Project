// src/components/ui/ProgressBar.tsx
import React, { memo } from 'react';
import { ProgressBarProps } from '../GameTranscriptAnalyzer/types';

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'emerald',
  size = 'md',
  showLabel = true
}) => {
  // Ensure value is within 0-100 range
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className="progress-container">
      <div className={`progress-track ${size}`}>
        <div 
          className={`progress-fill color-${color} animation-gpu`}
          style={{ width: `${normalizedValue}%` }}
          role="progressbar"
          aria-valuenow={normalizedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Empty div to maintain proper styling */}
        </div>
        
        {showLabel && normalizedValue > 0 && (
          <div 
            className="progress-label-container gpu-accelerated"
            style={{ left: `${Math.min(normalizedValue, 98)}%` }}
          >
            <span className={`progress-label color-${color}`}>
              {normalizedValue}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(ProgressBar);