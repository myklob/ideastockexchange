# "What Links Here" Feature - Implementation Guide

## Overview

The "What Links Here" feature enables users to understand the **belief dependency network** by showing:

1. **Incoming Links**: Which beliefs support or oppose this belief (dependencies)
2. **Outgoing Links**: Which beliefs this belief supports or opposes (influence)
3. **Network Position**: How central and influential this belief is in the overall network

This creates a **Wikipedia-style link graph** for beliefs, making the argument structure transparent and navigable.

---

## Architecture

### **1. Data Model**

#### **BeliefLink Model** (`backend/models/BeliefLink.js`)

Each link represents an argument from one belief being used to support/oppose another belief.

```javascript
{
  fromBeliefId: ObjectId,      // Source belief (providing the argument)
  toBeliefId: ObjectId,        // Target belief (receiving support/opposition)
  argumentId: ObjectId,        // The argument creating this link
  linkType: 'SUPPORTS' | 'OPPOSES',
  linkStrength: Number (0-100), // Computed from hybrid scoring
  contribution: {
    argumentScore: Number,
    reasonRankContribution: Number,
    voteContribution: Number,
    aspectContribution: Number,
    totalContribution: Number    // Can be negative for opposing
  },
  metadata: {
    createdAt: Date,
    lastUpdated: Date,
    createdBy: ObjectId,
    isActive: Boolean
  }
}
```

#### **Belief Model Extensions**

Added `linkStatistics` field to track:

```javascript
linkStatistics: {
  incoming: { total, supporting, opposing, totalContribution, averageStrength },
  outgoing: { total, supporting, opposing, totalContribution, averageStrength },
  networkPosition: { centrality, influenceScore, dependencyScore },
  topIncoming: [{ beliefId, strength, type }],
  topOutgoing: [{ beliefId, strength, type }],
  lastUpdated: Date
}
```

---

### **2. Hybrid Scoring System**

The scoring system combines three feedback mechanisms:

#### **Scoring Formula**

```
TotalScore = (ReasonRank × 0.50) + (VoteScore × 0.35) + (AspectScore × 0.15)
```

**Configurable Weights:**
- **ReasonRank (50%)**: Rewards users who provide structured arguments
- **Votes (35%)**: Accommodates users who only upvote/downvote
- **Aspect Ratings (15%)**: Middle ground for dimensional feedback

#### **Aspect Ratings**

Users can rate five aspects of arguments (1-5 scale):
- **Clarity**: How well-explained the argument is
- **Truth**: How factually accurate it seems
- **Usefulness**: How helpful to the discussion
- **Evidence**: Quality of supporting evidence
- **Logic**: Logical coherence

Each aspect is rated independently and averaged.

#### **Vote Scoring**

Uses **Wilson Score Confidence Interval** to prevent:
- New arguments with 1 upvote ranking higher than established arguments
- Vote count inflation

```javascript
voteScore = wilsonLowerBound(upvotes, downvotes, confidence=0.95)
```

---

### **3. API Endpoints**

#### **Belief Link Endpoints**

```
GET  /api/beliefs/:id/links/incoming
     Query params: ?type=SUPPORTS|OPPOSES&limit=50&sortBy=strength|contribution|recent

GET  /api/beliefs/:id/links/outgoing
     Query params: ?type=SUPPORTS|OPPOSES&limit=50&sortBy=strength|contribution|recent

GET  /api/beliefs/:id/links/graph
     Query params: ?depth=1
     Returns full bidirectional graph

GET  /api/beliefs/:id/links/summary
     Quick stats summary

POST /api/beliefs/:id/links/update-statistics
     Recalculates link statistics (Admin only)
```

#### **Network-Wide Endpoints**

```
GET  /api/beliefs/links/top-influential
     Beliefs with highest influence scores

GET  /api/beliefs/links/most-central
     Most connected beliefs in the network

GET  /api/beliefs/links/network-stats
     Overall network statistics
```

#### **Aspect Rating Endpoints**

```
POST /api/arguments/:id/rate-aspect
     Body: { aspect: 'clarity'|'truth'|'usefulness'|'evidence'|'logic', rating: 1-5 }

GET  /api/arguments/:id/aspect-stats
     Get aspect rating statistics

GET  /api/arguments/:id/my-aspect-ratings
     Get current user's ratings (requires auth)
```

---

### **4. Migration Script**

**Run once** to populate BeliefLink collection from existing arguments:

```bash
node backend/scripts/migrateBeliefLinks.js
```

**What it does:**
1. Analyzes all existing arguments
2. Extracts belief references from argument content
3. Creates BeliefLink documents
4. Calculates link strengths using hybrid scoring
5. Updates belief link statistics

**Output:**
```
🔗 Starting Belief Link Migration...
✅ Connected to MongoDB
📊 Found 1,234 active beliefs
📊 Found 5,678 active arguments
🔍 Analyzing arguments and creating links...
   Created: 423 | Updated: 156 | Skipped: 89
✅ Link creation complete!
📊 Updating belief link statistics...
   Updated: 1,234/1,234
✅ Migration completed successfully!
```

---

## Usage Examples

### **Backend: Query Incoming Links**

```javascript
// Get all beliefs that support this belief
const response = await fetch('/api/beliefs/123/links/incoming?type=SUPPORTS&limit=10');
const { links, stats } = await response.json();

console.log(`Total supporting beliefs: ${stats.supporting}`);
console.log(`Average link strength: ${stats.averageStrength}`);

links.forEach(link => {
  console.log(`${link.fromBeliefId.statement} → ${link.linkStrength}/100`);
});
```

### **Backend: Get Link Graph**

```javascript
const response = await fetch('/api/beliefs/123/links/graph?depth=1');
const { graph } = await response.json();

console.log('Incoming dependencies:', graph.incoming.length);
console.log('Outgoing influence:', graph.outgoing.length);
console.log('Network centrality:', graph.belief.linkStatistics.network.centrality);
```

### **Backend: Rate an Aspect**

```javascript
await fetch('/api/arguments/456/rate-aspect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    aspect: 'clarity',
    rating: 5
  })
});
```

---

## Scoring Transparency

Every link provides a **score breakdown** showing exactly how it was calculated:

```javascript
{
  components: {
    reasonRank: { score: 75, weight: 0.50, contribution: 37.5 },
    votes: { score: 82, weight: 0.35, contribution: 28.7 },
    aspects: { score: 68, weight: 0.15, contribution: 10.2 }
  },
  hybridScore: 76,
  argumentQuality: 85,
  linkStrength: 65  // hybridScore * argumentQuality / 100
}
```

This transparency helps users understand:
- Why certain beliefs rank higher
- How different feedback types contribute
- Where to focus improvement efforts

---

## User Engagement Levels

The system supports three engagement levels:

### **1. High Engagement (Full Arguments)**
- Users write structured arguments with reasoning
- System rewards with **50% weight** via ReasonRank
- Creates dense, well-reasoned belief networks

### **2. Medium Engagement (Aspect Ratings)**
- Users rate specific argument dimensions
- Provides nuanced feedback without full writing
- **15% weight** in scoring

### **3. Low Engagement (Voting)**
- Users simply upvote/downvote
- Quick, accessible feedback mechanism
- **35% weight** to ensure broad participation

All three levels contribute to the final scores, making the system inclusive while still rewarding effort.

---

## Network Metrics

### **Centrality**
How connected a belief is in the network:
```
centrality = min(total_connections / 100, 1.0)
```

### **Influence Score**
How much a belief contributes to other beliefs:
```
influenceScore = sum(outgoing_link_contributions)
```

### **Dependency Score**
How much a belief depends on other beliefs:
```
dependencyScore = sum(incoming_link_contributions)
```

---

## Future Enhancements

### **1. Graph Visualization**
- D3.js force-directed graph
- Interactive exploration of belief networks
- Color-coding by link type (support/oppose)

### **2. Path Finding**
- Find reasoning chains between two beliefs
- Identify logical dependencies
- Detect circular reasoning

### **3. Community Detection**
- Identify belief clusters
- Find schools of thought
- Map ideological boundaries

### **4. Temporal Analysis**
- Track how belief networks evolve
- Identify emerging consensus
- Detect shifting dependencies

### **5. Contradiction Detection**
- Identify beliefs that support contradictory conclusions
- Flag logical inconsistencies
- Suggest resolution strategies

---

## Maintenance

### **Updating Link Strengths**

When arguments or beliefs change:

```javascript
// Update all links for a belief
const BeliefLink = require('./models/BeliefLink');
await BeliefLink.updateLinksForBelief(beliefId);

// Update specific link
const link = await BeliefLink.findOne({ argumentId });
await link.calculateLinkStrength();
await link.save();
```

### **Recalculating Statistics**

```javascript
const belief = await Belief.findById(beliefId);
await belief.updateLinkStatistics();
await belief.save();
```

### **Bulk Recalculation**

For system-wide updates (e.g., after changing scoring weights):

```bash
node backend/scripts/recalculateLinkScores.js
```

---

## Performance Considerations

### **Indexes**

The system creates indexes for efficient queries:

```javascript
// BeliefLink indexes
{ fromBeliefId: 1, toBeliefId: 1 }
{ toBeliefId: 1, linkStrength: -1 }  // Incoming links by strength
{ fromBeliefId: 1, linkStrength: -1 } // Outgoing links by strength
{ argumentId: 1 } (unique)
```

### **Caching**

Link statistics are cached in the Belief model and updated:
- When arguments are added/modified
- When aspect ratings change
- When votes are cast
- Periodically via scheduled job

### **Pagination**

All link queries support pagination:
```javascript
GET /api/beliefs/:id/links/incoming?limit=20&offset=0
```

---

## Testing

### **Unit Tests**

```bash
npm test -- beliefLinks
npm test -- hybridScoring
npm test -- aspectRatings
```

### **Integration Tests**

```bash
npm test -- integration/beliefLinks
```

### **Manual Testing**

1. Create two beliefs
2. Add an argument on Belief B that references Belief A
3. Run migration script
4. Check `/api/beliefs/B/links/incoming` → Should show link from A
5. Check `/api/beliefs/A/links/outgoing` → Should show link to B
6. Rate aspects of the argument
7. Verify link strength updates

---

## Troubleshooting

### **Links not appearing**

1. Check if migration script ran: `db.belieflinks.count()`
2. Verify arguments reference other beliefs
3. Check `metadata.isActive = true`
4. Refresh link statistics: `POST /api/beliefs/:id/links/update-statistics`

### **Link strengths seem wrong**

1. Check hybrid scoring weights in `hybridScoringService.js`
2. Verify aspect ratings are being saved
3. Check vote counts
4. Review reasonRankScore calculation

### **Performance issues**

1. Ensure indexes are created: `db.belieflinks.getIndexes()`
2. Use pagination for large result sets
3. Cache frequently accessed link statistics
4. Consider read replicas for heavy query load

---

## Summary

The "What Links Here" feature provides:

✅ **Transparency**: Clear view of belief dependencies
✅ **Navigation**: Easy exploration of argument networks
✅ **Scoring**: Fair, multi-dimensional feedback system
✅ **Inclusivity**: Supports all engagement levels
✅ **Scalability**: Indexed, cached, and optimized

This creates a **living map of human reasoning** that helps users understand not just what people believe, but **why** they believe it and **how** beliefs connect.
