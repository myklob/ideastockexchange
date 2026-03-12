# Developer Quick Start - One Page Per Belief

## Quick Setup

### 1. Database Migration

The new schema adds fields to existing Belief model. No migration needed for MongoDB (schemaless), but you may want to update existing beliefs:

```javascript
// Update all existing beliefs with default dimensions
db.beliefs.updateMany(
  { dimensions: { $exists: false } },
  {
    $set: {
      dimensions: {
        specificity: 50,
        sentimentPolarity: 0
      },
      similarBeliefs: [],
      topicId: null
    }
  }
);
```

### 2. Calculate Dimensions for Existing Beliefs

```javascript
// Run this script to populate dimensions
const Belief = require('./backend/models/Belief');

async function updateAllDimensions() {
  const beliefs = await Belief.find({});

  for (const belief of beliefs) {
    await belief.updateDimensions();
    console.log(`Updated: ${belief.statement}`);
  }
}

updateAllDimensions();
```

### 3. Create Initial Topics

```javascript
// Example: Create topic hierarchy
const trump = await Topic.create({
  name: "Donald Trump",
  category: "politics",
  description: "Beliefs related to Donald Trump",
});

const trumpIntelligence = await Topic.create({
  name: "Trump's Intelligence",
  category: "politics",
  description: "Beliefs about Donald Trump's cognitive abilities",
  parentTopic: trump._id,
});

// Update existing beliefs to link to topic
await Belief.updateMany(
  { statement: /Trump.*intelligence/i },
  { $set: { topicId: trumpIntelligence._id } }
);
```

## API Usage Examples

### Check for Duplicates Before Creating

```javascript
// Frontend
const handleSubmit = async (statement) => {
  // Check for duplicates first
  const check = await beliefAPI.checkDuplicate(statement);

  if (check.isDuplicate) {
    const similarBelief = check.existingBelief;
    const similarity = (check.similarityScore * 100).toFixed(0);

    alert(
      `This belief is ${similarity}% similar to:\n"${similarBelief.statement}"\n\nWould you like to view that belief instead?`
    );

    // Redirect to existing belief
    navigate(`/beliefs/${similarBelief._id}`);
    return;
  }

  // No duplicate found, create new belief
  const newBelief = await beliefAPI.create({ statement, description });
  navigate(`/beliefs/${newBelief._id}`);
};
```

### Search Beliefs by Dimensions

```javascript
// Find specific, well-supported, negative beliefs
const results = await beliefAPI.searchByDimensions({
  minSpecificity: 70,
  maxSpecificity: 100,
  minStrength: 60,
  maxStrength: 100,
  minSentiment: -100,
  maxSentiment: -20,
  category: 'politics',
});

// Results: Specific, strongly-supported negative political beliefs
```

### Get Topic with Filtered Beliefs

```javascript
// Get topic details
const { topic, hierarchy } = await topicAPI.getByIdOrSlug('trump-intelligence');

// Get beliefs in topic with filters
const beliefs = await topicAPI.getBeliefs('trump-intelligence', {
  minStrength: 50,
  sort: '-conclusionScore',
});
```

### Link Similar Beliefs

```javascript
// After creating a new belief, find and link similar ones
const newBelief = await Belief.create({ statement: "..." });

// Find similar
const similar = await beliefAPI.getSimilar(newBelief._id, 0.7);

// Auto-link top 3 most similar
for (const s of similar.slice(0, 3)) {
  await beliefAPI.linkSimilar(
    newBelief._id,
    s.belief._id,
    s.similarityScore
  );
}
```

### Merge Duplicate Beliefs (Admin)

```javascript
// Admin merges duplicate belief into main one
await beliefAPI.mergeBelief(
  mainBeliefId,    // Keep this one
  duplicateId      // Merge this one (will be archived)
);

// This will:
// 1. Transfer all arguments from duplicate to main belief
// 2. Update argument references
// 3. Mark duplicate as merged
// 4. Archive the duplicate
// 5. Recalculate scores on main belief
```

## Testing the Features

### Test Semantic Clustering

```javascript
// Test similarity calculation
const { calculateSimilarity } = require('./backend/utils/semanticClustering');

console.log(calculateSimilarity(
  "Trump is not smart",
  "Trump is unintelligent"
));
// Output: ~0.78 (78% similar)

console.log(calculateSimilarity(
  "Trump is smart",
  "Trump is not smart"
));
// Output: ~0.65 but marked as opposite = true
```

### Test Dimensional Calculation

```javascript
const belief = new Belief({
  statement: "On January 20, 2024, Donald Trump scored exactly 125 on the Stanford-Binet IQ test",
});

belief.calculateSpecificity();
console.log(belief.dimensions.specificity);
// Output: ~90 (very specific: date, name, number, specific test)

belief.calculateSentimentPolarity();
console.log(belief.dimensions.sentimentPolarity);
// Output: ~5 (slightly positive, mentions score but no judgment)
```

### Test Duplicate Detection

```javascript
const allBeliefs = await Belief.find({ status: 'active' });

const { detectDuplicate } = require('./backend/utils/semanticClustering');

const result = detectDuplicate(
  "Trump has low intelligence",
  allBeliefs,
  0.85
);

if (result.isDuplicate) {
  console.log(`Duplicate found: ${result.existingBelief.statement}`);
  console.log(`Similarity: ${result.similarityScore * 100}%`);
}
```

## Frontend Integration

### Display Dimensional Filters

```jsx
function DimensionalFilter({ onChange }) {
  const [filters, setFilters] = useState({
    minSpecificity: 0,
    maxSpecificity: 100,
    minStrength: 0,
    maxStrength: 100,
    minSentiment: -100,
    maxSentiment: 100,
  });

  const handleChange = (dimension, value) => {
    const newFilters = { ...filters, [dimension]: value };
    setFilters(newFilters);
    onChange(newFilters);
  };

  return (
    <div>
      <h3>Filter by Dimensions</h3>

      {/* Specificity Slider */}
      <div>
        <label>Specificity: {filters.minSpecificity} - {filters.maxSpecificity}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={filters.minSpecificity}
          onChange={(e) => handleChange('minSpecificity', e.target.value)}
        />
        <input
          type="range"
          min="0"
          max="100"
          value={filters.maxSpecificity}
          onChange={(e) => handleChange('maxSpecificity', e.target.value)}
        />
      </div>

      {/* Similar for other dimensions... */}
    </div>
  );
}
```

### Show Belief in 3D Space

```jsx
function BeliefPosition({ belief }) {
  const position = {
    x: belief.dimensions.specificity,
    y: belief.conclusionScore,
    z: (belief.dimensions.sentimentPolarity + 100) / 2, // Normalize to 0-100
  };

  return (
    <div className="belief-position-3d">
      <div className="axis-label">
        Position in Belief Space:
      </div>
      <div className="coordinates">
        <span>Specificity: {position.x}/100</span>
        <span>Strength: {position.y}/100</span>
        <span>Sentiment: {belief.dimensions.sentimentPolarity}</span>
      </div>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Create Belief with Auto-Linking

```javascript
async function createBeliefWithAutoLink(statement, description, userId) {
  // 1. Check for duplicates
  const allBeliefs = await Belief.find({ status: 'active' });
  const duplicate = detectDuplicate(statement, allBeliefs, 0.85);

  if (duplicate.isDuplicate) {
    throw new Error('Duplicate belief exists');
  }

  // 2. Create belief
  const belief = await Belief.create({
    statement,
    description,
    author: userId,
  });

  // 3. Calculate dimensions
  await belief.updateDimensions();

  // 4. Find and link similar beliefs (threshold 0.7)
  const similar = findSimilarBeliefs(statement, allBeliefs, 0.7);
  for (const s of similar.slice(0, 5)) {
    await belief.addSimilarBelief(s.belief._id, s.similarityScore);
  }

  // 5. Auto-assign to topic (if possible)
  const topic = await autoAssignTopic(statement);
  if (topic) {
    belief.topicId = topic._id;
    await belief.save();
  }

  return belief;
}
```

### Pattern 2: Topic-Based Navigation

```javascript
async function getTopicHierarchyView(topicSlug) {
  // 1. Get topic
  const topic = await Topic.findOne({ slug: topicSlug });

  // 2. Get hierarchy (breadcrumbs)
  const hierarchy = await topic.getHierarchy();

  // 3. Get subtopics
  const subTopics = await Topic.find({ parentTopic: topic._id });

  // 4. Get beliefs in topic
  const beliefs = await topic.getBeliefs({ sort: '-conclusionScore' });

  return {
    topic,
    hierarchy,
    subTopics,
    beliefs,
  };
}
```

### Pattern 3: Dimensional Clustering

```javascript
async function clusterBeliefsByDimensions() {
  const beliefs = await Belief.find({ status: 'active' });

  // Group by dimensional ranges
  const clusters = {
    'General, Weak, Negative': [],
    'General, Weak, Positive': [],
    'Specific, Strong, Negative': [],
    'Specific, Strong, Positive': [],
    // ... etc
  };

  beliefs.forEach(belief => {
    const spec = belief.dimensions.specificity > 50 ? 'Specific' : 'General';
    const strength = belief.conclusionScore > 50 ? 'Strong' : 'Weak';
    const sentiment = belief.dimensions.sentimentPolarity > 0 ? 'Positive' : 'Negative';

    const key = `${spec}, ${strength}, ${sentiment}`;
    if (clusters[key]) {
      clusters[key].push(belief);
    }
  });

  return clusters;
}
```

## Debugging Tips

### View Dimensional Calculation Details

```javascript
const belief = await Belief.findById(beliefId);

console.log('Statement:', belief.statement);
console.log('\nDimensional Analysis:');
console.log('---');

// Specificity
belief.calculateSpecificity();
console.log('Specificity:', belief.dimensions.specificity);
console.log('  Has numbers:', /\d/.test(belief.statement));
console.log('  Has proper nouns:', belief.statement.split(' ').slice(1).filter(w => /^[A-Z]/.test(w)));
console.log('  Has dates:', /(january|february|...|december|\d{4})/i.test(belief.statement));

// Sentiment
belief.calculateSentimentPolarity();
console.log('\nSentiment:', belief.dimensions.sentimentPolarity);
const positiveWords = ['good', 'great', 'excellent', ...];
const negativeWords = ['bad', 'poor', 'terrible', ...];
console.log('  Positive words found:', positiveWords.filter(w => belief.statement.toLowerCase().includes(w)));
console.log('  Negative words found:', negativeWords.filter(w => belief.statement.toLowerCase().includes(w)));
```

### Check Similarity Calculation

```javascript
const { calculateSimilarity } = require('./backend/utils/semanticClustering');

const s1 = "Trump is not intelligent";
const s2 = "Trump lacks intelligence";

const similarity = calculateSimilarity(s1, s2);
console.log(`Similarity: ${(similarity * 100).toFixed(1)}%`);

// See component scores
const jaccard = jaccardSimilarity(s1, s2);
const cosine = cosineSimilarity(s1, s2);
const editDist = normalizedEditDistance(s1, s2);

console.log(`  Jaccard: ${jaccard.toFixed(3)}`);
console.log(`  Cosine: ${cosine.toFixed(3)}`);
console.log(`  Edit Distance: ${editDist.toFixed(3)}`);
console.log(`  Combined: ${similarity.toFixed(3)}`);
```

## Performance Optimization

### Cache Similarity Calculations

```javascript
// In-memory cache with TTL
const similarityCache = new Map();

function getCachedSimilarity(id1, id2) {
  const key = [id1, id2].sort().join(':');
  const cached = similarityCache.get(key);

  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.similarity;
  }

  return null;
}

function setCachedSimilarity(id1, id2, similarity) {
  const key = [id1, id2].sort().join(':');
  similarityCache.set(key, {
    similarity,
    timestamp: Date.now(),
  });
}
```

### Batch Dimensional Updates

```javascript
// Update dimensions for multiple beliefs efficiently
async function batchUpdateDimensions(beliefIds) {
  const beliefs = await Belief.find({ _id: { $in: beliefIds } });

  const updates = beliefs.map(belief => ({
    updateOne: {
      filter: { _id: belief._id },
      update: {
        $set: {
          'dimensions.specificity': calculateSpecificitySync(belief.statement),
          'dimensions.sentimentPolarity': calculateSentimentPolaritySync(belief.statement),
        },
      },
    },
  }));

  await Belief.bulkWrite(updates);
}
```

## Environment Variables

Add to `.env` if needed:

```env
# Semantic clustering thresholds
DUPLICATE_THRESHOLD=0.85
SIMILARITY_THRESHOLD=0.70

# Topic auto-assignment
ENABLE_AUTO_TOPIC_ASSIGNMENT=true

# Caching
SIMILARITY_CACHE_TTL=3600000
```

## Next Steps

1. **Test the endpoints** using the examples above
2. **Update existing beliefs** with dimensional data
3. **Create initial topics** for your domain
4. **Build UI components** for dimensional filtering
5. **Monitor performance** of similarity calculations
6. **Gather user feedback** on dimensional accuracy

For more details, see the full documentation in `docs/ONE_PAGE_PER_BELIEF.md`.
