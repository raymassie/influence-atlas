#!/usr/bin/env python3
"""
Create a cleaned outline.csv that:
1. Keeps all fields with any usage
2. Removes redundancies (chooses best version)
3. Adds missing fields from profiles
4. Re-assesses data mapping
"""

import os
import json
from collections import defaultdict

def analyze_field_usage():
    """Analyze actual field usage across all profiles"""
    
    profiles_dir = 'profiles'
    field_analysis = {
        'field_usage': defaultdict(int),
        'field_types': defaultdict(set),
        'field_examples': defaultdict(list)
    }
    
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
                
            analyze_profile_fields(profile_data, field_analysis)
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    return field_analysis

def analyze_profile_fields(profile_data, analysis):
    """Analyze fields in a single profile"""
    
    def analyze_field(field_path, value, depth=0):
        """Recursively analyze field usage and examples"""
        
        if isinstance(value, dict):
            for key, sub_value in value.items():
                full_path = f"{field_path}.{key}" if field_path else key
                analyze_field(full_path, sub_value, depth + 1)
        elif isinstance(value, list):
            analysis['field_usage'][field_path] += 1
            analysis['field_types'][field_path].add('array')
            
            # Collect examples
            for item in value[:3]:  # First 3 items as examples
                if isinstance(item, str) and len(item.strip()) > 2:
                    if len(analysis['field_examples'][field_path]) < 5:
                        analysis['field_examples'][field_path].append(item)
        elif isinstance(value, str) and value.strip() and value != "N/A":
            analysis['field_usage'][field_path] += 1
            analysis['field_types'][field_path].add('string')
            
            if len(analysis['field_examples'][field_path]) < 3:
                analysis['field_examples'][field_path].append(value[:50])  # First 50 chars
        elif value is not None and not isinstance(value, str):
            analysis['field_usage'][field_path] += 1
            analysis['field_types'][field_path].add(str(type(value).__name__))
    
    # Analyze all fields in the profile
    for key, value in profile_data.items():
        analyze_field(key, value)

def identify_redundancies(field_analysis):
    """Identify redundant field patterns"""
    
    redundancies = []
    field_groups = defaultdict(list)
    
    # Group fields by base name (removing _parsed, _chips, etc.)
    for field in field_analysis['field_usage'].keys():
        base_field = field.replace('_parsed', '').replace('_chips', '')
        field_groups[base_field].append(field)
    
    # Find groups with multiple versions
    for base_field, variants in field_groups.items():
        if len(variants) > 1:
            # Sort by usage to pick the most used version
            variants_with_usage = [(v, field_analysis['field_usage'][v]) for v in variants]
            variants_with_usage.sort(key=lambda x: x[1], reverse=True)
            
            redundancies.append({
                'base_field': base_field,
                'variants': variants_with_usage,
                'recommended': variants_with_usage[0][0]  # Most used version
            })
    
    return redundancies

def create_cleaned_outline(field_analysis, redundancies):
    """Create a cleaned outline.csv"""
    
    # Load existing outline for reference
    existing_outline = {}
    try:
        with open('outline.csv', 'r', encoding='utf-8') as f:
            lines = f.readlines()[1:]  # Skip header
            for line in lines:
                parts = line.strip().split(',')
                if len(parts) >= 4:
                    category = parts[0]
                    field = parts[1]
                    field_type = parts[2]
                    description = ','.join(parts[3:])  # Handle commas in description
                    existing_outline[f"{category}.{field}"] = {
                        'category': category,
                        'field': field,
                        'type': field_type,
                        'description': description
                    }
    except Exception as e:
        print(f"Could not load existing outline: {e}")
    
    # Create new outline entries
    new_outline = []
    
    # Process all fields with usage
    for field, usage_count in field_analysis['field_usage'].items():
        if usage_count == 0:
            continue  # Skip unused fields
        
        # Check if this field is redundant
        is_redundant = False
        recommended_field = field
        
        for redundancy in redundancies:
            if field in [v[0] for v in redundancy['variants']]:
                if field != redundancy['recommended']:
                    is_redundant = True
                    recommended_field = redundancy['recommended']
                    break
        
        if is_redundant:
            continue  # Skip redundant fields, we'll use the recommended one
        
        # Determine category and field name
        if '.' in field:
            category, field_name = field.split('.', 1)
        else:
            category = field
            field_name = field
        
        # Determine field type
        field_types = field_analysis['field_types'][field]
        if 'array' in field_types:
            field_type = 'array'
        elif 'string' in field_types:
            field_type = 'string'
        elif 'int' in field_types:
            field_type = 'integer'
        elif 'float' in field_types:
            field_type = 'float'
        elif 'bool' in field_types:
            field_type = 'boolean'
        else:
            field_type = 'string'  # Default
        
        # Create description
        examples = field_analysis['field_examples'][field][:3]
        if examples:
            example_str = ', '.join([f'"{ex}"' for ex in examples])
            if field_type == 'array':
                description = f"Array of {field_name.replace('_', ' ')} values"
            else:
                description = f"Single {field_name.replace('_', ' ')} value"
        else:
            description = f"{field_name.replace('_', ' ')} field"
        
        # Check if this field already exists in outline
        outline_key = f"{category}.{field_name}"
        if outline_key in existing_outline:
            # Use existing description if available
            description = existing_outline[outline_key]['description']
        
        new_outline.append({
            'category': category,
            'field': field_name,
            'type': field_type,
            'description': description,
            'usage_count': usage_count,
            'examples': examples
        })
    
    # Sort by category, then by usage count
    new_outline.sort(key=lambda x: (x['category'], -x['usage_count']))
    
    return new_outline

def generate_outline_csv(cleaned_outline):
    """Generate the cleaned outline.csv file"""
    
    csv_lines = ['category,field_name,field_type,description,example']
    
    for entry in cleaned_outline:
        examples = entry['examples'][:2]  # First 2 examples
        if entry['type'] == 'array' and examples:
            example_str = f'["{examples[0]}", "{examples[1] if len(examples) > 1 else examples[0]}"]'
        elif examples:
            example_str = f'"{examples[0]}"'
        else:
            example_str = '""'
        
        # Escape commas in description
        description = entry['description'].replace(',', ';')
        
        csv_lines.append(f"{entry['category']},{entry['field']},{entry['type']},{description},{example_str}")
    
    return '\n'.join(csv_lines)

def print_analysis_report(field_analysis, redundancies, cleaned_outline):
    """Print comprehensive analysis report"""
    
    total_profiles = 265
    
    print("\n" + "="*80)
    print("CLEANED OUTLINE ANALYSIS REPORT")
    print("="*80)
    
    print(f"\nTotal fields with usage: {len(field_analysis['field_usage'])}")
    print(f"Total redundant field groups: {len(redundancies)}")
    print(f"Fields in cleaned outline: {len(cleaned_outline)}")
    
    print(f"\n{'='*80}")
    print("REDUNDANT FIELD GROUPS (showing recommended version)")
    print("="*80)
    
    for redundancy in redundancies[:15]:  # Top 15
        print(f"\n{redundancy['base_field']}:")
        for variant, usage in redundancy['variants']:
            status = "✅ KEEP" if variant == redundancy['recommended'] else "❌ REMOVE"
            print(f"  {status} {variant:<40} ({usage:3d} profiles)")
    
    print(f"\n{'='*80}")
    print("CLEANED OUTLINE STRUCTURE")
    print("="*80)
    
    # Group by category
    categories = defaultdict(list)
    for entry in cleaned_outline:
        categories[entry['category']].append(entry)
    
    for category, fields in categories.items():
        print(f"\n{category.upper()} ({len(fields)} fields):")
        for field in fields[:10]:  # Show first 10 fields per category
            percentage = (field['usage_count'] / total_profiles) * 100
            print(f"  {field['field']:<30} {field['usage_count']:3d} profiles ({percentage:5.1f}%)")
        
        if len(fields) > 10:
            print(f"  ... and {len(fields) - 10} more fields")

if __name__ == '__main__':
    print("Analyzing field usage across all profiles...")
    field_analysis = analyze_field_usage()
    
    print("Identifying redundant fields...")
    redundancies = identify_redundancies(field_analysis)
    
    print("Creating cleaned outline...")
    cleaned_outline = create_cleaned_outline(field_analysis, redundancies)
    
    print("Generating outline.csv...")
    outline_csv = generate_outline_csv(cleaned_outline)
    
    # Save cleaned outline
    with open('outline-cleaned.csv', 'w', encoding='utf-8') as f:
        f.write(outline_csv)
    
    print_analysis_report(field_analysis, redundancies, cleaned_outline)
    
    print(f"\n✅ Cleaned outline saved to: outline-cleaned.csv")
    print(f"📊 Analysis saved to: cleaned-outline-analysis.json")
    
    # Save detailed analysis
    with open('cleaned-outline-analysis.json', 'w', encoding='utf-8') as f:
        analysis_data = {
            'field_usage': dict(field_analysis['field_usage']),
            'field_types': {k: list(v) for k, v in field_analysis['field_types'].items()},
            'field_examples': dict(field_analysis['field_examples']),
            'redundancies': redundancies,
            'cleaned_outline': cleaned_outline
        }
        json.dump(analysis_data, f, indent=2, ensure_ascii=False)
