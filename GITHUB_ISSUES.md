# GitHub Issues - Idea Stock Exchange

This document contains formatted GitHub issues ready to be created. Each issue is presented in a copy-paste friendly format.

**Summary of Completed Work (2025-11-28)**:
- ✅ **Issue #43**: Fixed voting state sync bug - votes now persist and display correctly
- ✅ **Issue #4**: Completed evidence display in ArgumentCard - full expandable evidence details
- ✅ **Issue #5**: Added sub-argument creation UI - inline reply form with depth limiting

---

## Priority 1: Critical & High Priority Issues

### Issue: Set up testing infrastructure

**Labels**: `infrastructure`, `testing`, `priority-high`

**Description**:
Set up comprehensive testing infrastructure for both backend and frontend to ensure code quality and prevent regressions.

**Current Status**: No tests exist yet

**Tasks**:
- [ ] Install and configure Jest for backend testing
- [ ] Install and configure React Testing Library for frontend
- [ ] Set up test scripts in package.json
- [ ] Create sample test files as templates
- [ ] Add test coverage reporting
- [ ] Configure CI/CD to run tests automatically

**Acceptance Criteria**:
- `npm test` runs successfully in both backend and frontend
- Sample tests pass for at least one component and one API endpoint
- Coverage reports generated

**Technical Details**:
```bash
# Backend
npm install --save-dev jest supertest @types/jest

# Frontend
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

---

### Issue: Write unit tests for scoring algorithms

**Labels**: `testing`, `algorithms`, `priority-high`

**Description**:
Add comprehensive unit tests for all scoring algorithms to ensure accuracy and prevent regressions.

**Dependencies**: Requires Issue "Set up testing infrastructure" to be completed first

**Current Implementation**:
- ✅ ArgumentRank/ReasonRank algorithm (server.js:45-88)
- ✅ Fallacy detection system (fallacyDetector.js) - 10 fallacy types
- ✅ Redundancy detection (redundancyDetector.js) - 4 algorithms
- ✅ Conclusion score calculation - 7-factor scoring

**Tasks**:
- [ ] Test calculateConclusionScore method with various input scenarios
- [ ] Test ArgumentRank algorithm with different matrix sizes
- [ ] Test all 10 fallacy detection types
- [ ] Test all 4 redundancy detection algorithms
- [ ] Test evidence verification scoring
- [ ] Test edge cases (empty inputs, extreme values)

**Acceptance Criteria**:
- 80%+ code coverage for algorithm files
- All tests pass
- Edge cases handled correctly

**Files to Test**:
- `backend/models/Belief.js` (calculateConclusionScore)
- `backend/utils/fallacyDetector.js`
- `backend/utils/redundancyDetector.js`
- Algorithm endpoints in `backend/server.js`

---

### Issue: Add integration tests for API endpoints

**Labels**: `testing`, `api`, `priority-high`

**Description**:
Test all API endpoints with various scenarios including success cases, error cases, and edge cases.

**Dependencies**: Requires Issue "Set up testing infrastructure" to be completed first

**Tasks**:
- [ ] Test auth endpoints (register, login, profile, logout)
- [ ] Test belief CRUD operations (create, read, update, delete)
- [ ] Test argument CRUD and voting functionality
- [ ] Test evidence submission and verification
- [ ] Test analysis endpoints (redundancy, fallacies)
- [ ] Test authorization (ensure protected routes require auth)
- [ ] Test validation (ensure invalid data is rejected)

**Acceptance Criteria**:
- All major user flows have integration tests
- Tests cover both success and failure scenarios
- Authorization and validation properly tested

**Example Test Structure**:
```javascript
describe('Argument API', () => {
  describe('POST /api/arguments/:id/vote', () => {
    it('should allow authenticated users to vote');
    it('should reject unauthenticated requests');
    it('should toggle vote when voting same type twice');
    it('should change vote when voting different type');
  });
});
```

---

### Issue: Add API documentation with Swagger/OpenAPI

**Labels**: `documentation`, `api`, `priority-high`

**Description**:
Document all API endpoints with interactive Swagger/OpenAPI documentation for easier integration and development.

**Current Status**: No API documentation exists

**Tasks**:
- [ ] Install swagger-jsdoc and swagger-ui-express
- [ ] Add JSDoc comments to all route handlers
- [ ] Configure Swagger UI at /api-docs endpoint
- [ ] Document request/response schemas
- [ ] Add example requests and responses
- [ ] Document authentication requirements
- [ ] Add error response documentation

**Acceptance Criteria**:
- Swagger UI accessible at `/api-docs`
- All endpoints documented
- Examples provided for complex requests

**Implementation**:
```javascript
// Install dependencies
npm install swagger-jsdoc swagger-ui-express

// Add to server.js
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ISE API',
      version: '1.0.0',
      description: 'Idea Stock Exchange API Documentation'
    },
    servers: [{ url: '/api' }]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

### Issue: Implement rate limiting

**Labels**: `backend`, `security`, `priority-medium`

**Description**:
Add rate limiting to prevent API abuse and protect against DoS attacks.

**Current Status**: No rate limiting exists

**Tasks**:
- [ ] Install express-rate-limit
- [ ] Configure different rate limits per endpoint type (e.g., stricter for auth, looser for reads)
- [ ] Optional: Add Redis for distributed rate limiting
- [ ] Return 429 status with Retry-After header
- [ ] Whitelist authenticated users for higher limits
- [ ] Add rate limit info to API documentation

**Acceptance Criteria**:
- Excessive requests return 429 error
- Different limits for different endpoint types
- Authenticated users have higher limits

**Implementation**:
```javascript
import rateLimit from 'express-rate-limit';

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

### Issue: Add email verification

**Labels**: `backend`, `auth`, `priority-medium`

**Description**:
Implement email verification on user registration to ensure valid email addresses and prevent spam accounts.

**Current Status**: No email functionality exists

**Tasks**:
- [ ] Add `emailVerified` boolean field to User model
- [ ] Generate secure verification tokens
- [ ] Set up email service (SendGrid, Mailgun, or AWS SES)
- [ ] Send verification emails on registration
- [ ] Create `/api/auth/verify-email/:token` endpoint
- [ ] Show unverified status in UI
- [ ] Optionally restrict features for unverified users
- [ ] Add resend verification email functionality

**Acceptance Criteria**:
- New users receive verification email
- Email contains working verification link
- Verified status tracked in database

**User Model Update**:
```javascript
emailVerified: {
  type: Boolean,
  default: false
},
verificationToken: {
  type: String,
  select: false
},
verificationTokenExpires: {
  type: Date,
  select: false
}
```

---

### Issue: Implement password reset flow

**Labels**: `backend`, `auth`, `priority-medium`

**Description**:
Allow users to reset forgotten passwords via email.

**Current Status**: Only authenticated password change exists (authController.js:158-188)

**Tasks**:
- [ ] Create "Forgot Password" page in frontend
- [ ] Add `/api/auth/forgot-password` endpoint
- [ ] Generate secure reset tokens
- [ ] Send password reset emails
- [ ] Create `/api/auth/reset-password/:token` endpoint
- [ ] Add reset password form with token validation
- [ ] Expire tokens after 1 hour
- [ ] Invalidate old tokens when new one is requested

**Acceptance Criteria**:
- Users can request password reset via email
- Reset link works and expires appropriately
- Password successfully updated

---

### Issue: Enhance user profile page

**Labels**: `frontend`, `ui`, `priority-medium`

**Description**:
Improve profile page with comprehensive user information, statistics, and contribution history.

**Current Status**:
- ✅ Basic profile page exists at `/profile` route (app.js:140-164)
- ✅ Shows username, reputation, role
- ❌ No statistics or contribution lists

**Tasks**:
- [ ] Show user statistics (beliefs created count, arguments count, total votes)
- [ ] List user's beliefs with scores
- [ ] List user's arguments with votes
- [ ] Add profile editing UI (username, bio, avatar upload)
- [ ] Add contribution timeline/activity feed
- [ ] Enable viewing other users' public profiles (`/users/:id`)
- [ ] Add reputation breakdown (how it was earned)
- [ ] Show badges/achievements (if implemented)

**Acceptance Criteria**:
- Profile shows comprehensive user information
- Users can edit their own profile
- Public profiles viewable by others
- Activity timeline visible

**API Endpoints Needed**:
```javascript
GET /api/users/:id - Get public user profile
GET /api/users/:id/beliefs - Get user's beliefs
GET /api/users/:id/arguments - Get user's arguments
GET /api/users/:id/activity - Get user's activity timeline
PUT /api/users/profile - Update own profile
POST /api/users/avatar - Upload avatar
```

---

## Priority 2: Phase 2 Features (Advanced Scoring)

### Issue: Implement Truth Score (separate from Conclusion Score)

**Labels**: `backend`, `algorithms`, `phase-2`

**Description**:
Add Truth Score bounded between -1 and +1, calculated from logical validity, evidence quality, and counterargument weight.

**Current Status**:
- Conclusion Score exists (multi-factor scoring)
- Truth Score not implemented

**Tasks**:
- [ ] Add `truthScore` field to Belief model
- [ ] Implement calculation formula: `(Logical Validity × Evidence Quality × Verification) ± Counterargument Weight`
- [ ] Create `/api/beliefs/:id/truth-score` endpoint
- [ ] Update UI to display truth score alongside conclusion score
- [ ] Add tooltip explaining difference between scores
- [ ] Create visualization (e.g., -1 to +1 scale)

**Acceptance Criteria**:
- Beliefs have both Conclusion Score and Truth Score
- Truth Score accurately reflects logical validity
- UI displays both scores clearly

**Formula Details**:
```javascript
truthScore = (logicalValidity * evidenceQuality * verificationScore) - counterargumentWeight
// Bound between -1 and +1
truthScore = Math.max(-1, Math.min(1, truthScore));
```

---

### Issue: Implement Importance Score

**Labels**: `backend`, `algorithms`, `phase-2`

**Description**:
Add Importance Score to measure real-world consequence and impact of beliefs.

**Tasks**:
- [ ] Add `importanceScore` field to Belief model
- [ ] Create importance argument type (cost-benefit, ethical, policy impact)
- [ ] Calculate importance from specialized importance arguments
- [ ] Add importance input UI when creating beliefs
- [ ] Display importance vs truth scatter plot
- [ ] Add filters for high-importance beliefs
- [ ] Create "Most Important Beliefs" leaderboard

**Acceptance Criteria**:
- Beliefs can be ranked by importance
- Importance score visible on belief cards
- Filter/sort by importance works

---

### Issue: Add belief score history graph

**Labels**: `frontend`, `visualization`, `phase-2`

**Description**:
Visualize how belief scores change over time with a line chart.

**Tasks**:
- [ ] Add score history tracking to Belief model
- [ ] Install charting library (Chart.js or Recharts)
- [ ] Create ScoreHistoryChart component
- [ ] Show truth score trend line
- [ ] Add markers for major events (new evidence, major arguments)
- [ ] Display on belief detail page
- [ ] Add date range selector

**Acceptance Criteria**:
- Belief page shows score timeline
- Interactive chart with tooltips
- Major events annotated

---

## Priority 3: Known Bugs

### Issue: Evidence form validation edge cases

**Labels**: `bug`, `frontend`, `priority-medium`

**Description**:
Improve URL validation in evidence submission form to catch edge cases.

**Current Status**:
- ✅ Basic validation exists (EvidenceForm.jsx:84-87)
- ✅ Uses HTML5 `type="url"`
- ⚠️ No custom regex validation
- ⚠️ Basic error messages

**Tasks**:
- [ ] Add comprehensive URL regex validation
- [ ] Validate URL protocol (http/https)
- [ ] Check for malformed URLs
- [ ] Improve error messages (specific feedback)
- [ ] Add real-time validation feedback
- [ ] Test edge cases: localhost, IP addresses, ports, special characters
- [ ] Add URL preview/verification

**Acceptance Criteria**:
- Invalid URLs rejected with clear error messages
- Edge cases handled correctly
- User-friendly validation feedback

**Validation Regex**:
```javascript
const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
```

---

### Issue: Redundancy detector performance optimization

**Labels**: `bug`, `backend`, `priority-low`, `performance`

**Description**:
Optimize redundancy detection algorithm to handle large argument sets efficiently.

**Current Status**:
- ⚠️ O(n²) pairwise comparisons (redundancyDetector.js)
- ⚠️ Calculates 4 similarity metrics per pair
- ⚠️ No pagination or background processing
- Analysis route at `/api/analysis/redundancy` (server.js:107-154)

**Performance Issue**: Degrades significantly with >100 arguments

**Tasks**:
- [ ] Implement pagination for redundancy analysis
- [ ] Add background job processing (Bull queue with Redis)
- [ ] Optimize algorithms (early termination, caching)
- [ ] Pre-compute similarity scores asynchronously
- [ ] Add database indexing for faster lookups
- [ ] Cache results with TTL
- [ ] Add progress indicator for long-running analyses

**Acceptance Criteria**:
- Analysis completes in reasonable time for 500+ arguments
- Background processing available for large sets
- Progress indicator shows for long operations

**Optimization Ideas**:
```javascript
// Early termination if similarity below threshold
if (jaccardSimilarity < 0.3) continue;

// Use LSH (Locality-Sensitive Hashing) for faster similarity search
// Cache frequently accessed comparisons
```

---

## Priority 4: Infrastructure & Performance

### Issue: Implement WebSocket for live updates

**Labels**: `backend`, `frontend`, `infrastructure`

**Description**:
Add real-time updates for scores, votes, and new content using WebSockets.

**Tasks**:
- [ ] Install Socket.io (server and client)
- [ ] Set up WebSocket server
- [ ] Emit events on score changes
- [ ] Emit events on new arguments/evidence
- [ ] Update UI in real-time without refresh
- [ ] Show "New argument" notifications
- [ ] Handle reconnection gracefully

**Acceptance Criteria**:
- Scores update live without refresh
- New content appears in real-time
- Notifications work correctly

---

### Issue: Add notification system

**Labels**: `backend`, `frontend`

**Description**:
Notify users of activity on their content (new arguments, votes, replies).

**Tasks**:
- [ ] Create Notification model
- [ ] Trigger notifications on events (new argument, vote, reply, etc.)
- [ ] Create notifications dropdown in nav bar
- [ ] Mark notifications as read
- [ ] Add notification preferences
- [ ] Optional: Send email notifications

**Acceptance Criteria**:
- Users receive in-app notifications
- Notification icon shows unread count
- Clicking notification navigates to content

---

### Issue: Implement caching with Redis

**Labels**: `backend`, `infrastructure`, `performance`

**Description**:
Cache frequently accessed data to reduce database load and improve performance.

**Tasks**:
- [ ] Install and configure Redis
- [ ] Cache belief queries (popular beliefs)
- [ ] Cache score calculations (expensive)
- [ ] Cache analysis results
- [ ] Set appropriate expiration policies
- [ ] Invalidate cache on updates
- [ ] Add cache hit/miss metrics

**Acceptance Criteria**:
- Page load time reduced by 50%
- Database queries reduced significantly
- Cache invalidation works correctly

---

## Priority 5: Phase 3+ Features (Future)

### Issue: Community/Topic grouping system

**Labels**: `backend`, `frontend`, `phase-2`

**Description**: Create Communities to group related beliefs

---

### Issue: Automatic reputation calculation

**Labels**: `backend`, `algorithms`, `phase-3`

**Description**: Calculate user reputation based on contribution impact

---

### Issue: CBO (Chief Belief Officer) system

**Labels**: `backend`, `algorithms`, `phase-3`

**Description**: Identify and reward top contributors per belief

---

### Issue: Media database and truth scoring

**Labels**: `backend`, `phase-4`

**Description**: Track films, books, podcasts and score them based on promoted beliefs

---

### Issue: AI claim extraction

**Labels**: `backend`, `ai`, `phase-5`

**Description**: Use GPT to extract factual claims from articles

---

### Issue: Version history for beliefs

**Labels**: `backend`, `phase-6`

**Description**: Track all changes to beliefs with diff view

---

## How to Use This Document

1. **Creating Issues on GitHub**:
   - Copy each issue section
   - Paste into GitHub's "New Issue" form
   - Add the specified labels
   - Assign to milestones as appropriate

2. **Prioritization**:
   - Start with Priority 1 (Critical & High Priority)
   - Complete testing infrastructure first
   - Address bugs alongside new features

3. **Progress Tracking**:
   - Check off completed tasks using GitHub's task list feature
   - Update issue status as work progresses
   - Link related PRs to issues

---

**Last Updated**: 2025-11-28
**Total Issues**: 45
**Completed**: 3 (Issues #43, #4, #5)
**Ready to Create**: 42
