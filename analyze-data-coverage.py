#!/usr/bin/env python3
"""
Analyze data coverage across all profiles to identify gaps.
"""

import json
import os
from collections import defaultdict
from pathlib import Path

def get_nested_value(obj, path):
    """Get nested value from object using dot notation."""
    keys = path.split('.')
    value = obj
    for key in keys:
        if isinstance(value, dict) and key in value:
            value = value[key]
        else:
            return None
    return value

def is_empty_value(value):
    """Check if a value is considered empty."""
    if value is None:
        return True
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return True
        # Check for placeholder/generic text
        placeholders = [
            'n/a', 'not available', 'unknown', 'tbd', 'to be determined',
            'placeholder', 'generic', 'fundamental principles that guide decisions',
            'basic values', 'core beliefs', 'standard approach'
        ]
        if value.lower() in placeholders:
            return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False

def analyze_coverage():
    """Analyze data coverage across all profiles."""
    profiles_dir = Path(__file__).parent / 'profiles'
    
    if not profiles_dir.exists():
        print(f"❌ Profiles directory not found: {profiles_dir}")
        return
    
    # Key fields to analyze (organized by category)
    field_groups = {
        'Behavioral Humanism': [
            'bias_awareness.decision_making_style',
            'bias_awareness.primary_biases',
            'bias_awareness.bias_mitigation_strategies',
            'growth_motivation.intrinsic_drivers',
            'growth_motivation.learning_orientation',
            'growth_motivation.curiosity_indicators',
            'cognitive_humanism.empathy_expression',
            'cognitive_humanism.ethical_framework',
            'cognitive_humanism.human_centered_thinking',
            'humanistic_cognition.creative_problem_solving',
            'humanistic_cognition.holistic_perspective',
            'humanistic_cognition.collaborative_intelligence',
            'human_needs_hierarchy.need_priorities',
            'human_needs_hierarchy.fulfillment_patterns',
            'human_needs_hierarchy.growth_trajectory',
            'self_actualization_indicators.peak_experiences',
            'self_actualization_indicators.autonomy_expression',
            'self_actualization_indicators.purpose_alignment',
            'behavioral_growth.adaptation_patterns',
            'behavioral_growth.feedback_integration',
            'behavioral_growth.resilience_indicators'
        ],
        'Core Profile': [
            'psychological_profile.primary_traits',
            'psychological_profile.core_motivations',
            'psychological_profile.behavioral_patterns',
            'psychological_profile.decision_making_framework',
            'psychological_profile.stress_responses',
            'psychological_profile.blind_spots'
        ],
        'Communication': [
            'communication_style.tone',
            'communication_style.sentence_structure',
            'communication_style.vocabulary_patterns',
            'communication.audience_adaptation',
            'communication.medium_preferences',
            'communication.message_framing'
        ],
        'Collaboration': [
            'collaboration.leadership_style',
            'collaboration.team_dynamics',
            'collaboration.mentorship_approach',
            'collaboration.conflict_resolution'
        ],
        'Domain Expertise': [
            'domain_expertise.primary_expertise',
            'domain_expertise.core_competencies',
            'domain_expertise.knowledge_depth',
            'domain_expertise.innovation_approach'
        ],
        'Behavioral Patterns': [
            'behavioral_patterns.work_style',
            'behavioral_patterns.problem_solving_approach',
            'behavioral_patterns.decision_making',
            'behavioral_patterns.learning_preferences'
        ],
        'Learning': [
            'learning.learning_style',
            'learning.knowledge_sharing',
            'learning.adaptation_speed',
            'learning.failure_response'
        ],
        'Values': [
            'values.core_values',
            'values.ethical_standards',
            'values.priority_framework'
        ]
    }
    
    # Load all profiles
    profiles = []
    for profile_file in profiles_dir.glob('*.json'):
        try:
            with open(profile_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
                profiles.append(profile)
        except Exception as e:
            print(f"⚠️  Error loading {profile_file.name}: {e}")
    
    print(f"📊 Analyzing {len(profiles)} profiles...\n")
    
    # Analyze each field group
    for group_name, fields in field_groups.items():
        print(f"\n{'='*80}")
        print(f"📁 {group_name}")
        print(f"{'='*80}\n")
        
        for field in fields:
            populated_count = 0
            empty_count = 0
            
            for profile in profiles:
                value = get_nested_value(profile, field)
                if is_empty_value(value):
                    empty_count += 1
                else:
                    populated_count += 1
            
            total = len(profiles)
            coverage_pct = (populated_count / total * 100) if total > 0 else 0
            
            # Determine priority based on coverage
            if coverage_pct >= 80:
                status = "✅ Good"
                priority = "Low"
            elif coverage_pct >= 50:
                status = "⚠️  Medium"
                priority = "Medium"
            else:
                status = "❌ Poor"
                priority = "High"
            
            field_display = field.split('.')[-1].replace('_', ' ').title()
            print(f"{status} {field_display:40} | {populated_count:3}/{total:3} ({coverage_pct:5.1f}%) | Priority: {priority}")
    
    # Summary
    print(f"\n{'='*80}")
    print("📈 SUMMARY")
    print(f"{'='*80}\n")
    
    all_fields = []
    for fields in field_groups.values():
        all_fields.extend(fields)
    
    overall_stats = {
        'excellent': 0,  # >= 90%
        'good': 0,       # >= 70%
        'medium': 0,     # >= 50%
        'poor': 0,       # < 50%
        'critical': 0    # < 20%
    }
    
    high_priority_fields = []
    
    for field in all_fields:
        populated_count = 0
        for profile in profiles:
            value = get_nested_value(profile, field)
            if not is_empty_value(value):
                populated_count += 1
        
        coverage_pct = (populated_count / len(profiles) * 100)
        
        if coverage_pct >= 90:
            overall_stats['excellent'] += 1
        elif coverage_pct >= 70:
            overall_stats['good'] += 1
        elif coverage_pct >= 50:
            overall_stats['medium'] += 1
        elif coverage_pct >= 20:
            overall_stats['poor'] += 1
        else:
            overall_stats['critical'] += 1
        
        if coverage_pct < 50:
            high_priority_fields.append((field, coverage_pct, populated_count))
    
    print(f"✅ Excellent Coverage (≥90%): {overall_stats['excellent']} fields")
    print(f"✅ Good Coverage (70-89%):    {overall_stats['good']} fields")
    print(f"⚠️  Medium Coverage (50-69%):  {overall_stats['medium']} fields")
    print(f"❌ Poor Coverage (20-49%):     {overall_stats['poor']} fields")
    print(f"🚨 Critical Coverage (<20%):   {overall_stats['critical']} fields")
    
    if high_priority_fields:
        print(f"\n{'='*80}")
        print("🎯 HIGH PRIORITY FIELDS TO FILL")
        print(f"{'='*80}\n")
        
        # Sort by coverage (lowest first)
        high_priority_fields.sort(key=lambda x: x[1])
        
        for field, coverage_pct, populated_count in high_priority_fields[:15]:
            field_display = field.replace('.', ' > ').replace('_', ' ').title()
            print(f"  • {field_display:60} {populated_count:3}/{len(profiles):3} ({coverage_pct:5.1f}%)")

if __name__ == '__main__':
    analyze_coverage()

