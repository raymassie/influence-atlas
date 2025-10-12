#!/usr/bin/env python3
"""
Analyze current gaps in profile data to identify what needs to be filled.
Focus on specific, valuable traits rather than broad categories.
"""

import os
import json
from collections import defaultdict

def analyze_profile_gaps():
    profiles_dir = 'profiles'
    gaps_analysis = {
        'total_profiles': 0,
        'category_gaps': defaultdict(int),
        'field_gaps': defaultdict(int),
        'n_a_count': 0,
        'empty_count': 0,
        'examples': defaultdict(list)
    }
    
    # Categories to focus on for enrichment
    focus_categories = [
        'communication_style',
        'behavioral_patterns', 
        'cognitive_patterns',
        'values_ethics',
        'growth_motivation',
        'collaboration',
        'background_context',
        'domain_expertise'
    ]
    
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    print(f"Analyzing {len(profile_files)} profiles...")
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
                
            profile_name = profile_data.get('name', filename)
            gaps_analysis['total_profiles'] += 1
            
            # Analyze each focus category
            for category in focus_categories:
                if category in profile_data:
                    category_data = profile_data[category]
                    if isinstance(category_data, dict):
                        analyze_category_gaps(category_data, category, profile_name, gaps_analysis)
                else:
                    gaps_analysis['category_gaps'][category] += 1
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    return gaps_analysis

def analyze_category_gaps(category_data, category_name, profile_name, gaps_analysis):
    """Analyze gaps within a specific category"""
    
    for field_name, field_value in category_data.items():
        if field_value is None or field_value == '':
            gaps_analysis['empty_count'] += 1
            gaps_analysis['field_gaps'][f"{category_name}.{field_name}"] += 1
            gaps_analysis['examples'][f"{category_name}.{field_name}"].append(profile_name)
        elif field_value == "N/A" or field_value == "n/a":
            gaps_analysis['n_a_count'] += 1
            gaps_analysis['field_gaps'][f"{category_name}.{field_name}"] += 1
            gaps_analysis['examples'][f"{category_name}.{field_name}"].append(profile_name)
        elif isinstance(field_value, str) and len(field_value.strip()) < 3:
            gaps_analysis['empty_count'] += 1
            gaps_analysis['field_gaps'][f"{category_name}.{field_name}"] += 1

def print_gap_report(gaps_analysis):
    """Print a detailed gap analysis report"""
    
    print("\n" + "="*60)
    print("PROFILE GAP ANALYSIS REPORT")
    print("="*60)
    
    print(f"\nTotal Profiles Analyzed: {gaps_analysis['total_profiles']}")
    print(f"Total N/A entries: {gaps_analysis['n_a_count']}")
    print(f"Total empty entries: {gaps_analysis['empty_count']}")
    print(f"Total gaps: {gaps_analysis['n_a_count'] + gaps_analysis['empty_count']}")
    
    print(f"\n{'='*60}")
    print("TOP 20 MISSING FIELDS (by frequency)")
    print("="*60)
    
    # Sort fields by frequency
    sorted_fields = sorted(gaps_analysis['field_gaps'].items(), 
                          key=lambda x: x[1], reverse=True)
    
    for i, (field, count) in enumerate(sorted_fields[:20], 1):
        percentage = (count / gaps_analysis['total_profiles']) * 100
        print(f"{i:2d}. {field:<40} {count:3d} profiles ({percentage:5.1f}%)")
    
    print(f"\n{'='*60}")
    print("CATEGORY GAPS")
    print("="*60)
    
    sorted_categories = sorted(gaps_analysis['category_gaps'].items(),
                              key=lambda x: x[1], reverse=True)
    
    for category, count in sorted_categories:
        percentage = (count / gaps_analysis['total_profiles']) * 100
        print(f"{category:<25} {count:3d} profiles ({percentage:5.1f}%)")
    
    print(f"\n{'='*60}")
    print("EXAMPLES OF MISSING DATA")
    print("="*60)
    
    # Show examples for top missing fields
    for field, count in sorted_fields[:10]:
        examples = gaps_analysis['examples'].get(field, [])[:5]
        if examples:
            print(f"\n{field} (missing in {count} profiles):")
            for example in examples:
                print(f"  - {example}")
    
    print(f"\n{'='*60}")
    print("ENRICHMENT PRIORITIES")
    print("="*60)
    
    # Identify highest-impact enrichment opportunities
    high_impact_fields = [
        field for field, count in sorted_fields[:15] 
        if count > gaps_analysis['total_profiles'] * 0.3  # Missing in >30% of profiles
    ]
    
    print("Fields missing in >30% of profiles (high enrichment impact):")
    for field in high_impact_fields:
        count = gaps_analysis['field_gaps'][field]
        percentage = (count / gaps_analysis['total_profiles']) * 100
        print(f"  - {field} ({percentage:.1f}% missing)")

if __name__ == '__main__':
    gaps_analysis = analyze_profile_gaps()
    print_gap_report(gaps_analysis)
    
    # Save detailed results
    with open('profile-gap-analysis.json', 'w', encoding='utf-8') as f:
        json.dump(gaps_analysis, f, indent=2, ensure_ascii=False)
    
    print(f"\nDetailed analysis saved to: profile-gap-analysis.json")
