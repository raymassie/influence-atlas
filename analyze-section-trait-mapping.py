#!/usr/bin/env python3
"""
Analyze the mapping between sections/fields and the specific traits to see if they're still relevant.
"""

import os
import json
from collections import defaultdict, Counter

def analyze_section_trait_mapping():
    """Analyze how traits are mapped to sections and if the mapping is still relevant"""
    
    profiles_dir = 'profiles'
    analysis = {
        'section_usage': defaultdict(int),
        'field_usage': defaultdict(int),
        'trait_distribution': defaultdict(int),
        'section_trait_examples': defaultdict(list),
        'orphaned_fields': [],
        'missing_sections': []
    }
    
    # Load outline to understand expected structure
    outline_sections = set()
    outline_fields = set()
    
    try:
        with open('outline.csv', 'r', encoding='utf-8') as f:
            lines = f.readlines()[1:]  # Skip header
            for line in lines:
                parts = line.strip().split(',')
                if len(parts) >= 2:
                    section = parts[0]
                    field = parts[1]
                    outline_sections.add(section)
                    outline_fields.add(f"{section}.{field}")
    except Exception as e:
        print(f"Could not load outline.csv: {e}")
    
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    print(f"Analyzing section-trait mapping across {len(profile_files)} profiles...")
    
    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
                
            analyze_profile_sections(profile_data, analysis)
                    
        except Exception as e:
            print(f"Error processing {filename}: {e}")
    
    # Find orphaned fields (in profiles but not in outline)
    profile_fields = set()
    for field in analysis['field_usage'].keys():
        profile_fields.add(field)
    
    analysis['orphaned_fields'] = list(profile_fields - outline_fields)
    analysis['missing_sections'] = list(outline_sections - set(analysis['section_usage'].keys()))
    
    return analysis, outline_sections, outline_fields

def analyze_profile_sections(profile_data, analysis):
    """Analyze sections and fields in a single profile"""
    
    def analyze_field(field_path, value, depth=0):
        """Recursively analyze field usage and trait examples"""
        
        if isinstance(value, dict):
            for key, sub_value in value.items():
                full_path = f"{field_path}.{key}" if field_path else key
                analyze_field(full_path, sub_value, depth + 1)
        elif isinstance(value, list):
            analysis['field_usage'][field_path] += 1
            if field_path:
                section = field_path.split('.')[0]
                analysis['section_usage'][section] += 1
                
            # Collect trait examples
            for item in value:
                if isinstance(item, str) and len(item.strip()) > 2:
                    analysis['trait_distribution'][item.lower()] += 1
                    if len(analysis['section_trait_examples'][field_path]) < 5:  # Keep examples
                        analysis['section_trait_examples'][field_path].append(item)
        elif isinstance(value, str) and value.strip() and value != "N/A":
            analysis['field_usage'][field_path] += 1
            if field_path:
                section = field_path.split('.')[0]
                analysis['section_usage'][section] += 1
    
    # Analyze all fields in the profile
    for key, value in profile_data.items():
        analyze_field(key, value)

def print_mapping_analysis(analysis, outline_sections, outline_fields):
    """Print comprehensive mapping analysis"""
    
    total_profiles = 265
    
    print("\n" + "="*80)
    print("SECTION-TRAIT MAPPING ANALYSIS")
    print("="*80)
    
    print(f"\n{'='*80}")
    print("1. SECTION USAGE (from profiles)")
    print("="*80)
    
    section_usage_sorted = sorted(analysis['section_usage'].items(), 
                                 key=lambda x: x[1], reverse=True)
    
    for section, count in section_usage_sorted:
        percentage = (count / total_profiles) * 100
        status = "✅ ACTIVE" if percentage > 80 else "⚠️ PARTIAL" if percentage > 30 else "❌ SPARSE"
        print(f"{status} {section:<30} {count:3d}/{total_profiles} ({percentage:5.1f}%)")
    
    print(f"\n{'='*80}")
    print("2. ORPHANED FIELDS (in profiles but not in outline)")
    print("="*80)
    
    if analysis['orphaned_fields']:
        print("Fields that exist in profiles but not defined in outline.csv:")
        for field in sorted(analysis['orphaned_fields']):
            usage = analysis['field_usage'].get(field, 0)
            percentage = (usage / total_profiles) * 100
            print(f"  • {field:<40} ({usage:3d} profiles, {percentage:5.1f}%)")
    else:
        print("✅ No orphaned fields found")
    
    print(f"\n{'='*80}")
    print("3. MISSING SECTIONS (in outline but not in profiles)")
    print("="*80)
    
    if analysis['missing_sections']:
        print("Sections defined in outline.csv but not found in profiles:")
        for section in sorted(analysis['missing_sections']):
            print(f"  • {section}")
    else:
        print("✅ All outline sections found in profiles")
    
    print(f"\n{'='*80}")
    print("4. TRAIT EXAMPLES BY SECTION")
    print("="*80)
    
    # Show examples of traits in each section
    for section, count in section_usage_sorted[:10]:  # Top 10 sections
        print(f"\n{section.upper()} (used in {count} profiles):")
        
        # Find fields in this section
        section_fields = [field for field in analysis['section_trait_examples'].keys() 
                         if field.startswith(section + '.')]
        
        for field in section_fields[:3]:  # Show first 3 fields
            examples = analysis['section_trait_examples'][field]
            if examples:
                print(f"  {field}: {', '.join(examples[:3])}")
    
    print(f"\n{'='*80}")
    print("5. MOST COMMON TRAITS")
    print("="*80)
    
    trait_counts = sorted(analysis['trait_distribution'].items(), 
                         key=lambda x: x[1], reverse=True)
    
    print("Most frequently used traits across all profiles:")
    for trait, count in trait_counts[:20]:
        percentage = (count / total_profiles) * 100
        print(f"  {trait:<25} {count:3d} profiles ({percentage:5.1f}%)")
    
    print(f"\n{'='*80}")
    print("6. RECOMMENDATIONS")
    print("="*80)
    
    print("SECTION RELEVANCE ASSESSMENT:")
    
    # Assess each section's relevance
    for section, count in section_usage_sorted:
        percentage = (count / total_profiles) * 100
        if percentage > 80:
            print(f"✅ {section} - Well integrated, keep as-is")
        elif percentage > 30:
            print(f"⚠️  {section} - Partially integrated, consider filling gaps")
        else:
            print(f"❌ {section} - Poorly integrated, consider removing or redesigning")
    
    print(f"\nFIELD CLEANUP NEEDED:")
    for field in analysis['orphaned_fields'][:5]:  # Top 5 orphaned fields
        usage = analysis['field_usage'].get(field, 0)
        percentage = (usage / total_profiles) * 100
        if percentage > 50:
            print(f"  - {field} (used in {percentage:.1f}% of profiles - consider adding to outline)")
        else:
            print(f"  - {field} (used in {percentage:.1f}% of profiles - consider removing)")

if __name__ == '__main__':
    analysis, outline_sections, outline_fields = analyze_section_trait_mapping()
    print_mapping_analysis(analysis, outline_sections, outline_fields)
    
    # Save detailed results
    with open('section-trait-mapping-analysis.json', 'w', encoding='utf-8') as f:
        # Convert sets to lists for JSON serialization
        analysis_copy = {}
        for key, value in analysis.items():
            if isinstance(value, (set, defaultdict)):
                analysis_copy[key] = dict(value)
            else:
                analysis_copy[key] = value
        json.dump(analysis_copy, f, indent=2, ensure_ascii=False)
    
    print(f"\nDetailed analysis saved to: section-trait-mapping-analysis.json")
