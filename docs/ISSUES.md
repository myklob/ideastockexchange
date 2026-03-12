# Idea Stock Exchange - Issue Tracker

This document outlines all planned features, bug fixes, and enhancements for the ISE platform. Use this as a reference for creating GitHub issues.

**Last Updated**: 2025-11-16

---

## **Implementation Status Summary**

### ✅ **Completed Features**
- **Belief Editing** (Issue #6): Full CRUD operations for beliefs
- **ArgumentRank/ReasonRank** (Phase 2 Scoring): PageRank-style argument credibility scoring
- **Fallacy Detection** (Phase 2 Scoring): 10 fallacy types with confidence scoring
- **Redundancy Detection** (Phase 2 Scoring): 4 similarity algorithms for duplicate detection
- **Conclusion Score Calculation**: Multi-factor belief scoring algorithm
- **Evidence System**: Complete CRUD with credibility scoring and verification
- **Sub-argument Backend**: Model supports hierarchical argument structure

### ⚠️ **Partially Implemented**
- **Evidence Display** (Issue #4): Shows count only, not individual items
- **Sub-argument UI** (Issue #5): Backend ready, no creation UI
- **User Profiles** (Issue #7): Basic page exists, needs enhancement

### ❌ **Not Started - High Priority**
- **Testing Infrastructure** (Issues #1-3): No tests exist yet
- **API Documentation** (Issue #8): No Swagger/OpenAPI
- **Rate Limiting** (Issue #9): No protection against abuse
- **Email Verification** (Issue #10): No email functionality
- **Password Reset** (Issue #11): Only authenticated password change exists

### ⚠️ **Confirmed Bugs**
- **Voting State Sync** (Issue #43): User votes not displayed in UI
- **Evidence Validation** (Issue #44): Basic validation, could be improved
- **Redundancy Performance** (Issue #45): O(n²) algorithm slow with many arguments

---

## **Phase 1 Completion (Priority: High)**

These features complete the MVP and should be implemented first.

### **Testing & Quality Assurance**

#### Issue #1: Set up testing infrastructure
- **Labels**: `infrastructure`, `testing`, `priority-high`
- **Description**: Set up Jest for backend testing and React Testing Library for frontend
- **Tasks**:
  - [ ] Install Jest and configure for backend
  - [ ] Install React Testing Library for frontend
  - [ ] Set up test scripts in package.json
  - [ ] Create sample test files as templates
  - [ ] Add test coverage reporting
- **Acceptance Criteria**: `npm test` runs successfully in both backend and frontend

#### Issue #2: Write unit tests for scoring algorithms
- **Labels**: `testing`, `algorithms`, `priority-high`
- **Description**: Add comprehensive unit tests for all scoring algorithms
- **Tasks**:
  - [ ] Test calculateConclusionScore method
  - [ ] Test ArgumentRank algorithm
  - [ ] Test fallacy detection (all 10 types)
  - [ ] Test redundancy detection (all 4 algorithms)
  - [ ] Test evidence verification scoring
- **Acceptance Criteria**: 80%+ code coverage for algorithm files

#### Issue #3: Add integration tests for API endpoints
- **Labels**: `testing`, `api`, `priority-high`
- **Description**: Test all API endpoints with various scenarios
- **Tasks**:
  - [ ] Test auth endpoints (register, login, profile)
  - [ ] Test belief CRUD operations
  - [ ] Test argument CRUD and voting
  - [ ] Test evidence submission and verification
  - [ ] Test analysis endpoints
- **Acceptance Criteria**: All major user flows have integration tests

### **UI/UX Improvements**

#### Issue #4: Integrate evidence display in argument cards
- **Labels**: `frontend`, `ui`, `priority-high`
- **Status**: ⚠️ **PARTIALLY IMPLEMENTED** - ArgumentCard shows evidence count only
- **Description**: Show attached evidence in ArgumentCard component
- **Current Implementation** (ArgumentCard.jsx:84-87):
  - ✅ Shows evidence count (e.g., "📎 3 evidence")
  - ❌ Does NOT display individual evidence items
  - ❌ No expandable section to view evidence details
- **Tasks**:
  - [x] Update ArgumentCard to display evidence count
  - [ ] Display full evidence list with titles
  - [ ] Add expandable section for evidence details
  - [ ] Style evidence items with type icons
  - [ ] Show credibility score and verification status
  - [ ] Add click handler to view full evidence details
- **Acceptance Criteria**: Arguments with evidence show complete evidence list in card

#### Issue #5: Add sub-argument creation UI
- **Labels**: `frontend`, `ui`, `priority-high`
- **Status**: ⚠️ **BACKEND READY** - Model supports sub-arguments, UI missing
- **Description**: Allow users to add sub-arguments (counter-arguments)
- **Current Implementation**:
  - ✅ Argument model has `subArguments[]` and `parentArgument` fields
  - ✅ ArgumentCard recursively displays sub-arguments (ArgumentCard.jsx:161-172)
  - ❌ No "Reply" button in UI
  - ❌ No SubArgumentForm component
- **Tasks**:
  - [x] Update API to handle parent-child relationships (DONE)
  - [x] Show nested sub-arguments in hierarchical view (DONE)
  - [ ] Add "Reply" button to ArgumentCard
  - [ ] Create SubArgumentForm component
  - [ ] Connect form to API
  - [ ] Add depth limit (e.g., max 3 levels)
- **Acceptance Criteria**: Users can reply to arguments with counter-arguments via UI

#### Issue #6: Complete belief editing functionality ✅ **COMPLETED**
- **Labels**: `frontend`, `priority-high`
- **Status**: ✅ **FULLY IMPLEMENTED**
- **Description**: Implement full edit flow for beliefs
- **Implementation Details** (BeliefForm.js:14-36):
  - ✅ BeliefForm component supports both create and edit modes
  - ✅ Loads existing belief data for editing
  - ✅ Route exists: `/beliefs/:id/edit`
  - ✅ Edit button shown to belief owners (BeliefDetails.jsx:189-203)
  - ✅ Updates belief via API on submission
  - ✅ Redirects to belief details on success
- **Tasks**:
  - [x] Create EditBelief page (DONE - uses BeliefForm)
  - [x] Pre-populate form with existing data (DONE)
  - [ ] Add version tracking (optional - deferred to Issue #35)
  - [x] Update belief on submission (DONE)
  - [x] Redirect to belief details on success (DONE)
- **Acceptance Criteria**: ✅ Belief owners can edit their beliefs

#### Issue #7: Enhanced user profile page
- **Labels**: `frontend`, `ui`, `priority-medium`
- **Status**: ⚠️ **BASIC IMPLEMENTATION** - Minimal profile page exists
- **Description**: Improve profile page with stats and contributions
- **Current Implementation** (app.js:140-164):
  - ✅ Basic profile page at `/profile` route
  - ✅ Shows username, reputation, role
  - ❌ No statistics (beliefs/arguments/votes counts)
  - ❌ No list of user's content
  - ❌ No profile editing UI
  - ❌ No contribution timeline
  - ❌ No public profiles for other users
- **Tasks**:
  - [x] Create basic profile route (DONE)
  - [x] Show reputation score (DONE)
  - [ ] Show user statistics (beliefs created, arguments, votes)
  - [ ] List user's beliefs and arguments
  - [ ] Add profile editing (username, bio, avatar)
  - [ ] Add contribution timeline
  - [ ] Enable viewing other users' public profiles
- **Acceptance Criteria**: Profile shows comprehensive user information

### **API & Documentation**

#### Issue #8: Add API documentation with Swagger/OpenAPI
- **Labels**: `documentation`, `api`, `priority-high`
- **Description**: Document all API endpoints with interactive documentation
- **Tasks**:
  - [ ] Install swagger-jsdoc and swagger-ui-express
  - [ ] Add JSDoc comments to all routes
  - [ ] Configure Swagger UI at /api-docs
  - [ ] Document request/response schemas
  - [ ] Add example requests
- **Acceptance Criteria**: Swagger UI accessible and shows all endpoints

#### Issue #9: Implement rate limiting
- **Labels**: `backend`, `security`, `priority-medium`
- **Description**: Add rate limiting to prevent abuse
- **Tasks**:
  - [ ] Install express-rate-limit
  - [ ] Configure rate limits per endpoint type
  - [ ] Add Redis for distributed rate limiting (optional)
  - [ ] Return 429 status with retry headers
  - [ ] Whitelist authenticated users for higher limits
- **Acceptance Criteria**: Excessive requests return 429 error

#### Issue #10: Add email verification
- **Labels**: `backend`, `auth`, `priority-medium`
- **Description**: Verify email addresses on registration
- **Tasks**:
  - [ ] Add verified field to User model
  - [ ] Generate verification tokens
  - [ ] Send verification emails (SendGrid/Mailgun)
  - [ ] Create verification endpoint
  - [ ] Show unverified status in UI
- **Acceptance Criteria**: New users receive verification email

#### Issue #11: Implement password reset flow
- **Labels**: `backend`, `auth`, `priority-medium`
- **Description**: Allow users to reset forgotten passwords
- **Tasks**:
  - [ ] Create "Forgot Password" page
  - [ ] Generate reset tokens
  - [ ] Send reset emails
  - [ ] Create reset password endpoint
  - [ ] Add reset form with token validation
- **Acceptance Criteria**: Users can reset password via email

---

## **Phase 2: Advanced Scoring (Priority: Medium)**

Implement additional scoring metrics and visualizations.

**✅ Note**: Several advanced scoring features from this phase are **ALREADY IMPLEMENTED**:
- **ArgumentRank/ReasonRank** (server.js:45-88): PageRank-style algorithm for argument credibility scoring
- **Fallacy Detection** (fallacyDetector.js): 10 fallacy types with confidence scoring and severity levels
- **Redundancy Detection** (redundancyDetector.js): 4 similarity algorithms (Jaccard, Cosine, Levenshtein, Overlap)
- **Conclusion Score**: Multi-dimensional belief scoring with 7-factor calculation

### **Scoring Enhancements**

#### Issue #12: Implement Truth Score (separate from Conclusion Score)
- **Labels**: `backend`, `algorithms`, `phase-2`
- **Description**: Add Truth Score bounded between -1 and +1
- **Tasks**:
  - [ ] Add truthScore field to Belief model
  - [ ] Implement calculation: `(Logical Validity × Evidence Quality × Verification) ± Counterargument Weight`
  - [ ] Create API endpoint to calculate truth score
  - [ ] Update UI to display truth score
  - [ ] Add explanation tooltip
- **Acceptance Criteria**: Beliefs have both Conclusion Score and Truth Score

#### Issue #13: Implement Importance Score
- **Labels**: `backend`, `algorithms`, `phase-2`
- **Description**: Add Importance Score to measure real-world consequence
- **Tasks**:
  - [ ] Add importanceScore field to Belief model
  - [ ] Create importance argument type (cost-benefit, ethical, policy)
  - [ ] Calculate importance from specialized arguments
  - [ ] Display importance vs truth scatter plot
  - [ ] Add filters for high-importance beliefs
- **Acceptance Criteria**: Beliefs can be ranked by importance

#### Issue #14: Implement Epistemic Impact calculation
- **Labels**: `backend`, `algorithms`, `phase-2`
- **Description**: Calculate total influence: Truth × Reach × Linkage
- **Tasks**:
  - [ ] Add epistemicImpact field to Belief and Argument models
  - [ ] Track reach metrics (views, shares, citations)
  - [ ] Calculate: `Truth Score × Reach × Linkage Strength`
  - [ ] Create leaderboard of highest-impact beliefs
  - [ ] Display on belief cards
- **Acceptance Criteria**: Most influential beliefs visible

### **Visualization**

#### Issue #15: Add belief score history graph
- **Labels**: `frontend`, `visualization`, `phase-2`
- **Description**: Show how belief scores change over time
- **Tasks**:
  - [ ] Track score history in database
  - [ ] Install charting library (Chart.js/Recharts)
  - [ ] Create ScoreHistoryChart component
  - [ ] Show truth score trend line
  - [ ] Add markers for major events (new evidence, etc.)
- **Acceptance Criteria**: Belief page shows score timeline

#### Issue #16: Create linkage network visualization
- **Labels**: `frontend`, `visualization`, `phase-2`
- **Description**: Visualize connections between beliefs
- **Tasks**:
  - [ ] Install D3.js or Vis.js
  - [ ] Create NetworkGraph component
  - [ ] Fetch related beliefs recursively
  - [ ] Render force-directed graph
  - [ ] Add interactivity (click nodes, zoom)
- **Acceptance Criteria**: Interactive network graph shows belief connections

#### Issue #17: Build argument map visualization
- **Labels**: `frontend`, `visualization`, `phase-2`
- **Description**: Tree/map view of pro/con argument structure
- **Tasks**:
  - [ ] Create ArgumentMap component
  - [ ] Use tree layout algorithm
  - [ ] Color-code by argument type (pro/con)
  - [ ] Show score on each node
  - [ ] Add collapse/expand functionality
- **Acceptance Criteria**: Hierarchical argument map displays correctly

### **Community/Topic Pages**

#### Issue #18: Create Community model and pages
- **Labels**: `backend`, `frontend`, `phase-2`
- **Description**: Group related beliefs into communities
- **Tasks**:
  - [ ] Create Community model
  - [ ] Add community CRUD endpoints
  - [ ] Create community list page
  - [ ] Create community detail page
  - [ ] Add beliefs to communities
  - [ ] Calculate aggregated scores
- **Acceptance Criteria**: Users can browse beliefs by community

#### Issue #19: Add "following" system for topics
- **Labels**: `backend`, `frontend`, `phase-2`
- **Description**: Let users follow communities and beliefs
- **Tasks**:
  - [ ] Add followedTopics to User model
  - [ ] Create follow/unfollow endpoints
  - [ ] Add "Follow" buttons to UI
  - [ ] Show followed content on dashboard
  - [ ] Add notification preferences
- **Acceptance Criteria**: Users can follow and see updates

---

## **Phase 3: Incentives & CBO System (Priority: Medium)**

Implement reputation and incentive mechanisms.

### **Reputation System**

#### Issue #20: Implement automatic reputation calculation
- **Labels**: `backend`, `algorithms`, `phase-3`
- **Description**: Calculate user reputation based on contributions
- **Tasks**:
  - [ ] Define reputation algorithm: `|Δ Score| × Durability × Evidence Quality`
  - [ ] Track contribution impact
  - [ ] Update reputation on score changes
  - [ ] Add reputation history
  - [ ] Create reputation leaderboard
- **Acceptance Criteria**: User reputation updates automatically

#### Issue #21: Add reputation-weighted voting
- **Labels**: `backend`, `algorithms`, `phase-3`
- **Description**: Give higher-reputation users more voting power
- **Tasks**:
  - [ ] Calculate vote weight from reputation
  - [ ] Update vote counting logic
  - [ ] Display weighted vote counts
  - [ ] Add transparency (show weight distribution)
  - [ ] Prevent gaming (diminishing returns)
- **Acceptance Criteria**: Votes weighted by user reputation

### **Chief Belief Officer (CBO) System**

#### Issue #22: Implement CBO selection algorithm
- **Labels**: `backend`, `algorithms`, `phase-3`
- **Description**: Identify top contributor per belief
- **Tasks**:
  - [ ] Track contribution impact per belief
  - [ ] Calculate top contributor
  - [ ] Add cbo field to Belief model
  - [ ] Create CBO badge component
  - [ ] Show CBO on belief page
- **Acceptance Criteria**: Each belief has a designated CBO

#### Issue #23: Create CBO dashboard
- **Labels**: `frontend`, `phase-3`
- **Description**: Dashboard for CBO users
- **Tasks**:
  - [ ] Create CBO dashboard page
  - [ ] Show beliefs where user is CBO
  - [ ] Display contribution impact metrics
  - [ ] Show earnings (future)
  - [ ] Add responsibility guidelines
- **Acceptance Criteria**: CBOs have dedicated dashboard

#### Issue #24: Implement ad revenue sharing
- **Labels**: `backend`, `monetization`, `phase-3`
- **Description**: Share ad revenue with CBOs
- **Tasks**:
  - [ ] Integrate ad platform (Google AdSense, etc.)
  - [ ] Track revenue per belief page
  - [ ] Calculate 5% share for CBO
  - [ ] Integrate payment processor (Stripe)
  - [ ] Create payout system
  - [ ] Add earnings dashboard
- **Acceptance Criteria**: CBOs receive revenue share

---

## **Phase 4: Media Integration (Priority: Low)**

Add media tracking and influence analysis.

### **Media Database**

#### Issue #25: Create Media model and CRUD operations
- **Labels**: `backend`, `phase-4`
- **Description**: Database for films, books, podcasts, etc.
- **Tasks**:
  - [ ] Create Media model
  - [ ] Add media CRUD endpoints
  - [ ] Create media submission form
  - [ ] Add media type selector (8+ types)
  - [ ] Include external IDs (IMDb, ISBN, etc.)
- **Acceptance Criteria**: Users can submit media items

#### Issue #26: Integrate external media APIs
- **Labels**: `backend`, `integration`, `phase-4`
- **Description**: Auto-populate media data from external sources
- **Tasks**:
  - [ ] Integrate OMDb API (movies)
  - [ ] Integrate Google Books API
  - [ ] Integrate Spotify API (podcasts)
  - [ ] Add auto-complete search
  - [ ] Fetch metadata automatically
- **Acceptance Criteria**: Media details auto-populated

#### Issue #27: Link media to beliefs
- **Labels**: `backend`, `frontend`, `phase-4`
- **Description**: Track which beliefs media promotes/challenges
- **Tasks**:
  - [ ] Add media-belief linkage schema
  - [ ] Create belief tagging UI for media
  - [ ] Calculate linkage strength
  - [ ] Show media on belief pages
  - [ ] Show beliefs on media pages
- **Acceptance Criteria**: Media linked to beliefs bidirectionally

### **Media Truth Score**

#### Issue #28: Calculate Media Truth Score
- **Labels**: `backend`, `algorithms`, `phase-4`
- **Description**: Score media based on beliefs it promotes
- **Tasks**:
  - [ ] Define Media Truth Score algorithm
  - [ ] Calculate from linked belief scores
  - [ ] Weight by prominence/emphasis
  - [ ] Display on media pages
  - [ ] Add to media database
- **Acceptance Criteria**: All media has truth score

#### Issue #29: Track cultural/epistemic impact of media
- **Labels**: `backend`, `analytics`, `phase-4`
- **Description**: Measure media's influence on beliefs
- **Tasks**:
  - [ ] Track reach (views, ratings, sales)
  - [ ] Calculate: `Media Truth × Reach × Belief Count`
  - [ ] Create cultural impact leaderboard
  - [ ] Visualize impact over time
  - [ ] Add "Media Watchdog" dashboard
- **Acceptance Criteria**: Media ranked by epistemic impact

---

## **Phase 5: AI Integration (Priority: Low)**

Add AI-powered features for analysis and assistance.

#### Issue #30: Implement AI claim extraction
- **Labels**: `backend`, `ai`, `phase-5`
- **Description**: Extract factual claims from text
- **Tasks**:
  - [ ] Integrate GPT API
  - [ ] Create claim extraction endpoint
  - [ ] Parse text and identify claims
  - [ ] Present claims for user confirmation
  - [ ] Auto-create beliefs from claims
- **Acceptance Criteria**: Users can extract claims from articles

#### Issue #31: Build argument suggestion engine
- **Labels**: `backend`, `ai`, `phase-5`
- **Description**: Suggest missing pro/con arguments
- **Tasks**:
  - [ ] Analyze existing arguments
  - [ ] Use GPT to generate suggestions
  - [ ] Rank by novelty and relevance
  - [ ] Display on belief page
  - [ ] Allow users to accept/edit/reject
- **Acceptance Criteria**: Beliefs show AI-suggested arguments

#### Issue #32: Create evidence summarization tool
- **Labels**: `backend`, `ai`, `phase-5`
- **Description**: AI-powered summaries of linked evidence
- **Tasks**:
  - [ ] Fetch evidence content (via URL)
  - [ ] Use GPT to summarize
  - [ ] Extract key points
  - [ ] Identify supporting/opposing claims
  - [ ] Display summary on evidence cards
- **Acceptance Criteria**: Evidence items show AI summaries

#### Issue #33: Build debate companion chatbot
- **Labels**: `frontend`, `ai`, `phase-5`
- **Description**: AI coach to help construct arguments
- **Tasks**:
  - [ ] Create chat interface
  - [ ] Integrate GPT API
  - [ ] Provide argument templates
  - [ ] Suggest evidence
  - [ ] Check for fallacies
  - [ ] Offer counterargument practice
- **Acceptance Criteria**: Users can chat with debate coach

---

## **Phase 6: Governance & Community (Priority: Low)**

Add moderation, peer review, and educational features.

### **Peer Review**

#### Issue #34: Implement challenge/dispute system
- **Labels**: `backend`, `frontend`, `phase-6`
- **Description**: Let users challenge evidence or scores
- **Tasks**:
  - [ ] Create Challenge model
  - [ ] Add challenge submission form
  - [ ] Create review queue
  - [ ] Assign reviewers (by reputation)
  - [ ] Track resolution
  - [ ] Award reputation for accurate reviews
- **Acceptance Criteria**: Users can challenge and review content

### **Version Control**

#### Issue #35: Add version history for beliefs
- **Labels**: `backend`, `phase-6`
- **Description**: Track all changes to beliefs over time
- **Tasks**:
  - [ ] Create Version model
  - [ ] Store snapshots on edit
  - [ ] Create diff view UI
  - [ ] Add rollback functionality
  - [ ] Show change attribution
  - [ ] Create changelog view
- **Acceptance Criteria**: Full edit history visible

### **Policy Simulator**

#### Issue #36: Build policy evaluation tool
- **Labels**: `frontend`, `phase-6`
- **Description**: Rank policies by truth + importance + cost-benefit
- **Tasks**:
  - [ ] Create policy belief category
  - [ ] Add cost-benefit analysis fields
  - [ ] Build policy comparison UI
  - [ ] Calculate composite scores
  - [ ] Rank policies by overall value
  - [ ] Export policy reports
- **Acceptance Criteria**: Policies can be compared objectively

### **Educational Mode**

#### Issue #37: Create classroom integration features
- **Labels**: `frontend`, `phase-6`
- **Description**: Tools for teachers to use ISE in classrooms
- **Tasks**:
  - [ ] Create "Class" model (group of students)
  - [ ] Add assignment creation
  - [ ] Track student contributions
  - [ ] Generate activity reports
  - [ ] Add fallacy learning modules
  - [ ] Create critical thinking exercises
- **Acceptance Criteria**: Teachers can create classes and assignments

---

## **Infrastructure & Performance**

### **Real-time Features**

#### Issue #38: Implement WebSocket for live updates
- **Labels**: `backend`, `frontend`, `infrastructure`
- **Description**: Real-time score updates and notifications
- **Tasks**:
  - [ ] Install Socket.io
  - [ ] Set up WebSocket server
  - [ ] Emit score change events
  - [ ] Update UI in real-time
  - [ ] Show "New argument" notifications
- **Acceptance Criteria**: Scores update live without refresh

#### Issue #39: Add notification system
- **Labels**: `backend`, `frontend`
- **Description**: Notify users of activity on their content
- **Tasks**:
  - [ ] Create Notification model
  - [ ] Trigger notifications on events (new argument, vote, etc.)
  - [ ] Create notifications dropdown
  - [ ] Add notification preferences
  - [ ] Send email notifications (optional)
- **Acceptance Criteria**: Users receive in-app notifications

### **Performance**

#### Issue #40: Implement caching with Redis
- **Labels**: `backend`, `infrastructure`
- **Description**: Cache frequently accessed data
- **Tasks**:
  - [ ] Install Redis
  - [ ] Cache belief queries
  - [ ] Cache score calculations
  - [ ] Set expiration policies
  - [ ] Invalidate on updates
- **Acceptance Criteria**: Page load time reduced by 50%

#### Issue #41: Add CDN for static assets
- **Labels**: `infrastructure`
- **Description**: Serve images, CSS, JS from CDN
- **Tasks**:
  - [ ] Set up CloudFront/CloudFlare
  - [ ] Upload assets to S3
  - [ ] Update URLs in frontend
  - [ ] Add cache headers
  - [ ] Test performance
- **Acceptance Criteria**: Assets load from CDN

### **Database**

#### Issue #42: Integrate Neo4j for linkage mapping
- **Labels**: `backend`, `infrastructure`
- **Description**: Use graph database for belief relationships
- **Tasks**:
  - [ ] Install Neo4j
  - [ ] Create graph schema
  - [ ] Sync with MongoDB
  - [ ] Query linkages efficiently
  - [ ] Use for network visualization
- **Acceptance Criteria**: Related beliefs queried from Neo4j

---

## **Bugs & Issues (Ongoing)**

### **Known Bugs**

#### Issue #43: Fix argument voting state sync
- **Labels**: `bug`, `frontend`, `priority-high`
- **Status**: ⚠️ **CONFIRMED BUG**
- **Description**: Vote state sometimes doesn't sync after voting
- **Root Cause Analysis**:
  - Backend correctly tracks votes in `User.votedArguments[]` (argumentController.js:182-214)
  - ArgumentCard.jsx does NOT check or display user's current vote state
  - Uses optimistic local updates but doesn't persist on page reload
  - User cannot see which arguments they've already voted on
- **Steps to Reproduce**:
  1. Vote on an argument
  2. Navigate away and back to the page
  3. Vote state does not reflect actual vote
  4. Vote buttons appear neutral (not highlighted)
- **Expected**: Vote state persists correctly and buttons show voted state
- **Actual**: State resets on page reload; no visual indication of previous votes
- **Fix Required**:
  - Fetch user's voted arguments on component mount
  - Check if current argument is in user's `votedArguments[]`
  - Highlight appropriate vote button based on vote type

#### Issue #44: Evidence form validation edge cases
- **Labels**: `bug`, `frontend`, `priority-medium`
- **Status**: ⚠️ **BASIC VALIDATION EXISTS** - Could be improved
- **Description**: Some invalid URLs may pass validation
- **Current Implementation** (EvidenceForm.jsx:84-87):
  - ✅ Checks title and URL are required fields
  - ✅ Uses HTML5 `type="url"` on URL field
  - ⚠️ No custom regex validation for edge cases
  - ⚠️ Basic error messages
- **Fix Required**:
  - Add comprehensive URL regex validation
  - Better error messages for specific validation failures
  - Validation feedback before submission
  - Test edge cases (malformed URLs, unsupported protocols, etc.)

#### Issue #45: Redundancy detector performance
- **Labels**: `bug`, `backend`, `priority-low`
- **Status**: ⚠️ **CONFIRMED PERFORMANCE ISSUE**
- **Description**: Slow with >100 arguments due to O(n²) complexity
- **Root Cause** (redundancyDetector.js):
  - Uses O(n²) pairwise comparisons
  - Calculates 4 similarity metrics (Jaccard, Cosine, Levenshtein, Overlap) for each pair
  - No pagination or background processing
  - Analysis route at `/api/analysis/redundancy` (server.js:107-154)
- **Impact**: Performance degrades significantly with large argument sets (>100 arguments)
- **Fix Options**:
  - Implement pagination for redundancy analysis
  - Add background job processing (e.g., Bull queue with Redis)
  - Optimize algorithms (early termination, caching)
  - Pre-compute similarity scores asynchronously
  - Add indexing for faster lookups

---

## **How to Use This Document**

1. **Creating Issues**: Copy relevant sections to create GitHub issues
2. **Prioritization**: Focus on Phase 1 (high priority) first
3. **Claiming Issues**: Comment "I'll take this" on GitHub
4. **Updates**: Mark completed items and add new issues as needed

---

## **Issue Statistics**

**Total Issues Identified**: 45

**Status Breakdown**:
- ✅ **Completed**: 1 issue (Issue #6)
- ⚠️ **Partially Implemented**: 3 issues (Issues #4, #5, #7)
- ❌ **Not Started**: 38 issues
- ⚠️ **Confirmed Bugs**: 3 issues (Issues #43-45)

**Priority Breakdown**:
- **High Priority (Phase 1)**: 11 issues
  - Completed: 1 (Issue #6)
  - Partially done: 3 (Issues #4, #5, #7)
  - Not started: 7 (Issues #1-3, #8-11)
- **Medium Priority (Phases 2-3)**: 14 issues
  - Note: Advanced scoring algorithms (ArgumentRank, fallacy detection, redundancy detection) are **FULLY IMPLEMENTED** beyond what was planned
- **Low Priority (Phases 4-6)**: 17 issues
- **Infrastructure**: 5 issues
- **Bugs**: 3 confirmed bugs

---

**Next Steps - Recommended Priority**:
1. **Critical**: Implement testing infrastructure (Issues #1-3) - No tests currently exist
2. **High**: Fix voting state sync bug (Issue #43) - Impacts user experience
3. **High**: Complete evidence display in ArgumentCard (Issue #4) - Evidence exists but not shown
4. **High**: Add sub-argument creation UI (Issue #5) - Backend ready, needs UI
5. **Medium**: Add API documentation (Issue #8) - Aids development and integration
6. **Medium**: Implement rate limiting (Issue #9) - Security concern
7. **Medium**: Enhanced user profiles (Issue #7) - Better user engagement
