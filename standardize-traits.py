#!/usr/bin/env python3
"""
Standardize and canonicalize primary traits across all profiles.

Phase 1: Lowercase all traits
Phase 2: Apply canonicalization mapping
Phase 3: Remove duplicates and maintain order
"""

import os
import json
from collections import Counter

# Canonicalization mapping: variant -> canonical form
TRAIT_CANONICALIZATION = {
    # Research orientation
    'research-focused': 'research-oriented',
    'research-driven': 'research-oriented',
    'research-backed': 'research-oriented',
    
    # Results orientation
    'results-driven': 'results-oriented',
    'results-focused': 'results-oriented',
    
    # Growth orientation
    'growth-focused': 'growth-oriented',
    'growth-minded': 'growth-oriented',
    
    # Data-driven
    'data-focused': 'data-driven',
    
    # Emotional intelligence
    'emotionally intelligent': 'emotionally-intelligent',
    
    # Scientific rigor
    'scientifically rigorous': 'scientifically-rigorous',
    'scientifically-minded': 'scientifically-rigorous',
    
    # Social consciousness
    'socially conscious': 'socially-conscious',
    'socially aware': 'socially-conscious',
    
    # Transformation
    'transformation-focused': 'transformational',
    
    # Performance orientation
    'performance-focused': 'performance-oriented',
    
    # Leadership orientation
    'leadership-focused': 'leadership-oriented',
    
    # Observational styles
    'observational': 'observant',
    
    # Methodological
    'methodological': 'methodical',
    
    # Empowerment
    'empowering': 'empowering',  # Keep as is
    
    # Inspirational
    'inspirational': 'inspiring',
    
    # Developmental
    'developmental': 'developmental',  # Keep as is
    
    # Evidence-based
    'evidence-driven': 'evidence-based',
    
    # Intellectually curious
    'intellectually curious': 'intellectually-curious',
    'intellectually rigorous': 'intellectually-rigorous',
    'intellectually sharp': 'intellectually-rigorous',
    
    # Emotionally driven
    'emotionally driven': 'emotionally-driven',
    
    # Artistically expressive
    'artistically expressive': 'artistically-expressive',
}

def standardize_and_canonicalize_traits():
    """Standardize and canonicalize traits across all profiles"""
    
    profiles_dir = 'profiles'
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    
    total_changes = 0
    profiles_updated = 0
    trait_changes = Counter()
    
    print(f"Standardizing traits across {len(profile_files)} profiles...\n")
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
            
            # Get primary_traits
            primary_traits = profile_data.get('psychological_profile', {}).get('primary_traits', '')
            
            if not primary_traits:
                continue
            
            # Handle both string and array formats
            if isinstance(primary_traits, list):
                traits = primary_traits
            else:
                traits = [t.strip() for t in str(primary_traits).split(',')]
            
            # Process each trait
            new_traits = []
            changed = False
            
            for trait in traits:
                if not trait or len(trait) == 0:
                    continue
                
                original_trait = trait
                
                # Step 1: Lowercase
                trait = trait.lower()
                
                # Step 2: Apply canonicalization
                if trait in TRAIT_CANONICALIZATION:
                    canonical_trait = TRAIT_CANONICALIZATION[trait]
                    if canonical_trait != trait:
                        trait_changes[f"{original_trait} → {canonical_trait}"] += 1
                        changed = True
                    trait = canonical_trait
                elif original_trait != trait:
                    # Just capitalization change
                    trait_changes[f"{original_trait} → {trait}"] += 1
                    changed = True
                
                # Add to new traits (will dedupe later)
                new_traits.append(trait)
            
            # Step 3: Remove duplicates while preserving order
            seen = set()
            unique_traits = []
            for trait in new_traits:
                if trait not in seen:
                    seen.add(trait)
                    unique_traits.append(trait)
            
            # Update profile if changed
            if changed or len(unique_traits) != len(traits) or unique_traits != traits:
                # Convert back to comma-separated string
                profile_data['psychological_profile']['primary_traits'] = ', '.join(unique_traits)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(profile_data, f, indent=2, ensure_ascii=False)
                
                profiles_updated += 1
                total_changes += len([t for t in new_traits if t != original_trait])
        
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")
    
    print(f"\n{'='*80}")
    print(f"STANDARDIZATION COMPLETE")
    print(f"{'='*80}\n")
    print(f"Profiles updated: {profiles_updated}/{len(profile_files)}")
    print(f"Total trait changes: {total_changes}")
    
    if trait_changes:
        print(f"\n{'='*80}")
        print(f"TOP 20 TRAIT CHANGES")
        print(f"{'='*80}\n")
        
        for change, count in trait_changes.most_common(20):
            print(f"{change:<60} {count:>4} times")
    
    # Generate post-standardization analysis
    analyze_traits_after_standardization()

def analyze_traits_after_standardization():
    """Analyze trait distribution after standardization"""
    
    profiles_dir = 'profiles'
    all_traits = []
    
    for filename in os.listdir(profiles_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(profiles_dir, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    profile = json.load(f)
                
                primary_traits = profile.get('psychological_profile', {}).get('primary_traits', '')
                
                if primary_traits:
                    if isinstance(primary_traits, list):
                        traits = primary_traits
                    else:
                        traits = [t.strip() for t in str(primary_traits).split(',')]
                    
                    all_traits.extend([t for t in traits if t and len(t) > 0])
            except Exception as e:
                pass
    
    trait_counts = Counter(all_traits)
    
    print(f"\n{'='*80}")
    print(f"POST-STANDARDIZATION ANALYSIS")
    print(f"{'='*80}\n")
    
    print(f"Total unique traits: {len(trait_counts)} (was 371)")
    print(f"Total trait instances: {sum(trait_counts.values())} (was 1,434)")
    print(f"Average traits per profile: {sum(trait_counts.values()) / 265:.1f} (was 5.4)")
    
    # Count traits by usage frequency
    single_use = len([t for t, c in trait_counts.items() if c == 1])
    low_use = len([t for t, c in trait_counts.items() if 2 <= c <= 5])
    medium_use = len([t for t, c in trait_counts.items() if 6 <= c <= 20])
    high_use = len([t for t, c in trait_counts.items() if c > 20])
    
    print(f"\nTrait Distribution:")
    print(f"  High-use traits (20+ profiles): {high_use}")
    print(f"  Medium-use traits (6-20 profiles): {medium_use}")
    print(f"  Low-use traits (2-5 profiles): {low_use}")
    print(f"  Single-use traits (1 profile): {single_use}")
    
    print(f"\n{'='*80}")
    print(f"TOP 30 TRAITS AFTER STANDARDIZATION")
    print(f"{'='*80}\n")
    
    for i, (trait, count) in enumerate(trait_counts.most_common(30), 1):
        percentage = (count / 265) * 100
        print(f"{i:>2}. {trait:<45} {count:>4} profiles ({percentage:>5.1f}%)")
    
    # Save detailed analysis
    analysis_data = {
        'total_unique_traits': len(trait_counts),
        'total_instances': sum(trait_counts.values()),
        'average_per_profile': sum(trait_counts.values()) / 265,
        'distribution': {
            'high_use': high_use,
            'medium_use': medium_use,
            'low_use': low_use,
            'single_use': single_use
        },
        'top_50_traits': [
            {'trait': trait, 'count': count, 'percentage': round((count / 265) * 100, 1)}
            for trait, count in trait_counts.most_common(50)
        ],
        'all_traits': dict(trait_counts)
    }
    
    with open('trait-standardization-analysis.json', 'w', encoding='utf-8') as f:
        json.dump(analysis_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Detailed analysis saved to: trait-standardization-analysis.json")

if __name__ == '__main__':
    standardize_and_canonicalize_traits()
