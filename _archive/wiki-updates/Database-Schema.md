# Database Schema

The Idea Stock Exchange uses PostgreSQL with Prisma ORM. The schema includes 40+ tables modeling debates, arguments, users, evidence, and sophisticated scoring systems.

---

## Core Tables

### User Management

#### User
Primary user account table.

**Fields:**
- `id` (UUID) - Primary key
- `username` (String, unique) - Display name
- `email` (String, unique) - Contact email
- `passwordHash` (String) - Bcrypt hashed password
- `reputation` (Int, default: 0) - Community reputation score
- `karma` (Int, default: 0) - Accumulated karma points
- `verified` (Boolean, default: false) - Email verification status
- `role` (Enum) - USER, MODERATOR, ADMIN
- `banned` (Boolean, default: false) - Account status
- `bio` (String, optional) - User biography
- `avatar` (String, optional) - Profile picture URL
- `createdAt` (DateTime) - Account creation
- `updatedAt` (DateTime) - Last modification

**Relationships:**
- One-to-Many: Debates, Arguments, Comments, Votes
- Many-to-Many: Follows (self-referential), Blocks

#### UserStats
User activity statistics.

**Fields:**
- `userId` (UUID, unique FK)
- `debatesCreated` (Int)
- `argumentsPosted` (Int)
- `commentsPosted` (Int)
- `karmaReceived` (Int)
- `karmaGiven` (Int)
- `averageReasonRank` (Float)
- `lastActive` (DateTime)

#### Follow
Social graph for user following.

**Fields:**
- `id` (UUID)
- `followerId` (UUID, FK → User)
- `followingId` (UUID, FK → User)
- `createdAt` (DateTime)

**Constraints:**
- Unique: (followerId, followingId)

#### UserBlock
User blocking system.

**Fields:**
- `id` (UUID)
- `blockerId` (UUID, FK → User)
- `blockedId` (UUID, FK → User)
- `createdAt` (DateTime)

---

### Debate Structure

#### Debate
Core debate/topic table.

**Fields:**
- `id` (UUID)
- `thesis` (String) - Main debate statement
- `description` (Text) - Detailed context
- `status` (Enum) - OPEN, CLOSED, ARCHIVED
- `visibility` (Enum) - PUBLIC, PRIVATE, UNLISTED
- `moderationLevel` (Enum) - NONE, STANDARD, STRICT
- `createdById` (UUID, FK → User)
- `tags` (String[]) - Topic categorization
- `featured` (Boolean) - Featured on homepage
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes:**
- `status`
- `createdAt` (descending)
- `tags` (GIN index for array search)

#### DebateSubscription
User subscriptions to debates for notifications.

**Fields:**
- `id` (UUID)
- `userId` (UUID, FK → User)
- `debateId` (UUID, FK → Debate)
- `notifyOnNewArgument` (Boolean)
- `notifyOnReply` (Boolean)
- `notifyOnMention` (Boolean)
- `createdAt` (DateTime)

**Constraints:**
- Unique: (userId, debateId)

---

### Arguments & Evidence

#### Argument
Individual arguments within debates (hierarchical tree structure).

**Fields:**
- `id` (UUID)
- `debateId` (UUID, FK → Debate)
- `parentId` (UUID, FK → Argument, nullable) - Parent argument for replies
- `content` (Text) - Argument content
- `position` (Enum) - PRO, CON, NEUTRAL
- `createdById` (UUID, FK → User)
- **Scoring fields:**
  - `truthScore` (Float, 0-10) - Factual accuracy
  - `importanceScore` (Float, 0-10) - Significance
  - `relevanceScore` (Float, 0-10) - Topical relevance
  - `reasonRank` (Float, computed) - Overall ranking
- `hidden` (Boolean) - Moderation flag
- `merged` (Boolean) - Merged into another argument
- `mergedIntoId` (UUID, FK → Argument, nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Relationships:**
- Self-referential tree (parent/children)
- Many-to-Many: Media (via ArgumentMedia)

**Indexes:**
- `debateId, reasonRank DESC`
- `parentId`
- `position`

#### Vote
Voting system for arguments.

**Fields:**
- `id` (UUID)
- `userId` (UUID, FK → User)
- `argumentId` (UUID, FK → Argument)
- `voteType` (Enum) - UPVOTE, DOWNVOTE
- `createdAt` (DateTime)

**Constraints:**
- Unique: (userId, argumentId) - One vote per user per argument

#### Comment
Comment threads on arguments.

**Fields:**
- `id` (UUID)
- `argumentId` (UUID, FK → Argument)
- `parentId` (UUID, FK → Comment, nullable) - For nested replies
- `content` (Text)
- `createdById` (UUID, FK → User)
- `votes` (Int, default: 0) - Net vote count
- `hidden` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

#### CommentVote
Voting on comments.

**Fields:**
- `id` (UUID)
- `userId` (UUID, FK → User)
- `commentId` (UUID, FK → Comment)
- `voteType` (Enum) - UPVOTE, DOWNVOTE
- `createdAt` (DateTime)

**Constraints:**
- Unique: (userId, commentId)

---

### Media & Evidence

#### Media
Evidence library (books, papers, videos, etc.).

**Fields:**
- `id` (UUID)
- `title` (String) - Media title
- `type` (Enum) - BOOK, VIDEO, ARTICLE, PAPER, PODCAST, DOCUMENTARY, IMAGE, WEBSITE
- `author` (String, optional) - Creator/author
- `year` (Int, optional) - Publication year
- `url` (String, optional) - Web link
- `description` (Text, optional)
- `credibilityScore` (Float, 0-10) - Source credibility
- `biasScore` (Float, -10 to 10) - Political/ideological bias
- `addedById` (UUID, FK → User)
- `verifiedBy` (UUID[], FK → User) - Users who verified
- `thumbnailUrl` (String, optional)
- `metadata` (JSONB) - Flexible additional data
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes:**
- `type`
- `credibilityScore DESC`
- Full-text search on title/description

#### ArgumentMedia
Junction table linking media to arguments with position.

**Fields:**
- `id` (UUID)
- `argumentId` (UUID, FK → Argument)
- `mediaId` (UUID, FK → Media)
- `position` (Enum) - SUPPORTS, REFUTES, NEUTRAL
- `relevanceScore` (Float, 0-10) - How relevant to argument
- `addedById` (UUID, FK → User)
- `createdAt` (DateTime)

**Constraints:**
- Unique: (argumentId, mediaId)

---

### Quality Control

#### MergeProposal
Proposals to merge duplicate/similar arguments.

**Fields:**
- `id` (UUID)
- `sourceArgumentId` (UUID, FK → Argument)
- `targetArgumentId` (UUID, FK → Argument)
- `proposedById` (UUID, FK → User)
- `reason` (Text) - Justification
- `status` (Enum) - PENDING, APPROVED, REJECTED
- `votesApprove` (Int, default: 0)
- `votesReject` (Int, default: 0)
- `createdAt` (DateTime)
- `resolvedAt` (DateTime, nullable)

#### MergeVote
Community voting on merge proposals.

**Fields:**
- `id` (UUID)
- `mergeProposalId` (UUID, FK → MergeProposal)
- `userId` (UUID, FK → User)
- `vote` (Enum) - APPROVE, REJECT
- `createdAt` (DateTime)

**Constraints:**
- Unique: (mergeProposalId, userId)

#### ArgumentMerge
Audit trail of completed merges.

**Fields:**
- `id` (UUID)
- `sourceArgumentId` (UUID)
- `targetArgumentId` (UUID)
- `mergedById` (UUID, FK → User)
- `reason` (Text)
- `mergedAt` (DateTime)

#### SuggestedEdit
Collaborative improvement proposals.

**Fields:**
- `id` (UUID)
- `targetType` (Enum) - ARGUMENT, COMMENT, DEBATE
- `targetId` (UUID)
- `proposedById` (UUID, FK → User)
- `originalContent` (Text)
- `suggestedContent` (Text)
- `rationale` (Text)
- `status` (Enum) - PENDING, ACCEPTED, REJECTED
- `createdAt` (DateTime)

---

### Moderation

#### Report
Content reporting system.

**Fields:**
- `id` (UUID)
- `contentType` (Enum) - ARGUMENT, COMMENT, USER, DEBATE
- `contentId` (UUID)
- `reportedById` (UUID, FK → User)
- `reason` (Enum) - SPAM, HARASSMENT, MISINFORMATION, OFFENSIVE, OTHER
- `details` (Text)
- `status` (Enum) - PENDING, RESOLVED, DISMISSED
- `resolvedById` (UUID, FK → User, nullable)
- `resolution` (Text, nullable)
- `createdAt` (DateTime)
- `resolvedAt` (DateTime, nullable)

#### ModerationAction
Audit log of moderation actions.

**Fields:**
- `id` (UUID)
- `moderatorId` (UUID, FK → User)
- `targetType` (Enum) - USER, ARGUMENT, COMMENT, DEBATE
- `targetId` (UUID)
- `actionType` (Enum) - DELETE, HIDE, BAN, MUTE, WARN, LOCK, FEATURE
- `reason` (Text)
- `duration` (Int, nullable) - Seconds for temporary actions
- `createdAt` (DateTime)
- `expiresAt` (DateTime, nullable)

---

### Social Features

#### DirectMessage
Private messaging between users.

**Fields:**
- `id` (UUID)
- `senderId` (UUID, FK → User)
- `recipientId` (UUID, FK → User)
- `content` (Text)
- `read` (Boolean, default: false)
- `createdAt` (DateTime)

**Indexes:**
- `(recipientId, createdAt DESC)` - Inbox query
- `(senderId, recipientId, createdAt DESC)` - Conversation query

#### Notification
User notification system.

**Fields:**
- `id` (UUID)
- `userId` (UUID, FK → User)
- `type` (Enum) - NEW_ARGUMENT, VOTE_RECEIVED, MENTION, REPLY, MERGE_PROPOSAL, ACHIEVEMENT, DIRECT_MESSAGE, MODERATION_ACTION
- `title` (String)
- `message` (Text)
- `link` (String, optional) - URL to related content
- `read` (Boolean, default: false)
- `createdAt` (DateTime)

**Indexes:**
- `(userId, createdAt DESC)`
- `(userId, read, createdAt DESC)` - Unread notifications

---

### Gamification

#### Achievement
Achievement/badge definitions.

**Fields:**
- `id` (UUID)
- `name` (String)
- `description` (Text)
- `type` (Enum) - DEBATES_CREATED, ARGUMENTS_POSTED, KARMA_EARNED, VOTES_RECEIVED, etc.
- `threshold` (Int) - Requirement to unlock
- `icon` (String) - Icon identifier
- `points` (Int) - Reputation points awarded

#### UserAchievement
User achievement progress and unlocks.

**Fields:**
- `id` (UUID)
- `userId` (UUID, FK → User)
- `achievementId` (UUID, FK → Achievement)
- `progress` (Int) - Current progress
- `unlocked` (Boolean, default: false)
- `unlockedAt` (DateTime, nullable)

**Constraints:**
- Unique: (userId, achievementId)

---

### Workflow

#### Draft
Auto-save drafts for content.

**Fields:**
- `id` (UUID)
- `userId` (UUID, FK → User)
- `contentType` (Enum) - DEBATE, ARGUMENT, COMMENT
- `debateId` (UUID, FK → Debate, nullable)
- `parentId` (UUID, nullable) - Parent argument/comment
- `content` (Text)
- `metadata` (JSONB) - Additional draft data
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

**Indexes:**
- `(userId, contentType, updatedAt DESC)`

#### EditHistory
Version control for content changes.

**Fields:**
- `id` (UUID)
- `contentType` (Enum)
- `contentId` (UUID)
- `editedById` (UUID, FK → User)
- `previousContent` (Text)
- `newContent` (Text)
- `changeReason` (Text, optional)
- `createdAt` (DateTime)

---

### Education

#### Classroom
Teacher-created debate classrooms.

**Fields:**
- `id` (UUID)
- `name` (String)
- `description` (Text)
- `teacherId` (UUID, FK → User)
- `joinCode` (String, unique) - For student enrollment
- `active` (Boolean, default: true)
- `createdAt` (DateTime)

#### ClassroomStudent
Classroom enrollment.

**Fields:**
- `id` (UUID)
- `classroomId` (UUID, FK → Classroom)
- `studentId` (UUID, FK → User)
- `enrolledAt` (DateTime)

**Constraints:**
- Unique: (classroomId, studentId)

#### ClassroomDebate
Debates assigned to classrooms.

**Fields:**
- `id` (UUID)
- `classroomId` (UUID, FK → Classroom)
- `debateId` (UUID, FK → Debate)
- `assignedAt` (DateTime)
- `dueDate` (DateTime, nullable)

#### Assignment
Debate participation assignments.

**Fields:**
- `id` (UUID)
- `classroomDebateId` (UUID, FK → ClassroomDebate)
- `studentId` (UUID, FK → User)
- `requirementType` (Enum) - POST_ARGUMENT, VOTE, COMMENT
- `minimumCount` (Int)
- `dueDate` (DateTime)
- `points` (Int) - Assignment value

#### Submission
Student assignment submissions.

**Fields:**
- `id` (UUID)
- `assignmentId` (UUID, FK → Assignment)
- `studentId` (UUID, FK → User)
- `argumentId` (UUID, FK → Argument, nullable)
- `submittedAt` (DateTime)
- `grade` (Int, nullable)
- `feedback` (Text, nullable)

---

### Templates

#### Template
Reusable debate structures.

**Fields:**
- `id` (UUID)
- `name` (String)
- `description` (Text)
- `category` (Enum) - POLICY, SCIENCE, PHILOSOPHY, ETHICS, etc.
- `createdById` (UUID, FK → User)
- `structure` (JSONB) - Template configuration
- `featured` (Boolean)
- `usageCount` (Int, default: 0)
- `createdAt` (DateTime)

---

## Book Analysis Schema

_(Alternative/experimental schema for book analysis features)_

### Book
Book metadata and analysis scores.

**Fields:**
- `id` (UUID)
- `title` (String)
- `author` (String)
- `year` (Int)
- `isbn` (String, optional)
- `logicalValidityScore` (Float)
- `qualityScore` (Float)
- `beliefImpactScore` (Float)
- `analyzedAt` (DateTime)

### Claim
Individual claims extracted from books.

**Fields:**
- `id` (UUID)
- `bookId` (UUID, FK → Book)
- `content` (Text)
- `centralityWeight` (Float) - Importance to book's thesis
- `page` (Int, nullable)
- `chapter` (String, nullable)

### TopicOverlap
How central a claim is to various topics.

**Fields:**
- `id` (UUID)
- `claimId` (UUID, FK → Claim)
- `topic` (String)
- `abstractionLevel` (Float) - General → Specific
- `claimIntensity` (Float) - Weak → Strong
- `stancePolarity` (Float) - Negative → Positive
- `centralityScore` (Float)

### Fallacy
Logical fallacies detected in books.

**Fields:**
- `id` (UUID)
- `bookId` (UUID, FK → Book)
- `claimId` (UUID, FK → Claim, nullable)
- `fallacyType` (Enum) - AD_HOMINEM, STRAWMAN, SLIPPERY_SLOPE, FALSE_DILEMMA, etc.
- `excerpt` (Text)
- `severity` (Float, 0-10)
- `confidence` (Float, 0-1)
- `page` (Int, nullable)

### Contradiction
Internal contradictions within books.

**Fields:**
- `id` (UUID)
- `bookId` (UUID, FK → Book)
- `claim1Id` (UUID, FK → Claim)
- `claim2Id` (UUID, FK → Claim)
- `contradictionType` (String)
- `explanation` (Text)
- `severity` (Float)

### Evidence
Supporting evidence for claims.

**Fields:**
- `id` (UUID)
- `claimId` (UUID, FK → Claim)
- `source` (String)
- `quality` (Enum) - PEER_REVIEWED, STUDY, EXPERT_OPINION, ANECDOTE, SPECULATION
- `credibilityScore` (Float)
- `relevanceScore` (Float)

### Metaphor
Metaphorical analysis of language.

**Fields:**
- `id` (UUID)
- `bookId` (UUID, FK → Book)
- `sourceText` (Text)
- `targetConcept` (String)
- `structuralSimilarity` (Float)
- `clarityScore` (Float)

### Prediction
Trackable predictions made in books.

**Fields:**
- `id` (UUID)
- `bookId` (UUID, FK → Book)
- `prediction` (Text)
- `timeframe` (String)
- `resolvable` (Boolean)
- `resolved` (Boolean, default: false)
- `accurate` (Boolean, nullable)
- `resolutionDate` (DateTime, nullable)

---

## Indexes & Performance

### Critical Indexes

```sql
-- Argument queries (most frequent)
CREATE INDEX idx_arguments_debate_rank
  ON arguments(debate_id, reason_rank DESC);

CREATE INDEX idx_arguments_parent
  ON arguments(parent_id)
  WHERE parent_id IS NOT NULL;

-- User activity
CREATE INDEX idx_votes_user
  ON votes(user_id, created_at DESC);

-- Notifications
CREATE INDEX idx_notifications_unread
  ON notifications(user_id, read, created_at DESC);

-- Full-text search
CREATE INDEX idx_media_fulltext
  ON media USING GIN(to_tsvector('english', title || ' ' || description));

-- Tag search
CREATE INDEX idx_debates_tags
  ON debates USING GIN(tags);
```

### Query Optimization

- **Argument trees:** Use recursive CTEs for efficient tree traversal
- **ReasonRank calculation:** Computed on write, cached on argument
- **Leaderboards:** Materialized views refreshed periodically
- **Search:** PostgreSQL full-text search with GIN indexes

---

## Migrations

Database migrations are managed with Prisma:

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# View status
npx prisma migrate status
```

---

## Relationships Diagram

```
User ──┬── Debates (creator)
       ├── Arguments (author)
       ├── Comments (author)
       ├── Votes
       ├── Follows (bidirectional)
       ├── Blocks
       └── DirectMessages (sender/recipient)

Debate ──┬── Arguments (tree structure)
         ├── Subscriptions
         └── ClassroomDebates

Argument ──┬── Votes
           ├── Comments
           ├── ArgumentMedia (evidence)
           ├── Children (self-referential)
           └── MergeProposals

Media ──── ArgumentMedia ──── Argument
```

---

## Data Integrity

### Constraints

- **Foreign keys:** All relationships enforced
- **Unique constraints:** Prevent duplicate votes, follows, enrollments
- **Check constraints:** Score ranges (0-10), valid enums
- **Not null:** Required fields enforced at DB level

### Soft Deletes

Most content uses soft deletes:
- Arguments: `hidden` flag
- Users: `banned` flag
- Debates: `status = ARCHIVED`

Hard deletes only for:
- GDPR/legal requirements
- Spam/abuse content
- User-requested account deletion

---

## Backup & Recovery

**Recommended backup strategy:**

1. **Daily full backups** of PostgreSQL database
2. **Point-in-time recovery** enabled (WAL archiving)
3. **Replication** to standby server
4. **Off-site backups** to S3/Cloud Storage

```bash
# Manual backup
pg_dump ideastockexchange > backup.sql

# Restore
psql ideastockexchange < backup.sql
```

---

For more information:
- [Getting Started](Getting-Started) - Database setup
- [API Documentation](API-Documentation) - How to query data
- [Architecture Overview](Architecture-Overview) - System design
