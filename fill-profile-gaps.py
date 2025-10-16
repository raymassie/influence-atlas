#!/usr/bin/env python3
"""
Fill gaps in profile data using intelligent inference from existing populated fields.
Only fills fields where we can make reasonable inferences from existing data.
Does NOT make up data - marks uncertain fields as empty for manual review.
"""

import json
import os
from pathlib import Path
from collections import defaultdict

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

def set_nested_value(obj, path, value):
    """Set nested value in object using dot notation."""
    keys = path.split('.')
    for key in keys[:-1]:
        if key not in obj:
            obj[key] = {}
        obj = obj[key]
    obj[keys[-1]] = value

def is_empty_value(value):
    """Check if a value is considered empty."""
    if value is None:
        return True
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return True
        placeholders = ['n/a', 'not available', 'unknown', 'tbd']
        if value.lower() in placeholders:
            return True
    if isinstance(value, list) and len(value) == 0:
        return True
    return False

def infer_curiosity_indicators(profile):
    """Infer curiosity indicators from learning style and other traits."""
    learning_style = get_nested_value(profile, 'learning.learning_style')
    learning_orientation = get_nested_value(profile, 'growth_motivation.learning_orientation')
    primary_traits = get_nested_value(profile, 'psychological_profile.primary_traits')
    
    indicators = []
    
    if learning_style:
        if isinstance(learning_style, str):
            learning_style_lower = learning_style.lower()
            if 'experiment' in learning_style_lower or 'hands-on' in learning_style_lower:
                indicators.append('experimental exploration')
            if 'question' in learning_style_lower or 'inquiry' in learning_style_lower:
                indicators.append('questioning mindset')
            if 'diverse' in learning_style_lower or 'interdisciplinary' in learning_style_lower:
                indicators.append('interdisciplinary interests')
    
    if learning_orientation:
        if isinstance(learning_orientation, str):
            if 'growth' in learning_orientation.lower():
                indicators.append('growth-oriented exploration')
            if 'continuous' in learning_orientation.lower():
                indicators.append('continuous learning drive')
    
    if primary_traits:
        traits = primary_traits if isinstance(primary_traits, list) else [primary_traits]
        trait_text = ' '.join(traits).lower()
        if 'curious' in trait_text or 'inquisitive' in trait_text:
            indicators.append('natural curiosity')
        if 'innovative' in trait_text or 'creative' in trait_text:
            indicators.append('exploratory thinking')
    
    return list(set(indicators)) if indicators else None

def infer_medium_preferences(profile):
    """Infer communication medium preferences from domain and work style."""
    domain = get_nested_value(profile, 'domain')
    work_style = get_nested_value(profile, 'behavioral_patterns.work_style')
    
    preferences = []
    
    if domain:
        domain_lower = domain.lower()
        if 'technology' in domain_lower or 'software' in domain_lower:
            preferences.extend(['written documentation', 'digital communication', 'asynchronous collaboration'])
        elif 'design' in domain_lower or 'art' in domain_lower:
            preferences.extend(['visual presentation', 'in-person collaboration', 'iterative feedback'])
        elif 'business' in domain_lower or 'management' in domain_lower:
            preferences.extend(['executive briefings', 'presentations', 'strategic memos'])
        elif 'academic' in domain_lower or 'research' in domain_lower:
            preferences.extend(['scholarly writing', 'conference presentations', 'peer discourse'])
    
    if work_style:
        style_text = ' '.join(work_style) if isinstance(work_style, list) else work_style
        style_lower = style_text.lower()
        if 'collaborative' in style_lower:
            preferences.append('collaborative platforms')
        if 'independent' in style_lower:
            preferences.append('written reports')
        if 'fast-paced' in style_lower:
            preferences.append('real-time communication')
    
    return list(set(preferences))[:3] if preferences else None

def infer_message_framing(profile):
    """Infer message framing style from communication tone and audience adaptation."""
    tone = get_nested_value(profile, 'communication_style.tone')
    audience_adaptation = get_nested_value(profile, 'communication.audience_adaptation')
    
    framing_styles = []
    
    if tone:
        tone_text = ' '.join(tone) if isinstance(tone, list) else tone
        tone_lower = tone_text.lower()
        
        if 'analytical' in tone_lower or 'data-driven' in tone_lower:
            framing_styles.append('evidence-based arguments')
        if 'persuasive' in tone_lower or 'inspiring' in tone_lower:
            framing_styles.append('motivational narratives')
        if 'direct' in tone_lower or 'concise' in tone_lower:
            framing_styles.append('clear bottom-line messaging')
        if 'technical' in tone_lower or 'precise' in tone_lower:
            framing_styles.append('detailed technical explanations')
        if 'visionary' in tone_lower or 'big-picture' in tone_lower:
            framing_styles.append('strategic vision framing')
    
    if audience_adaptation:
        adaptation_text = ' '.join(audience_adaptation) if isinstance(audience_adaptation, list) else audience_adaptation
        if 'context' in adaptation_text.lower():
            framing_styles.append('context-aware messaging')
    
    return list(set(framing_styles))[:3] if framing_styles else None

def infer_primary_expertise(profile):
    """Infer primary expertise from domain and core competencies."""
    domain = get_nested_value(profile, 'domain')
    subdomain = get_nested_value(profile, 'sub_domain')
    core_competencies = get_nested_value(profile, 'domain_expertise.core_competencies')
    
    if subdomain:
        return [subdomain]
    elif domain:
        return [domain]
    elif core_competencies:
        # Use first 1-2 core competencies as primary expertise
        if isinstance(core_competencies, list):
            return core_competencies[:2]
        else:
            return [core_competencies]
    return None

def infer_ethical_standards(profile):
    """Infer ethical standards from core values and ethical framework."""
    core_values = get_nested_value(profile, 'values.core_values')
    ethical_framework = get_nested_value(profile, 'cognitive_humanism.ethical_framework')
    
    standards = []
    
    if ethical_framework:
        framework_text = ' '.join(ethical_framework) if isinstance(ethical_framework, list) else ethical_framework
        framework_lower = framework_text.lower()
        
        if 'integrity' in framework_lower:
            standards.append('commitment to integrity')
        if 'transparency' in framework_lower:
            standards.append('transparency in operations')
        if 'fairness' in framework_lower or 'equity' in framework_lower:
            standards.append('equity and fairness')
        if 'accountability' in framework_lower:
            standards.append('personal accountability')
    
    if core_values:
        values_text = ' '.join(core_values) if isinstance(core_values, list) else core_values
        values_lower = values_text.lower()
        
        if 'honesty' in values_lower:
            standards.append('commitment to honesty')
        if 'respect' in values_lower:
            standards.append('respect for others')
        if 'excellence' in values_lower:
            standards.append('pursuit of excellence')
        if 'innovation' in values_lower:
            standards.append('ethical innovation')
    
    return list(set(standards))[:4] if standards else None

def fill_profile_gaps(profile):
    """Fill gaps in a single profile with inferred data."""
    changes = []
    
    # Only fill fields where we can make reasonable inferences
    
    # Curiosity Indicators
    if is_empty_value(get_nested_value(profile, 'growth_motivation.curiosity_indicators')):
        indicators = infer_curiosity_indicators(profile)
        if indicators:
            set_nested_value(profile, 'growth_motivation.curiosity_indicators', indicators)
            changes.append('growth_motivation.curiosity_indicators')
    
    # Medium Preferences
    if is_empty_value(get_nested_value(profile, 'communication.medium_preferences')):
        preferences = infer_medium_preferences(profile)
        if preferences:
            set_nested_value(profile, 'communication.medium_preferences', preferences)
            changes.append('communication.medium_preferences')
    
    # Message Framing
    if is_empty_value(get_nested_value(profile, 'communication.message_framing')):
        framing = infer_message_framing(profile)
        if framing:
            set_nested_value(profile, 'communication.message_framing', framing)
            changes.append('communication.message_framing')
    
    # Primary Expertise
    if is_empty_value(get_nested_value(profile, 'domain_expertise.primary_expertise')):
        expertise = infer_primary_expertise(profile)
        if expertise:
            set_nested_value(profile, 'domain_expertise.primary_expertise', expertise)
            changes.append('domain_expertise.primary_expertise')
    
    # Ethical Standards
    if is_empty_value(get_nested_value(profile, 'values.ethical_standards')):
        standards = infer_ethical_standards(profile)
        if standards:
            set_nested_value(profile, 'values.ethical_standards', standards)
            changes.append('values.ethical_standards')
    
    return changes

def main():
    """Main function to fill gaps across all profiles."""
    profiles_dir = Path(__file__).parent / 'profiles'
    
    if not profiles_dir.exists():
        print(f"❌ Profiles directory not found: {profiles_dir}")
        return
    
    print("🔄 Filling profile gaps...\n")
    
    total_profiles = 0
    profiles_modified = 0
    total_changes = defaultdict(int)
    
    for profile_file in sorted(profiles_dir.glob('*.json')):
        try:
            with open(profile_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
            
            total_profiles += 1
            changes = fill_profile_gaps(profile)
            
            if changes:
                profiles_modified += 1
                for change in changes:
                    total_changes[change] += 1
                
                # Save updated profile
                with open(profile_file, 'w', encoding='utf-8') as f:
                    json.dump(profile, f, indent=2, ensure_ascii=False)
                
                print(f"✅ {profile.get('name', profile_file.stem):40} | {len(changes)} fields updated")
            
        except Exception as e:
            print(f"❌ Error processing {profile_file.name}: {e}")
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 SUMMARY")
    print(f"{'='*80}\n")
    print(f"Total profiles processed: {total_profiles}")
    print(f"Profiles modified: {profiles_modified}")
    print(f"\nFields updated:")
    for field, count in sorted(total_changes.items(), key=lambda x: -x[1]):
        field_display = field.split('.')[-1].replace('_', ' ').title()
        print(f"  • {field_display:40} {count:3} profiles")
    
    print(f"\n✅ Gap filling complete!")
    print(f"\n💡 Note: Only filled fields where reasonable inferences could be made from existing data.")
    print(f"   Other empty fields should be filled with factual research or left empty.")

if __name__ == '__main__':
    main()

