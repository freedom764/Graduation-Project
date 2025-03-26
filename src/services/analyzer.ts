// src/services/analyzer.ts
import { AnalysisResult, RatingType } from '../components/GameTranscriptAnalyzer/types';

/**
 * Descriptions for each rating
 */
const RATING_DESCRIPTIONS: Record<RatingType, string> = {
  E: "Content is generally suitable for all ages. May contain minimal cartoon, fantasy or mild violence and/or infrequent use of mild language.",
  'ET': "Content is generally suitable for ages 10 and up. May contain more cartoon, fantasy or mild violence, mild language and/or minimal suggestive themes.",
  T: "Content is generally suitable for ages 13 and up. May contain violence, suggestive themes, crude humor, minimal blood, simulated gambling and/or infrequent use of strong language.",
  M: "Content is generally suitable for ages 17 and up. May contain intense violence, blood and gore, sexual content and/or strong language."
};

/**
 * Detailed explanations for each content descriptor
 */
const DESCRIPTOR_EXPLANATIONS: Record<string, string> = {
  // Violence
  'None': 'No violent content.',
  'Mild Cartoon Violence': 'Mild cartoon depictions of violence that may be comical and unrealistic.',
  'Mild Fantasy Violence': 'Mild violent actions of a fantasy nature, involving human or non-human characters.',
  'Mild Violence': 'Depictions of realistic violence that do not result in blood or death.',
  'Cartoon Violence': 'Violent actions involving cartoon-like characters.',
  'Fantasy Violence': 'Violent actions of a fantasy nature, involving human or non-human characters.',
  'Moderate Violence': 'More intense violent sequences that may show injury but not prolonged death.',
  'Intense Violence': 'Graphic and realistic-looking depictions of physical conflict.',
  
  // Blood
  'Mild Blood': 'Small amounts of blood or discoloration shown briefly.',
  'Animated Blood': 'Discolored and/or unrealistic depictions of blood.',
  'Blood': 'Depictions of blood or the mutilation of body parts.',
  'Blood And Gore': 'Depictions of blood or the mutilation of body parts in a realistic and graphic manner.',
  
  // Language
  'Mild Lyrics': 'Mild references to profanity, sexuality, violence, alcohol, or drug use in music.',
  'Mild Language': 'Mild to moderate use of profanity.',
  'Lyrics': 'Moderate references to profanity, sex, violence, alcohol, or drug use in music.',
  'Language': 'Moderate to strong use of profanity.',
  'Strong Language': 'Explicit and/or frequent use of profanity.',
  
  // Humor
  'Crude Humor': 'Depictions or dialogue involving vulgar antics.',
  'Mature Humor': 'Depictions or dialogue involving adult humor.',
  
  // Substances
  'Alcohol Reference': 'Reference to and/or images of alcoholic beverages.',
  'Drug Reference': 'Reference to and/or images of illegal drugs.',
  'Use of Alcohol': 'The consumption of alcoholic beverages.',
  'Use of Drugs and Alcohol': 'The consumption of drugs and/or alcohol.',
  
  // Sexual Content
  'Mild Suggestive Themes': 'Mild provocative references or materials.',
  'Sexual Themes': 'References to sex or sexuality.',
  'Partial Nudity': 'Brief and/or mild depictions of nudity.',
  'Sexual Content': 'Non-explicit depictions of sexual behavior, possibly including partial nudity.',
  'Nudity': 'Graphic or prolonged depictions of nudity.',
  'Strong Sexual Content': 'Explicit and/or frequent depictions of sexual behavior, possibly including nudity.',
  
  // Gambling
  'Simulated Gambling': 'Player can gamble without betting or wagering real cash or currency.'
};

/**
 * Analyze transcript using GPT-4o-mini + Random Forest model
 * Calls the Python backend API
 */
export function analyzeTranscript(transcript: string): Promise<AnalysisResult> {
  // API endpoint URL
  const apiUrl = 'http://localhost:5000/api/analyze';
  
  return new Promise((resolve, reject) => {
    // First, we simulate a short delay for UI consistency (like the original function)
    setTimeout(() => {
      // Make the API request to our Python backend
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Create an AnalysisResult object from the API response
          const result: AnalysisResult = {
            rating: data.rating as RatingType,
            confidence: data.confidence,
            factors: {
              violence: data.factors.violence,
              language: data.factors.language,
              substances: data.factors.substances,
              suggestiveContent: data.factors.suggestiveContent
            },
            description: data.description,
            summary: data.summary, // Use the summary directly from the API response
            descriptors: data.descriptors,
            descriptorExplanations: DESCRIPTOR_EXPLANATIONS,
            descriptorEvidences: data.descriptorEvidences,
            top2_classes: data.top2_classes,
            top2_probs: data.top2_probs
          };
          
          resolve(result);
        })
        .catch(error => {
          console.error('Error analyzing transcript:', error);
          
          // Fallback to the original analyzer in case of API failure
          const fallbackResult = fallbackAnalyzer(transcript);
          resolve(fallbackResult);
        });
    }, 1500); // Maintain the 1.5 second simulated processing time
  });
}

/**
 * Generate a summary from the detailed analysis - Used only for fallback
 */
function generateSummary(data: any): string {
  let summary = `Analysis was performed using AI-powered content detection.\n\n`;
  
  // Add information about the content descriptors
  summary += `Content descriptors:\n`;
  
  // Violence descriptors
  if (data.descriptors.violence.length > 0 && data.descriptors.violence[0] !== 'None') {
    summary += `• Violence: ${data.descriptors.violence.join(', ')}\n`;
  }
  
  // Language descriptors
  if (data.descriptors.language.length > 0 && data.descriptors.language[0] !== 'None') {
    summary += `• Language: ${data.descriptors.language.join(', ')}\n`;
  }
  
  // Substances descriptors
  if (data.descriptors.substances.length > 0 && data.descriptors.substances[0] !== 'None') {
    summary += `• Substances: ${data.descriptors.substances.join(', ')}\n`;
  }
  
  // Suggestive Content descriptors
  if (data.descriptors.suggestiveContent.length > 0 && data.descriptors.suggestiveContent[0] !== 'None') {
    summary += `• Suggestive Content: ${data.descriptors.suggestiveContent.join(', ')}\n`;
  }
  
  // Add information about the model confidence
  summary += `\nThe AI model has ${data.confidence}% confidence in this rating.`;
  
  return summary;
}

/**
 * Fallback analyzer function that uses the original pattern-matching approach
 * This is used only if the API call fails
 */
function fallbackAnalyzer(transcript: string): AnalysisResult {
  // Original content patterns
  const CONTENT_PATTERNS = {
    violence: [
      { keywords: ['blood', 'gore', 'dismember', 'mutilate', 'decapitate'], weight: 90 },
      { keywords: ['kill', 'murder', 'stab', 'shoot', 'death', 'die'], weight: 70 },
      { keywords: ['fight', 'battle', 'combat', 'attack', 'hurt', 'injure'], weight: 50 },
      { keywords: ['punch', 'hit', 'slap', 'kick', 'push'], weight: 30 }
    ],
    language: [
      { keywords: ['f***', 'sh**', 'explicit language', 'profanity'], weight: 90 },
      { keywords: ['damn', 'hell', 'ass', 'crap'], weight: 50 },
      { keywords: ['idiot', 'stupid', 'shut up', 'dumb'], weight: 30 }
    ],
    substances: [
      { keywords: ['cocaine', 'heroin', 'drug', 'inject', 'addiction'], weight: 90 },
      { keywords: ['alcohol', 'drunk', 'weed', 'joint', 'smoke', 'high'], weight: 70 },
      { keywords: ['beer', 'wine', 'cigarette', 'drinking'], weight: 50 }
    ],
    suggestiveContent: [
      { keywords: ['sex', 'nude', 'explicit', 'naked'], weight: 90 },
      { keywords: ['kiss', 'romance', 'intimate', 'seduce'], weight: 50 },
      { keywords: ['flirt', 'attractive', 'date', 'sexy'], weight: 30 }
    ]
  };

  const RATING_THRESHOLDS: Record<RatingType, Record<string, number>> = {
    E: { violence: 20, language: 10, substances: 10, suggestiveContent: 10 },
    'ET': { violence: 40, language: 30, substances: 20, suggestiveContent: 20 },
    T: { violence: 60, language: 60, substances: 40, suggestiveContent: 50 },
    M: { violence: 85, language: 85, substances: 70, suggestiveContent: 70 }
  };
  
  // Normalize transcript text
  const text = transcript.toLowerCase();
  
  // Calculate content factor scores
  const factorScores = {
    violence: calculateFactorScore(text, CONTENT_PATTERNS.violence),
    language: calculateFactorScore(text, CONTENT_PATTERNS.language),
    substances: calculateFactorScore(text, CONTENT_PATTERNS.substances),
    suggestiveContent: calculateFactorScore(text, CONTENT_PATTERNS.suggestiveContent)
  };
  
  // Determine rating based on factor scores
  const rating = determineRating(factorScores, RATING_THRESHOLDS);
  
  // Calculate confidence based on how clearly the content fits the rating
  const confidence = calculateConfidence(factorScores, rating, RATING_THRESHOLDS);
  
  // Generate fallback descriptors based on factor scores
  const descriptors = generateFallbackDescriptors(factorScores);
  
  // Generate placeholder evidence for fallback mode
  const descriptorEvidences: {[key: string]: any} = {};

  // For each active descriptor, create placeholder evidence
  Object.entries(descriptors).forEach(([category, descriptorList]) => {
    descriptorList.forEach(descriptor => {
      if (descriptor !== "None") {
        descriptorEvidences[descriptor] = {
          examples: [
            "Evidence unavailable in fallback mode.",
            "Please try again when the API is available.",
            "Fallback mode provides basic analysis only."
          ],
          topWords: [
            { word: "unavailable", count: 0 },
            { word: "fallback", count: 0 },
            { word: "offline", count: 0 }
          ]
        };
      }
    });
  });
  
  // Generate alternate rating for fallback mode
  const ratings: RatingType[] = ['M', 'T', 'ET', 'E'];
  let alternateRating: RatingType = rating;
  
  // Find the next closest rating
  for (let i = 0; i < ratings.length; i++) {
    if (ratings[i] === rating && i < ratings.length - 1) {
      alternateRating = ratings[i + 1];
      break;
    } else if (ratings[i] === rating) {
      alternateRating = ratings[0]; // If current rating is last, wrap around to first
    }
  }

  // Generate a fallback summary for the game
  const fallbackSummary = "This appears to be a game transcript. Unable to generate detailed game summary in fallback mode. Please try again when the API is available.";
  
  // Generate result
  const result: AnalysisResult = {
    rating,
    confidence,
    factors: factorScores,
    description: RATING_DESCRIPTIONS[rating],
    summary: fallbackSummary,
    descriptors,
    descriptorExplanations: DESCRIPTOR_EXPLANATIONS,
    descriptorEvidences,
    top2_classes: [rating, alternateRating],
    top2_probs: [confidence / 100, (100 - confidence) / 100]
  };
  
  return result;
}

/**
 * Generate fallback descriptors based on factor scores
 */
function generateFallbackDescriptors(factorScores: Record<string, number>) {
  const descriptors = {
    violence: ["None"],
    language: ["None"],
    substances: ["None"],
    suggestiveContent: ["None"]
  };
  
  // Set violence descriptors
  if (factorScores.violence > 75) {
    descriptors.violence = ["Intense Violence"];
  } else if (factorScores.violence > 50) {
    descriptors.violence = ["Moderate Violence"];
  } else if (factorScores.violence > 30) {
    descriptors.violence = ["Mild Violence"];
  } else if (factorScores.violence > 0) {
    descriptors.violence = ["Mild Cartoon Violence"];
  }
  
  // Set language descriptors
  if (factorScores.language > 75) {
    descriptors.language = ["Strong Language"];
  } else if (factorScores.language > 50) {
    descriptors.language = ["Language"];
  } else if (factorScores.language > 0) {
    descriptors.language = ["Mild Language"];
  }
  
  // Set substances descriptors
  if (factorScores.substances > 75) {
    descriptors.substances = ["Use of Drugs and Alcohol"];
  } else if (factorScores.substances > 50) {
    descriptors.substances = ["Use of Alcohol"];
  } else if (factorScores.substances > 0) {
    descriptors.substances = ["Alcohol Reference"];
  }
  
  // Set suggestive content descriptors
  if (factorScores.suggestiveContent > 75) {
    descriptors.suggestiveContent = ["Strong Sexual Content"];
  } else if (factorScores.suggestiveContent > 50) {
    descriptors.suggestiveContent = ["Sexual Content"];
  } else if (factorScores.suggestiveContent > 0) {
    descriptors.suggestiveContent = ["Mild Suggestive Themes"];
  }
  
  return descriptors;
}

/**
 * Calculate score for a specific content factor
 */
function calculateFactorScore(text: string, patterns: Array<{ keywords: string[], weight: number }>): number {
  let score = 0;
  let maxPossibleScore = 0;
  
  // Check for each pattern
  patterns.forEach(pattern => {
    // Count matches for this pattern
    const matchCount = pattern.keywords.filter(keyword => text.includes(keyword)).length;
    const hasMatch = matchCount > 0;
    
    // Adjust score based on match count (more matches = higher score)
    if (hasMatch) {
      const weightMultiplier = Math.min(1, (matchCount / pattern.keywords.length) + 0.5);
      score += pattern.weight * weightMultiplier;
    }
    
    maxPossibleScore += pattern.weight;
  });
  
  // Normalize score to 0-100 range
  return maxPossibleScore > 0 ? Math.min(100, Math.round((score / maxPossibleScore) * 100)) : 0;
}

/**
 * Determine rating based on factor scores
 */
function determineRating(
  factorScores: Record<string, number>, 
  thresholds: Record<RatingType, Record<string, number>>
): RatingType {
  // Get ratings in descending order (from most to least restrictive)
  const ratings: RatingType[] = ['M', 'T', 'ET', 'E'];
  
  // Start from the most restrictive rating and check if any factor exceeds the threshold
  for (const rating of ratings) {
    const ratingThresholds = thresholds[rating];
    
    // Check if any factor exceeds its threshold for this rating
    const exceedsThreshold = Object.keys(factorScores).some(factor => {
      const score = factorScores[factor];
      const threshold = ratingThresholds[factor];
      return score >= threshold;
    });
    
    if (exceedsThreshold) {
      return rating;
    }
  }
  
  // Default to Everyone
  return 'E';
}

/**
 * Calculate confidence score (70-100)
 * Higher confidence when factor scores are either well above or well below thresholds
 */
function calculateConfidence(
  factorScores: Record<string, number>, 
  rating: RatingType,
  thresholds: Record<RatingType, Record<string, number>>
): number {
  const ratingThresholds = thresholds[rating];
  let confidenceSum = 0;
  let factorCount = 0;
  
  // Calculate confidence for each factor
  Object.keys(factorScores).forEach(factor => {
    const score = factorScores[factor];
    const threshold = ratingThresholds[factor];
    
    // How far is the score from the threshold (normalized to 0-1)
    const distance = Math.abs(score - threshold) / 100;
    
    // Convert distance to confidence (0.3 distance → ~85% confidence)
    const factorConfidence = 70 + (distance * 30);
    
    confidenceSum += factorConfidence;
    factorCount++;
  });
  
  // Average confidence across all factors
  return Math.round(confidenceSum / factorCount);
}