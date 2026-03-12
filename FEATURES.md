# Idea Stock Exchange - Feature Documentation

## Core Features Implemented

This document outlines all implemented features of the Objective Criteria system based on the design specification.

## 1. Topic Management

### Create Topics
- Define debatable topics (e.g., "Is the Economy Healthy?", "How Severe is Climate Change?")
- Add descriptions and context
- Organize all criteria for a topic in one place

### Browse Topics
- View all available topics
- Sort and filter
- Navigate to detailed topic pages

### Topic Pages
- Display all criteria for a topic
- Show overall topic context
- Enable criterion creation and evaluation

## 2. Objective Criteria System

### Propose Criteria
Users can propose specific, quantifiable metrics for evaluating topics:

**Example for "Economic Health":**
- GDP Growth Rate
- Median Real Wage Growth
- Labor Force Participation Rate
- Gini Coefficient (Inequality)
- Consumer Price Index
- Housing Affordability Index

**Example for "Climate Change":**
- Average Global Temperature
- Glacier Mass Balance
- Sea Level Rise
- Arctic Ice Extent
- CO2 Concentration

### Criterion Properties
Each criterion has:
- **Name**: Clear, specific identifier
- **Description**: What it measures and why
- **Overall Score**: 0-100% quality rating
- **Four Dimension Scores**: Detailed quality breakdown

## 3. Four Quality Dimensions

Every criterion is evaluated across four dimensions:

### ✓ Validity (Does this measure what we think?)
Questions answered:
- Does this metric actually capture the concept we're trying to measure?
- Are there confounding factors?
- Does it measure symptoms vs. causes?

**Example Arguments:**
- Supporting: "GDP directly measures economic output"
- Opposing: "GDP doesn't account for distribution - economy can grow while median person suffers"

### ⚖ Reliability (Can different people measure consistently?)
Questions answered:
- Can this be measured objectively?
- Are measurements replicable?
- Is historical data comparable?

**Example Arguments:**
- Supporting: "Satellite measurements are objective and replicable"
- Opposing: "Historical baseline data less precise than modern measurements"

### ◉ Independence (Is the data source neutral?)
Questions answered:
- Are there conflicts of interest?
- Can data be verified independently?
- Is there manipulation risk?

**Example Arguments:**
- Supporting: "Data collected by independent meteorological agencies worldwide"
- Opposing: "Study funded by oil company on emissions safety"

### ↔ Linkage (How strongly does this correlate with the goal?)
Questions answered:
- Does this metric predict the outcome we care about?
- How direct is the causal relationship?
- Does it affect the right people?

**Example Arguments:**
- Supporting: "Median wage growth directly affects most people's lives"
- Opposing: "Stock market affects investors primarily - weak correlation with median quality of life"

## 4. Argument-Based Evaluation

### Create Arguments
For each dimension of each criterion, users can propose arguments:

**Argument Components:**
- **Dimension**: Which quality dimension (Validity, Reliability, etc.)
- **Direction**: Supporting (pushes score up) or Opposing (pushes score down)
- **Content**: The argument text
- **Evidence Quality** (0-100%): How well-supported with evidence
- **Logical Validity** (0-100%): How logically sound
- **Importance** (0-100%): How important this consideration is

### Argument Weighting
Arguments are automatically weighted by their quality:
- High-quality arguments (well-supported, logical, important) → High weight
- Low-quality arguments → Low weight
- Weight = (Evidence × Logic × Importance)^(1/3)

**Example:**
- Argument with Evidence=90%, Logic=90%, Importance=90% → Weight=90%
- Argument with Evidence=90%, Logic=90%, Importance=30% → Weight=66%

### Real-Time Score Updates
When arguments are added or updated:
1. Argument weight is recalculated
2. Dimension scores update based on supporting vs. opposing weight
3. Overall criterion score updates from dimension scores
4. All changes visible immediately in UI

## 5. Transparent Scoring

### Score Visualization
Every criterion displays:
- Overall quality score (0-100%)
- Individual dimension scores
- Visual progress bars with color coding:
  - Green (80-100%): Excellent
  - Blue (60-80%): Good
  - Yellow (40-60%): Moderate
  - Red (0-40%): Weak

### Detailed Breakdown
Click "Show Detailed Breakdown" to see:
- How each dimension was scored
- All supporting arguments with weights
- All opposing arguments with weights
- Total support weight vs. total oppose weight
- Balance calculation
- How final score was derived

**Example Breakdown:**

```
Validity Dimension: 88%

Supporting Arguments (Total Weight: 300):
- "Ice melts only when heat added" (Weight: 90)
- "Integrates temperature over time" (Weight: 85)
- "Multiple independent verification" (Weight: 80)

Opposing Arguments (Total Weight: 100):
- "Local precipitation effects" (Weight: 70)
- "Historical data less precise" (Weight: 65)

Balance: +200 → Score: 88%
```

## 6. Evidence Integration

### Link Evidence to Criteria
Users can add evidence measured against specific criteria:
- Claim being made
- Measured value
- Source
- URL for verification

### Automatic Weighting
Evidence is automatically weighted by criterion quality:
- Evidence based on 92%-rated criterion → Weight = 92%
- Evidence based on 15%-rated criterion → Weight = 15%

**Result:** Better measurement standards automatically get more influence

## 7. Filtering and Views

### Sort Criteria
- By overall score (highest first)
- By name (alphabetical)
- By recency (newest first)

### Custom Views (Framework in place)
System supports creating custom weighted views:
- "Growth-Focused Economic View" (emphasizes GDP, stock market)
- "Equality-Focused Economic View" (emphasizes wages, Gini coefficient)
- Users see same data through different value lenses

## 8. User Interface Features

### Intuitive Navigation
- Clean, card-based layouts
- Expandable details
- Breadcrumb navigation
- Responsive design

### Interactive Forms
- Inline argument creation
- Slider controls for quality scores
- Real-time validation
- Clear error messages

### Visual Feedback
- Color-coded scores
- Animated transitions
- Loading indicators
- Success/error notifications

### Educational Context
- Explanatory text throughout
- Dimension descriptions
- Example topics and criteria
- Inline help

## 9. API Features

### RESTful API
Complete REST API with:
- JSON request/response
- Standard HTTP methods (GET, POST, PUT, DELETE)
- Proper status codes
- Error handling

### Auto-Generated Documentation
Interactive API docs at `/docs`:
- Try endpoints directly
- See request/response schemas
- View all available operations

### CORS Support
Frontend-backend communication enabled with proper CORS configuration

## 10. Database Features

### Relational Data Model
- Topics contain Criteria
- Criteria contain Dimension Arguments
- Arguments contain Evidence
- Cascading deletes for data integrity

### Automatic Score Storage
Calculated scores cached in database:
- Avoids recalculation on every request
- Updates only when arguments change
- Fast read operations

### SQLite for Development
- No separate database server needed
- Easy to reset and seed
- Portable

### PostgreSQL-Ready
Code supports switching to PostgreSQL for production

## 11. Example Data

### Pre-Seeded Topics

**Climate Change Severity** with 4 criteria:
1. **Glacier Mass Balance** (92% - Excellent)
   - High validity, reliability, independence, linkage
   - Strong supporting arguments
   - Demonstrates high-quality criterion

2. **Average Global Temperature** (85% - Excellent)
   - Good across all dimensions
   - Some valid opposing arguments
   - Balanced evaluation

3. **Frequency of Hot Days** (60% - Moderate)
   - Lower reliability and linkage scores
   - Confounds weather with climate
   - Shows moderate-quality criterion

4. **Twitter Sentiment** (15% - Very Weak)
   - Low on all dimensions
   - Strong opposing arguments
   - Demonstrates poor criterion

**Economic Health** with 3 criteria:
1. **Median Real Wage Growth** (High score expected)
2. **GDP Growth Rate** (Medium score expected)
3. **Stock Market Performance** (Lower score expected)

## 12. Algorithm Implementation

### ReasonRank Algorithm
Custom implementation of argument-based scoring:
- Geometric mean for argument weights
- Sigmoid function for dimension scores
- Weighted average for overall scores
- Mathematically sound and transparent

### Score Calculation Flow
```
1. User adds/updates argument
2. Calculate argument weight from quality scores
3. Sum supporting vs. opposing weights
4. Calculate dimension score from balance
5. Calculate overall score from dimensions
6. Update database
7. Return updated scores to UI
```

### Edge Case Handling
- No arguments yet → Neutral 50% score
- Only supporting → High score
- Only opposing → Low score
- Balanced arguments → Medium score

## 13. Separating Debate Layers

The system enforces clean separation:

**Layer 1: Criteria Quality** (What are we measuring?)
- "Is GDP a good measure of economic health?"
- Objective evaluation of measurement tools

**Layer 2: Data/Evidence** (What do measurements show?)
- "GDP grew 3% last year"
- Factual claims measured against criteria

**Layer 3: Values** (Which criteria matter most?)
- "We should prioritize equality over growth"
- Normative choices made explicit

**Result:** Fake disagreements become visible, real disagreements become negotiable

## 14. Preventing Gaming

### Multi-Factor Quality
Arguments must score well on ALL three dimensions:
- Evidence quality
- Logical validity
- Importance

Low score on any → Low overall weight

### Public Transparency
- All arguments visible
- All calculations shown
- Score breakdown available
- No hidden factors

### Community Correction
- Anyone can add counter-arguments
- Better arguments naturally emerge
- Self-correcting over time

## 15. Mobile-Friendly Design

- Responsive layouts
- Touch-friendly controls
- Readable on small screens
- Fast load times

## Future Enhancements (Not Yet Implemented)

### User Accounts & Authentication
- Personal profiles
- Argument attribution
- Reputation systems

### Advanced Filtering
- Filter by dimension scores
- Custom weight configurations
- Save personal views

### Argument Threading
- Reply to specific arguments
- Counter-arguments
- Nested reasoning trees

### Social Features
- Follow topics
- Notifications
- Discussion forums

### Analytics
- Topic activity tracking
- Score change history
- Argument effectiveness metrics

### Export/Import
- Export data as JSON
- Import from other systems
- Data portability

### Integration
- Link to external evidence sources
- Automatic fact-checking
- Research paper integration

## Summary

The current implementation provides:
✅ Complete objective criteria evaluation system
✅ Four-dimension quality scoring
✅ Argument-based score calculation
✅ Transparent algorithm with detailed breakdowns
✅ Full-stack web application (React + FastAPI)
✅ Example data demonstrating the concept
✅ Documentation and setup guides

This creates the foundation for systematic, measurable, transparent debate as described in the original design document.
