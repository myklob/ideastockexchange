# Belief Tag Schema Documentation

## Overview

This document describes the comprehensive tagging and scoring system for beliefs in the Idea Stock Exchange. Every belief and relationship is tagged with multiple dimensions of metadata and scoring.

## Core Principle

**All beliefs have text IDs.** Every belief must have a unique identifier (slug or hash) that serves as its primary key in the system.

## Tag Types

### 1. BeliefTag

The fundamental tag for all beliefs.

**Required Fields:**
- `text_id` (string): Unique identifier (slug or SHA-1 hash)
- `statement` (string): The belief statement

**Optional Fields:**
- `category` (string): Category/topic (default: "other")
- `description` (string): Extended description
- `created` (datetime): Creation timestamp
- `updated` (datetime): Last update timestamp

**Example:**
```xml
<Belief id="climate-change-human-caused">
  <Statement>Global warming is largely caused by humans</Statement>
  <Category>Science > Climate</Category>
  <Description>The scientific consensus is that human activities...</Description>
</Belief>
```

### 2. RelationshipTag

Tags representing belief-to-belief relationships. This is the **core tag for implementing "reasons to agree/disagree"**.

#### Purpose

A RelationshipTag represents one belief serving as a reason to agree or disagree with another belief.

#### Fields

**Identifiers:**
- `from_belief_id` (string): The belief providing the reason/argument
- `to_belief_id` (string): The belief being supported or opposed
- `relationship_type` (enum): "SUPPORTS" or "OPPOSES"

**Scoring Dimensions:**

Each relationship is scored across multiple dimensions (0.0 to 1.0 scale):

1. **linkage_score** (float 0-1):
   - How relevant is this connection?
   - Does the from_belief actually relate to the to_belief?
   - High score = strong logical connection
   - Low score = weak or tangential connection

2. **truth_score** (float 0-1):
   - How true is the from_belief itself?
   - Independent assessment of the supporting/opposing belief's validity
   - High score = well-evidenced, likely true
   - Low score = poorly evidenced, likely false

3. **importance_score** (float 0-1):
   - How important is this relationship?
   - Does this connection matter significantly to the conclusion?
   - High score = critical to the argument
   - Low score = minor or peripheral point

4. **evidence_strength** (float 0-1):
   - How strong is the evidence supporting this relationship?
   - Quality and quantity of evidence
   - High score = peer-reviewed studies, official data
   - Low score = anecdotal, opinion-based

**Composite Score:**
- `overall_contribution` (float): Weighted combination of the above scores
  - Formula: `(linkage × 0.4) + (truth × 0.3) + (importance × 0.2) + (evidence × 0.1)`
  - This represents the total contribution of this relationship to the target belief's score

**Metadata:**
- `created_at` (datetime): When the relationship was created
- `created_by` (string): User who created it
- `justification` (string): Explanation of why this relationship exists

#### XML Format

```xml
<SupportingArgument>
  <ConclusionID>climate-change-problem</ConclusionID>
  <SupportingArgumentID>climate-change-human-caused</SupportingArgumentID>
  <LinkageScore>85</LinkageScore>
  <TruthScore>90</TruthScore>
  <ImportanceScore>95</ImportanceScore>
  <EvidenceStrength>88</EvidenceStrength>
  <Justification>If humans cause climate change, addressing it requires human action</Justification>
</SupportingArgument>

<WeakeningArgument>
  <ConclusionID>tax-carbon-production</ConclusionID>
  <WeakeningArgumentID>taxes-harm-economy</WeakeningArgumentID>
  <LinkageScore>70</LinkageScore>
  <TruthScore>40</TruthScore>
  <ImportanceScore>60</ImportanceScore>
  <EvidenceStrength>35</EvidenceStrength>
</WeakeningArgument>
```

#### Alternative XML Format (Explicit Links)

```xml
<Link>
  <LinkID>1</LinkID>
  <IfThisBeliefWereTrueID>belief-A</IfThisBeliefWereTrueID>
  <AffectedBeliefID>belief-B</AffectedBeliefID>
  <LinkType>Supporting</LinkType>
  <JustificationText>If A is true, then B follows because...</JustificationText>
  <Scores>
    <Linkage>0.85</Linkage>
    <Truth>0.90</Truth>
    <Importance>0.80</Importance>
    <Evidence>0.75</Evidence>
  </Scores>
</Link>
```

### 3. EvidenceTag

Tags for evidence supporting or opposing beliefs.

**Fields:**
- `belief_id` (string): Which belief this evidence relates to
- `evidence_type` (enum): "supporting" or "opposing"
- `tier` (int 1-4): Evidence quality tier
  - **Tier 1**: Meta-analyses, peer-reviewed studies, official data
  - **Tier 2**: Expert analysis, institutional reports
  - **Tier 3**: Investigative journalism, surveys
  - **Tier 4**: Opinion pieces, anecdotal claims
- `description` (string): Description of the evidence
- `source` (string): Source name
- `url` (string): Link to evidence
- `score` (float 0-1): Evidence credibility score

### 4. ArgumentTag

Tags for arguments/reasons for beliefs.

**Fields:**
- `belief_id` (string): Which belief this argument relates to
- `argument_type` (enum): "supporting" or "opposing"
- `content` (string): The argument text
- `linkage_score` (float 0-1): Relevance to belief
- `evidence_score` (float 0-1): Quality of supporting evidence
- `logic_score` (float 0-1): Logical soundness
- `importance_score` (float 0-1): Significance

### 5. ValueTag

Tags for values associated with beliefs.

**Fields:**
- `belief_id` (string): Which belief
- `value_type` (enum): "supporting" or "opposing"
- `value_name` (string): Name of the value (e.g., "Freedom", "Equality")
- `is_advertised` (bool): Whether this is an advertised vs actual motivation

### 6. InterestTag

Tags for stakeholder interests.

**Fields:**
- `belief_id` (string): Which belief
- `interest_type` (enum): "supporter" or "opponent"
- `stakeholder` (string): Who has this interest
- `motivation` (string): What motivates them

### 7. AssumptionTag

Tags for foundational assumptions.

**Fields:**
- `belief_id` (string): Which belief
- `assumption_type` (enum): "required_to_accept" or "required_to_reject"
- `assumption` (string): The assumption statement

## Scoring System

### Belief Score Calculation

Each belief receives an overall score from 0-100 based on its supporting and opposing relationships:

```
Base Score = 50 (neutral)
Final Score = Base + Σ(supporting contributions × 10) - Σ(opposing contributions × 10)
Clamped to [0, 100]
```

### Score Interpretation

- **80-100**: Strongly Supported (well-evidenced, minimal opposition)
- **60-79**: Moderately Supported (good evidence, some concerns)
- **40-59**: Contested (balanced arguments on both sides)
- **20-39**: Weakly Supported (strong opposition, limited support)
- **0-19**: Likely False (overwhelming opposition, little support)

### Relationship Contribution Calculation

Each relationship's contribution is calculated as:

```
contribution = (linkage × 0.4) + (truth × 0.3) + (importance × 0.2) + (evidence × 0.1)
```

**Why these weights?**
- **Linkage (40%)**: Most important - the connection must be relevant
- **Truth (30%)**: The supporting belief must be true
- **Importance (20%)**: The connection must matter
- **Evidence (10%)**: Evidence quality provides confidence

## Complete Example

### XML Input

```xml
<?xml version="1.0" encoding="UTF-8"?>
<BeliefAnalysis>
  <Beliefs>
    <Belief id="climate-action-needed">
      <Statement>We need to take action on climate change</Statement>
      <Category>Policy > Environment</Category>
    </Belief>

    <Belief id="climate-change-real">
      <Statement>Climate change is happening</Statement>
      <Category>Science > Climate</Category>
    </Belief>

    <Belief id="human-activity-causes-climate-change">
      <Statement>Human activities are the primary cause of climate change</Statement>
      <Category>Science > Climate</Category>
    </Belief>
  </Beliefs>

  <Arguments>
    <SupportingArgument>
      <ConclusionID>climate-action-needed</ConclusionID>
      <SupportingArgumentID>climate-change-real</SupportingArgumentID>
      <LinkageScore>90</LinkageScore>
      <TruthScore>95</TruthScore>
      <ImportanceScore>100</ImportanceScore>
      <EvidenceStrength>98</EvidenceStrength>
    </SupportingArgument>

    <SupportingArgument>
      <ConclusionID>climate-change-real</ConclusionID>
      <SupportingArgumentID>human-activity-causes-climate-change</SupportingArgumentID>
      <LinkageScore>85</LinkageScore>
      <TruthScore>92</TruthScore>
      <ImportanceScore>90</ImportanceScore>
      <EvidenceStrength>95</EvidenceStrength>
    </SupportingArgument>
  </Arguments>
</BeliefAnalysis>
```

### Processing

The system will:

1. Parse all beliefs and create BeliefTags
2. Parse all relationships and create RelationshipTags
3. Calculate contribution scores for each relationship:
   - First relationship: `(0.90×0.4) + (0.95×0.3) + (1.0×0.2) + (0.98×0.1) = 0.943`
   - Second relationship: `(0.85×0.4) + (0.92×0.3) + (0.90×0.2) + (0.95×0.1) = 0.891`
4. Calculate belief scores:
   - `climate-action-needed`: 50 + (0.943 × 10) = 59.43 ≈ 59 (Moderately Supported)
   - `climate-change-real`: 50 + (0.891 × 10) = 58.91 ≈ 59 (Moderately Supported)

## Usage with Transform Script

```bash
# Transform XML to HTML templates
python backend/scripts/transform_to_template.py \
  -i BeliefOutlineData.xml \
  -o output/beliefs

# Transform specific belief
python backend/scripts/transform_to_template.py \
  -i BeliefOutlineData.xml \
  -o output/beliefs \
  -b climate-action-needed
```

## Database Integration

The tag schema can be integrated with the existing MongoDB models:

- **BeliefTag** → `Belief` model
- **RelationshipTag** → `BeliefLink` model
- **ArgumentTag** → `Argument` model
- **EvidenceTag** → `Evidence` model

The scoring system complements the existing ReasonRank algorithm and can provide an alternative or supplementary scoring method.

## Future Extensions

Potential additional tags:

1. **TemporalTag**: Time-based relevance (when is this belief applicable?)
2. **GeographicTag**: Location-based relevance
3. **ContextTag**: Under what conditions is this belief valid?
4. **CounterargumentTag**: Explicit rebuttals and responses
5. **MetaTag**: Tags about tags (confidence in the tagging itself)

## Summary

This tag schema provides:

1. ✅ **Text IDs for all beliefs** (required)
2. ✅ **Tags for "reason to agree"** (RelationshipTag with type="SUPPORTS")
3. ✅ **Tags for "reason to disagree"** (RelationshipTag with type="OPPOSES")
4. ✅ **Associated scores** (linkage, truth, importance, evidence)
5. ✅ **Overall contribution score** (weighted combination)
6. ✅ **Extensible design** (easy to add new tag types)

The system transforms XML/PHP data into structured HTML templates while preserving all relationship information and scoring metadata.
