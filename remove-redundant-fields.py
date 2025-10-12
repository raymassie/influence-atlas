#!/usr/bin/env python3
"""
Remove redundant fields from all profile JSON files based on the cleaned outline analysis.
"""

import os
import json

def remove_redundant_fields():
    """Remove redundant fields from all profiles"""
    
    # Fields to remove (redundant versions)
    redundant_fields = [
        # Communication Style
        'communication_style.tone_parsed',
        'communication_style.sentence_structure_parsed',
        
        # Values
        'values.core_values_parsed',
        
        # Bias Awareness
        'bias_awareness.primary_biases_chips',
        'bias_awareness.bias_mitigation_strategies_chips',
        'bias_awareness.decision_making_style_chips',
        
        # Growth Motivation
        'growth_motivation.learning_orientation_chips',
        'growth_motivation.intrinsic_drivers_chips',
        'growth_motivation.challenge_seeking_chips',
        
        # Cognitive Humanism
        'cognitive_humanism.human_centered_thinking_chips',
        'cognitive_humanism.empathy_expression_chips',
        'cognitive_humanism.ethical_framework_chips',
        
        # Behavioral Patterns
        'behavioral_patterns.work_style_parsed',
        'behavioral_patterns.problem_solving_approach_parsed',
        
        # Temporal Context
        'temporal_context.career_evolution_parsed',
        'temporal_context.influence_timeline_parsed',
        'temporal_context.legacy_impact_parsed',
        
        # Collaboration
        'collaboration.leadership_style_parsed',
        'collaboration.team_dynamics_parsed',
        'collaboration.mentorship_approach_parsed',
        
        # Communication
        'communication.audience_adaptation_parsed',
        
        # Cultural Context
        'cultural_context.cultural_background_parsed',
        
        # Practical Application
        'practical_application.decision_speed_parsed',
        
        # Learning
        'learning.learning_style_parsed',
        
        # Self Actualization
        'self_actualization_indicators.peak_experiences_chips',
        'self_actualization_indicators.autonomy_expression_chips',
        'self_actualization_indicators.purpose_alignment_chips',
        
        # Behavioral Growth
        'behavioral_growth.adaptation_patterns_chips',
        'behavioral_growth.resilience_indicators_chips',
        'behavioral_growth.feedback_integration_chips',
        
        # Human Needs Hierarchy
        'human_needs_hierarchy.belonging_expression_chips',
        'human_needs_hierarchy.esteem_sources_chips',
        
        # Humanistic Cognition
        'humanistic_cognition.creative_problem_solving_chips',
        'humanistic_cognition.holistic_perspective_chips',
        'humanistic_cognition.collaborative_intelligence_chips',
        
        # Trait Constellations (all of them)
        'trait_constellations.constellations',
        'trait_constellations.constellation_details.analytical_thinking.name',
        'trait_constellations.constellation_details.analytical_thinking.traits',
        'trait_constellations.constellation_details.collaboration_mode.name',
        'trait_constellations.constellation_details.collaboration_mode.traits',
        'trait_constellations.constellation_details.communication_style.name',
        'trait_constellations.constellation_details.communication_style.traits',
        'trait_constellations.constellation_details.creative_expression.name',
        'trait_constellations.constellation_details.creative_expression.traits',
        'trait_constellations.constellation_details.emotional_intelligence.name',
        'trait_constellations.constellation_details.emotional_intelligence.traits',
        'trait_constellations.constellation_details.growth_learning.name',
        'trait_constellations.constellation_details.growth_learning.traits',
        'trait_constellations.constellation_details.impact_legacy.name',
        'trait_constellations.constellation_details.impact_legacy.traits',
        'trait_constellations.constellation_details.innovation_drive.name',
        'trait_constellations.constellation_details.innovation_drive.traits',
        'trait_constellations.constellation_details.intellectual_depth.name',
        'trait_constellations.constellation_details.intellectual_depth.traits',
        'trait_constellations.constellation_details.leadership_approach.name',
        'trait_constellations.constellation_details.leadership_approach.traits',
        'trait_constellations.constellation_details.practical_execution.name',
        'trait_constellations.constellation_details.practical_execution.traits',
        'trait_constellations.constellation_details.values_ethics.name',
        'trait_constellations.constellation_details.values_ethics.traits',
    ]
    
    profiles_dir = 'profiles'
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    
    print(f"Removing redundant fields from {len(profile_files)} profiles...")
    
    total_removed = 0
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
            
            removed_count = remove_fields_from_profile(profile_data, redundant_fields)
            total_removed += removed_count
            
            if removed_count > 0:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(profile_data, f, indent=2, ensure_ascii=False)
                print(f"✅ {filename}: removed {removed_count} redundant fields")
            
        except Exception as e:
            print(f"❌ Error processing {filename}: {e}")
    
    print(f"\n🎉 Total redundant fields removed: {total_removed}")
    print(f"📁 Processed {len(profile_files)} profile files")

def remove_fields_from_profile(profile_data, redundant_fields):
    """Remove redundant fields from a single profile"""
    
    removed_count = 0
    
    def remove_nested_field(data, field_path):
        """Remove a nested field using dot notation"""
        if '.' not in field_path:
            if field_path in data:
                del data[field_path]
                return 1
            return 0
        
        parts = field_path.split('.')
        current = data
        
        for part in parts[:-1]:
            if isinstance(current, dict) and part in current:
                current = current[part]
            else:
                return 0
        
        final_key = parts[-1]
        if isinstance(current, dict) and final_key in current:
            del current[final_key]
            return 1
        
        return 0
    
    # Remove each redundant field
    for field_path in redundant_fields:
        removed_count += remove_nested_field(profile_data, field_path)
    
    return removed_count

if __name__ == '__main__':
    remove_redundant_fields()
