#!/usr/bin/env python3
"""
Critical evaluation of the data structure:
1. Identify gaps that need filling
2. Identify irrelevant/empty fields that should be removed
3. Identify missing traits that would add value
"""

import os
import json
from collections import defaultdict, Counter

def evaluate_data_structure():
    """Evaluate the entire data structure for relevance and completeness"""
    
    profiles_dir = 'profiles'
    evaluation = {
        'field_usage': defaultdict(int),  # How often each field is used
        'field_value_types': defaultdict(set),  # What types of values in each field
        'empty_fields': defaultdict(int),  # Fields that are consistently empty
        'valuable_fields': defaultdict(int),  # Fields with rich, specific content
        'redundant_fields': defaultdict(list),  # Fields that might be redundant
        'missing_concepts': []  # Important concepts not captured
    }
    
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    print(f"Evaluating data structure across {len(profile_files)} profiles...")
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
                
            analyze_profile_structure(profile_data, evaluation)
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    return evaluation

def analyze_profile_structure(profile_data, evaluation):
    """Analyze the structure and content of a single profile"""
    
    def analyze_field(field_path, value, depth=0):
        """Recursively analyze field usage and value types"""
        
        if isinstance(value, dict):
            for key, sub_value in value.items():
                full_path = f"{field_path}.{key}" if field_path else key
                analyze_field(full_path, sub_value, depth + 1)
        elif isinstance(value, list):
            evaluation['field_usage'][field_path] += 1
            if value:  # Non-empty list
                evaluation['valuable_fields'][field_path] += 1
                # Analyze list contents
                for item in value:
                    if isinstance(item, str) and len(item.strip()) > 2:
                        evaluation['field_value_types'][field_path].add(f"list_of_strings")
            else:
                evaluation['empty_fields'][field_path] += 1
        elif isinstance(value, str):
            evaluation['field_usage'][field_path] += 1
            if value.strip() and value != "N/A" and len(value.strip()) > 2:
                evaluation['valuable_fields'][field_path] += 1
                evaluation['field_value_types'][field_path].add("string")
            else:
                evaluation['empty_fields'][field_path] += 1
        elif value is not None:
            evaluation['field_usage'][field_path] += 1
            evaluation['valuable_fields'][field_path] += 1
            evaluation['field_value_types'][field_path].add(str(type(value).__name__))
    
    # Analyze all fields in the profile
    for key, value in profile_data.items():
        analyze_field(key, value)

def print_structure_evaluation(evaluation):
    """Print comprehensive structure evaluation"""
    
    total_profiles = 265  # Known from previous analysis
    
    print("\n" + "="*80)
    print("DATA STRUCTURE EVALUATION REPORT")
    print("="*80)
    
    print(f"\n{'='*80}")
    print("1. FIELD USAGE ANALYSIS")
    print("="*80)
    
    # Sort fields by usage
    usage_sorted = sorted(evaluation['field_usage'].items(), 
                         key=lambda x: x[1], reverse=True)
    
    print("Fields by usage frequency:")
    for field, count in usage_sorted[:20]:
        percentage = (count / total_profiles) * 100
        status = "✅ GOOD" if percentage > 80 else "⚠️  PARTIAL" if percentage > 30 else "❌ SPARSE"
        print(f"{status} {field:<40} {count:3d}/{total_profiles} ({percentage:5.1f}%)")
    
    print(f"\n{'='*80}")
    print("2. EMPTY/IRRELEVANT FIELDS (Candidates for Removal)")
    print("="*80)
    
    # Find fields that are consistently empty or have low value
    empty_fields = []
    for field, count in evaluation['empty_fields'].items():
        usage = evaluation['field_usage'].get(field, 0)
        if usage > 0:
            empty_percentage = (count / usage) * 100
            if empty_percentage > 70:  # >70% of usage is empty
                empty_fields.append((field, count, usage, empty_percentage))
    
    empty_fields.sort(key=lambda x: x[3], reverse=True)
    
    print("Fields that are mostly empty (candidates for removal):")
    for field, empty_count, total_usage, empty_percentage in empty_fields[:15]:
        print(f"❌ {field:<40} {empty_count:3d}/{total_usage:3d} empty ({empty_percentage:5.1f}%)")
    
    print(f"\n{'='*80}")
    print("3. VALUABLE FIELDS (Rich Content)")
    print("="*80)
    
    # Find fields with consistently rich content
    valuable_fields = []
    for field, count in evaluation['valuable_fields'].items():
        usage = evaluation['field_usage'].get(field, 0)
        if usage > 0:
            value_percentage = (count / usage) * 100
            if value_percentage > 60 and usage > 50:  # >60% valuable content, used in >50 profiles
                valuable_fields.append((field, count, usage, value_percentage))
    
    valuable_fields.sort(key=lambda x: x[3], reverse=True)
    
    print("Fields with consistently rich content:")
    for field, value_count, total_usage, value_percentage in valuable_fields[:20]:
        print(f"✅ {field:<40} {value_count:3d}/{total_usage:3d} valuable ({value_percentage:5.1f}%)")
    
    print(f"\n{'='*80}")
    print("4. MISSING CONCEPT ANALYSIS")
    print("="*80)
    
    # Analyze what important concepts might be missing
    missing_concepts = analyze_missing_concepts(evaluation)
    
    print("Potentially missing important concepts:")
    for concept in missing_concepts:
        print(f"  • {concept}")
    
    print(f"\n{'='*80}")
    print("5. RECOMMENDATIONS")
    print("="*80)
    
    print("REMOVE (Irrelevant/Empty):")
    for field, empty_count, total_usage, empty_percentage in empty_fields[:10]:
        print(f"  - {field} ({empty_percentage:.1f}% empty)")
    
    print("\nFILL (High-value gaps):")
    high_value_gaps = [
        field for field, count in evaluation['valuable_fields'].items()
        if count > 0 and count < 100  # Used but not widely
    ]
    for field in high_value_gaps[:10]:
        print(f"  - {field}")
    
    print("\nADD (Missing concepts):")
    for concept in missing_concepts[:5]:
        print(f"  - {concept}")

def analyze_missing_concepts(evaluation):
    """Identify potentially missing important concepts"""
    
    missing_concepts = [
        "Communication Medium Preferences",  # Written vs spoken vs visual
        "Information Processing Speed",  # Quick vs deliberate
        "Conflict Resolution Style",  # Collaborative vs competitive
        "Risk Tolerance Level",  # Conservative vs adventurous
        "Innovation Approach",  # Incremental vs breakthrough
        "Learning Method Preferences",  # Visual vs auditory vs kinesthetic
        "Decision Making Speed",  # Rapid vs deliberate
        "Collaboration Depth",  # Surface vs deep engagement
        "Feedback Style",  # Direct vs diplomatic
        "Motivation Triggers",  # What specifically motivates
        "Stress Response Patterns",  # How they handle pressure
        "Creative Process",  # Structured vs free-form
        "Problem Decomposition",  # How they break down problems
        "Influence Style",  # How they persuade others
        "Temporal Orientation",  # Past vs present vs future focus
    ]
    
    # Check which of these might already exist in different forms
    existing_concepts = set()
    for field in evaluation['field_usage'].keys():
        field_lower = field.lower()
        for concept in missing_concepts:
            concept_lower = concept.lower()
            # Simple keyword matching to see if concept already exists
            if any(word in field_lower for word in concept_lower.split()):
                existing_concepts.add(concept)
    
    return [concept for concept in missing_concepts if concept not in existing_concepts]

if __name__ == '__main__':
    evaluation = evaluate_data_structure()
    print_structure_evaluation(evaluation)
    
    # Save detailed results
    with open('data-structure-evaluation.json', 'w', encoding='utf-8') as f:
        # Convert sets to lists for JSON serialization
        eval_copy = {}
        for key, value in evaluation.items():
            if isinstance(value, dict):
                eval_copy[key] = {}
                for k, v in value.items():
                    if isinstance(v, set):
                        eval_copy[key][k] = list(v)
                    else:
                        eval_copy[key][k] = v
            else:
                eval_copy[key] = value
        json.dump(eval_copy, f, indent=2, ensure_ascii=False)
    
    print(f"\nDetailed evaluation saved to: data-structure-evaluation.json")
