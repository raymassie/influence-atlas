#!/usr/bin/env python3
"""
Populate Tier 2 Categories for all profiles.

This script adds the new Tier 2 expansion fields to all 265 profiles:
- Resource Relationship (5 fields)
- Time Orientation (5 fields)
- Collaboration Enhancement (5 fields)

It uses known biographical information and existing profile data to make educated assessments.
"""

import json
import os
from pathlib import Path


# ============================================================================
# RESOURCE RELATIONSHIP - Inference Logic
# ============================================================================

def infer_wealth_perspective(profile):
    """
    Infer how they view money and resources.
    
    Values:
    - tool for impact: Wealth as means to create change
    - security need: Financial safety as primary goal
    - status symbol: Wealth as marker of success
    - corrupting force: Money as inherently problematic
    """
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    core_values = profile.get('values', {}).get('core_values', [])
    core_values_str = ' '.join([str(v).lower() for v in core_values]) if isinstance(core_values, list) else str(core_values).lower()
    
    # Philosophers, activists, ethicists often see wealth as tool or corrupting
    if any(term in domain or term in archetype for term in ['philosophy', 'ethics', 'activist', 'social justice']):
        if any(term in core_values_str for term in ['altruism', 'poverty', 'justice', 'equality']):
            return 'tool for impact'
        return 'corrupting force'
    
    # Entrepreneurs, investors - could be any, lean toward tool or status
    if any(term in domain or term in archetype for term in ['entrepreneur', 'investor', 'business', 'ceo']):
        if any(term in core_values_str for term in ['impact', 'innovation', 'change']):
            return 'tool for impact'
        return 'status symbol'
    
    # Artists, creatives - often ambivalent
    if any(term in domain or term in archetype for term in ['artist', 'musician', 'writer', 'creative']):
        return 'corrupting force'
    
    # Academics, researchers - security and impact
    if any(term in domain or term in archetype for term in ['academic', 'researcher', 'professor', 'scientist']):
        return 'security need'
    
    # Default
    return 'tool for impact'


def infer_resource_allocation_priority(profile):
    """
    Infer primary approach to allocating resources.
    
    Values:
    - long-term investment: Patient capital, future focus
    - immediate needs: Present-focused spending
    - experimentation: Willing to risk on innovation
    - conservation: Careful preservation of resources
    """
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    
    # Tech entrepreneurs - experimentation
    if any(term in domain or term in archetype for term in ['tech', 'startup', 'innovation', 'entrepreneur']):
        return 'experimentation'
    
    # Long-term thinkers (investors, strategists)
    if any(term in domain or term in archetype for term in ['investor', 'strategy', 'visionary']):
        return 'long-term investment'
    
    # Activists, humanitarian - immediate needs
    if any(term in domain or term in archetype for term in ['activist', 'humanitarian', 'poverty', 'relief']):
        return 'immediate needs'
    
    # Conservative domains
    if any(term in domain or term in archetype for term in ['traditional', 'classical', 'preservation']):
        return 'conservation'
    
    return 'long-term investment'


def infer_generosity_pattern(profile):
    """
    Infer how they share resources with others.
    
    Values:
    - proactive giver: Actively seeks to help/donate
    - strategic philanthropist: Calculated giving for maximum impact
    - reciprocal: Gives when receives
    - protective: Guards resources carefully
    """
    core_values = profile.get('values', {}).get('core_values', [])
    core_values_str = ' '.join([str(v).lower() for v in core_values]) if isinstance(core_values, list) else str(core_values).lower()
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    
    # Effective altruists, humanitarians - strategic or proactive
    if any(term in core_values_str for term in ['altruism', 'giving', 'charity', 'poverty']):
        if 'effective' in core_values_str:
            return 'strategic philanthropist'
        return 'proactive giver'
    
    # Entrepreneurs, business leaders - strategic
    if any(term in domain or term in archetype for term in ['entrepreneur', 'ceo', 'business', 'investor']):
        return 'strategic philanthropist'
    
    # Traditional, conservative - protective
    if any(term in domain or term in archetype for term in ['traditional', 'conservative']):
        return 'protective'
    
    # Default to reciprocal
    return 'reciprocal'


def infer_financial_risk_appetite(profile):
    """
    Infer comfort level with financial risk.
    
    Values:
    - high risk tolerance: Comfortable betting big
    - calculated risks: Strategic risk-taking
    - risk-averse: Prioritizes safety
    - minimizes exposure: Avoids risk entirely
    """
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    practical = profile.get('practical_application', {})
    risk_tolerance = str(practical.get('risk_tolerance', '')).lower()
    
    # Use existing risk_tolerance if available
    if 'high' in risk_tolerance or 'bold' in risk_tolerance:
        return 'high risk tolerance'
    if 'calculated' in risk_tolerance or 'strategic' in risk_tolerance:
        return 'calculated risks'
    if 'averse' in risk_tolerance or 'conservative' in risk_tolerance:
        return 'risk-averse'
    
    # Entrepreneurs, innovators - high risk
    if any(term in domain or term in archetype for term in ['entrepreneur', 'startup', 'innovation', 'disrupt']):
        return 'high risk tolerance'
    
    # Business strategists - calculated
    if any(term in domain or term in archetype for term in ['business', 'strategy', 'executive']):
        return 'calculated risks'
    
    # Academics, traditional - risk-averse
    if any(term in domain or term in archetype for term in ['academic', 'researcher', 'traditional', 'classical']):
        return 'risk-averse'
    
    return 'calculated risks'


def infer_resource_transparency(profile):
    """
    Infer openness about financial matters.
    
    Values:
    - fully transparent: Open about finances
    - selective disclosure: Shares when relevant
    - private: Keeps financial matters confidential
    - secretive: Actively hides financial information
    """
    core_values = profile.get('values', {}).get('core_values', [])
    core_values_str = ' '.join([str(v).lower() for v in core_values]) if isinstance(core_values, list) else str(core_values).lower()
    domain = profile.get('domain', '').lower()
    
    # Activists, ethicists who value transparency
    if any(term in core_values_str for term in ['transparency', 'openness', 'accountability']):
        return 'fully transparent'
    
    # Effective altruists - often transparent
    if 'altruism' in core_values_str or 'activist' in domain:
        return 'fully transparent'
    
    # Business, entertainment - private
    if any(term in domain for term in ['business', 'entertainment', 'celebrity']):
        return 'private'
    
    # Default
    return 'selective disclosure'


# ============================================================================
# TIME ORIENTATION - Inference Logic
# ============================================================================

def infer_time_horizon(profile):
    """
    Infer primary time frame for planning and thinking.
    
    Values:
    - quarterly: Short-term focus (3-12 months)
    - annual: Year-to-year planning
    - decade: 5-10 year thinking
    - generational: 20-50 year perspective
    - civilizational: Century+ time horizon
    """
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    core_values = profile.get('values', {}).get('core_values', [])
    core_values_str = ' '.join([str(v).lower() for v in core_values]) if isinstance(core_values, list) else str(core_values).lower()
    
    # Philosophers, futurists - generational/civilizational
    if any(term in domain or term in archetype for term in ['philosophy', 'futurist', 'visionary']):
        if any(term in core_values_str for term in ['humanity', 'civilization', 'future']):
            return 'civilizational'
        return 'generational'
    
    # Environmental, climate - generational
    if any(term in domain or term in archetype for term in ['environment', 'climate', 'sustainability']):
        return 'generational'
    
    # Investors, strategists - decade
    if any(term in domain or term in archetype for term in ['investor', 'strategy', 'planning']):
        return 'decade'
    
    # Public companies, quarterly reporting - quarterly/annual
    if any(term in domain or term in archetype for term in ['ceo', 'executive', 'public company']):
        return 'annual'
    
    # Startups - quarterly to annual
    if 'startup' in domain or 'startup' in archetype:
        return 'quarterly'
    
    return 'decade'


def infer_legacy_concern(profile):
    """
    Infer level of concern with being remembered.
    
    Values:
    - indifferent: Not focused on being remembered
    - concerned with reputation: Cares about perception
    - focused on impact: Wants lasting positive change
    - obsessed with immortality: Driven by being remembered
    """
    core_values = profile.get('values', {}).get('core_values', [])
    core_values_str = ' '.join([str(v).lower() for v in core_values]) if isinstance(core_values, list) else str(core_values).lower()
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    
    # Visionaries, innovators - obsessed with immortality
    if any(term in archetype for term in ['visionary', 'pioneer', 'revolutionary']):
        return 'obsessed with immortality'
    
    # Impact-focused (activists, ethicists)
    if any(term in core_values_str for term in ['impact', 'change', 'justice', 'altruism']):
        return 'focused on impact'
    
    # Public figures - concerned with reputation
    if any(term in domain for term in ['entertainment', 'politics', 'media', 'celebrity']):
        return 'concerned with reputation'
    
    # Researchers, academics - focused on impact
    if any(term in domain for term in ['research', 'academic', 'science']):
        return 'focused on impact'
    
    return 'focused on impact'


def infer_present_vs_future_balance(profile):
    """
    Infer balance between present enjoyment and future planning.
    
    Values:
    - live for today: Present-moment focus
    - balanced: Healthy mix of now and future
    - sacrifice present for future: Deferred gratification
    - haunted by past: Past-focused
    """
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    
    # Visionaries, long-term thinkers - sacrifice present
    if any(term in archetype for term in ['visionary', 'futurist', 'pioneer']):
        return 'sacrifice present for future'
    
    # Artists, entertainers - live for today
    if any(term in domain for term in ['artist', 'musician', 'entertainment', 'performer']):
        return 'live for today'
    
    # Historians, preservationists - haunted by past
    if any(term in domain for term in ['history', 'preservation', 'classical']):
        return 'haunted by past'
    
    # Most professionals - balanced
    return 'balanced'


def infer_intergenerational_thinking(profile):
    """
    Infer scope of consideration beyond own lifetime.
    
    Values:
    - self-focused: Own lifetime only
    - children's generation: Next generation
    - multi-generational: Grandchildren and beyond
    - species-level: Humanity's long-term future
    """
    core_values = profile.get('values', {}).get('core_values', [])
    core_values_str = ' '.join([str(v).lower() for v in core_values]) if isinstance(core_values, list) else str(core_values).lower()
    domain = profile.get('domain', '').lower()
    
    # Existential risk, longtermism - species-level
    if any(term in core_values_str for term in ['humanity', 'existential', 'civilization', 'species']):
        return 'species-level'
    
    # Environmental, sustainability - multi-generational
    if any(term in domain for term in ['environment', 'sustainability', 'climate']):
        return 'multi-generational'
    
    # Education, family-focused - children's generation
    if any(term in domain for term in ['education', 'parenting', 'youth']):
        return "children's generation"
    
    # Short-term domains - self-focused
    if any(term in domain for term in ['entertainment', 'sports', 'fashion']):
        return 'self-focused'
    
    return 'multi-generational'


def infer_urgency_vs_patience(profile):
    """
    Infer approach to timing and pace.
    
    Values:
    - impatient: Everything is urgent
    - strategic urgency: Knows when to move fast
    - patient: Willing to wait for results
    - overly patient: Risk of inaction
    """
    domain = profile.get('domain', '').lower()
    archetype = profile.get('archetype', '').lower()
    practical = profile.get('practical_application', {})
    decision_speed = str(practical.get('decision_speed', '')).lower()
    
    # Use existing decision_speed if available
    if 'fast' in decision_speed or 'quick' in decision_speed or 'immediate' in decision_speed:
        return 'impatient'
    if 'deliberate' in decision_speed or 'patient' in decision_speed:
        return 'patient'
    
    # Entrepreneurs, startups - impatient or strategic urgency
    if any(term in domain or term in archetype for term in ['entrepreneur', 'startup']):
        return 'strategic urgency'
    
    # Researchers, academics - patient
    if any(term in domain for term in ['research', 'academic', 'science']):
        return 'patient'
    
    # Business strategists - strategic urgency
    if any(term in domain or term in archetype for term in ['business', 'strategy', 'executive']):
        return 'strategic urgency'
    
    return 'strategic urgency'


# ============================================================================
# COLLABORATION ENHANCEMENT - Inference Logic
# ============================================================================

def infer_conflict_resolution_style(profile):
    """
    Infer approach to resolving disagreements.
    
    Values:
    - confrontational: Direct address of issues
    - mediating: Facilitates resolution
    - avoidant: Sidesteps conflict
    - diplomatic: Navigates carefully
    """
    collab = profile.get('collaboration', {})
    conflict_res = str(collab.get('conflict_resolution', '')).lower()
    archetype = profile.get('archetype', '').lower()
    primary_traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join([str(t).lower() for t in primary_traits]) if isinstance(primary_traits, list) else str(primary_traits).lower()
    
    # Use existing conflict_resolution if descriptive
    if 'direct' in conflict_res or 'confrontational' in conflict_res:
        return 'confrontational'
    if 'diplomatic' in conflict_res or 'careful' in conflict_res:
        return 'diplomatic'
    if 'mediat' in conflict_res or 'facilitat' in conflict_res:
        return 'mediating'
    if 'avoid' in conflict_res:
        return 'avoidant'
    
    # Infer from traits
    if any(term in traits_str for term in ['demanding', 'blunt', 'aggressive', 'abrasive']):
        return 'confrontational'
    if any(term in traits_str for term in ['empathetic', 'compassionate', 'facilitator']):
        return 'mediating'
    if any(term in traits_str for term in ['diplomatic', 'political', 'strategic']):
        return 'diplomatic'
    if any(term in traits_str for term in ['withdrawn', 'introverted', 'shy']):
        return 'avoidant'
    
    return 'diplomatic'


def infer_credit_sharing_behavior(profile):
    """
    Infer how they attribute success and recognition.
    
    Values:
    - generous attribution: Quick to credit others
    - balanced: Fair credit distribution
    - credit-seeking: Ensures own recognition
    - self-effacing: Deflects credit to team
    """
    primary_traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join([str(t).lower() for t in primary_traits]) if isinstance(primary_traits, list) else str(primary_traits).lower()
    archetype = profile.get('archetype', '').lower()
    
    # Ego-driven personalities - credit-seeking
    if any(term in traits_str for term in ['egotistical', 'narcissistic', 'demanding', 'dominant']):
        return 'credit-seeking'
    
    # Humble, servant leaders - generous or self-effacing
    if any(term in traits_str for term in ['humble', 'servant', 'selfless', 'altruistic']):
        return 'generous attribution'
    
    # Team-oriented - generous
    if any(term in traits_str for term in ['collaborative', 'team', 'facilitator']):
        return 'generous attribution'
    
    return 'balanced'


def infer_mentorship_inclination(profile):
    """
    Infer tendency to develop others.
    
    Values:
    - natural mentor: Actively develops others
    - selective mentor: Mentors chosen few
    - reciprocal only: Mentor/protégé relationships
    - lone wolf: Prefers working independently
    """
    collab = profile.get('collaboration', {})
    mentorship = str(collab.get('mentorship_approach', '')).lower()
    primary_traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join([str(t).lower() for t in primary_traits]) if isinstance(primary_traits, list) else str(primary_traits).lower()
    domain = profile.get('domain', '').lower()
    
    # Use existing mentorship_approach
    if 'active' in mentorship or 'natural' in mentorship:
        return 'natural mentor'
    if 'selective' in mentorship or 'chosen' in mentorship:
        return 'selective mentor'
    if 'lone' in mentorship or 'independent' in mentorship:
        return 'lone wolf'
    
    # Teachers, educators - natural mentor
    if any(term in domain for term in ['education', 'teaching', 'professor', 'academic']):
        return 'natural mentor'
    
    # Independent artists, writers - lone wolf
    if any(term in domain for term in ['artist', 'writer']) and 'collaborative' not in traits_str:
        return 'lone wolf'
    
    # Leaders, executives - selective
    if any(term in domain for term in ['executive', 'ceo', 'leader']):
        return 'selective mentor'
    
    return 'natural mentor'


def infer_feedback_style(profile):
    """
    Infer how they give constructive criticism.
    
    Values:
    - direct and immediate: Real-time, blunt feedback
    - constructive and structured: Thoughtful, organized
    - gentle and encouraging: Supportive approach
    - avoids giving feedback: Reluctant to critique
    """
    primary_traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join([str(t).lower() for t in primary_traits]) if isinstance(primary_traits, list) else str(primary_traits).lower()
    comm_style = profile.get('communication_style', {})
    tone = str(comm_style.get('tone', '')).lower()
    
    # Direct, blunt personalities
    if any(term in traits_str or term in tone for term in ['blunt', 'direct', 'demanding', 'harsh', 'confrontational']):
        return 'direct and immediate'
    
    # Empathetic, supportive
    if any(term in traits_str or term in tone for term in ['empathetic', 'supportive', 'compassionate', 'gentle']):
        return 'gentle and encouraging'
    
    # Analytical, systematic
    if any(term in traits_str for term in ['analytical', 'systematic', 'methodical', 'structured']):
        return 'constructive and structured'
    
    # Conflict-avoidant
    if any(term in traits_str for term in ['avoidant', 'withdrawn', 'shy']):
        return 'avoids giving feedback'
    
    return 'constructive and structured'


def infer_delegation_approach(profile):
    """
    Infer how they distribute tasks and authority.
    
    Values:
    - empowers fully: Complete autonomy
    - structured delegation: Clear boundaries and check-ins
    - micromanages: Heavy oversight
    - reluctant to delegate: Prefers doing themselves
    """
    collab = profile.get('collaboration', {})
    leadership = str(collab.get('leadership_style', '')).lower()
    primary_traits = profile.get('psychological_profile', {}).get('primary_traits', [])
    traits_str = ' '.join([str(t).lower() for t in primary_traits]) if isinstance(primary_traits, list) else str(primary_traits).lower()
    
    # Micromanagers
    if any(term in traits_str or term in leadership for term in ['perfectionist', 'controlling', 'demanding', 'micromanag']):
        return 'micromanages'
    
    # Empowering leaders
    if any(term in leadership for term in ['empowering', 'autonomy', 'trust']):
        return 'empowers fully'
    
    # Lone wolves, perfectionists
    if any(term in traits_str for term in ['lone', 'independent', 'solo']):
        return 'reluctant to delegate'
    
    # Structured, systematic
    if any(term in traits_str for term in ['systematic', 'structured', 'organized']):
        return 'structured delegation'
    
    return 'structured delegation'


# ============================================================================
# MAIN POPULATION FUNCTION
# ============================================================================

def populate_tier2_categories(profile):
    """Add Tier 2 categories to a profile."""
    
    # Resource Relationship
    profile['resource_relationship'] = {
        'wealth_perspective': infer_wealth_perspective(profile),
        'resource_allocation_priority': infer_resource_allocation_priority(profile),
        'generosity_pattern': infer_generosity_pattern(profile),
        'financial_risk_appetite': infer_financial_risk_appetite(profile),
        'resource_transparency': infer_resource_transparency(profile)
    }
    
    # Time Orientation
    profile['time_orientation'] = {
        'time_horizon': infer_time_horizon(profile),
        'legacy_concern': infer_legacy_concern(profile),
        'present_vs_future_balance': infer_present_vs_future_balance(profile),
        'intergenerational_thinking': infer_intergenerational_thinking(profile),
        'urgency_vs_patience': infer_urgency_vs_patience(profile)
    }
    
    # Collaboration Enhancement
    profile['collaboration_enhancement'] = {
        'conflict_resolution_style': infer_conflict_resolution_style(profile),
        'credit_sharing_behavior': infer_credit_sharing_behavior(profile),
        'mentorship_inclination': infer_mentorship_inclination(profile),
        'feedback_style': infer_feedback_style(profile),
        'delegation_approach': infer_delegation_approach(profile)
    }
    
    return profile


def main():
    """Process all profiles and add Tier 2 categories."""
    
    # Get the project root (3 levels up from scripts/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    profiles_dir = project_root / 'profiles'
    
    if not profiles_dir.exists():
        print(f"❌ Profiles directory not found: {profiles_dir}")
        return
    
    # Get all JSON files
    profile_files = sorted(profiles_dir.glob('*.json'))
    
    if not profile_files:
        print(f"❌ No profile files found in {profiles_dir}")
        return
    
    print(f"📊 Found {len(profile_files)} profiles to process")
    print("=" * 70)
    
    success_count = 0
    error_count = 0
    
    for profile_file in profile_files:
        try:
            # Load profile
            with open(profile_file, 'r', encoding='utf-8') as f:
                profile = json.load(f)
            
            # Skip if already has Tier 2 data
            if 'resource_relationship' in profile and 'time_orientation' in profile and 'collaboration_enhancement' in profile:
                print(f"⏭️  {profile.get('name', profile_file.name):40} - Already has Tier 2 data")
                success_count += 1
                continue
            
            # Add Tier 2 categories
            profile = populate_tier2_categories(profile)
            
            # Save back to file
            with open(profile_file, 'w', encoding='utf-8') as f:
                json.dump(profile, f, indent=2, ensure_ascii=False)
            
            print(f"✅ {profile.get('name', profile_file.name):40} - Tier 2 data added")
            success_count += 1
            
        except Exception as e:
            print(f"❌ {profile_file.name:40} - Error: {str(e)}")
            error_count += 1
    
    print("=" * 70)
    print(f"\n✨ Tier 2 Population Complete!")
    print(f"   Success: {success_count}")
    print(f"   Errors:  {error_count}")
    print(f"\n📝 Next steps:")
    print(f"   1. Review sample profiles for quality")
    print(f"   2. Update all-profiles.json")
    print(f"   3. Add UI filters for Tier 2 categories")
    print(f"   4. Test filtering and display")


if __name__ == '__main__':
    main()

