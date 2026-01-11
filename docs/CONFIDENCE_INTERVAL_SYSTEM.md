# Confidence Interval System Documentation

## Overview

The Confidence Interval (CI) System assigns a **0-100 reliability score** to every belief in the Idea Stock Exchange. This score represents **how much trust we should place in the belief's conclusion score**, not the truth of the belief itself.

- **High CI (85-100)**: "We can trust this number" - The score is stable and well-evaluated
- **Moderate CI (50-84)**: "Score may change with more data" - Needs additional review
- **Low CI (0-49)**: "Score is unreliable" - Significant uncertainty remains

## Key Principle

**The CI predicts how likely a belief's score would remain within ±10 points if 100 new experts reviewed it tomorrow.**

---

## Four Core Factors

The CI is calculated from four weighted components:

### 1. User Examination Depth (30% weight)

**What it measures:** How thoroughly verified users have examined the belief and its arguments.

**Increases when:**
- More verified users review the belief
- Users spend more time reading arguments
- Expert reviewers evaluate the content
- User interactions (expansions, votes) increase

**Decreases when:**
- Few unique reviewers
- New contested points appear
- Arguments are downvoted for low quality

**Tracked metrics:**
- Total reading time (minutes)
- Unique verified readers
- Pro/con arguments evaluated
- Expert review count
- User interactions
- Low-quality flags

### 2. Score Stability (30% weight)

**What it measures:** How stable the belief score remains despite ongoing review and new arguments.

**Increases when:**
- Score stays consistent over time (low standard deviation)
- Limited score fluctuation in last 30 days
- Long time since last major score change (>10 points)
- High activity but stable scores

**Decreases when:**
- Large score swings
- High volatility index
- Many new arguments causing score changes
- Frequent sub-argument score updates

**Tracked metrics:**
- 30-day score standard deviation
- 30-day score range (max - min)
- Score volatility index (0-1)
- Days since last major change
- New arguments in last 30 days
- Score history (last 100 changes)

### 3. Knowability (20% weight)

**What it measures:** How testable and verifiable the belief is by its nature.

**Categories:**
1. **Testable Facts** (Max CI: 100)
   - Economic statistics, scientific claims
   - Measurable outcomes, empirical data
   - Example: "Solar power costs decreased 89% from 2010-2020"

2. **Partially Testable** (Max CI: 90)
   - Policy predictions, economic forecasting
   - Conditional statements
   - Example: "Universal basic income will reduce poverty by 15%"

3. **Value Judgments** (Max CI: 75)
   - Value judgments with empirical components
   - Ethical claims with practical implications
   - Example: "Progressive taxation is fair"

4. **Pure Philosophy** (Max CI: 60)
   - Pure philosophy, speculation
   - Moral absolutes without empirical grounding
   - Example: "The meaning of life is to maximize happiness"

**Increases when:**
- Belief contains measurable outcomes
- Supported by Tier 1-2 evidence (peer-reviewed, expert analysis)
- Historical or scientific tests exist

**Decreases when:**
- Belief is primarily normative
- Little high-quality evidence
- Hypothetical or speculative

**Tracked metrics:**
- Knowability category (1-4)
- Evidence tier distribution (Tier 1-4 counts)
- Has measurable outcomes (boolean)
- Has historical tests (boolean)
- Max CI cap based on category

### 4. Challenge Resistance (20% weight)

**What it measures:** How well the belief resists attempts to overturn it.

**Increases when:**
- New challenges repeat already-refuted points (high redundancy ratio)
- Challenges fail to change the score
- Time since last successful challenge increases
- Challenge frequency declines over time

**Decreases when:**
- New arguments reveal previously unconsidered weaknesses
- Challenges significantly change the score
- Many unresolved evidence-based objections
- Challenges continue at high frequency

**Tracked metrics:**
- Total challenge attempts
- Redundant challenges count
- Redundancy ratio (0-1)
- Challenges that changed score
- Average score impact from challenges
- Days since last successful challenge
- Unique challengers count
- Unresolved objections

---

## Calculation Formula

```
CI = (UE × 0.30) + (SS × 0.30) + (K × 0.20) + (CR × 0.20)
```

Where:
- UE = User Examination score (0-100)
- SS = Score Stability score (0-100)
- K = Knowability score (0-100)
- CR = Challenge Resistance score (0-100)

**Final step:** Apply knowability cap
```
Final CI = min(CI, knowability.maxCICap)
```

---

## Database Schema

### ConfidenceInterval Model

Located at: `/backend/models/ConfidenceInterval.js`

**Core fields:**
- `beliefId`: Reference to Belief (unique, indexed)
- `ciScore`: 0-100 overall confidence score
- `confidenceLevel`: 'low' | 'moderate' | 'high'
- `userExamination`: Object with metrics and score
- `scoreStability`: Object with history and metrics
- `knowability`: Object with category and evidence tiers
- `challengeResistance`: Object with challenge tracking
- `weights`: Configurable weights for each factor
- `explanations`: Array of user-facing tooltips

### Belief Model Updates

Located at: `/backend/models/Belief.js`

**New field:**
- `confidenceInterval`: Reference to ConfidenceInterval document

### Argument Model Updates

Located at: `/backend/models/Argument.js`

**New field:** `ciTracking` object containing:
- `readingTime`: User time spent
- `uniqueReaders`: Reader count
- `expansionCount`: Interaction count
- `isRedundant`: Boolean flag
- `redundancyScore`: 0-1 similarity
- `reviewedByExperts`: Count
- `expertReviewers`: Array of expert reviews
- `initialBeliefScore`: Score before argument
- `scoreImpact`: How much argument changed score
- `contestedAsLowQuality`: Boolean
- `lowQualityFlags`: Count

---

## API Endpoints

### Belief-Specific CI

**Get CI for a belief:**
```
GET /api/beliefs/:beliefId/confidence-interval
```

**Get detailed breakdown:**
```
GET /api/beliefs/:beliefId/confidence-interval/breakdown
```

**Recalculate CI (admin/moderator only):**
```
POST /api/beliefs/:beliefId/confidence-interval/calculate
```

### Global CI Endpoints

**Get CI rankings:**
```
GET /api/confidence-intervals/rankings?level=high&category=science&limit=50
```

**Get CI statistics:**
```
GET /api/confidence-intervals/statistics
```

### Argument-Level Tracking

**Mark argument as redundant:**
```
POST /api/confidence-intervals/arguments/:argumentId/mark-redundant
Body: { redundancyScore: 0.9 }
```

**Record expert review:**
```
POST /api/confidence-intervals/arguments/:argumentId/expert-review
Body: { expertise: "Economics PhD" }
```

---

## Frontend Components

### ConfidenceIntervalDisplay

Located at: `/frontend/src/components/ConfidenceInterval/ConfidenceIntervalDisplay.jsx`

**Features:**
- Color-coded confidence level badge
- Progress bar visualization
- Interpretation text
- Key factors list (auto-generated explanations)
- Expandable detailed breakdown
- Four-factor card layout with metrics

**Usage:**
```jsx
import ConfidenceIntervalDisplay from '../components/ConfidenceInterval/ConfidenceIntervalDisplay';

<ConfidenceIntervalDisplay beliefId={beliefId} />
```

**Integration:**
- Added to `BeliefDetails` page right sidebar
- Displays below ScoreBreakdown component
- Auto-fetches CI data on mount

---

## Service Layer

### confidenceIntervalService.js

Located at: `/backend/services/confidenceIntervalService.js`

**Core functions:**

**`calculateConfidenceInterval(beliefId)`**
- Calculates all four factors
- Computes weighted composite score
- Applies knowability cap
- Generates explanations
- Returns updated CI document

**`getConfidenceInterval(beliefId)`**
- Fetches existing CI or calculates if missing
- Returns CI document

**`updateCIOnArgumentAdded(beliefId, argument)`**
- Triggered when new argument is added
- Records initial belief score
- Recalculates CI

**`updateCIOnArgumentScoreChanged(beliefId, argumentId, oldScore, newScore)`**
- Tracks score impact of argument changes
- Updates CI

**`markArgumentRedundant(argumentId, userId, redundancyScore)`**
- Marks argument as redundant
- Recalculates CI for belief

**`recordExpertReview(argumentId, userId, expertise)`**
- Records expert review
- Recalculates CI for belief

---

## Automatic CI Updates

The CI is automatically recalculated when:

1. **New argument added** → Triggers `updateCIOnArgumentAdded()`
2. **Argument score changes** → Triggers `updateCIOnArgumentScoreChanged()`
3. **User marks redundancy** → Triggers `markArgumentRedundant()`
4. **Expert review added** → Triggers `recordExpertReview()`
5. **Manual recalculation** → Via API endpoint (admin/moderator)

**Future enhancement:** Scheduled batch recalculation (nightly cron job)

---

## Example CI Outcomes

### High CI Example (Climate Science)

**Belief:** "Solar power costs have decreased over the past 20 years."

- **Knowability:** Category 1 (Testable facts)
- **Unique Readers:** 100+
- **Expert Reviews:** 15
- **Score Stability:** No changes for 4 months
- **Challenge Resistance:** 85% redundancy ratio
- **Expected CI:** 95 (High Confidence)

### Moderate CI Example (Policy)

**Belief:** "Restricting algorithmic feeds will reduce polarization."

- **Knowability:** Category 2 (Partially testable)
- **Unique Readers:** 45
- **Active debate:** Some new evidence
- **Score Stability:** Fluctuates ±8 points
- **Challenge Resistance:** Moderate
- **Expected CI:** 65 (Moderate Confidence)

### Low CI Example (Philosophy)

**Belief:** "Universal basic income is morally mandatory."

- **Knowability:** Category 4 (Pure philosophy)
- **Unique Readers:** 12
- **Score volatility:** High
- **Many new arguments:** Emerging debate
- **No clear consensus**
- **Expected CI:** 30 (Low Confidence) - capped at 60

---

## Development Guidelines

### Adding New CI Factors

To add a new factor to the CI calculation:

1. **Update Model** (`ConfidenceInterval.js`):
   - Add new factor object with metrics and score
   - Add weight to `weights` object

2. **Update Service** (`confidenceIntervalService.js`):
   - Create `calculateNewFactor(ci, belief)` function
   - Add to `calculateConfidenceInterval()` sequence
   - Update `calculateCIScore()` formula

3. **Update Frontend** (`ConfidenceIntervalDisplay.jsx`):
   - Add FactorCard for new factor
   - Include in breakdown display

4. **Update Documentation** (this file):
   - Document new factor metrics
   - Add calculation logic
   - Update examples

### Testing CI Calculations

1. **Unit tests** (future):
   - Test each factor calculation independently
   - Verify score bounds (0-100)
   - Test knowability caps

2. **Integration tests** (future):
   - Test full CI calculation flow
   - Verify automatic updates on argument changes
   - Test API endpoints

3. **Manual testing:**
   - Create test beliefs with known characteristics
   - Verify CI scores match expectations
   - Test edge cases (0 arguments, 1000 arguments)

---

## Future Enhancements

### Phase 2 Features

1. **Historical CI Tracking**
   - Track CI changes over time
   - Visualize CI trend charts
   - Identify beliefs gaining/losing confidence

2. **Sensitivity Analysis**
   - What-if scenarios: "If 10 more experts reviewed this..."
   - Factor contribution visualization
   - Confidence-weighted belief rankings

3. **User Reputation Integration**
   - Weight expert reviews by user reputation
   - Track CI contribution per user
   - Reward users who increase CI

4. **Notification System**
   - Alert users when CI drops significantly
   - Notify belief authors of low CI
   - Suggest actions to improve CI

5. **Caching and Performance**
   - Redis caching for CI scores
   - Scheduled batch recalculation
   - Incremental updates instead of full recalc

---

## Troubleshooting

### CI Not Displaying

**Problem:** CI shows "not yet calculated" message

**Solutions:**
1. Check if belief has any arguments (CI requires arguments)
2. Manually trigger calculation via API endpoint
3. Verify beliefId is correct
4. Check server logs for errors

### CI Score Seems Wrong

**Problem:** CI score doesn't match expectations

**Solutions:**
1. Check detailed breakdown to see factor scores
2. Verify knowability category is correct
3. Review argument tracking data (ciTracking fields)
4. Check if knowability cap is being applied
5. Recalculate CI manually

### Performance Issues

**Problem:** CI calculation is slow

**Solutions:**
1. Check number of arguments (1000+ may be slow)
2. Verify database indexes are created
3. Consider caching frequently-accessed CIs
4. Optimize argument queries with pagination

---

## Contact

For questions or issues with the CI system:
- GitHub Issues: https://github.com/myklob/ideastockexchange/issues
- Email: [Contact Me](https://ideastockexchange.com/contact)

---

## Changelog

### 2025-11-30 - Initial Implementation
- Created ConfidenceInterval model
- Implemented four-factor calculation system
- Added API endpoints for CI operations
- Created frontend display component
- Integrated with BeliefDetails page
- Added argument-level tracking fields
- Created comprehensive documentation
