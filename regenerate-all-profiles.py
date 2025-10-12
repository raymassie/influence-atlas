#!/usr/bin/env python3
"""
Regenerate all-profiles.json from individual profile files.
"""

import os
import json

def regenerate_all_profiles(profiles_dir='profiles', output_file='all-profiles.json'):
    all_profiles_data = []
    profile_files = [f for f in os.listdir(profiles_dir) if f.endswith('.json')]
    
    print(f"Found {len(profile_files)} profile files")

    for filename in profile_files:
        filepath = os.path.join(profiles_dir, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                profile_data = json.load(f)
                all_profiles_data.append(profile_data)
                print(f"✅ Loaded: {profile_data.get('name', filename)}")
        except Exception as e:
            print(f"❌ Error loading {filename}: {e}")

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_profiles_data, f, indent=2, ensure_ascii=False)
    print(f"✅ Generated {output_file} with {len(all_profiles_data)} profiles")

if __name__ == '__main__':
    regenerate_all_profiles()
