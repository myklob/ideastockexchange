# Automated Belief Generation from Wikipedia

## Overview

The ISE Belief Generator automatically creates structured beliefs from Wikipedia pages, transforming encyclopedic information into scored arguments that can be evaluated, debated, and refined.

This system enables the ISE to scale from hundreds of manually-written belief pages to **millions of automatically-generated belief structures**.

## How It Works

### Three-Step Pipeline

```
Wikipedia Page → Topic Classification → Belief Generation → Argument Generation
```

#### 1. **Fetch Wikipedia Data**
- Retrieves page content, categories, and metadata via Wikipedia API
- Extracts infobox data and key facts
- Cleans and parses wikitext markup

#### 2. **Classify Topic Type**
- Analyzes Wikipedia categories, infobox type, and content keywords
- Classifies into one of 10 semantic topic types
- Returns confidence scores for all matching types

#### 3. **Generate Beliefs**
- Selects appropriate belief templates based on topic type
- Populates templates with extracted data
- Creates supporting and opposing arguments
- Calculates confidence scores

---

## Topic Type Taxonomy

The system classifies Wikipedia pages into 10 semantic types:

### 1. **People**
*Examples: Presidents, scientists, artists, activists, business leaders*

**Belief Templates:**
- `{name} was an ethical/unethical leader`
- `{name} was competent at {role}`
- `{name} was more effective than {comparison}`
- `{name} positively/negatively influenced history`
- `{name}'s work should be more widely known`
- `{name} caused {outcome}`

**Argument Types:**
- Moral behavior
- Impact on society
- Professional competence
- Comparison with peers
- Historical legacy

---

### 2. **Historical Events**
*Examples: Wars, revolutions, discoveries, reforms*

**Belief Templates:**
- `{event} was justified/unjustified`
- `{event} was effective in achieving its goals`
- `{event} caused {outcome}`
- `{event} could have been prevented`
- `{event} was {party}'s fault`
- `{event} improved/worsened the world`

**Argument Types:**
- Moral justification
- Outcomes and consequences
- Preventability
- Responsibility analysis
- Historical impact

---

### 3. **Tragedies / Disasters**
*Examples: Pandemics, earthquakes, genocides, industrial accidents*

**Belief Templates:**
- `{disaster} was preventable`
- `{disaster} was the fault of {party}`
- `{disaster} was worsened by policy decisions`
- `Victims of {disaster} deserve restitution`
- `Lessons from {disaster} must be implemented`

**Argument Types:**
- Evidence of negligence
- Systemic causes
- Policy analysis
- Ethical responsibility
- Risk reduction

---

### 4. **Animals / Species**
*Examples: Wolves, polar bears, mosquitoes, oak trees*

**Belief Templates:**
- `{species} needs more protected territory`
- `{species} is essential for ecosystem balance`
- `{species} threatens human safety`
- `{species} should be protected`
- `{species} is invasive and harmful`
- `{species} has economic value`

**Argument Types:**
- Ecological impact
- Conservation value
- Threat analysis
- Biodiversity importance
- Economic benefits

---

### 5. **Technology / Products**
*Examples: Smartphones, solar panels, nuclear energy, electric cars*

**Belief Templates:**
- `{technology} is effective for solving {problem}`
- `{technology} is cost-effective`
- `{technology} is better than {alternative}`
- `{technology} is harmful to society`
- `{technology} is the future of {industry}`
- `{technology} is environmentally sustainable`

**Argument Types:**
- Performance metrics
- Cost analysis
- Comparative advantages
- Environmental impact
- Innovation potential

---

### 6. **Artworks**
*Examples: Books, movies, music, paintings*

**Belief Templates:**
- `{artwork} supports {ideology}`
- `{artwork} contains harmful messaging`
- `{artwork} is better than other works in {genre}`
- `{artwork} is culturally important`
- `{artwork} is aesthetically beautiful`
- `{artwork} significantly influenced society`

**Argument Types:**
- Symbolism and themes
- Cultural impact
- Artistic merit
- Social influence
- Aesthetic theory

---

### 7. **Ideologies / Theories**
*Examples: Capitalism, socialism, evolution, libertarianism*

**Belief Templates:**
- `{ideology} produces better outcomes than {alternative}`
- `{ideology} aligns with {values}`
- `{ideology} harms vulnerable groups`
- `{ideology} explains {phenomenon}`
- `{ideology} should/should not be adopted`

**Argument Types:**
- Empirical evidence
- Moral arguments
- Comparative outcomes
- Predictive accuracy
- Value alignment

---

### 8. **Geographical Locations**
*Examples: Countries, cities, regions, rivers*

**Belief Templates:**
- `{location} is a good place to live`
- `{location} is economically strong`
- `{location} should adopt policy {policy}`
- `{location} is environmentally threatened`
- `{location} is culturally significant`

**Argument Types:**
- Quality of life
- Economic indicators
- Environmental risks
- Cultural heritage
- Governance quality

---

### 9. **Companies / Organizations**
*Examples: Apple, NASA, WHO, Exxon*

**Belief Templates:**
- `{company} acts ethically/unethically`
- `{company} harms/benefits society`
- `{company} is innovative`
- `{company} should be regulated more/less`

**Argument Types:**
- Ethical practices
- Social impact
- Innovation track record
- Market behavior
- Corporate responsibility

---

### 10. **Scientific Concepts**
*Examples: Gravity, CRISPR, relativity, climate change*

**Belief Templates:**
- `{concept} is scientifically valid`
- `{concept} threatens humanity`
- `{concept} offers solutions to {problem}`
- `{concept} is misunderstood by the public`
- `{concept} supports policy {policy}`

**Argument Types:**
- Experimental evidence
- Scientific consensus
- Practical applications
- Risk analysis
- Policy implications

---

## System Architecture

### Core Services

#### 1. **Wikipedia Service** (`services/wikipediaService.js`)
```javascript
import { fetchWikipediaPage, extractKeyFacts } from './services/wikipediaService.js';

const pageData = await fetchWikipediaPage('Abraham Lincoln');
// Returns: title, url, extract, categories, wikitext, pageId
```

**Functions:**
- `fetchWikipediaPage(title)` - Fetch full page data
- `extractInfobox(wikitext)` - Parse infobox data
- `extractKeyFacts(extract, wikitext)` - Extract key facts
- `searchWikipedia(query, limit)` - Search for topics
- `getRandomArticles(count)` - Get random articles

#### 2. **Topic Classifier** (`services/topicTypeClassifier.js`)
```javascript
import { classifyTopicType } from './services/topicTypeClassifier.js';

const classification = classifyTopicType(pageData);
// Returns: [{ type: 'people', confidence: 87.3, score: 42 }, ...]
```

**Classification Algorithm:**
1. Category matching (40% weight)
2. Content keyword matching (30% weight)
3. Infobox type matching (30% weight)

#### 3. **Belief Templates** (`services/beliefTemplates.js`)
Defines 8-10 belief templates per topic type, each with:
- Pattern with placeholders (e.g., `{name} was an ethical leader`)
- ISE category mapping
- Polarity (positive/negative/neutral)
- Associated argument types

#### 4. **Belief Generator** (`services/beliefGenerator.js`)
```javascript
import { generateBeliefsFromWikipedia } from './services/beliefGenerator.js';

const result = await generateBeliefsFromWikipedia('Electric Car', {
  maxBeliefs: 5,
  includeArguments: true,
});
```

**Output Structure:**
```json
{
  "source": {
    "title": "Electric Car",
    "url": "https://en.wikipedia.org/wiki/Electric_car",
    "extract": "An electric car is an automobile..."
  },
  "topicTypes": [
    { "type": "technology_products", "confidence": 92.5 }
  ],
  "primaryType": "technology_products",
  "beliefs": [
    {
      "statement": "Electric cars are effective for reducing emissions",
      "description": "Electric cars produce zero direct emissions...",
      "category": "technology",
      "polarity": "positive",
      "argumentTypes": ["performance_metrics", "environmental_impact"],
      "confidence": 75,
      "arguments": {
        "supporting": [
          {
            "content": "Electric vehicles reduce total emissions...",
            "type": "supporting",
            "argumentType": "environmental_impact"
          }
        ],
        "opposing": [
          {
            "content": "Battery production requires rare earth minerals...",
            "type": "opposing",
            "argumentType": "environmental_impact"
          }
        ]
      }
    }
  ]
}
```

---

## API Endpoints

### 1. **Generate Beliefs (Preview)**
```http
POST /api/belief-generator/generate
Content-Type: application/json

{
  "pageTitle": "Abraham Lincoln",
  "maxBeliefs": 5,
  "includeArguments": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "source": { ... },
    "topicTypes": [ ... ],
    "beliefs": [ ... ],
    "metadata": {
      "generatedAt": "2025-01-15T10:30:00Z",
      "beliefCount": 5,
      "confidence": 87.3
    }
  }
}
```

### 2. **Generate and Save to Database**
```http
POST /api/belief-generator/generate-and-save
Authorization: Bearer <token>
Content-Type: application/json

{
  "pageTitle": "Electric Car",
  "maxBeliefs": 5,
  "autoCreateTopic": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "topic": { _id: "...", name: "Electric Car", ... },
    "beliefs": [ ... ],
    "generationMetadata": { ... }
  },
  "message": "Successfully generated and saved 5 beliefs"
}
```

### 3. **Batch Generate**
```http
POST /api/belief-generator/batch-generate
Content-Type: application/json

{
  "pageTitles": ["Wolf", "Electric Car", "Napoleon"],
  "maxBeliefs": 3
}
```

### 4. **Search Wikipedia**
```http
GET /api/belief-generator/search?query=climate change&limit=10
```

### 5. **Classify Topic**
```http
POST /api/belief-generator/classify
Content-Type: application/json

{
  "pageTitle": "Abraham Lincoln"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Abraham Lincoln",
    "topicTypes": [
      { "type": "people", "confidence": 87.3, "score": 42 },
      { "type": "historical_events", "confidence": 45.2, "score": 21 }
    ],
    "primaryType": "people"
  }
}
```

### 6. **Get Random Topics**
```http
GET /api/belief-generator/random?count=5
```

---

## CLI Usage

### Installation
```bash
cd backend
npm install
```

### Basic Usage
```bash
# Generate beliefs for a single topic
node scripts/generateBeliefs.js "Abraham Lincoln"

# Generate more beliefs
node scripts/generateBeliefs.js "Electric Car" --max-beliefs 10

# Save to file
node scripts/generateBeliefs.js "World War II" --output beliefs.json

# Generate from multiple pages
node scripts/generateBeliefs.js "Wolf,Electric Car,Napoleon" --batch

# Search Wikipedia first
node scripts/generateBeliefs.js --search "climate change"

# Generate from random articles
node scripts/generateBeliefs.js --random 10
```

### CLI Options
```
-m, --max-beliefs <num>   Maximum beliefs to generate (default: 5)
--no-arguments            Don't generate arguments (faster)
-o, --output <file>       Save output to JSON file
-b, --batch               Treat input as comma-separated list
-s, --search <query>      Search Wikipedia and show results
-r, --random [count]      Generate from random articles
-h, --help                Show help message
```

---

## Testing

Run the test suite:
```bash
node backend/scripts/testBeliefGenerator.js
```

**Test Coverage:**
1. ✓ Topic type classification (10 topics)
2. ✓ Single topic belief generation
3. ✓ Batch topic generation
4. ✓ Wikipedia search integration
5. ✓ Belief template coverage

---

## Code Examples

### Example 1: Generate Beliefs Programmatically
```javascript
import { generateBeliefsFromWikipedia } from './services/beliefGenerator.js';

async function example() {
  const result = await generateBeliefsFromWikipedia('Abraham Lincoln', {
    maxBeliefs: 5,
    includeArguments: true,
  });

  console.log(`Generated ${result.beliefs.length} beliefs`);
  console.log(`Topic type: ${result.primaryType}`);

  result.beliefs.forEach(belief => {
    console.log(`- ${belief.statement}`);
  });
}
```

### Example 2: Classify Any Wikipedia Page
```javascript
import { fetchWikipediaPage } from './services/wikipediaService.js';
import { classifyTopicType } from './services/topicTypeClassifier.js';

async function classifyPage(title) {
  const pageData = await fetchWikipediaPage(title);
  const types = classifyTopicType(pageData);

  console.log(`${title} is classified as:`);
  types.forEach(t => {
    console.log(`- ${t.type} (${t.confidence.toFixed(1)}% confidence)`);
  });
}
```

### Example 3: Batch Process Topics
```javascript
import { generateBeliefsFromBatch } from './services/beliefGenerator.js';

async function batchProcess() {
  const topics = ['Wolf', 'Electric Car', 'Napoleon'];

  const results = await generateBeliefsFromBatch(topics, {
    maxBeliefs: 3,
    includeArguments: true,
  });

  const totalBeliefs = results.reduce((sum, r) => sum + r.beliefs.length, 0);
  console.log(`Generated ${totalBeliefs} total beliefs`);
}
```

---

## Integration with ISE

### Belief Scoring
Generated beliefs are automatically scored using the ISE's ReasonRank algorithm:

1. **Conclusion Score**: Calculated from supporting/opposing arguments
2. **Dimensional Scores**:
   - Specificity (General → Specific)
   - Strength (Weak → Strong)
   - Sentiment (Negative → Positive)

### Argument Scoring
Each generated argument receives:
- Evidence strength score
- Logical coherence score
- Linkage relevance score
- Overall ReasonRank score

### Topic Association
Beliefs are automatically linked to topics for organization and navigation.

---

## Customization

### Adding New Topic Types

1. **Define in `topicTypeClassifier.js`:**
```javascript
CUSTOM_TYPE: {
  name: 'custom_type',
  categoryPatterns: [/pattern1/i, /pattern2/i],
  contentKeywords: ['keyword1', 'keyword2'],
  infoboxTypes: ['infobox_type'],
}
```

2. **Add templates in `beliefTemplates.js`:**
```javascript
custom_type: {
  beliefTypes: [
    {
      pattern: '{name} has property {property}',
      category: 'other',
      polarity: 'neutral',
      argumentTypes: ['evidence', 'analysis'],
    },
  ],
}
```

### Adjusting Classification Weights

Edit weights in `classifyTopicType()`:
```javascript
// Current weights
categories: 40%
content keywords: 30%
infobox type: 30%
```

---

## Performance

### Rate Limiting
- Wikipedia API: 1 request per second (configurable)
- Batch operations include automatic delays

### Caching
Future enhancement: Cache Wikipedia page data to reduce API calls

### Scalability
- Single topic: ~2-5 seconds
- Batch (10 topics): ~20-50 seconds
- Can process millions of topics over time

---

## Limitations and Future Improvements

### Current Limitations
1. **Template-based**: Limited to predefined belief patterns
2. **Simple NLP**: Basic keyword matching (could use ML models)
3. **English only**: Wikipedia API uses English Wikipedia
4. **No fact verification**: Accepts Wikipedia content as-is

### Future Enhancements
1. **AI-powered generation**: Use LLMs for more sophisticated belief creation
2. **Multi-language support**: Support Wikipedia in other languages
3. **Real-time updates**: Monitor Wikipedia changes and update beliefs
4. **Confidence scoring**: Improve confidence calculation with ML
5. **Custom templates**: Allow users to define custom belief templates
6. **Evidence linking**: Automatically link to Wikipedia citations

---

## Related Documentation

- [One Page Per Belief](./ONE_PAGE_PER_BELIEF.md)
- [ReasonRank Algorithm](./wiki/ReasonRank:-Google's-PageRank-for-Arguments.md)
- [Scoring System](./wiki/Scoring-System.md)
- [API Reference](./wiki/API-Reference.md)

---

## Support

For issues, suggestions, or contributions:
- GitHub Issues: https://github.com/myklob/ideastockexchange/issues
- Documentation: https://github.com/myklob/ideastockexchange/wiki

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
