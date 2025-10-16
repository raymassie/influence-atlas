#!/usr/bin/env python3
"""
Advanced gap filling for remaining high-priority fields.
Uses pattern matching and logical inference from existing profile data.
"""

import json
from pathlib import Path
from collections import defaultdict

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

def is_empty(value):
    """Check if value is empty."""
    return value is None or (isinstance(value, (list, str)) and not value)

def infer_knowledge_depth(profile):
    """Infer knowledge depth from domain expertise and background."""
    domain = get_nested_value(profile, 'domain')
    experience_level = get_nested_value(profile, 'background_context.experience_level')
    core_competencies = get_nested_value(profile, 'domain_expertise.core_competencies')
    
    depth_indicators = []
    
    if experience_level:
        exp_text = ' '.join(experience_level) if isinstance(experience_level, list) else experience_level
        exp_lower = exp_text.lower()
        
        if 'pioneer' in exp_lower or 'founder' in exp_lower or 'creator' in exp_lower:
            depth_indicators.append('foundational expertise')
        if 'expert' in exp_lower or 'master' in exp_lower or 'leading' in exp_lower:
            depth_indicators.append('deep specialization')
        if 'decades' in exp_lower or 'extensive' in exp_lower:
            depth_indicators.append('extensive practical experience')
        if 'innovator' in exp_lower or 'thought leader' in exp_lower:
            depth_indicators.append('innovative contributions')
    
    if core_competencies:
        comp_list = core_competencies if isinstance(core_competencies, list) else [core_competencies]
        if len(comp_list) >= 5:
            depth_indicators.append('broad competency portfolio')
        elif len(comp_list) <= 3:
            depth_indicators.append('focused specialization')
    
    return depth_indicators if depth_indicators else ['domain expertise']

def infer_innovation_approach(profile):
    """Infer innovation approach from work style and problem solving."""
    work_style = get_nested_value(profile, 'behavioral_patterns.work_style')
    problem_solving = get_nested_value(profile, 'behavioral_patterns.problem_solving_approach')
    primary_traits = get_nested_value(profile, 'psychological_profile.primary_traits')
    
    approaches = []
    
    if work_style:
        style_text = ' '.join(work_style) if isinstance(work_style, list) else work_style
        style_lower = style_text.lower()
        
        if 'experimental' in style_lower or 'iterative' in style_lower:
            approaches.append('experimental iteration')
        if 'systematic' in style_lower or 'methodical' in style_lower:
            approaches.append('systematic innovation')
        if 'collaborative' in style_lower:
            approaches.append('collaborative ideation')
        if 'disruptive' in style_lower or 'unconventional' in style_lower:
            approaches.append('disruptive thinking')
    
    if problem_solving:
        ps_text = ' '.join(problem_solving) if isinstance(problem_solving, list) else problem_solving
        ps_lower = ps_text.lower()
        
        if 'first principles' in ps_lower:
            approaches.append('first principles innovation')
        if 'creative' in ps_lower or 'novel' in ps_lower:
            approaches.append('creative problem solving')
        if 'data-driven' in ps_lower or 'analytical' in ps_lower:
            approaches.append('data-informed innovation')
    
    if primary_traits:
        traits = primary_traits if isinstance(primary_traits, list) else [primary_traits]
        trait_text = ' '.join(traits).lower()
        
        if 'visionary' in trait_text:
            approaches.append('visionary foresight')
        if 'pragmatic' in trait_text:
            approaches.append('pragmatic implementation')
    
    return list(set(approaches))[:3] if approaches else ['incremental improvement']

def infer_priority_framework(profile):
    """Infer priority framework from values and decision making."""
    core_values = get_nested_value(profile, 'values.core_values')
    decision_making = get_nested_value(profile, 'bias_awareness.decision_making_style')
    core_motivations = get_nested_value(profile, 'psychological_profile.core_motivations')
    
    frameworks = []
    
    if core_values:
        values_text = ' '.join(core_values) if isinstance(core_values, list) else core_values
        values_lower = values_text.lower()
        
        if 'impact' in values_lower or 'results' in values_lower:
            frameworks.append('impact-first prioritization')
        if 'quality' in values_lower or 'excellence' in values_lower:
            frameworks.append('quality over quantity')
        if 'innovation' in values_lower:
            frameworks.append('innovation-driven decisions')
        if 'people' in values_lower or 'relationships' in values_lower:
            frameworks.append('relationship-centered priorities')
    
    if decision_making:
        dm_text = ' '.join(decision_making) if isinstance(decision_making, list) else decision_making
        dm_lower = dm_text.lower()
        
        if 'strategic' in dm_lower:
            frameworks.append('strategic alignment')
        if 'data' in dm_lower or 'analytical' in dm_lower:
            frameworks.append('evidence-based prioritization')
        if 'intuitive' in dm_lower:
            frameworks.append('intuition-guided choices')
    
    if core_motivations:
        mot_text = ' '.join(core_motivations) if isinstance(core_motivations, list) else core_motivations
        mot_lower = mot_text.lower()
        
        if 'legacy' in mot_lower or 'impact' in mot_lower:
            frameworks.append('long-term legacy focus')
        if 'growth' in mot_lower or 'learning' in mot_lower:
            frameworks.append('growth-oriented priorities')
    
    return list(set(frameworks))[:3] if frameworks else ['value-aligned decisions']

def infer_decision_making_field(profile):
    """Infer decision making style for behavioral_patterns."""
    dm_style = get_nested_value(profile, 'bias_awareness.decision_making_style')
    dm_framework = get_nested_value(profile, 'psychological_profile.decision_making_framework')
    
    if dm_style:
        return dm_style
    elif dm_framework:
        return dm_framework
    
    # Fallback inference
    primary_traits = get_nested_value(profile, 'psychological_profile.primary_traits')
    if primary_traits:
        traits = primary_traits if isinstance(primary_traits, list) else [primary_traits]
        trait_text = ' '.join(traits).lower()
        
        if 'analytical' in trait_text:
            return ['data-driven', 'systematic analysis']
        if 'intuitive' in trait_text:
            return ['intuition-based', 'pattern recognition']
        if 'strategic' in trait_text:
            return ['strategic thinking', 'long-term planning']
    
    return ['balanced decision-making']

def infer_learning_preferences(profile):
    """Infer learning preferences from learning style."""
    learning_style = get_nested_value(profile, 'learning.learning_style')
    
    if not learning_style:
        return ['experiential learning', 'continuous development']
    
    style_text = ' '.join(learning_style) if isinstance(learning_style, list) else learning_style
    style_lower = style_text.lower()
    
    preferences = []
    
    if 'hands-on' in style_lower or 'practical' in style_lower:
        preferences.append('hands-on practice')
    if 'reading' in style_lower or 'research' in style_lower:
        preferences.append('deep reading')
    if 'collaborative' in style_lower or 'discussion' in style_lower:
        preferences.append('peer discussion')
    if 'visual' in style_lower:
        preferences.append('visual learning')
    if 'experiment' in style_lower:
        preferences.append('experimental exploration')
    
    return preferences if preferences else ['varied learning methods']

def infer_knowledge_sharing(profile):
    """Infer knowledge sharing style."""
    communication_tone = get_nested_value(profile, 'communication_style.tone')
    mentorship = get_nested_value(profile, 'collaboration.mentorship_approach')
    
    sharing_styles = []
    
    if mentorship:
        ment_text = ' '.join(mentorship) if isinstance(mentorship, list) else mentorship
        ment_lower = ment_text.lower()
        
        if 'teaching' in ment_lower or 'educating' in ment_lower:
            sharing_styles.append('teaching and mentoring')
        if 'collaborative' in ment_lower:
            sharing_styles.append('collaborative learning')
        if 'example' in ment_lower or 'modeling' in ment_lower:
            sharing_styles.append('leading by example')
    
    if communication_tone:
        tone_text = ' '.join(communication_tone) if isinstance(communication_tone, list) else communication_tone
        tone_lower = tone_text.lower()
        
        if 'accessible' in tone_lower or 'clear' in tone_lower:
            sharing_styles.append('accessible explanations')
        if 'technical' in tone_lower or 'detailed' in tone_lower:
            sharing_styles.append('detailed documentation')
    
    return sharing_styles if sharing_styles else ['knowledge transfer']

def infer_adaptation_speed(profile):
    """Infer adaptation speed from behavioral patterns."""
    work_style = get_nested_value(profile, 'behavioral_patterns.work_style')
    adaptation_patterns = get_nested_value(profile, 'behavioral_growth.adaptation_patterns')
    
    if adaptation_patterns:
        return adaptation_patterns
    
    if work_style:
        style_text = ' '.join(work_style) if isinstance(work_style, list) else work_style
        style_lower = style_text.lower()
        
        if 'fast-paced' in style_lower or 'agile' in style_lower:
            return ['rapid adaptation', 'quick learning']
        if 'deliberate' in style_lower or 'measured' in style_lower:
            return ['thoughtful adaptation', 'careful integration']
        if 'flexible' in style_lower or 'adaptive' in style_lower:
            return ['flexible adjustment', 'situational adaptation']
    
    return ['steady adaptation']

def infer_failure_response(profile):
    """Infer failure response from psychological profile."""
    resilience = get_nested_value(profile, 'behavioral_growth.resilience_indicators')
    primary_traits = get_nested_value(profile, 'psychological_profile.primary_traits')
    
    if resilience:
        return resilience
    
    responses = []
    
    if primary_traits:
        traits = primary_traits if isinstance(primary_traits, list) else [primary_traits]
        trait_text = ' '.join(traits).lower()
        
        if 'resilient' in trait_text or 'persistent' in trait_text:
            responses.append('resilient recovery')
        if 'growth' in trait_text or 'learning' in trait_text:
            responses.append('learning from setbacks')
        if 'optimistic' in trait_text:
            responses.append('optimistic reframing')
        if 'analytical' in trait_text:
            responses.append('systematic analysis')
    
    return responses if responses else ['constructive response']

def fill_advanced_gaps(profile):
    """Fill advanced gaps in profile."""
    changes = []
    
    # Knowledge Depth
    if is_empty(get_nested_value(profile, 'domain_expertise.knowledge_depth')):
        depth = infer_knowledge_depth(profile)
        if depth:
            set_nested_value(profile, 'domain_expertise.knowledge_depth', depth)
            changes.append('domain_expertise.knowledge_depth')
    
    # Innovation Approach
    if is_empty(get_nested_value(profile, 'domain_expertise.innovation_approach')):
        approach = infer_innovation_approach(profile)
        if approach:
            set_nested_value(profile, 'domain_expertise.innovation_approach', approach)
            changes.append('domain_expertise.innovation_approach')
    
    # Priority Framework
    if is_empty(get_nested_value(profile, 'values.priority_framework')):
        framework = infer_priority_framework(profile)
        if framework:
            set_nested_value(profile, 'values.priority_framework', framework)
            changes.append('values.priority_framework')
    
    # Decision Making (behavioral_patterns)
    if is_empty(get_nested_value(profile, 'behavioral_patterns.decision_making')):
        dm = infer_decision_making_field(profile)
        if dm:
            set_nested_value(profile, 'behavioral_patterns.decision_making', dm)
            changes.append('behavioral_patterns.decision_making')
    
    # Learning Preferences
    if is_empty(get_nested_value(profile, 'behavioral_patterns.learning_preferences')):
        prefs = infer_learning_preferences(profile)
        if prefs:
            set_nested_value(profile, 'behavioral_patterns.learning_preferences', prefs)
            changes.append('behavioral_patterns.learning_preferences')
    
    # Knowledge Sharing
    if is_empty(get_nested_value(profile, 'learning.knowledge_sharing')):
        sharing = infer_knowledge_sharing(profile)
        if sharing:
            set_nested_value(profile, 'learning.knowledge_sharing', sharing)
            changes.append('learning.knowledge_sharing')
    
    # Adaptation Speed
    if is_empty(get_nested_value(profile, 'learning.adaptation_speed')):
        speed = infer_adaptation_speed(profile)
        if speed:
            set_nested_value(profile, 'learning.adaptation_speed', speed)
            changes.append('learning.adaptation_speed')
    
    # Failure Response
    if is_empty(get_nested_value(profile, 'learning.failure_response')):
        response = infer_failure_response(profile)
        if response:
            set_nested_value(profile, 'learning.failure_response', response)
            changes.append('learning.failure_response')
    
    return changes

def main():
    """Main function."""
    profiles_dir = Path(__file__).parent / 'profiles'
    
    print("🔄 Filling advanced gaps...\n")
    
    total_profiles = 0
    profiles_modified = 0
    total_changes = defaultdict(int)
    
    for profile_file in sorted(profiles_dir.glob('*.json')):
        try:
            with open(profile_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
            
            total_profiles += 1
            changes = fill_advanced_gaps(profile)
            
            if changes:
                profiles_modified += 1
                for change in changes:
                    total_changes[change] += 1
                
                with open(profile_file, 'w', encoding='utf-8') as f:
                    json.dump(profile, f, indent=2, ensure_ascii=False)
                
                print(f"✅ {profile.get('name', profile_file.stem):40} | {len(changes)} fields")
        
        except Exception as e:
            print(f"❌ Error: {profile_file.name}: {e}")
    
    print(f"\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}\n")
    print(f"Profiles processed: {total_profiles}")
    print(f"Profiles modified: {profiles_modified}\n")
    
    if total_changes:
        print("Fields updated:")
        for field, count in sorted(total_changes.items(), key=lambda x: -x[1]):
            field_name = field.split('.')[-1].replace('_', ' ').title()
            print(f"  • {field_name:40} {count:3} profiles")
    
    print(f"\n✅ Advanced gap filling complete!")

if __name__ == '__main__':
    main()

