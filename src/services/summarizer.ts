// src/services/summarizer.ts
import { SummaryFocusType } from '../components/GameTranscriptSummarizer/types';

/**
 * Generate a focused summary of a game transcript
 * @param transcript The game transcript text
 * @param focusType The type of summary to generate
 * @returns A Promise that resolves to the summary text
 */
export function summarizeTranscript(transcript: string, focusType: SummaryFocusType): Promise<string> {
  // API endpoint URL
  const apiUrl = 'http://localhost:5000/api/summarize';
  
  return new Promise((resolve, reject) => {
    // Add a short delay for UI consistency
    setTimeout(() => {
      // Make the API request to our Python backend
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript, focus: focusType, model: 'gemini' }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log("API response:", data); // Debug log
          
          // Ensure we have a summary, even if it's empty
          const summaryText = data.summary || "No summary was generated.";
          console.log("Final summary to be displayed:", summaryText);
          
          resolve(summaryText);
        })
        .catch(error => {
          console.error('Error summarizing transcript:', error);
          
          // Fallback to a local summary generation in case of API failure
          const fallbackSummary = generateFallbackSummary(transcript, focusType);
          resolve(fallbackSummary);
        });
    }, 1500); // Maintain the 1.5 second simulated processing time
  });
}

/**
 * Generate a fallback summary if the API call fails
 * This is only used when the API is unavailable
 */
function generateFallbackSummary(transcript: string, focusType: SummaryFocusType): string {
  // Create different templates based on focus type
  const templates: Record<SummaryFocusType, string> = {
    gameplay: `This appears to be a game transcript. Without API access, I can't provide a detailed analysis of the gameplay elements.

The transcript contains information about a game that includes various interactions and gameplay mechanics. For a more accurate and detailed gameplay summary, please try again when the API is available.

A full gameplay summary would describe the core gameplay loop, player actions, objectives, and distinctive gameplay features.`,

    setting: `This appears to be a game transcript. Without API access, I can't provide a detailed analysis of the setting and atmosphere.

The transcript contains information about a game world and its environment. For a more accurate and detailed setting summary, please try again when the API is available.

A full setting summary would describe the game world, time period, environment types, atmosphere, and overall aesthetic.`,

    plot: `This appears to be a game transcript. Without API access, I can't provide a detailed analysis of the plot elements.

The transcript contains dialogue and narrative elements that form part of the game's story. For a more accurate and detailed plot summary, please try again when the API is available.

A full plot summary would describe the main storyline, key characters, important events, and narrative themes.`,

    mechanics: `This appears to be a game transcript. Without API access, I can't provide a detailed analysis of the game mechanics.

The transcript contains information about game systems and mechanics. For a more accurate and detailed mechanics summary, please try again when the API is available.

A full mechanics summary would describe the core systems, unique features, player progression, and distinctive gameplay mechanics.`
  };
  
  return templates[focusType];
}