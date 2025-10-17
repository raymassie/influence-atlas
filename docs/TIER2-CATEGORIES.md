# Tier 2 Category Expansion Guide

## Overview

Version 10.0 introduces 15 new fields across 3 category groups, deepening behavioral profiles with dimensions focused on resource management, temporal thinking, and interpersonal dynamics. These categories complement Tier 1 (Technology Relationship, Crisis Response, Influence Style) to provide richer context for AI training and persona development.

---

## Resource Relationship

Understanding how influential figures relate to money and resources reveals core values, priorities, and decision-making patterns around wealth allocation.

### Fields

#### `wealth_perspective` (string)
**How they view money and resources**

Values:
- `tool for impact` - Wealth as means to create positive change
- `security need` - Financial safety as primary concern
- `status symbol` - Wealth as marker of success or achievement
- `corrupting force` - Money viewed as inherently problematic

**Examples**:
- Peter Singer: `tool for impact` (effective altruism philosophy)
- Steve Jobs: `tool for impact` (wealth enables revolutionary products)
- Traditional philosophers: `corrupting force` (skeptical of material wealth)

**Inference Logic**:
- Philosophers/activists with altruistic values → `tool for impact` or `corrupting force`
- Entrepreneurs focused on innovation → `tool for impact`
- Business leaders → `status symbol` or `tool for impact`
- Academics/researchers → `security need`

#### `resource_allocation_priority` (string)
**Primary approach to allocating resources**

Values:
- `long-term investment` - Patient capital, future-focused
- `immediate needs` - Present-focused spending
- `experimentation` - Willing to risk on innovation
- `conservation` - Careful preservation of resources

**Examples**:
- Tech entrepreneurs: `experimentation`
- Investors/strategists: `long-term investment`
- Activists/humanitarian: `immediate needs`
- Traditional/classical domains: `conservation`

#### `generosity_pattern` (string)
**How they share resources with others**

Values:
- `proactive giver` - Actively seeks to help/donate
- `strategic philanthropist` - Calculated giving for maximum impact
- `reciprocal` - Gives when receives
- `protective` - Guards resources carefully

**Examples**:
- Effective altruists: `strategic philanthropist`
- Humanitarian activists: `proactive giver`
- Business leaders: `strategic philanthropist`
- Traditional/conservative: `protective`

#### `financial_risk_appetite` (string)
**Comfort level with financial risk**

Values:
- `high risk tolerance` - Comfortable betting big
- `calculated risks` - Strategic risk-taking
- `risk-averse` - Prioritizes safety
- `minimizes exposure` - Avoids risk entirely

**Examples**:
- Startup founders: `high risk tolerance`
- Business strategists: `calculated risks`
- Academics/researchers: `risk-averse`

**Inference Logic**:
- Uses existing `practical_application.risk_tolerance` when available
- Entrepreneurs/innovators default to `high risk tolerance`
- Business/strategy domains default to `calculated risks`

#### `resource_transparency` (string)
**Openness about financial matters**

Values:
- `fully transparent` - Open about finances
- `selective disclosure` - Shares when relevant
- `private` - Keeps financial matters confidential
- `secretive` - Actively hides financial information

**Examples**:
- Effective altruists: `fully transparent`
- Activists with transparency values: `fully transparent`
- Business/entertainment: `private`
- Default: `selective disclosure`

---

## Time Orientation

Time horizon shapes decision-making, reveals deeper motivations, and indicates legacy concerns. Understanding how influential figures think about time provides crucial context for their choices and impact.

### Fields

#### `time_horizon` (string)
**Primary time frame for planning and thinking**

Values:
- `quarterly` - Short-term focus (3-12 months)
- `annual` - Year-to-year planning
- `decade` - 5-10 year thinking
- `generational` - 20-50 year perspective
- `civilizational` - Century+ time horizon

**Examples**:
- Philosophers/futurists: `generational` or `civilizational`
- Environmental/climate: `generational`
- Investors/strategists: `decade`
- Public company CEOs: `annual`
- Startups: `quarterly`

**Inference Logic**:
- Domain/archetype containing 'philosophy', 'futurist', 'visionary' → `generational`/`civilizational`
- 'environment', 'climate', 'sustainability' → `generational`
- 'investor', 'strategy', 'planning' → `decade`
- Default: `decade`

#### `legacy_concern` (string)
**Level of concern with being remembered**

Values:
- `indifferent` - Not focused on being remembered
- `concerned with reputation` - Cares about perception
- `focused on impact` - Wants lasting positive change
- `obsessed with immortality` - Driven by being remembered

**Examples**:
- Visionaries/pioneers: `obsessed with immortality`
- Impact-focused (activists, ethicists): `focused on impact`
- Public figures (entertainment, politics): `concerned with reputation`
- Researchers/academics: `focused on impact`

#### `present_vs_future_balance` (string)
**Balance between present enjoyment and future planning**

Values:
- `live for today` - Present-moment focus
- `balanced` - Healthy mix of now and future
- `sacrifice present for future` - Deferred gratification
- `haunted by past` - Past-focused

**Examples**:
- Visionaries/futurists: `sacrifice present for future`
- Artists/entertainers: `live for today`
- Historians/preservationists: `haunted by past`
- Most professionals: `balanced`

#### `intergenerational_thinking` (string)
**Scope of consideration beyond own lifetime**

Values:
- `self-focused` - Own lifetime only
- `children's generation` - Next generation
- `multi-generational` - Grandchildren and beyond
- `species-level` - Humanity's long-term future

**Examples**:
- Existential risk thinkers: `species-level`
- Environmental/sustainability: `multi-generational`
- Education/family-focused: `children's generation`
- Entertainment/sports: `self-focused`

#### `urgency_vs_patience` (string)
**Approach to timing and pace**

Values:
- `impatient` - Everything is urgent
- `strategic urgency` - Knows when to move fast
- `patient` - Willing to wait for results
- `overly patient` - Risk of inaction

**Examples**:
- Entrepreneurs/startups: `strategic urgency`
- Researchers/academics: `patient`
- Business strategists: `strategic urgency`

**Inference Logic**:
- Uses existing `practical_application.decision_speed` when available
- 'fast', 'quick', 'immediate' → `impatient`
- 'deliberate', 'patient' → `patient`

---

## Collaboration Enhancement

Expands the existing collaboration category with deeper interpersonal patterns, conflict resolution approaches, and team dynamics. These fields reveal how influential figures work with others and develop talent.

### Fields

#### `conflict_resolution_style` (string)
**Approach to resolving disagreements**

Values:
- `confrontational` - Direct address of issues
- `mediating` - Facilitates resolution
- `avoidant` - Sidesteps conflict
- `diplomatic` - Navigates carefully

**Examples**:
- Demanding/blunt leaders: `confrontational`
- Empathetic/compassionate: `mediating`
- Diplomatic/political: `diplomatic`
- Withdrawn/introverted: `avoidant`

**Inference Logic**:
- Uses existing `collaboration.conflict_resolution` when descriptive
- Infers from psychological traits (demanding, empathetic, diplomatic, withdrawn)

#### `credit_sharing_behavior` (string)
**How they attribute success and recognition**

Values:
- `generous attribution` - Quick to credit others
- `balanced` - Fair credit distribution
- `credit-seeking` - Ensures own recognition
- `self-effacing` - Deflects credit to team

**Examples**:
- Ego-driven personalities: `credit-seeking`
- Humble/servant leaders: `generous attribution`
- Team-oriented: `generous attribution`
- Default: `balanced`

**Inference Logic**:
- Traits like 'egotistical', 'narcissistic', 'dominant' → `credit-seeking`
- Traits like 'humble', 'selfless', 'altruistic' → `generous attribution`
- Traits like 'collaborative', 'team', 'facilitator' → `generous attribution`

#### `mentorship_inclination` (string)
**Tendency to develop others**

Values:
- `natural mentor` - Actively develops others
- `selective mentor` - Mentors chosen few
- `reciprocal only` - Mentor/protégé relationships
- `lone wolf` - Prefers working independently

**Examples**:
- Teachers/educators: `natural mentor`
- Independent artists/writers: `lone wolf`
- Leaders/executives: `selective mentor`

**Inference Logic**:
- Uses existing `collaboration.mentorship_approach` when available
- Domain containing 'education', 'teaching', 'professor' → `natural mentor`
- Independent artists/writers without collaborative traits → `lone wolf`

#### `feedback_style` (string)
**How they give constructive criticism**

Values:
- `direct and immediate` - Real-time, blunt feedback
- `constructive and structured` - Thoughtful, organized
- `gentle and encouraging` - Supportive approach
- `avoids giving feedback` - Reluctant to critique

**Examples**:
- Direct/blunt personalities: `direct and immediate`
- Empathetic/supportive: `gentle and encouraging`
- Analytical/systematic: `constructive and structured`
- Conflict-avoidant: `avoids giving feedback`

**Inference Logic**:
- Infers from traits and communication tone
- 'blunt', 'direct', 'demanding', 'harsh' → `direct and immediate`
- 'empathetic', 'supportive', 'compassionate' → `gentle and encouraging`

#### `delegation_approach` (string)
**How they distribute tasks and authority**

Values:
- `empowers fully` - Complete autonomy
- `structured delegation` - Clear boundaries and check-ins
- `micromanages` - Heavy oversight
- `reluctant to delegate` - Prefers doing themselves

**Examples**:
- Perfectionists/controlling: `micromanages`
- Empowering leaders: `empowers fully`
- Lone wolves: `reluctant to delegate`
- Systematic/organized: `structured delegation`

**Inference Logic**:
- Traits like 'perfectionist', 'controlling', 'demanding' → `micromanages`
- Leadership style containing 'empowering', 'autonomy' → `empowers fully`
- Traits like 'lone', 'independent', 'solo' → `reluctant to delegate`

---

## Implementation Details

### Data Population

All Tier 2 data is generated through intelligent inference based on:
- Existing profile fields (values, traits, practical_application, collaboration)
- Biographical domain and archetype information
- Communication patterns and leadership style
- Known behaviors and documented actions

**Script**: `scripts/populate-tier2-categories.py`

### API/JSON Format

All fields are accessible via standard profile JSON:

```json
{
  "name": "Profile Name",
  "resource_relationship": {
    "wealth_perspective": "tool for impact",
    "resource_allocation_priority": "experimentation",
    "generosity_pattern": "strategic philanthropist",
    "financial_risk_appetite": "high risk tolerance",
    "resource_transparency": "selective disclosure"
  },
  "time_orientation": {
    "time_horizon": "decade",
    "legacy_concern": "focused on impact",
    "present_vs_future_balance": "balanced",
    "intergenerational_thinking": "multi-generational",
    "urgency_vs_patience": "strategic urgency"
  },
  "collaboration_enhancement": {
    "conflict_resolution_style": "diplomatic",
    "credit_sharing_behavior": "balanced",
    "mentorship_inclination": "natural mentor",
    "feedback_style": "constructive and structured",
    "delegation_approach": "structured delegation"
  }
}
```

### UI Integration

#### Filter Sections
Three new filter sections appear below Tier 1 categories:
- **Resource Relationship** - Filter by wealth perspective and resource patterns
- **Time Orientation** - Filter by time horizon and legacy concern
- **Collaboration Enhancement** - Filter by conflict resolution and mentorship style

#### Details Modal Display
Three new category cards appear in expanded profile view, each containing:
- Category header with trait count
- Sections for each field (5 per category)
- Trait chips with hierarchical color coding

---

## Data Quality Standards

### Inference-Based, Not Speculative
- Uses documented behaviors and existing profile data as evidence
- Infers from patterns in domain, archetype, traits, and values
- Defaults to conservative/balanced values when uncertain

### Verifiable Sources
- Existing profile fields and documented traits
- Known biographical information
- Published values and stated philosophies
- Career decisions and leadership patterns

### Clear Defaults
- When insufficient data: Use middle-ground values (`balanced`, `strategic`)
- Conservative approach to avoid overstating characteristics
- Open to refinement with better information

---

## Statistics

- **Total Profiles**: 265
- **Total New Fields**: 15 (5 per category)
- **Coverage**: 100% of profiles populated
- **Inference Success**: All profiles have complete Tier 2 data

---

## Future Enhancements

### Potential Tier 3 Categories
- **Social & Emotional Intelligence**: Empathy depth, emotional regulation
- **Innovation Patterns**: Experimentation frequency, failure tolerance
- **Learning Styles**: Knowledge integration, skill acquisition

### Refinement Opportunities
- Add confidence scores for inferred values
- Enable community submissions for verification
- Expand value options based on additional research

---

## Usage for AI Training

Tier 2 categories are especially valuable for:

1. **Financial Decision Contexts**: Understanding how personas approach money and risk
2. **Long-term Planning Scenarios**: Knowing time horizons shapes strategic conversations
3. **Team Dynamics**: Simulating realistic conflict resolution and delegation patterns
4. **Legacy/Impact Discussions**: Authentic responses about goals beyond immediate success
5. **Resource Allocation**: How personas would advise on spending and investment

---

**Created**: 2025-10-17  
**Version**: 10.0  
**Status**: Production  
**Script**: `scripts/populate-tier2-categories.py`

