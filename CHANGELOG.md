# Changelog

All notable changes to Influence Atlas will be documented in this file.

## [10.0.0] - 2025-10-17

### 🎉 Major Release - Tier 2 Expansion

#### Added
- **3 new category groups** with 15 total fields across all 265 profiles:
  - **Resource Relationship** (5 fields): wealth perspective, resource allocation priority, generosity pattern, financial risk appetite, resource transparency
  - **Time Orientation** (5 fields): time horizon, legacy concern, present vs future balance, intergenerational thinking, urgency vs patience
  - **Collaboration Enhancement** (5 fields): conflict resolution style, credit sharing behavior, mentorship inclination, feedback style, delegation approach
- **New filter sections** in UI for all 3 Tier 2 categories
- **Details modal display** for all new categories with trait cards
- **Intelligent inference system** for populating data based on existing profile fields
- **Complete documentation**: `docs/TIER2-CATEGORIES.md` with field definitions and inference logic
- **Population script**: `scripts/populate-tier2-categories.py`

#### Changed
- **Data fields**: 155 → 170 total profile fields
- **Behavioral categories**: 20 → 23 categories
- **Filters**: 25 → 28 total filters
- **Framework depth**: Now includes resource management, temporal thinking, and interpersonal dynamics
- **100% coverage**: All 265 profiles have complete Tier 2 data

#### Technical
- Updated `outline-cleaned.csv` with 15 new field definitions
- Added Tier 2 filter initialization to `initializeFilters()`
- Added Tier 2 filter matching logic to `filterProfiles()`
- Updated category cards array with 3 new category sections
- Regenerated `all-profiles.json` with Tier 2 data

---

## [9.0.0] - 2025-10-16

### 🎉 Major Release - Tier 1 Expansion

#### Added
- **3 new category groups** with 15 total fields across all 265 profiles:
  - **Technology Relationship** (5 fields): adoption level, digital fluency, AI perspective, platform preference, tech integration
  - **Crisis Response** (5 fields): stress patterns, failure recovery, uncertainty tolerance, pressure performance, crisis leadership
  - **Influence Style** (5 fields): persuasion approach, influence scope, rhetoric style, credibility source, change mechanism
- **New filter sections** in UI for all 3 categories
- **Details modal display** for all new categories
- **Intelligent inference system** for populating data based on biographical information
- **Scripts documentation** in `scripts/README.md`

#### Changed
- **Complete rebrand**: "JSON Context Profiles" → "Influence Atlas"
- **New tagline**: "Context for expert authenticity"
- **Repository name**: `JSON-context-profiles` → `influence-atlas`
- **Performance optimization**: Consolidated parsing loops (~93% faster)
- **Filter memoization**: Caches last 10 filter states for instant switching

#### Fixed
- **Critical filter bug**: Filters now work correctly with proper conditional logic
- **Filter matching logic**: Added missing Behavioral Humanism filter implementations

---

## [8.5.0] - 2025-10-15

### Enhanced UI & Testing

#### Added
- **Colophon modal** with project methodology and data integrity details
- **Comprehensive test suite**: Playwright tests for all major features
- **Cross-browser testing**: Chrome, Firefox, Safari compatibility
- **Clickable trait chips** for instant filtering

#### Changed
- **Details modal styling**: Full-screen, category cards, improved hierarchy
- **Trait chip colors**: Hierarchical color system with WCAG AA compliance
- **Automatic contrast adjustment**: Text color adjusts for accessibility

#### Fixed
- **Copy button functionality**: Works across all browsers including Safari
- **Modal scrolling**: Proper viewport coverage and background scroll prevention

---

## [8.0.0] - 2025-10-14

### Behavioral Humanism Framework Integration

#### Added
- **7 Behavioral Humanism categories**:
  - Bias Awareness
  - Growth Motivation
  - Cognitive Humanism
  - Humanistic Cognition
  - Human Needs Hierarchy
  - Self-Actualization Indicators
  - Behavioral Growth
- **Framework documentation**: BEHAVIORAL-HUMANISM-FRAMEWORK.md
- **Evaluation methodology**: Combining Kahneman and Maslow perspectives

#### Changed
- **Subheading**: "An interactive index of industry leaders drawn from a Behavioral Humanism framework"
- **265 profiles re-evaluated** with new framework
- **Data integrity focus**: All data must be factually verifiable

---

## [7.0.0] - 2025-10-13

### Data Quality & Standardization

#### Added
- **Trait standardization**: 3,887 traits normalized to lowercase
- **Coverage analysis**: Field usage tracking and gap identification
- **Python scripts**: Automated data enhancement and validation
- **Data quality metrics**: 90%+ coverage on high-value fields

#### Changed
- **Field consolidation**: Removed redundant `_parsed` and `_chips` fields where appropriate
- **Orphaned field recovery**: Added missing fields from profiles to outline.csv

#### Fixed
- **Empty categories**: Removed unfillable fields from schema
- **Placeholder content**: Replaced generic text with real evaluated data

---

## [6.0.0] - 2025-10-12

### UI/UX Overhaul

#### Added
- **Quick navigation**: Alphabet nav with profile counts
- **Super filters**: Quick category buttons (Innovators, Thinkers, etc.)
- **Multiple export formats**: JSON, Markdown, AI agent format
- **Profile card redesign**: Cleaner layout with action buttons

#### Changed
- **Grid layout**: Responsive 3-column design
- **Filter UI**: Collapsible sections with improved organization
- **Details modal**: Full-screen with better typography

---

## Earlier Versions

### [5.0.0] - Initial multi-filter system
### [4.0.0] - Profile card implementation
### [3.0.0] - Search functionality
### [2.0.0] - Filter system
### [1.0.0] - Initial release with 265 profiles

---

## Version Numbering

- **Major (X.0.0)**: New categories, framework changes, breaking changes
- **Minor (x.X.0)**: New features, significant enhancements
- **Patch (x.x.X)**: Bug fixes, small improvements


