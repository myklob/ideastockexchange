# Belief Classification System

## Overview

The Belief Classification System is a comprehensive framework for organizing and analyzing beliefs according to three structured hierarchical spectrums. This system enables the Idea Stock Exchange to create **one page per belief** by grouping all variations of a belief along these spectrums.

## Core Classification Spectrums

### 1. Positivity/Negativity (Sentiment Spectrum)

**Purpose**: Categorizes whether a belief portrays its subject positively or negatively.

**Hierarchy Levels** (from negative to positive):
1. **Extremely Negative** (-100 to -80)
   - Strongest negative characterization
   - Indicates complete failure, danger, or harm
   - Example: "Ford trucks are death traps"

2. **Strongly Negative** (-79 to -55)
   - Clear negative assessment with significant criticism
   - Example: "Ford makes bad trucks"

3. **Moderately Negative** (-54 to -30)
   - Noticeable negative lean
   - Example: "Ford trucks are disappointing"

4. **Mildly Negative** (-29 to -10)
   - Slight negative tendency
   - Example: "Ford trucks are not very efficient"

5. **Neutral** (-9 to 9)
   - Balanced or factual statement
   - Example: "Ford manufactures trucks"

6. **Mildly Positive** (10 to 29)
   - Slight positive tendency
   - Example: "Ford trucks are decent vehicles"

7. **Moderately Positive** (30 to 54)
   - Clear approval
   - Example: "Ford makes good trucks"

8. **Strongly Positive** (55 to 79)
   - Strong praise or endorsement
   - Example: "Ford makes great trucks"

9. **Extremely Positive** (80 to 100)
   - Strongest possible positive characterization
   - Example: "Ford makes the best trucks in the world"

### 2. Specificity Spectrum

**Purpose**: Measures how narrow (specific) or broad (general) a belief is.

**Hierarchy Levels** (from general to specific):
1. **Highly General** (0-20)
   - Applies to very broad categories or universal claims
   - Example: "Politicians are corrupt"

2. **Moderately General** (21-40)
   - Applies to identifiable groups
   - Example: "U.S. presidents tend to be corrupt"

3. **Baseline Concept** (41-60)
   - Standard level of specificity
   - Example: "Ford trucks have reliability issues"

4. **Moderately Specific** (61-80)
   - Names specific people, products, or policies
   - Example: "Bill Clinton was involved in corrupt practices"

5. **Highly Specific** (81-100)
   - References exact dates, versions, or unique circumstances
   - Example: "Bill Clinton committed perjury in his 1998 grand jury testimony"

### 3. Strength/Intensity Spectrum

**Purpose**: Measures how forceful, absolute, or hedged a claim is.

**Hierarchy Levels** (from weak to strong):
1. **Very Weak Claim** (0-20)
   - Highly hedged and tentative
   - Example: "This product might not be very smart"

2. **Weak Claim** (21-40)
   - Hedged but makes a claim
   - Example: "This product probably isn't very efficient"

3. **Moderate Claim** (41-60)
   - Clear assertion with some qualification
   - Example: "This product is inefficient"

4. **Strong Claim** (61-80)
   - Forceful assertion with minimal hedging
   - Example: "This product is stupid"

5. **Extreme Claim** (81-100)
   - Absolute, categorical language
   - Example: "This product is completely useless in all circumstances"

## Technical Architecture

### Database Schema

Each belief document includes:

```javascript
hierarchicalClassification: {
  sentiment: {
    levelId: String,        // e.g., "strongly_positive"
    levelName: String,      // e.g., "Strongly Positive"
    confidence: Number,     // 0-1 confidence score
    autoClassified: Boolean // Whether auto-classified or manual
  },
  specificity: {
    levelId: String,
    levelName: String,
    confidence: Number,
    autoClassified: Boolean
  },
  strength: {
    levelId: String,
    levelName: String,
    confidence: Number,
    autoClassified: Boolean
  },
  lastClassified: Date
}
```

### Classification Algorithm

The classification service uses multiple NLP techniques:

1. **Keyword Analysis**: Matches words against hierarchy definitions
2. **Pattern Recognition**: Identifies linguistic patterns (causal, modal, etc.)
3. **Context Analysis**: Considers negation, qualifiers, and intensifiers
4. **Discourse Markers**: Detects hedging, absolute language, and sentiment indicators

### Confidence Scoring

Confidence in classifications is calculated based on:
- Number of signal words detected
- Presence of clear linguistic markers
- Number of supporting arguments
- Clarity of the statement

## API Endpoints

### Classification

```bash
# Classify a single belief
POST /api/classification/classify/:beliefId

# Classify multiple beliefs
POST /api/classification/classify-batch
Body: { beliefIds: ["id1", "id2", ...] }

# Get classification summary
GET /api/classification/belief/:beliefId/summary
```

### Hierarchy Navigation

```bash
# Get all hierarchy definitions
GET /api/classification/hierarchies

# Get beliefs at a specific level
GET /api/classification/spectrum/:spectrum/:levelId
# Example: GET /api/classification/spectrum/sentiment/strongly_positive

# Get distribution for a topic
GET /api/classification/distribution/:topicId/:spectrum

# Get belief spectrum for comparison
GET /api/classification/spectrum/:topicId/:spectrum

# Get related beliefs
GET /api/classification/related/:beliefId
```

### Export

```bash
# Export belief to JSON
GET /api/classification/export/:beliefId

# Export belief to XML
GET /api/classification/export/:beliefId/xml

# Export with full ISE template
GET /api/classification/export/:beliefId/ise-template

# Export entire topic
GET /api/classification/export/topic/:topicId
```

### Analysis

```bash
# Extract sub-arguments from argument
POST /api/classification/extract-subarguments/:argumentId

# Analyze argument structure
POST /api/classification/analyze-structure/:argumentId

# Identify issues
POST /api/classification/identify-issues/:beliefId
```

## Usage Examples

### Classifying a Belief

```javascript
// Automatic classification
const response = await fetch('/api/classification/classify/BELIEF_ID', {
  method: 'POST'
});

const result = await response.json();
console.log(result.classification);
// {
//   sentiment: { levelId: 'strongly_positive', levelName: 'Strongly Positive', confidence: 0.85 },
//   specificity: { levelId: 'moderately_specific', levelName: 'Moderately Specific', confidence: 0.78 },
//   strength: { levelId: 'strong', levelName: 'Strong Claim', confidence: 0.82 }
// }
```

### Finding Beliefs Across a Spectrum

```javascript
// Get all "strongly positive" beliefs about a topic
const response = await fetch('/api/classification/spectrum/TOPIC_ID/sentiment');
const grouped = await response.json();

// grouped.grouped will contain beliefs organized by sentiment level
console.log(grouped.grouped.strongly_positive);
// Array of beliefs with strong positive sentiment
```

### Exporting Belief Data

```javascript
// Export complete belief with ISE template
const response = await fetch('/api/classification/export/BELIEF_ID/ise-template');
const template = await response.json();

console.log(template.iseTemplate);
// {
//   statement: "...",
//   reasonsToAgree: [...],
//   reasonsToDisagree: [...],
//   evidenceTiers: {...},
//   linkageScores: {...},
//   ...
// }
```

## Sub-Argument Extraction

The system automatically extracts sub-arguments from argument text:

### Extracted Components

1. **Premises**: Foundation statements
2. **Evidence**: Citations and data
3. **Assumptions**: Underlying presumptions
4. **Causal Claims**: X causes Y statements
5. **Examples**: Illustrative instances
6. **Counterarguments**: Contrasting points

### Discourse Markers Detected

- **Premise markers**: "because", "since", "given that"
- **Evidence markers**: "research shows", "data reveals"
- **Consequence markers**: "therefore", "thus", "hence"
- **Support markers**: "furthermore", "moreover"
- **Contrast markers**: "however", "but", "nevertheless"
- **Example markers**: "for example", "such as"

## Issue Prioritization

The system identifies and ranks issues based on:

### Priority Factors

1. **Severity** (30% weight): Impact magnitude
2. **Scale** (25% weight): Number affected
3. **Urgency** (20% weight): Time sensitivity
4. **Evidence Quality** (15% weight): Strength of evidence
5. **Solvability** (10% weight): Feasibility of solutions

### Issue Categories

- Policy Failure
- Misinformation
- Systemic Inequality
- Public Health
- Economic Harm
- Environmental
- Human Rights
- Corruption
- Safety Risk
- Market Failure
- Regulatory Gap
- Ethical Violation

### Solution Generation

For each identified issue, the system generates:
- Proposed solutions by type (legislative, educational, etc.)
- Feasibility estimates
- Expected impact
- Timeframe
- Required resources
- Key stakeholders

## Migration and Setup

### Initial Classification

Run the migration script to classify all existing beliefs:

```bash
node backend/scripts/migrateBeliefClassifications.js
```

This will:
1. Process all beliefs in the database
2. Calculate dimensional scores
3. Assign hierarchical classifications
4. Generate statistics
5. Skip recently classified beliefs (< 30 days)

### Manual Classification

Beliefs can also be manually classified through the API or by directly updating the database.

## Best Practices

### When to Use Each Spectrum

1. **Sentiment**: Understanding value judgments and emotional tone
2. **Specificity**: Organizing general principles vs specific cases
3. **Strength**: Evaluating claim confidence and hedging

### Grouping Related Beliefs

Create "one page per belief" by:
1. Identifying the baseline concept (moderate specificity)
2. Finding all variations across sentiment spectrum
3. Finding all variations across specificity spectrum
4. Finding all variations across strength spectrum
5. Linking them as related beliefs with appropriate relationships

### Example Belief Page Structure

**Topic**: Ford Trucks

**Baseline Concept**: "Ford trucks have reliability issues" (Moderately Negative, Baseline Concept, Moderate Claim)

**Variations by Sentiment**:
- Extremely Negative: "Ford trucks are death traps"
- Strongly Negative: "Ford makes bad trucks"
- Moderately Negative: "Ford trucks have reliability issues" (baseline)
- Neutral: "Ford manufactures various truck models"
- Moderately Positive: "Ford makes good trucks"
- Strongly Positive: "Ford makes great trucks"
- Extremely Positive: "Ford makes the best trucks in the world"

**Variations by Specificity**:
- Highly General: "All trucks have some issues"
- Moderately General: "American trucks often have problems"
- Baseline: "Ford trucks have reliability issues" (baseline)
- Moderately Specific: "Ford F-150s have transmission problems"
- Highly Specific: "2018 Ford F-150s with 10-speed transmission have shifting issues"

**Variations by Strength**:
- Very Weak: "Ford trucks might have some reliability concerns"
- Weak: "Ford trucks probably have more issues than average"
- Moderate: "Ford trucks have reliability issues" (baseline)
- Strong: "Ford trucks definitely have serious reliability problems"
- Extreme: "Ford trucks always fail and are completely unreliable"

## Integration with ISE Framework

The classification system integrates with all ISE components:

- **Arguments**: Sub-argument extraction and linkage
- **Evidence**: Automatic evidence tier categorization
- **Topics**: Hierarchical organization and distribution analysis
- **Scoring**: Integration with ReasonRank and conclusion scores
- **Export**: Comprehensive XML/JSON output for all components

## Future Enhancements

Planned improvements include:
1. Machine learning classification refinement
2. Multi-language support
3. Custom hierarchy definitions per topic
4. Interactive hierarchy visualization
5. Automatic belief merging based on similarity
6. Temporal tracking of classification changes
7. User feedback loop for classification accuracy

## Support and Maintenance

For issues or questions:
- Review API documentation
- Check hierarchy definitions in `/backend/config/hierarchyDefinitions.js`
- Examine classification service in `/backend/services/beliefClassificationService.js`
- Run migration script with verbose logging for debugging

## Performance Considerations

- Classifications are cached for 30 days
- Batch classification available for bulk operations
- Async processing recommended for large datasets
- Index on `hierarchicalClassification` fields for query performance
