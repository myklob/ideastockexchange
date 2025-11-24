# Belief Classification System - Quick Start Guide

## Introduction

The Belief Classification System organizes beliefs along three hierarchical spectrums:
1. **Positivity/Negativity** - Is it good or bad?
2. **Specificity** - How broad or narrow is it?
3. **Strength/Intensity** - How forceful is the claim?

This enables **one page per belief** that groups all variations together.

## 5-Minute Setup

### 1. Install Dependencies

Already installed! The system uses existing dependencies.

### 2. Run Migration (Optional)

If you have existing beliefs, classify them:

```bash
cd backend
node scripts/migrateBeliefClassifications.js
```

### 3. Start Server

```bash
npm start
```

The classification API is now available at `/api/classification/*`

## Quick Examples

### Example 1: Classify a Single Belief

```javascript
// POST /api/classification/classify/:beliefId
const response = await fetch('http://localhost:5000/api/classification/classify/BELIEF_ID', {
  method: 'POST'
});

const result = await response.json();
console.log(result.classification);
```

**Result**:
```json
{
  "sentiment": {
    "levelId": "strongly_positive",
    "levelName": "Strongly Positive",
    "confidence": 0.85
  },
  "specificity": {
    "levelId": "moderately_specific",
    "levelName": "Moderately Specific",
    "confidence": 0.78
  },
  "strength": {
    "levelId": "strong",
    "levelName": "Strong Claim",
    "confidence": 0.82
  }
}
```

### Example 2: Get All Hierarchies

```javascript
// GET /api/classification/hierarchies
const response = await fetch('http://localhost:5000/api/classification/hierarchies');
const hierarchies = await response.json();

console.log(hierarchies.hierarchies.sentiment.levels);
// Array of 9 levels from extremely_negative to extremely_positive
```

### Example 3: Find Beliefs at a Specific Level

```javascript
// GET /api/classification/spectrum/:spectrum/:levelId
const response = await fetch(
  'http://localhost:5000/api/classification/spectrum/sentiment/strongly_positive'
);

const result = await response.json();
console.log(result.beliefs);
// Array of all beliefs with strong positive sentiment
```

### Example 4: Export Belief with Full ISE Template

```javascript
// GET /api/classification/export/:beliefId/ise-template
const response = await fetch(
  'http://localhost:5000/api/classification/export/BELIEF_ID/ise-template'
);

const template = await response.json();
console.log(template.iseTemplate);
```

**Result includes**:
- Statement and description
- Hierarchical classifications
- Reasons to agree/disagree
- Evidence tiers
- Linkage scores
- Cost-benefit analysis structure
- Media resources
- And more!

### Example 5: Extract Sub-Arguments

```javascript
// POST /api/classification/extract-subarguments/:argumentId
const response = await fetch(
  'http://localhost:5000/api/classification/extract-subarguments/ARG_ID',
  { method: 'POST' }
);

const result = await response.json();
console.log(result.subArguments);
// Array of extracted sub-arguments, assumptions, causal claims
```

### Example 6: Identify Issues

```javascript
// POST /api/classification/identify-issues/:beliefId
const response = await fetch(
  'http://localhost:5000/api/classification/identify-issues/BELIEF_ID',
  { method: 'POST' }
);

const result = await response.json();
console.log(result.topIssues);
// Array of top 5 issues with severity, scale, solutions
```

## Common Use Cases

### Use Case 1: Create a Belief Page with All Variations

```javascript
// 1. Get the main belief
const belief = await fetch('/api/beliefs/BELIEF_ID').then(r => r.json());

// 2. Get classification
const classification = await fetch(`/api/classification/belief/${belief._id}/summary`)
  .then(r => r.json());

// 3. Find related beliefs across spectrums
const spectrum = await fetch(`/api/classification/spectrum/${belief.topicId}/sentiment`)
  .then(r => r.json());

// 4. Display all variations on one page
console.log('Belief variations:', spectrum.grouped);
```

### Use Case 2: Batch Classify Multiple Beliefs

```javascript
const beliefIds = ['id1', 'id2', 'id3', ...];

const response = await fetch('/api/classification/classify-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ beliefIds })
});

const results = await response.json();
console.log(`Classified ${results.results.length} beliefs`);
```

### Use Case 3: Analyze Topic Distribution

```javascript
// Get distribution of beliefs across sentiment spectrum for a topic
const response = await fetch('/api/classification/distribution/TOPIC_ID/sentiment');
const distribution = await response.json();

console.log(distribution.distribution);
// Shows how many beliefs at each sentiment level
```

### Use Case 4: Export Topic for External Analysis

```javascript
// Export entire topic with all beliefs
const response = await fetch('/api/classification/export/topic/TOPIC_ID');
const topicData = await response.json();

console.log(`Topic: ${topicData.topic.name}`);
console.log(`Beliefs: ${topicData.beliefCount}`);
console.log(topicData.beliefs); // All beliefs with full details
```

## Understanding the Spectrums

### Sentiment Spectrum Example

**Topic**: "Climate Change"

| Level | Example |
|-------|---------|
| Extremely Negative | "Climate change will make Earth uninhabitable" |
| Strongly Negative | "Climate change is catastrophically harmful" |
| Moderately Negative | "Climate change has significant negative impacts" |
| Mildly Negative | "Climate change may cause some problems" |
| Neutral | "Climate patterns are changing" |
| Mildly Positive | "Climate change creates some opportunities" |
| Moderately Positive | "Climate change adaptation is working well" |
| Strongly Positive | "Climate change is beneficial for agriculture" |
| Extremely Positive | "Climate change is the best thing for humanity" |

### Specificity Spectrum Example

**Topic**: "Political Corruption"

| Level | Example |
|-------|---------|
| Highly General | "People in power are corrupt" |
| Moderately General | "Politicians are often corrupt" |
| Baseline Concept | "Corruption exists in U.S. politics" |
| Moderately Specific | "Some members of Congress took bribes" |
| Highly Specific | "Senator X accepted $50,000 from Company Y on March 15, 2020" |

### Strength Spectrum Example

**Topic**: "Smartphone Quality"

| Level | Example |
|-------|---------|
| Very Weak | "This phone might have some issues" |
| Weak | "This phone probably isn't very good" |
| Moderate | "This phone has quality problems" |
| Strong | "This phone is definitely defective" |
| Extreme | "This phone is completely worthless and always fails" |

## Testing the System

### Test 1: Verify Hierarchy Definitions

```bash
curl http://localhost:5000/api/classification/hierarchies
```

Should return all three hierarchies with their levels.

### Test 2: Classify a Test Belief

```bash
curl -X POST http://localhost:5000/api/classification/classify/BELIEF_ID
```

Should return classifications with confidence scores.

### Test 3: Get Classification Summary

```bash
curl http://localhost:5000/api/classification/belief/BELIEF_ID/summary
```

Should return complete classification data.

## Troubleshooting

### Issue: "Belief not found"
**Solution**: Verify the belief ID exists in the database

### Issue: Low confidence scores
**Solution**:
- Add more descriptive text to belief statement
- Add supporting/opposing arguments
- Use clearer sentiment words

### Issue: Classifications seem wrong
**Solution**:
- Check if belief has calculated dimensions (specificity, sentimentPolarity, conclusionScore)
- Run belief.calculateSpecificity() and belief.calculateSentimentPolarity()
- Re-run classification

### Issue: Migration script fails
**Solution**:
- Check MongoDB connection
- Verify all beliefs have required fields
- Check error logs for specific belief IDs failing

## Next Steps

1. **Read Full Documentation**: See `BELIEF_CLASSIFICATION_SYSTEM.md`
2. **Build Frontend**: Create UI components to visualize hierarchies
3. **Customize Hierarchies**: Modify `/backend/config/hierarchyDefinitions.js`
4. **Add Custom Logic**: Extend classification service for domain-specific rules
5. **Integrate**: Connect classification to your existing belief display pages

## API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/classification/classify/:id` | POST | Classify single belief |
| `/api/classification/classify-batch` | POST | Classify multiple beliefs |
| `/api/classification/hierarchies` | GET | Get all hierarchies |
| `/api/classification/spectrum/:spectrum/:levelId` | GET | Get beliefs at level |
| `/api/classification/distribution/:topicId/:spectrum` | GET | Get distribution |
| `/api/classification/spectrum/:topicId/:spectrum` | GET | Get spectrum view |
| `/api/classification/related/:beliefId` | GET | Get related beliefs |
| `/api/classification/export/:beliefId` | GET | Export to JSON |
| `/api/classification/export/:beliefId/xml` | GET | Export to XML |
| `/api/classification/export/:beliefId/ise-template` | GET | Export ISE template |
| `/api/classification/export/topic/:topicId` | GET | Export full topic |
| `/api/classification/extract-subarguments/:argumentId` | POST | Extract sub-arguments |
| `/api/classification/analyze-structure/:argumentId` | POST | Analyze structure |
| `/api/classification/identify-issues/:beliefId` | POST | Identify issues |
| `/api/classification/belief/:beliefId/summary` | GET | Get summary |

## Support

For detailed information, see:
- Full documentation: `/docs/BELIEF_CLASSIFICATION_SYSTEM.md`
- Code: `/backend/services/beliefClassificationService.js`
- Hierarchies: `/backend/config/hierarchyDefinitions.js`
- Models: `/backend/models/Belief.js`

## Example Application Flow

```
1. User creates belief → "Ford makes great trucks"
                           ↓
2. System calculates → sentiment: positive (70)
   numeric scores    → specificity: baseline (50)
                     → strength: moderate (55)
                           ↓
3. Classification   → sentiment: moderately_positive
   service maps     → specificity: baseline_concept
                     → strength: moderate
                           ↓
4. System finds     → More general: "Trucks are good"
   related beliefs  → More specific: "2023 Ford F-150 is excellent"
                     → Stronger: "Ford makes the best trucks"
                           ↓
5. Display on       → One page showing all variations
   belief page      → Organized by spectrum
```

Start building your belief classification system now!
