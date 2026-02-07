# Automated Belief Generator

Generate ISE beliefs automatically from any Wikipedia page!

## Quick Start

### Install Dependencies
```bash
cd backend
npm install
```

### Generate Beliefs

#### CLI Usage
```bash
# Generate beliefs for any Wikipedia topic
npm run generate-beliefs "Abraham Lincoln"

# Options
npm run generate-beliefs "Electric Car" -- --max-beliefs 10
npm run generate-beliefs "World War II" -- --output beliefs.json
npm run generate-beliefs "Wolf,Napoleon,Tesla" -- --batch

# Search Wikipedia
npm run generate-beliefs -- --search "climate change"

# Random topics
npm run generate-beliefs -- --random 5
```

#### API Usage
```bash
# Start the server
npm start

# Then make API requests:
curl -X POST http://localhost:5000/api/belief-generator/generate \
  -H "Content-Type: application/json" \
  -d '{"pageTitle": "Abraham Lincoln", "maxBeliefs": 5}'
```

## Features

### 🎯 Automatic Topic Classification
Classifies Wikipedia pages into 10 semantic types:
- People (presidents, scientists, artists)
- Historical Events (wars, revolutions)
- Tragedies/Disasters (pandemics, earthquakes)
- Animals/Species (wolves, polar bears)
- Technology/Products (electric cars, smartphones)
- Artworks (books, movies, music)
- Ideologies/Theories (capitalism, socialism)
- Geographical Locations (countries, cities)
- Companies/Organizations (Apple, NASA)
- Scientific Concepts (gravity, climate change)

### 💡 Smart Belief Generation
Each topic type has custom belief templates:
- **People**: "X was an ethical leader", "X was competent at their role"
- **Events**: "X was justified", "X caused Y", "X could have been prevented"
- **Technology**: "X is effective", "X is better than Y", "X is cost-effective"
- And more...

### 🔄 Automatic Argument Creation
Generates supporting and opposing arguments with:
- Evidence from Wikipedia
- Argument types matched to belief
- Confidence scores

## API Endpoints

### Generate Beliefs (Preview)
```http
POST /api/belief-generator/generate
{
  "pageTitle": "Abraham Lincoln",
  "maxBeliefs": 5,
  "includeArguments": true
}
```

### Generate and Save to Database
```http
POST /api/belief-generator/generate-and-save
Authorization: Bearer <token>
{
  "pageTitle": "Electric Car",
  "maxBeliefs": 5,
  "autoCreateTopic": true
}
```

### Batch Generate
```http
POST /api/belief-generator/batch-generate
{
  "pageTitles": ["Wolf", "Electric Car", "Napoleon"],
  "maxBeliefs": 3
}
```

### Search Wikipedia
```http
GET /api/belief-generator/search?query=climate change&limit=10
```

### Classify Topic Type
```http
POST /api/belief-generator/classify
{
  "pageTitle": "Abraham Lincoln"
}
```

### Get Random Topics
```http
GET /api/belief-generator/random?count=5
```

## Testing

Run the test suite:
```bash
npm run test-belief-generator
```

Tests include:
- ✓ Topic classification (10 different types)
- ✓ Single topic generation
- ✓ Batch processing
- ✓ Wikipedia search integration
- ✓ Template coverage

## Code Examples

### Example 1: Basic Usage
```javascript
import { generateBeliefsFromWikipedia } from './services/beliefGenerator.js';

const result = await generateBeliefsFromWikipedia('Abraham Lincoln', {
  maxBeliefs: 5,
  includeArguments: true,
});

console.log(`Generated ${result.beliefs.length} beliefs`);
result.beliefs.forEach(belief => {
  console.log(`- ${belief.statement}`);
});
```

### Example 2: Batch Processing
```javascript
import { generateBeliefsFromBatch } from './services/beliefGenerator.js';

const topics = ['Wolf', 'Electric Car', 'Napoleon'];
const results = await generateBeliefsFromBatch(topics, {
  maxBeliefs: 3,
});

const total = results.reduce((sum, r) => sum + r.beliefs.length, 0);
console.log(`Generated ${total} beliefs from ${topics.length} topics`);
```

### Example 3: Topic Classification
```javascript
import { fetchWikipediaPage } from './services/wikipediaService.js';
import { classifyTopicType } from './services/topicTypeClassifier.js';

const pageData = await fetchWikipediaPage('Abraham Lincoln');
const types = classifyTopicType(pageData);

console.log('Topic types:');
types.forEach(t => {
  console.log(`- ${t.type}: ${t.confidence.toFixed(1)}%`);
});
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Wikipedia API                            │
│  • Fetch page content                                   │
│  • Extract categories                                   │
│  • Parse infobox data                                   │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            Topic Type Classifier                        │
│  • Analyze categories (40% weight)                      │
│  • Analyze content keywords (30% weight)                │
│  • Analyze infobox type (30% weight)                    │
│  → Returns: people, events, technology, etc.            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│             Belief Templates                            │
│  • Select templates for topic type                      │
│  • 8-10 templates per type                              │
│  • Custom argument types                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│            Belief Generator                             │
│  • Populate templates with Wikipedia data               │
│  • Generate arguments from key facts                    │
│  • Calculate confidence scores                          │
│  → Returns: Structured beliefs with arguments           │
└─────────────────────────────────────────────────────────┘
```

## Files Structure

```
backend/
├── services/
│   ├── wikipediaService.js       # Wikipedia API integration
│   ├── topicTypeClassifier.js    # Topic classification
│   ├── beliefTemplates.js        # Belief template definitions
│   └── beliefGenerator.js        # Main generation logic
├── controllers/
│   └── beliefGeneratorController.js  # API endpoints
├── routes/
│   └── beliefGenerator.js        # Route definitions
└── scripts/
    ├── generateBeliefs.js        # CLI tool
    └── testBeliefGenerator.js    # Test suite
```

## Performance

- **Single topic**: 2-5 seconds
- **Batch (10 topics)**: 20-50 seconds
- **Rate limiting**: 1 Wikipedia API request per second (configurable)

## Future Enhancements

1. **AI-powered generation**: Use LLMs for more sophisticated beliefs
2. **Multi-language support**: Support non-English Wikipedia
3. **Real-time updates**: Monitor Wikipedia changes
4. **Custom templates**: User-defined belief templates
5. **Evidence linking**: Automatic citation extraction

## Documentation

Full documentation: [AUTOMATED_BELIEF_GENERATION.md](../docs/AUTOMATED_BELIEF_GENERATION.md)

## Examples

### Example Output

Input: `"Abraham Lincoln"`

Output:
```json
{
  "source": {
    "title": "Abraham Lincoln",
    "url": "https://en.wikipedia.org/wiki/Abraham_Lincoln"
  },
  "primaryType": "people",
  "beliefs": [
    {
      "statement": "Abraham Lincoln was an ethical leader",
      "category": "philosophy",
      "polarity": "positive",
      "confidence": 75,
      "arguments": {
        "supporting": [
          {
            "content": "Lincoln abolished slavery with the Emancipation Proclamation...",
            "type": "supporting",
            "argumentType": "moral_behavior"
          }
        ],
        "opposing": [
          {
            "content": "Some critics argue Lincoln suspended habeas corpus...",
            "type": "opposing",
            "argumentType": "moral_behavior"
          }
        ]
      }
    }
  ]
}
```

## License

MIT

## Support

- GitHub Issues: https://github.com/myklob/ideastockexchange/issues
- Documentation: https://github.com/myklob/ideastockexchange/wiki
