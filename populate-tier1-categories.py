#!/usr/bin/env python3
"""
Populate Tier 1 Categories for all profiles.

This script adds the new Tier 1 expansion fields to all 265 profiles:
- Technology Relationship (5 fields)
- Crisis Response (5 fields)
- Influence Style (5 fields)

It uses known biographical information to make educated assessments.
"""

import json
import os
from pathlib import Path

# Define the new category structures with common values
TECHNOLOGY_ADOPTION_VALUES = {
    'early adopter': ['tech', 'digital', 'innovation', 'software', 'computer', 'internet', 'platform'],
    'pragmatic': ['business', 'strategy', 'academic', 'research', 'science'],
    'skeptical': ['philosophy', 'traditional', 'classical', 'historical'],
    'resistant': ['analog', 'pre-digital']
}

DIGITAL_FLUENCY_VALUES = {
    'native': ['1970-', 'tech', 'digital', 'software', 'entrepreneur'],
    'proficient': ['1950-1969', 'business', 'modern'],
    'basic': ['1930-1949', 'traditional'],
    'analog-preferring': ['-1929', 'classical', 'historical']
}

AI_PERSPECTIVE_VALUES = {
    'enthusiast': ['tech', 'futurist', 'innovation', 'ai', 'computer science'],
    'cautious optimist': ['balanced', 'strategic', 'thoughtful'],
    'concerned': ['ethics', 'philosophy', 'social impact', 'psychology'],
    'opposed': ['humanist', 'traditional']
}

STRESS_RESPONSE_VALUES = {
    'calm under pressure': ['mindful', 'zen', 'meditation', 'philosophical', 'systematic'],
    'energized by challenge': ['competitive', 'driven', 'ambitious', 'perfectionist'],
    'overwhelmed': ['anxiety', 'sensitive'],
    'avoidant': ['withdrawn', 'isolated']
}

FAILURE_RECOVERY_VALUES = {
    'bounce back stronger': ['resilient', 'growth mindset', 'adaptive', 'learning-focused'],
    'learn and adapt': ['systematic', 'analytical', 'thoughtful', 'deliberate'],
    'prolonged recovery': ['perfectionist', 'self-critical'],
    'denial': ['defensive', 'rigid']
}

PERSUASION_APPROACH_VALUES = {
    'logical argument': ['rational', 'analytical', 'systematic', 'research', 'scientific'],
    'emotional appeal': ['passionate', 'charismatic', 'inspirational', 'visionary'],
    'social proof': ['popular', 'influencer', 'trendsetter'],
    'authority': ['expertise', 'credentials', 'institutional']
}

INFLUENCE_SCOPE_VALUES = {
    'one-to-one': ['coaching', 'mentoring', 'consulting', 'therapy'],
    'small groups': ['teaching', 'workshop', 'seminar'],
    'mass audience': ['author', 'speaker', 'media', 'entertainment', 'ceo'],
    'institutional': ['policy', 'academia', 'research', 'government']
}

RHETORIC_STYLE_VALUES = {
    'direct': ['blunt', 'straightforward', 'concise'],
    'storytelling': ['narrative', 'anecdote', 'personal', 'relatable'],
    'socratic': ['questioning', 'dialogue', 'philosophical', 'teaching'],
    'inspirational': ['motivational', 'uplifting', 'visionary']
}


def infer_technology_adoption(profile):
    """Infer technology adoption level based on profile data."""
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    birth_year = profile.get('birth_year', 1950)
    
    # Tech-related domains are early adopters
    if any(term in domain or term in archetype for term in ['tech', 'digital', 'software', 'entrepreneur', 'innovation']):
        return 'early adopter'
    
    # Born after 1980 - likely early adopter
    if birth_year and birth_year >= 1980:
        return 'early adopter'
    
    # Business/modern professionals - pragmatic
    if any(term in domain or term in archetype for term in ['business', 'entrepreneur', 'strategy', 'modern']):
        return 'pragmatic'
    
    # Traditional/classical - skeptical
    if any(term in domain or term in archetype for term in ['philosophy', 'classical', 'historical', 'traditional']):
        return 'skeptical'
    
    # Default to pragmatic
    return 'pragmatic'


def infer_digital_fluency(profile):
    """Infer digital fluency based on birth year and domain."""
    birth_year = profile.get('birth_year', 1950)
    domain = profile.get('domain', '').lower()
    
    if birth_year:
        if birth_year >= 1980:
            return 'native'
        elif birth_year >= 1960:
            return 'proficient'
        elif birth_year >= 1940:
            return 'basic'
        else:
            return 'analog-preferring'
    
    # Fallback to domain
    if 'tech' in domain or 'digital' in domain:
        return 'native'
    
    return 'proficient'


def infer_ai_perspective(profile):
    """Infer AI perspective based on domain and traits."""
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    
    if 'tech' in domain or 'ai' in domain or 'computer' in domain:
        return 'enthusiast'
    
    if any(term in domain or term in archetype for term in ['ethics', 'philosophy', 'psychology', 'social']):
        return 'concerned'
    
    return 'cautious optimist'


def infer_stress_response(profile):
    """Infer stress response pattern from traits."""
    traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join(traits).lower() if isinstance(traits, list) else str(traits).lower()
    
    if any(term in traits_str for term in ['calm', 'zen', 'mindful', 'philosophical', 'systematic']):
        return 'calm under pressure'
    
    if any(term in traits_str for term in ['competitive', 'driven', 'ambitious', 'perfectionist', 'demanding']):
        return 'energized by challenge'
    
    return 'maintains quality'


def infer_failure_recovery(profile):
    """Infer failure recovery approach."""
    traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join(traits).lower() if isinstance(traits, list) else str(traits).lower()
    
    if any(term in traits_str for term in ['resilient', 'adaptive', 'growth', 'learning']):
        return 'bounce back stronger'
    
    if any(term in traits_str for term in ['analytical', 'systematic', 'thoughtful', 'deliberate']):
        return 'learn and adapt'
    
    return 'learn and adapt'


def infer_persuasion_approach(profile):
    """Infer persuasion approach from communication style."""
    comm_style = profile.get('communication_style', {})
    tone = comm_style.get('tone', '')
    tone_str = str(tone).lower()
    
    if any(term in tone_str for term in ['analytical', 'rational', 'systematic', 'research']):
        return 'logical argument'
    
    if any(term in tone_str for term in ['passionate', 'charismatic', 'inspirational', 'visionary', 'emotional']):
        return 'emotional appeal'
    
    return 'logical argument'


def infer_influence_scope(profile):
    """Infer influence scope from domain and archetype."""
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    occupation = profile.get('occupation', '').lower()
    
    if any(term in occupation or term in archetype for term in ['author', 'speaker', 'ceo', 'entertainer', 'artist']):
        return 'mass audience'
    
    if any(term in domain or term in archetype for term in ['academic', 'research', 'policy', 'government']):
        return 'institutional'
    
    if any(term in occupation for term in ['coach', 'consultant', 'therapist']):
        return 'one-to-one'
    
    return 'mass audience'


def infer_rhetoric_style(profile):
    """Infer rhetoric style from communication patterns."""
    comm_style = profile.get('communication_style', {})
    tone = str(comm_style.get('tone', '')).lower()
    sentence_structure = str(comm_style.get('sentence_structure', '')).lower()
    
    if any(term in tone or term in sentence_structure for term in ['story', 'narrative', 'anecdote', 'personal']):
        return 'storytelling'
    
    if any(term in tone or term in sentence_structure for term in ['question', 'socratic', 'philosophical', 'dialogue']):
        return 'socratic'
    
    if any(term in tone or term in sentence_structure for term in ['inspirational', 'motivational', 'visionary', 'uplifting']):
        return 'inspirational'
    
    if any(term in tone or term in sentence_structure for term in ['direct', 'blunt', 'concise', 'straightforward']):
        return 'direct'
    
    return 'storytelling'


def populate_tier1_categories(profile):
    """Add Tier 1 categories to a profile."""
    
    # Technology Relationship
    profile['technology_relationship'] = {
        'technology_adoption': infer_technology_adoption(profile),
        'digital_fluency': infer_digital_fluency(profile),
        'ai_perspective': infer_ai_perspective(profile),
        'platform_preference': 'varies by domain',  # Generic - would need more specific data
        'tech_integration': 'strategic use'  # Generic default
    }
    
    # Crisis Response
    profile['crisis_response'] = {
        'stress_response_pattern': infer_stress_response(profile),
        'failure_recovery': infer_failure_recovery(profile),
        'uncertainty_tolerance': 'manages discomfort',  # Conservative default
        'pressure_performance': 'maintains quality',  # Conservative default
        'crisis_leadership': 'provides calm guidance'  # Conservative default
    }
    
    # Influence Style
    profile['influence_style'] = {
        'persuasion_approach': infer_persuasion_approach(profile),
        'influence_scope': infer_influence_scope(profile),
        'rhetoric_style': infer_rhetoric_style(profile),
        'credibility_source': 'expertise',  # Common default
        'change_mechanism': 'incremental progress'  # Conservative default
    }
    
    return profile


def main():
    """Process all profiles and add Tier 1 categories."""
    profiles_dir = Path('profiles')
    
    if not profiles_dir.exists():
        print("❌ Profiles directory not found!")
        return
    
    profiles = list(profiles_dir.glob('*.json'))
    print(f"📊 Found {len(profiles)} profiles to process")
    
    updated_count = 0
    skipped_count = 0
    
    for profile_path in profiles:
        try:
            with open(profile_path, 'r', encoding='utf-8') as f:
                profile = json.load(f)
            
            # Skip if already has Tier 1 categories
            if 'technology_relationship' in profile:
                skipped_count += 1
                continue
            
            # Add Tier 1 categories
            profile = populate_tier1_categories(profile)
            
            # Write back
            with open(profile_path, 'w', encoding='utf-8') as f:
                json.dump(profile, f, indent=2, ensure_ascii=False)
            
            updated_count += 1
            
            if updated_count % 50 == 0:
                print(f"  ✓ Processed {updated_count} profiles...")
        
        except Exception as e:
            print(f"❌ Error processing {profile_path.name}: {e}")
    
    print(f"\n✅ Complete!")
    print(f"  - Updated: {updated_count} profiles")
    print(f"  - Skipped: {skipped_count} profiles (already have Tier 1 data)")
    print(f"  - Total: {len(profiles)} profiles")


if __name__ == '__main__':
    main()

