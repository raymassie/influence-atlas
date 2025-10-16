# Scripts Documentation

This directory contains utility scripts for maintaining and enhancing the Influence Atlas profiles.

## Active Scripts

### `populate-tier1-categories.py`
**Purpose**: Populates Tier 1 category expansion fields across all profiles.

**Usage**:
```bash
python3 scripts/populate-tier1-categories.py
```

**What it does**:
- Adds Technology Relationship fields (5 fields)
- Adds Crisis Response fields (5 fields)
- Adds Influence Style fields (5 fields)
- Uses intelligent inference based on:
  - Birth year
  - Domain/archetype
  - Existing psychological traits
  - Communication style

**Output**: Updates all 265 JSON profiles with new Tier 1 data.

**Inference Logic**:
- **Technology Adoption**: Based on birth year and domain (tech-related = early adopter)
- **Digital Fluency**: Age-based (1980+ = native, 1960+ = proficient, etc.)
- **AI Perspective**: Domain-based (tech = enthusiast, ethics/philosophy = concerned)
- **Stress Response**: Trait-based (calm/zen/mindful = calm under pressure)
- **Failure Recovery**: Trait-based (resilient/adaptive = bounce back stronger)
- **Persuasion Approach**: Communication tone (analytical = logical, passionate = emotional)
- **Influence Scope**: Occupation-based (author/speaker/CEO = mass audience)
- **Rhetoric Style**: Communication style (story/narrative = storytelling)

---

## Archive Scripts

Located in `scripts/archive/` - these were used for earlier data population phases:

### `analyze-data-coverage.py`
Analyzes field coverage across all profiles, identifies gaps and patterns.

### `fill-profile-gaps.py`
Initial script for filling missing profile data.

### `fill-remaining-gaps-advanced.py`
Advanced gap-filling with pattern recognition.

### `verify-trait-standardization.py`
Verifies that traits follow standardization conventions (lowercase, consistency).

---

## Running Scripts

All scripts should be run from the project root:

```bash
cd /Users/raymassie/Sites/applications/JSON-context-profiles
python3 scripts/[script-name].py
```

**Requirements**: Python 3.7+, no external dependencies needed.

---

## Creating New Scripts

When creating new population/enhancement scripts:

1. **Document inference logic clearly** - explain how decisions are made
2. **Handle missing data gracefully** - use sensible defaults
3. **Skip already-populated profiles** - check for existing data
4. **Provide progress feedback** - print status every N profiles
5. **Report results** - summary of what was updated

Example structure:
```python
#!/usr/bin/env python3
"""
Script description and purpose.
"""
import json
from pathlib import Path

def infer_new_field(profile):
    """Explain inference logic."""
    # Implementation
    return value

def main():
    profiles_dir = Path('profiles')
    # Process profiles
    print(f"✅ Complete! Updated {count} profiles")

if __name__ == '__main__':
    main()
```

