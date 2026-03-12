# One Page Per Belief Framework

## Overview

The "One Page Per Belief" framework is a comprehensive system for organizing online discourse by giving each distinct belief its own dedicated page. This eliminates redundancy, prevents fragmented discussions, and enables structured, traceable debates.

## Core Principles

### 1. One Page Per Belief

Each distinct belief has a **dedicated page** that serves as the centralized hub for:
- The belief statement
- All supporting and opposing arguments
- Evidence and sources
- Related and similar beliefs
- Metadata and dimensional positioning

### 2. Semantic Clustering

Similar belief statements are automatically grouped together to prevent duplication:
- "Trump is not smart"
- "Trump is unintelligent"
- "Trump lacks cognitive ability"

All three would be linked to the same belief page, with the most representative statement chosen as the primary one.

### 3. Three-Dimensional Sorting

Every belief is positioned in a 3D space across these dimensions:

#### Dimension 1: General → Specific (0-100)
- **0 = Very General**: "People should be kind"
- **100 = Very Specific**: "On January 20, 2024, John Smith voted against Bill HR-1234"

Indicators of specificity:
- Proper nouns (names, places)
- Numbers and dates
- Specific quantifiers ("exactly", "precisely")

Indicators of generality:
- Abstract concepts ("idea", "theory")
- Universal quantifiers ("all", "always", "never")

#### Dimension 2: Weaker → Stronger (0-100)
Uses the existing `conclusionScore` based on argument quality:
- **0-20**: Likely False - overwhelming opposition
- **20-40**: Weakly Supported - strong opposition
- **40-60**: Contested - balanced arguments
- **60-80**: Moderately Supported - good evidence
- **80-100**: Strongly Supported - well-evidenced

#### Dimension 3: Negative → Positive (-100 to 100)
Measures sentiment toward the subject:
- **-100**: Very negative ("X is terrible", "X harms people")
- **0**: Neutral ("X exists")
- **+100**: Very positive ("X is excellent", "X helps everyone")

## Architecture

### Backend Components

#### 1. Enhanced Belief Model (`backend/models/Belief.js`)

```javascript
{
  statement: String,              // Main belief statement
  description: String,            // Detailed description

  // Three-Dimensional Positioning
  dimensions: {
    specificity: Number,          // 0-100 (general → specific)
    sentimentPolarity: Number,    // -100 to 100 (negative → positive)
  },
  conclusionScore: Number,        // 0-100 (weaker → stronger)

  // Semantic Clustering
  similarBeliefs: [{
    beliefId: ObjectId,
    similarityScore: Number,      // 0-1
    mergedInto: Boolean,
  }],

  // Topic Aggregation
  topicId: ObjectId,              // Reference to Topic

  // Arguments and Evidence
  supportingArguments: [ObjectId],
  opposingArguments: [ObjectId],
  relatedBeliefs: [{
    beliefId: ObjectId,
    relationship: String,         // 'supports', 'opposes', 'related'
    linkageStrength: Number,
  }],
}
```

**Key Methods:**
- `calculateSpecificity()` - Analyzes statement for specificity markers
- `calculateSentimentPolarity()` - Determines positive/negative sentiment
- `updateDimensions()` - Recalculates all dimensional scores
- `addSimilarBelief()` - Links semantically similar beliefs
- `mergeSimilarBelief()` - Merges duplicate beliefs
- `get3DPosition()` - Returns {specificity, strength, sentiment}

#### 2. Topic Model (`backend/models/Topic.js`)

Aggregates related beliefs under common topics:

```javascript
{
  name: String,
  slug: String,
  description: String,

  // Hierarchy
  parentTopic: ObjectId,
  subTopics: [ObjectId],
  relatedTopics: [{
    topicId: ObjectId,
    relevanceScore: Number,
  }],

  // Aggregated Statistics
  statistics: {
    totalBeliefs: Number,
    totalArguments: Number,
    averageBeliefScore: Number,
    averageSpecificity: Number,
    averageSentiment: Number,
  },
}
```

**Key Methods:**
- `updateStatistics()` - Recalculates aggregate stats from beliefs
- `getBeliefs(filters)` - Returns beliefs with dimensional filtering
- `getHierarchy()` - Returns parent chain for breadcrumbs

#### 3. Semantic Clustering (`backend/utils/semanticClustering.js`)

Implements similarity detection using multiple algorithms:

**Similarity Calculation:**
- **Jaccard Similarity** (30%): Word overlap
- **Cosine Similarity** (50%): TF-IDF semantic similarity
- **Levenshtein Distance** (20%): Character-level similarity

```javascript
calculateSimilarity(statement1, statement2)
// Returns: 0.0 to 1.0 (0 = completely different, 1 = identical)
```

**Functions:**
- `findSimilarBeliefs(statement, beliefs, threshold)` - Find all similar beliefs
- `detectDuplicate(statement, beliefs, threshold)` - Check for duplicates (threshold=0.85)
- `clusterBeliefs(beliefs, threshold)` - Group beliefs into clusters
- `areOpposites(statement1, statement2)` - Detect negation patterns
- `suggestMainStatement(beliefs)` - Choose best primary statement

### API Endpoints

#### Belief Endpoints

```
POST   /api/beliefs/check-duplicate
       Request: { statement: String }
       Response: { isDuplicate: Boolean, existingBelief: Object, similarityScore: Number }

GET    /api/beliefs/:id/similar?threshold=0.7
       Response: [{ belief: Object, similarityScore: Number, isOpposite: Boolean }]

POST   /api/beliefs/:id/link-similar
       Request: { similarBeliefId: String, similarityScore: Number }

POST   /api/beliefs/:id/merge (Admin only)
       Request: { beliefIdToMerge: String }

POST   /api/beliefs/:id/update-dimensions
       Response: { dimensions: Object, position3D: Object }

GET    /api/beliefs/search/dimensions
       Query: minSpecificity, maxSpecificity, minStrength, maxStrength, minSentiment, maxSentiment
       Response: Filtered beliefs
```

#### Topic Endpoints

```
GET    /api/topics
       Query: category, featured, trending, search
       Response: Topic list with statistics

GET    /api/topics/:idOrSlug
       Response: Topic details with hierarchy

GET    /api/topics/:idOrSlug/beliefs
       Query: Dimensional filters + sort
       Response: Beliefs in topic

POST   /api/topics (Protected)
       Request: { name, description, category, parentTopic, tags }

PUT    /api/topics/:id (Protected)
DELETE /api/topics/:id (Protected)
```

### Frontend Components

#### 1. Enhanced BeliefDetails Page

**New Features:**
- **Belief Dimensions Panel**: Visual representation of 3D position
  - Specificity bar (blue)
  - Strength bar (green/yellow/red based on score)
  - Sentiment bar (red for negative, green for positive, with center point)

- **Similar Beliefs Section**: Shows semantically related beliefs
  - Similarity percentage
  - "Similar" vs "Opposite" badges
  - Expandable list (show 3, expand for all)

- **Related Beliefs Section**: Manually linked beliefs with relationship types

#### 2. Updated API Service

```javascript
// Semantic Clustering
beliefAPI.checkDuplicate(statement)
beliefAPI.getSimilar(id, threshold)
beliefAPI.linkSimilar(id, similarBeliefId, similarityScore)
beliefAPI.mergeBelief(id, beliefIdToMerge)
beliefAPI.updateDimensions(id)
beliefAPI.searchByDimensions(params)

// Topic Operations
topicAPI.getAll(params)
topicAPI.getByIdOrSlug(idOrSlug)
topicAPI.getBeliefs(idOrSlug, params)
topicAPI.create(topicData)
topicAPI.update(id, topicData)
topicAPI.delete(id)
```

## User Workflows

### 1. Creating a New Belief

```
User submits: "Trump is unintelligent"
↓
System checks for duplicates via semantic clustering
↓
Finds existing belief: "Trump has low cognitive ability" (similarity: 0.87)
↓
Prompts user: "This belief is very similar to an existing one. View existing page?"
↓
User can:
  - View existing page and add their argument there
  - Create new belief if genuinely different
  - Suggest merge if truly duplicate
```

### 2. Browsing by Dimensions

```
User wants beliefs that are:
  - Specific (70-100)
  - Strongly supported (60-100)
  - Negative sentiment (-100 to -50)
↓
GET /api/beliefs/search/dimensions?minSpecificity=70&minStrength=60&maxSentiment=-50
↓
Returns filtered list of beliefs matching criteria
```

### 3. Exploring a Topic

```
User visits: /topics/trump-intelligence
↓
Topic page shows:
  - Topic hierarchy (Politics > US Politics > Trump Administration > Intelligence)
  - Aggregate statistics (15 beliefs, avg specificity: 65, avg sentiment: -40)
  - All beliefs in topic with dimensional visualization
  - Filters to narrow by specificity, strength, sentiment
```

### 4. Discovering Similar Beliefs

```
User views belief page
↓
Sidebar automatically shows "Similar Beliefs" section
↓
Lists 3-5 most similar beliefs with similarity scores
↓
User can expand to see all similar beliefs
↓
Each similar belief is clickable to navigate
```

## Benefits

### 1. Prevents Redundancy
- No duplicate discussions
- Similar statements automatically linked
- Efforts focused on meaningful contributions

### 2. Improves Clarity
- Clear structure for each belief
- All evidence in one place
- Easy to see current state of debate

### 3. Enables Traceability
- Track how arguments evolve
- See what evidence has been added
- Understand debate progression

### 4. Facilitates Discovery
- Find beliefs by dimensional properties
- Explore related beliefs
- Navigate topic hierarchies

### 5. Encourages Quality
- Build on existing arguments
- Avoid rehashing old points
- Focus on new insights

## Implementation Example

### Creating a Belief with Automatic Dimensioning

```javascript
// Backend: When a belief is created
const belief = new Belief({
  statement: "Donald Trump scored 125 on the Stanford-Binet IQ test in 1964",
  description: "...",
  author: userId,
});

// Calculate dimensions automatically
belief.calculateSpecificity();
// Result: 85 (has proper noun, date, number, specific test name)

belief.calculateSentimentPolarity();
// Result: 10 (neutral-to-slightly-positive, mentions score but not judgment)

await belief.save();

// Strength (conclusionScore) calculated when arguments are added
await belief.calculateConclusionScore();
```

### Checking for Duplicates

```javascript
// Frontend: Before creating belief
const statement = "Trump has a high IQ";

const duplicateCheck = await beliefAPI.checkDuplicate(statement);

if (duplicateCheck.isDuplicate) {
  // Show user: "Similar belief exists: 'Trump is intelligent' (92% match)"
  // Offer options: View existing | Create anyway | Suggest merge
}
```

### Finding Similar Beliefs

```javascript
// Backend: Find similar beliefs
const belief = await Belief.findById(beliefId);
const allBeliefs = await Belief.find({ status: 'active' });

const similar = findSimilarBeliefs(
  belief.statement,
  allBeliefs,
  0.7 // threshold
);

// Returns: [
//   {
//     belief: { statement: "Trump is smart", ... },
//     similarityScore: 0.78,
//     isOpposite: false,
//     relationship: 'similar'
//   },
//   ...
// ]
```

## Future Enhancements

### 1. Visual 3D Belief Space
Interactive visualization where users can:
- Navigate beliefs in 3D space
- Filter by dimensional ranges
- Cluster view to see groups

### 2. AI-Assisted Clustering
- Use embeddings (BERT, GPT) for better similarity
- Automatic topic assignment
- Suggest relationships between beliefs

### 3. Reputation-Based Clustering
- Users who contribute earn editing power
- Wikipedia-style curation
- Quality-based ranking of similar beliefs

### 4. Advanced Filtering UI
- Multi-dimensional sliders
- Save filter presets
- Notification for new beliefs in watched dimensional range

### 5. Belief Evolution Tracking
- Timeline view of how arguments changed
- Track when evidence was added
- See how scores evolved

## Technical Notes

### Scalability
- Semantic clustering is O(n²) - consider caching for large datasets
- Use MongoDB indexes on dimensional fields
- Consider batch processing for dimension calculations

### Performance
- Similarity calculations are expensive - use threshold early
- Cache duplicate checks with TTL
- Lazy-load similar beliefs in UI

### Accuracy
- Specificity and sentiment are heuristic-based
- May need manual adjustment by moderators
- Consider user feedback to improve algorithms

## Conclusion

The "One Page Per Belief" framework transforms online discourse from fragmented, repetitive discussions into organized, traceable knowledge graphs. By combining semantic clustering, dimensional navigation, and topic aggregation, it enables users to:

- Find existing discussions before creating duplicates
- Navigate beliefs by their inherent properties
- Build upon existing arguments rather than restarting
- Track the evolution of debates over time
- Discover related beliefs and topics

This creates a dynamic, evolving resource for understanding complex issues.
