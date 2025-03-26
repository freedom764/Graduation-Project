// src/components/ui/RatingBadge.tsx
import React, { memo } from 'react';
import { RatingBadgeProps } from '../GameTranscriptAnalyzer/types';

const RatingBadge: React.FC<RatingBadgeProps> = ({ rating }) => {
  return (
    <div 
      className={`rating-badge rating-${rating.toLowerCase()} gpu-accelerated`}
      aria-label={`${rating} rating`}
    >
      {rating}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export default memo(RatingBadge);