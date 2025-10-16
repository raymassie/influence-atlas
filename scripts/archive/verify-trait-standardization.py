#!/usr/bin/env python3
"""
Verify and fix trait standardization across all profiles.
Ensures all traits follow lowercase convention.
"""

import json
from pathlib import Path
from collections import defaultdict

def standardize_trait(trait):
    """Standardize a single trait to lowercase."""
    if isinstance(trait, str):
        return trait.strip().lower()
    return trait

def standardize_trait_list(traits):
    """Standardize a list of traits."""
    if traits is None:
        return None
    if isinstance(traits, str):
        return traits.strip().lower()
    if isinstance(traits, list):
        return [standardize_trait(t) for t in traits if t]
    return traits

def get_all_trait_fields():
    """Get all fields that contain traits."""
    return [
        'psychological_profile.primary_traits',
        'psychological_profile.core_motivations',
        'psychological_profile.behavioral_patterns',
        'psychological_profile.stress_responses',
        'psychological_profile.blind_spots',
        'communication_style.tone',
        'communication_style.vocabulary_patterns',
        'domain_expertise.core_competencies',
        'behavioral_patterns.work_style',
        'behavioral_patterns.problem_solving_approach',
        'behavioral_patterns.decision_making',
        'behavioral_patterns.learning_preferences',
        'collaboration.leadership_style',
        'collaboration.team_dynamics',
        'collaboration.mentorship_approach',
        'collaboration.conflict_resolution',
        'values.core_values',
        'values.ethical_standards',
        'bias_awareness.primary_biases',
        'bias_awareness.bias_mitigation_strategies',
        'growth_motivation.intrinsic_drivers',
        'growth_motivation.curiosity_indicators',
        'cognitive_humanism.empathy_expression',
        'cognitive_humanism.ethical_framework',
        'humanistic_cognition.creative_problem_solving',
        'humanistic_cognition.holistic_perspective',
        'humanistic_cognition.collaborative_intelligence',
        'self_actualization_indicators.peak_experiences',
        'self_actualization_indicators.autonomy_expression',
        'self_actualization_indicators.purpose_alignment',
        'behavioral_growth.adaptation_patterns',
        'behavioral_growth.feedback_integration',
        'behavioral_growth.resilience_indicators',
        'learning.learning_style',
        'learning.knowledge_sharing',
        'learning.adaptation_speed',
        'learning.failure_response',
        'domain_expertise.primary_expertise',
        'domain_expertise.knowledge_depth',
        'domain_expertise.innovation_approach',
        'communication.medium_preferences',
        'communication.message_framing',
        'values.priority_framework'
    ]

def get_nested_value(obj, path):
    """Get nested value using dot notation."""
    keys = path.split('.')
    value = obj
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value

def set_nested_value(obj, path, value):
    """Set nested value using dot notation."""
    keys = path.split('.')
    for key in keys[:-1]:
        if key not in obj:
            obj[key] = {}
        obj = obj[key]
    obj[keys[-1]] = value

def verify_and_fix_profile(profile):
    """Verify and fix trait standardization in a profile."""
    changes = []
    non_standard_traits = []
    
    trait_fields = get_all_trait_fields()
    
    for field in trait_fields:
        value = get_nested_value(profile, field)
        
        if value is None:
            continue
        
        # Check if standardization is needed
        needs_fix = False
        
        if isinstance(value, str):
            if value != value.lower():
                needs_fix = True
                non_standard_traits.append((field, value))
        elif isinstance(value, list):
            for trait in value:
                if isinstance(trait, str) and trait != trait.lower():
                    needs_fix = True
                    non_standard_traits.append((field, trait))
        
        # Apply standardization if needed
        if needs_fix:
            standardized = standardize_trait_list(value)
            set_nested_value(profile, field, standardized)
            changes.append(field)
    
    return changes, non_standard_traits

def main():
    """Main function."""
    profiles_dir = Path(__file__).parent / 'profiles'
    
    print("🔍 Verifying trait standardization...\n")
    
    total_profiles = 0
    profiles_with_issues = 0
    profiles_fixed = 0
    all_non_standard = []
    field_changes = defaultdict(int)
    
    for profile_file in sorted(profiles_dir.glob('*.json')):
        try:
            with open(profile_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
            
            total_profiles += 1
            changes, non_standard = verify_and_fix_profile(profile)
            
            if non_standard:
                profiles_with_issues += 1
                all_non_standard.extend(non_standard)
            
            if changes:
                profiles_fixed += 1
                for change in changes:
                    field_changes[change] += 1
                
                # Save fixed profile
                with open(profile_file, 'w', encoding='utf-8') as f:
                    json.dump(profile, f, indent=2, ensure_ascii=False)
                
                print(f"✅ Fixed: {profile.get('name', profile_file.stem):40} | {len(changes)} fields")
        
        except Exception as e:
            print(f"❌ Error: {profile_file.name}: {e}")
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 VERIFICATION SUMMARY")
    print(f"{'='*80}\n")
    print(f"Total profiles checked: {total_profiles}")
    print(f"Profiles with non-standard traits: {profiles_with_issues}")
    print(f"Profiles fixed: {profiles_fixed}")
    print(f"Total non-standard trait instances: {len(all_non_standard)}")
    
    if field_changes:
        print(f"\n📝 Fields standardized:")
        for field, count in sorted(field_changes.items(), key=lambda x: -x[1])[:15]:
            field_name = field.split('.')[-1].replace('_', ' ').title()
            print(f"  • {field_name:40} {count:3} profiles")
    
    # Show sample of non-standard traits (unique)
    if all_non_standard:
        print(f"\n🔍 Sample non-standard traits found:")
        unique_samples = {}
        for field, trait in all_non_standard[:50]:
            if trait not in unique_samples:
                unique_samples[trait] = trait.lower()
        
        for original, standardized in list(unique_samples.items())[:15]:
            print(f"  '{original}' → '{standardized}'")
    
    if profiles_fixed == 0:
        print(f"\n✅ All traits are already standardized!")
    else:
        print(f"\n✅ Trait standardization complete!")
        print(f"   All traits now follow lowercase convention.")

if __name__ == '__main__':
    main()

