import os
import json
import pickle
import pandas as pd
import re
import tiktoken
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import numpy as np
from google import genai

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Path to the trained model files
MODEL_PATH = 'rf_model.pkl'
SCALER_PATH = 'scaler.pkl'

# Load the trained model if it exists, otherwise train it
def load_or_train_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        print("Loading pre-trained model...")
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
    else:
        print("Training new model...")
        # Load ESRB dataset for training
        esrb_data = pd.read_csv("data/Video_games_esrb_rating.csv")
        
        # Prepare features for training
        X_train = esrb_data.drop(columns=['title', 'console', 'esrb_rating'])
        y_train = esrb_data['esrb_rating']
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        
        # Train RF model
        model = RandomForestClassifier(random_state=42, n_jobs=-1)
        model.fit(X_train_scaled, y_train)
        
        # Save the model and scaler
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)
        with open(SCALER_PATH, 'wb') as f:
            pickle.dump(scaler, f)
    
    return model, scaler

# Count tokens in a text string
def count_tokens(text):
    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))

# Split transcript into segments of max_tokens each
def split_transcript(transcript, max_tokens=125000):
    encoding = tiktoken.get_encoding("cl100k_base")
    full_tokens = encoding.encode(transcript)
    total_tokens = len(full_tokens)
    
    segments = []
    start_idx = 0
    
    while start_idx < total_tokens:
        end_idx = min(start_idx + max_tokens, total_tokens)
        segment_tokens = full_tokens[start_idx:end_idx]
        segment_text = encoding.decode(segment_tokens)
        segments.append(segment_text)
        start_idx += max_tokens
    
    return segments

# Format descriptor name from snake_case to Title Case
def get_formatted_descriptor_name(descriptor):
    return ' '.join(word.capitalize() for word in descriptor.split('_'))

# Calculate extremeness percentage for each content category
def calculate_category_extremeness(content_flags):
    # Define severity levels for each descriptor (0-4)
    descriptor_severity = {
        # Violence
        'intense_violence': 4,
        'moderate_violence': 3,
        'fantasy_violence': 2, 
        'cartoon_violence': 2,
        'mild_violence': 1,
        'mild_fantasy_violence': 1, 
        'mild_cartoon_violence': 1,
        
        # Blood
        'blood_and_gore': 4,
        'blood': 3,
        'animated_blood': 2,
        'mild_blood': 1,
        
        # Language
        'strong_language': 4,
        'language': 3,
        'lyrics': 2,
        'mild_language': 1,
        'mild_lyrics': 1,
        
        # Humor
        'mature_humor': 4,
        'crude_humor': 2,
        
        # Substances
        'use_of_drugs_and_alcohol': 4,
        'use_of_alcohol': 2,
        'drug_reference': 2,
        'alcohol_reference': 1,
        
        # Sexual content
        'strong_sexual_content': 4,
        'sexual_content': 3,
        'sexual_themes': 2,
        'mild_suggestive_themes': 1,
        
        # Nudity
        'nudity': 4,
        'partial_nudity': 3,
        
        # Gambling
        'simulated_gambling': 4
    }
    
    # Define subcategory groups
    subcategories = {
        'Violence': [
            # Violence subcategory (75%)
            ['intense_violence', 'moderate_violence', 'fantasy_violence', 
             'cartoon_violence', 'mild_violence', 'mild_fantasy_violence', 
             'mild_cartoon_violence'],
            
            # Blood subcategory (75%)
            ['blood_and_gore', 'blood', 'animated_blood', 'mild_blood']
        ],
        
        'Language': [
            # Language subcategory (75%)
            ['strong_language', 'language', 'lyrics', 'mild_language', 'mild_lyrics'],
            
            # Humor subcategory (75%)
            ['mature_humor', 'crude_humor']
        ],
        
        'Substances': [
            # Single subcategory (100%)
            ['use_of_drugs_and_alcohol', 'use_of_alcohol', 'drug_reference', 'alcohol_reference']
        ],
        
        'Suggestive Content': [
            # Sexual content subcategory (75%)
            ['strong_sexual_content', 'sexual_content', 'sexual_themes', 'mild_suggestive_themes'],
            
            # Nudity subcategory (75%)
            ['nudity', 'partial_nudity']
        ]
    }
    
    # Define subcategory hierarchies (ordered from highest to lowest severity)
    subcategory_hierarchies = {
        'Violence': [
            # Violence subcategory hierarchy
            ['intense_violence', 'moderate_violence', 'fantasy_violence', 
             'cartoon_violence', 'mild_violence', 'mild_fantasy_violence', 
             'mild_cartoon_violence'],
            
            # Blood subcategory hierarchy
            ['blood_and_gore', 'blood', 'animated_blood', 'mild_blood']
        ],
        
        'Language': [
            # Language subcategory hierarchy
            ['strong_language', 'language', 'lyrics', 'mild_language', 'mild_lyrics'],
            
            # Humor subcategory hierarchy
            ['mature_humor', 'crude_humor']
        ],
        
        'Substances': [
            # Substances hierarchy
            ['use_of_drugs_and_alcohol', 'use_of_alcohol', 'drug_reference', 'alcohol_reference']
        ],
        
        'Suggestive Content': [
            # Sexual content subcategory hierarchy
            ['strong_sexual_content', 'sexual_content', 'sexual_themes', 'mild_suggestive_themes'],
            
            # Nudity subcategory hierarchy
            ['nudity', 'partial_nudity']
        ]
    }
    
    # Gambling descriptor for special handling
    gambling_descriptor = 'simulated_gambling'
    
    extremeness = {}
    
    # Calculate extremeness for each category
    for category, subcat_groups in subcategories.items():
        category_score = 0
        
        # Calculate score for each subcategory
        for i, subcat_descriptors in enumerate(subcat_groups):
            # Check if any descriptors in this subcategory are active
            active_descriptors = [d for d in subcat_descriptors if d in content_flags and content_flags[d] == 1]
            
            if active_descriptors:
                # Get highest severity descriptor in this subcategory
                hierarchy = subcategory_hierarchies[category][i]
                
                # Find the highest severity descriptor that is active
                highest_descriptor = None
                for descriptor in hierarchy:
                    if descriptor in active_descriptors:
                        highest_descriptor = descriptor
                        break
                
                if highest_descriptor:
                    # Get the severity of this descriptor 
                    severity = descriptor_severity[highest_descriptor]
                    # Get the maximum severity in this subcategory
                    max_severity = max(descriptor_severity[d] for d in subcat_descriptors)
                    
                    # Each subcategory contributes up to 75%
                    # For categories with 1 subcategory (Substances), it's still 100%
                    if len(subcat_groups) == 1:
                        subcategory_weight = 100
                    else:
                        subcategory_weight = 60
                    
                    # Scale the severity to get the subcategory score
                    subcategory_score = (severity / max_severity) * subcategory_weight
                    
                    category_score += subcategory_score + 5
        
        extremeness[category] = category_score
    
    # Special handling for gambling in Suggestive Content
    if gambling_descriptor in content_flags and content_flags[gambling_descriptor] == 1:
        # Add 50% for gambling 
        gambling_contribution = 50
        
        # Add gambling contribution to Suggestive Content
        extremeness['Suggestive Content'] += gambling_contribution
    
    # Cap all scores at 100% for display
    for category in extremeness:
        extremeness[category] = min(extremeness[category], 100)
    
    return extremeness

# Get active descriptors by category
def get_active_descriptors_by_category(content_flags):
    categories = {
        'Violence': [],
        'Language': [],
        'Substances': [],
        'Suggestive Content': []
    }
    
    # Violence hierarchy
    violence_hierarchy = [
        'intense_violence', 'moderate_violence', 'fantasy_violence', 
        'cartoon_violence', 'mild_violence', 'mild_fantasy_violence', 
        'mild_cartoon_violence'
    ]
    
    blood_hierarchy = [
        'blood_and_gore', 'blood', 'animated_blood', 'mild_blood'
    ]
    
    # Language hierarchy
    language_hierarchy = [
        'strong_language', 'language', 'lyrics', 'mild_language', 'mild_lyrics'
    ]
    
    humor_hierarchy = [
        'mature_humor', 'crude_humor'
    ]
    
    # Substances hierarchy
    substances_hierarchy = [
        'use_of_drugs_and_alcohol', 'use_of_alcohol', 'drug_reference', 'alcohol_reference'
    ]
    
    # Suggestive Content hierarchy
    sexual_hierarchy = [
        'strong_sexual_content', 'sexual_content', 'sexual_themes', 'mild_suggestive_themes'
    ]
    
    nudity_hierarchy = [
        'nudity', 'partial_nudity'
    ]
    
    gambling_hierarchy = [
        'simulated_gambling'
    ]
    
    # Check violence descriptors
    for descriptor in violence_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Violence'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check blood descriptors (also in Violence category)
    for descriptor in blood_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Violence'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check language descriptors
    for descriptor in language_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Language'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check humor descriptors (put in Language category)
    for descriptor in humor_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Language'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check substances descriptors
    for descriptor in substances_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Substances'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check sexual content descriptors
    for descriptor in sexual_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Suggestive Content'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check nudity descriptors (put in Suggestive Content)
    for descriptor in nudity_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Suggestive Content'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Check gambling descriptors (put in Suggestive Content)
    for descriptor in gambling_hierarchy:
        if descriptor in content_flags and content_flags[descriptor] == 1:
            categories['Suggestive Content'].append(get_formatted_descriptor_name(descriptor))
            break  # Only get strongest one
    
    # Replace empty lists with "None"
    for category in categories:
        if not categories[category]:
            categories[category] = ["None"]
    
    return categories

# Get descriptor examples with GPT
def get_descriptor_examples(client, transcript, active_descriptors):
    """
    Get examples and key words from transcript for each active content descriptor.
    
    Args:
        client: OpenAI client
        transcript: Game transcript text
        active_descriptors: Dictionary of categories and their active descriptors
    
    Returns:
        Dictionary of descriptors with their examples and key words
    """
    # Flatten the active descriptors into a simple list
    flat_descriptors = []
    for category, descriptors in active_descriptors.items():
        for descriptor in descriptors:
            if descriptor != "None":  # Skip "None" values
                flat_descriptors.append(descriptor)
    
    # If there are no descriptors, return empty dictionary
    if not flat_descriptors:
        return {}
    
    # Create prompt for GPT with the transcript and descriptors
    system_prompt = f"""You are analyzing a game transcript to find examples and key words for each content descriptor.
    
CONTENT DESCRIPTORS TO FIND EXAMPLES FOR:
{", ".join(flat_descriptors)}

For each descriptor:
Identify the 3 most representative words from the transcript that exemplify this descriptor and also save sentences you get the words from.

Return a JSON object with:
- Each descriptor as a key
- For each descriptor, provide an object with:
  - "examples": an array of 3 strings with clear quoted examples from the transcript that contain the representative words you identified
  - "words": an array of the 3 representative words you identified
"""
    
    # Use a smaller transcript segment if it's too large
    max_tokens = 100000  # Reduced to leave room for response
    if count_tokens(transcript) > max_tokens:
        # Use the first segment only for finding examples
        segments = split_transcript(transcript, max_tokens)
        analysis_transcript = segments[0]
    else:
        analysis_transcript = transcript
    
    print(f"Finding examples and key words for: {', '.join(flat_descriptors)}")
    
    # Make API request
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": analysis_transcript
            }
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    
    try:
        result = json.loads(response.choices[0].message.content)
        return result
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response for examples: {e}")
        print("Raw response:", response.choices[0].message.content)
        return {}

# Generate game transcript summary with Gemini
def generate_transcript_summary(transcript):
    """
    Generate a summary of the game transcript using Google's Gemini API.
    
    Args:
        transcript: The game transcript text
    
    Returns:
        A summary of the game transcript
    """
    try:
        # Initialize the Gemini API client with your API key
        client = genai.Client(api_key="AIzaSyDQFigX51iCUXDtOke9Q7YtQDJy1_a1ui4")
        
        # Truncate transcript if it's too long
        max_length = 25000  # Approximate character limit for input
        if len(transcript) > max_length:
            analysis_transcript = transcript[:max_length] + "..."
        else:
            analysis_transcript = transcript
        
        # Create the prompt for Gemini
        prompt = f"""
        Analyze the following game transcript and create a summary in no more than 100 words.
        The summary should capture the main elements of the game including:
        - The type of game and gameplay
        - The setting and atmosphere
        - Key plot points (if apparent)
        - Notable game mechanics or features
        The summary should not be structured, but should be plain unstructured text.
        
        Transcript:
        {analysis_transcript}
        """
        
        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-2.0-flash-lite-preview-02-05",
            contents=prompt
        )
        
        # Get the summary from the response
        summary = response.text
        print("Gemini summary generated successfully")
        return summary
        
    except Exception as e:
        print(f"Error generating Gemini summary: {e}")
        # Return a fallback message if Gemini API fails
        return "Game transcript summary unavailable. Analysis was performed using AI-powered content detection."

# Count word occurrences in transcript
def count_word_occurrences(transcript, word_list):
    """
    Count occurrences of each word in the transcript.
    """
    word_counts = {}
    
    for word in word_list:
        # Create a regex pattern that matches the word as a whole word
        pattern = r'\b' + re.escape(word) + r'\b'
        
        # Count occurrences (case insensitive)
        matches = re.findall(pattern, transcript, re.IGNORECASE)
        word_counts[word] = len(matches)
    
    return word_counts

# Get rating description based on rating
def get_rating_description(rating):
    descriptions = {
        'E': "Content is generally suitable for all ages. May contain minimal cartoon, fantasy or mild violence and/or infrequent use of mild language.",
        'ET': "Content is generally suitable for ages 10 and up. May contain more cartoon, fantasy or mild violence, mild language and/or minimal suggestive themes.",
        'T': "Content is generally suitable for ages 13 and up. May contain violence, suggestive themes, crude humor, minimal blood, simulated gambling and/or infrequent use of strong language.",
        'M': "Content is generally suitable for ages 17 and up. May contain intense violence, blood and gore, sexual content and/or strong language."
    }
    return descriptions.get(rating, "Rating description not available.")

# Analyze transcript using GPT-4o-mini
def analyze_transcript_with_gpt(client, transcript):
    system_prompt = """You are analyzing a game transcript to identify content descriptors.

CONTENT DESCRIPTORS:

Violence:
- mild_cartoon_violence
- mild_fantasy_violence
- mild_violence
- cartoon_violence
- fantasy_violence
- moderate_violence
- intense_violence

Blood:
- mild_blood
- animated_blood
- blood
- blood_and_gore

Language:
- mild_lyrics
- mild_language
- lyrics
- language
- strong_language

Sexual Content:
- mild_suggestive_themes
- sexual_themes
- partial_nudity
- sexual_content
- nudity
- strong_sexual_content

Substance Use:
- alcohol_reference
- drug_reference
- use_of_alcohol
- use_of_drugs_and_alcohol

Humor:
- crude_humor
- mature_humor

Gambling:
- simulated_gambling

Other:
- no_descriptors

VALIDATION RULES:
1. Flag only descriptors that accurately describe content in the transcript.
2. Be thorough but accurate - don't miss content, but don't overstate it.
3. Do not be overly cautious - flag content that is present.
4. Use mild descriptors for mild content, strong descriptors for strong content.

Return a JSON object with:
- "content_flags": dictionary of all descriptors with 0 or 1 values
- "predicted_rating": E, ET, T, or M based on the combination of content flags"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": transcript
            }
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    
    try:
        result = json.loads(response.choices[0].message.content)
        
        # Ensure rating is in correct format
        if result['predicted_rating'] == 'E10+':
            result['predicted_rating'] = 'ET'
            
        # Define expected column names
        expected_columns = [
            'alcohol_reference', 'animated_blood', 'blood', 'blood_and_gore',
            'cartoon_violence', 'crude_humor', 'drug_reference', 'fantasy_violence',
            'intense_violence', 'language', 'lyrics', 'mature_humor', 'mild_blood',
            'mild_cartoon_violence', 'mild_fantasy_violence', 'mild_language',
            'mild_lyrics', 'mild_suggestive_themes', 'mild_violence', 'no_descriptors',
            'nudity', 'partial_nudity', 'sexual_content', 'sexual_themes',
            'simulated_gambling', 'strong_language', 'strong_sexual_content',
            'suggestive_themes', 'use_of_alcohol', 'use_of_drugs_and_alcohol',
            'moderate_violence'
        ]
        
        # Ensure all expected flags are present
        flags = result.get('content_flags', {})
        standardized_flags = {col: flags.get(col, 0) for col in expected_columns}
        result['content_flags'] = standardized_flags
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON response: {e}")
        print("Raw response:", response.choices[0].message.content)
        raise

# API endpoint to analyze transcript
@app.route('/api/analyze', methods=['POST'])
def analyze():
    # Get transcript from request
    data = request.json
    transcript = data.get('transcript', '')
    
    if not transcript:
        return jsonify({'error': 'No transcript provided'}), 400
    
    # Initialize OpenAI client (make sure OPENAI_API_KEY is set in environment)
    client = OpenAI()
    
    # Step 1: Analyze transcript with GPT
    try:
        gpt_result = analyze_transcript_with_gpt(client, transcript)
    except Exception as e:
        return jsonify({'error': f'GPT analysis failed: {str(e)}'}), 500
    
    # Step 2: Load or train the Random Forest model
    try:
        rf_model, scaler = load_or_train_model()
    except Exception as e:
        return jsonify({'error': f'Model loading/training failed: {str(e)}'}), 500
    
    # Step 3: Use the model to predict rating based on content flags
    feature_vector = pd.DataFrame([gpt_result['content_flags']])
    X_scaled = scaler.transform(feature_vector)
    
    # Get prediction and probabilities
    rf_rating = rf_model.predict(X_scaled)[0]
    rf_proba = rf_model.predict_proba(X_scaled)[0]
    class_labels = rf_model.classes_
    
    # Get the confidence score (probability of the predicted class)
    confidence = int(round(np.max(rf_proba) * 100))
    
    # Get the top 2 class probabilities
    top2_indices = np.argsort(rf_proba)[-2:][::-1]
    top2_classes = [class_labels[idx] for idx in top2_indices]
    top2_probs = [rf_proba[idx] for idx in top2_indices]
    
    # Calculate category extremeness
    extremeness = calculate_category_extremeness(gpt_result['content_flags'])
    
    # Get active descriptors by category
    active_descriptors = get_active_descriptors_by_category(gpt_result['content_flags'])
    
    # Get examples and top words for active descriptors
    descriptor_evidence = {}
    try:
        raw_evidence = get_descriptor_examples(client, transcript, active_descriptors)
        
        # Process evidence and count word frequencies
        for descriptor, evidence in raw_evidence.items():
            word_counts = count_word_occurrences(transcript, evidence.get('words', []))
            
            descriptor_evidence[descriptor] = {
                "examples": evidence.get('examples', []),
                "topWords": [{"word": word, "count": count} for word, count in word_counts.items()]
            }
    except Exception as e:
        print(f"Error getting descriptor evidence: {e}")
    
    # Generate game transcript summary with Gemini
    try:
        transcript_summary = generate_transcript_summary(transcript)
    except Exception as e:
        print(f"Error generating transcript summary: {e}")
        transcript_summary = "Game transcript summary unavailable. Analysis was performed using AI-powered content detection."
    
    # Print results to console (similar to compare_predictions.py output)
    print("\nTranscript Analysis Results:")
    print("-" * 120)
    print(f"{'GPT Rating':<12} {'RF Rating':<10} {'Confidence':<10} {'RF Top 2 Decisions':<40}")
    print("-" * 120)
    print(f"{gpt_result['predicted_rating']:<12} {rf_rating:<10} {confidence:>7}%  {top2_classes[0]} ({top2_probs[0]:.2f}), {top2_classes[1]} ({top2_probs[1]:.2f})")
    
    # Print categories, their active descriptors, and extremeness
    for category, descriptors in active_descriptors.items():
        extremeness_value = extremeness[category]
        print(f"  {category} ({extremeness_value:.0f}%): {', '.join(descriptors)}")
    
    print("-" * 120)
    
    # Construct response object
    response = {
        'gpt_rating': gpt_result['predicted_rating'],
        'rating': rf_rating,
        'confidence': confidence,
        'top2_classes': top2_classes,
        'top2_probs': [float(p) for p in top2_probs],
        'content_flags': gpt_result['content_flags'],
        'factors': {
            'violence': int(extremeness['Violence']),
            'language': int(extremeness['Language']),
            'substances': int(extremeness['Substances']),
            'suggestiveContent': int(extremeness['Suggestive Content'])
        },
        'descriptors': {
            'violence': active_descriptors['Violence'],
            'language': active_descriptors['Language'],
            'substances': active_descriptors['Substances'],
            'suggestiveContent': active_descriptors['Suggestive Content']
        },
        'descriptorEvidences': descriptor_evidence,
        'description': get_rating_description(rf_rating),
        'summary': transcript_summary
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)