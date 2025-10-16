# Tier 2 Category Expansion Plan

## Overview

Building on Tier 1's success (Technology Relationship, Crisis Response, Influence Style), Tier 2 will add 3 more category groups focused on deeper behavioral patterns and values.

**Target**: Version 10.0
**Timeline**: Q1 2026
**Total New Fields**: 12-15 fields across 3 categories

---

## Proposed Tier 2 Categories

### 1. Resource Relationship (5 fields)

**Why Important**: How people relate to money and resources reveals core values and priorities.

#### Fields

**`wealth_perspective`** (string)
- `tool for impact` - Wealth as means to create change
- `security need` - Financial safety as primary goal
- `status symbol` - Wealth as marker of success
- `corrupting force` - Money as inherently problematic

**`resource_allocation_priority`** (string)
- `long-term investment` - Patient capital, future focus
- `immediate needs` - Present-focused spending
- `experimentation` - Willing to risk on innovation
- `conservation` - Careful preservation of resources

**`generosity_pattern`** (string)
- `proactive giver` - Actively seeks to help/donate
- `strategic philanthropist` - Calculated giving for maximum impact
- `reciprocal` - Gives when receives
- `protective` - Guards resources carefully

**`financial_risk_appetite`** (string)
- `high risk tolerance` - Comfortable betting big
- `calculated risks` - Strategic risk-taking
- `risk-averse` - Prioritizes safety
- `minimizes exposure` - Avoids risk entirely

**`resource_transparency`** (string)
- `fully transparent` - Open about finances
- `selective disclosure` - Shares when relevant
- `private` - Keeps financial matters confidential
- `secretive` - Actively hides financial information

**Inference Sources**:
- Known philanthropic activities
- Investment patterns (for business leaders)
- Statements about wealth and money
- Career choices (non-profit vs. for-profit)

---

### 2. Time Orientation & Legacy (5 fields)

**Why Important**: Time horizon shapes decision-making and reveals deeper motivations.

#### Fields

**`time_horizon`** (string)
- `quarterly` - Short-term focus (3-12 months)
- `annual` - Year-to-year planning
- `decade` - 5-10 year thinking
- `generational` - 20-50 year perspective
- `civilizational` - Century+ time horizon

**`legacy_concern`** (string)
- `indifferent` - Not focused on being remembered
- `concerned with reputation` - Cares about perception
- `focused on impact` - Wants lasting positive change
- `obsessed with immortality` - Driven by being remembered

**`present_vs_future_balance`** (string)
- `live for today` - Present-moment focus
- `balanced` - Healthy mix of now and future
- `sacrifice present for future` - Deferred gratification
- `haunted by past` - Past-focused

**`intergenerational_thinking`** (string)
- `self-focused` - Own lifetime only
- `children's generation` - Next generation
- `multi-generational` - Grandchildren and beyond
- `species-level` - Humanity's long-term future

**`urgency_vs_patience`** (string)
- `impatient` - Everything is urgent
- `strategic urgency` - Knows when to move fast
- `patient` - Willing to wait for results
- `overly patient` - Risk of inaction

**Inference Sources**:
- Career trajectory (quick pivots vs. long-term commitments)
- Stated goals and vision
- Type of work (immediate results vs. research)
- Age and life stage

---

### 3. Collaboration & Team Dynamics Enhancement (5 fields)

**Why Important**: Expands existing `collaboration` category with deeper interpersonal patterns.

#### Fields

**`conflict_resolution_style`** (string)
- `confrontational` - Direct address of issues
- `mediating` - Facilitates resolution
- `avoidant` - Sidesteps conflict
- `diplomatic` - Navigates carefully

**`credit_sharing_behavior`** (string)
- `generous attribution` - Quick to credit others
- `balanced` - Fair credit distribution
- `credit-seeking` - Ensures own recognition
- `self-effacing` - Deflects credit to team

**`mentorship_inclination`** (string)
- `natural mentor` - Actively develops others
- `selective mentor` - Mentors chosen few
- `reciprocal only` - Mentor/protégé relationships
- `lone wolf` - Prefers working independently

**`feedback_style`** (string)
- `direct and immediate` - Real-time, blunt feedback
- `constructive and structured` - Thoughtful, organized
- `gentle and encouraging` - Supportive approach
- `avoids giving feedback` - Reluctant to critique

**`delegation_approach`** (string)
- `empowers fully` - Complete autonomy
- `structured delegation` - Clear boundaries and check-ins
- `micromanages` - Heavy oversight
- `reluctant to delegate` - Prefers doing themselves

**Inference Sources**:
- Known management style
- Team member testimonials
- Documented leadership approach
- Communication patterns

---

## Implementation Strategy

### Phase 1: Data Structure (Week 1)
1. Add fields to `outline-cleaned.csv`
2. Update 2-3 sample profiles manually
3. Document field definitions

### Phase 2: Inference Engine (Week 1-2)
1. Create `populate-tier2-categories.py`
2. Build inference logic using:
   - Existing profile data
   - Domain patterns
   - Known behaviors
   - Wikipedia/biographical sources
3. Test on sample profiles

### Phase 3: UI Integration (Week 2)
1. Add 3 new filter sections
2. Update details modal with new category cards
3. Add filter matching logic
4. Test filtering across all categories

### Phase 4: Population & Testing (Week 2-3)
1. Run script across all 265 profiles
2. Manual review of sample profiles for quality
3. Update `all-profiles.json`
4. Comprehensive testing

### Phase 5: Documentation (Week 3)
1. Create TIER2-CATEGORIES.md
2. Update README
3. Update CHANGELOG
4. Release v10.0

---

## Data Quality Standards

Following Tier 1 approach:

### Inference-Based, Not Speculative
- Use documented behaviors as evidence
- Infer from patterns, not imagination
- Default to conservative values when uncertain

### Verifiable Sources
- Biographical information
- Published works and statements
- Documented career decisions
- Known actions and outcomes

### Clear Defaults
- When insufficient data: Use "balanced" or middle-ground values
- Document confidence levels (future enhancement)
- Open to community corrections

---

## Alternative Tier 2 Options

If Resource/Time/Collaboration don't resonate, consider:

### Option B: Social & Emotional Intelligence
- Empathy depth
- Emotional regulation
- Social awareness
- Relationship building patterns
- Conflict sensitivity

### Option C: Innovation & Risk Patterns
- Innovation approach (incremental vs. radical)
- Failure tolerance
- Experimentation frequency
- Novel vs. proven preference
- Creative process style

### Option D: Learning & Growth Patterns
- Learning style depth
- Knowledge integration approach
- Expertise development path
- Intellectual curiosity expression
- Skill acquisition strategy

---

## Success Metrics

Tier 2 will be considered successful if:

1. **Inference Accuracy**: >80% of values feel accurate to subject matter experts
2. **Usage Value**: AI developers report improved persona authenticity
3. **Filter Utility**: New filters provide meaningful profile segmentation
4. **Data Coverage**: >90% of profiles have complete Tier 2 data
5. **Performance**: No degradation in load/filter times

---

## Open Questions

1. **Confidence Scores**: Should we add confidence levels to inferred values?
2. **User Submissions**: Enable community to suggest corrections?
3. **API Integration**: Expose inference logic as API for real-time assessment?
4. **Tier 3**: Should we plan Tier 3 now or wait for Tier 2 results?

---

## Next Steps

1. **User Feedback**: Gather input on proposed categories
2. **Prioritize Fields**: Which 15 fields provide most value?
3. **Pilot Test**: Run inference on 10-20 profiles manually
4. **Decision**: Confirm Tier 2 scope and timeline

---

**Created**: 2025-10-16
**Status**: Planning Phase
**Target Release**: v10.0 (Q1 2026)


