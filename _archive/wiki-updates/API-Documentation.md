# API Documentation

The Idea Stock Exchange API is a RESTful API built with Express.js and TypeScript. All endpoints return JSON responses.

**Base URL:** `http://localhost:3001/api` (development)

---

## Table of Contents

- [Authentication](#authentication)
- [Auth Routes](#auth-routes)
- [Debate Routes](#debate-routes)
- [Argument Routes](#argument-routes)
- [Media Routes](#media-routes)
- [Comments Routes](#comments-routes)
- [Merge Routes](#merge-routes)
- [Moderation Routes](#moderation-routes)
- [Social Routes](#social-routes)
- [Notifications Routes](#notifications-routes)
- [Template Routes](#template-routes)
- [Drafts Routes](#drafts-routes)
- [User Routes](#user-routes)
- [Error Responses](#error-responses)

---

## Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT).

### Getting a Token

1. Register or login to receive a JWT token
2. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Refresh

Tokens expire after a certain period. Use the `/api/auth/refresh` endpoint to get a new token.

---

## Auth Routes

**Base:** `/api/auth`

### POST `/register`

Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "reputation": 0,
    "karma": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/login`

Authenticate a user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/logout`

Terminate user session.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

### GET `/me`

Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "reputation": 150,
  "karma": 45,
  "verified": false,
  "role": "USER",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### POST `/refresh`

Refresh authentication token.

**Headers:** `Authorization: Bearer <expired-token>`

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Debate Routes

**Base:** `/api/debates`

### GET `/`

List all debates with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Results per page
- `status` (string) - Filter by status: "OPEN", "CLOSED", "ARCHIVED"
- `tag` (string) - Filter by tag
- `search` (string) - Search debate titles

**Example:** `GET /api/debates?page=1&limit=10&status=OPEN`

**Response:** `200 OK`
```json
{
  "debates": [
    {
      "id": "uuid",
      "thesis": "Universal Basic Income should be implemented",
      "description": "Discussion about UBI feasibility",
      "status": "OPEN",
      "visibility": "PUBLIC",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "createdBy": {
        "id": "uuid",
        "username": "policy_analyst"
      },
      "tags": ["economics", "policy"],
      "_count": {
        "arguments": 45,
        "subscribers": 120
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15
  }
}
```

### GET `/:id`

Fetch a specific debate with its argument tree.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "thesis": "Universal Basic Income should be implemented",
  "description": "Full description...",
  "status": "OPEN",
  "visibility": "PUBLIC",
  "moderationLevel": "STANDARD",
  "createdBy": {
    "id": "uuid",
    "username": "policy_analyst"
  },
  "arguments": [
    {
      "id": "uuid",
      "content": "Studies show UBI reduces poverty",
      "position": "PRO",
      "reasonRank": 8.5,
      "votes": 45,
      "children": [],
      "media": [
        {
          "id": "uuid",
          "title": "UBI Research Paper",
          "position": "SUPPORTS"
        }
      ]
    }
  ],
  "stats": {
    "totalArguments": 45,
    "proArguments": 23,
    "conArguments": 22,
    "subscribers": 120
  }
}
```

### POST `/`

Create a new debate.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "thesis": "Climate action requires immediate policy changes",
  "description": "Detailed description of the debate topic...",
  "tags": ["climate", "policy", "environment"],
  "visibility": "PUBLIC",
  "moderationLevel": "STANDARD"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "thesis": "Climate action requires immediate policy changes",
  "description": "Detailed description...",
  "status": "OPEN",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### PUT `/:id`

Update debate metadata (creator or moderator only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "description": "Updated description",
  "status": "CLOSED",
  "tags": ["climate", "urgent"]
}
```

**Response:** `200 OK`

### DELETE `/:id`

Archive a debate (soft delete).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Debate archived successfully"
}
```

### GET `/:id/stats`

Get detailed statistics for a debate.

**Response:** `200 OK`
```json
{
  "totalArguments": 45,
  "proArguments": 23,
  "conArguments": 22,
  "totalVotes": 567,
  "totalComments": 234,
  "subscribers": 120,
  "uniqueContributors": 56,
  "averageReasonRank": 6.8,
  "mediaCount": 34
}
```

---

## Argument Routes

**Base:** `/api/arguments`

### GET `/`

List arguments with filtering.

**Query Parameters:**
- `debateId` (uuid) - Filter by debate
- `position` (string) - "PRO", "CON", or "NEUTRAL"
- `minReasonRank` (number) - Minimum ReasonRank score
- `parentId` (uuid) - Get children of specific argument
- `page` (number) - Page number
- `limit` (number) - Results per page

**Response:** `200 OK`

### GET `/:id`

Get a single argument with votes, media, and children.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "content": "Universal Basic Income eliminates poverty traps",
  "position": "PRO",
  "debateId": "uuid",
  "parentId": null,
  "createdBy": {
    "id": "uuid",
    "username": "economist_jane"
  },
  "scores": {
    "reasonRank": 8.5,
    "truthScore": 8.0,
    "importanceScore": 7.5,
    "relevanceScore": 9.0,
    "voteScore": 8.2,
    "mediaScore": 7.8
  },
  "votes": {
    "upvotes": 45,
    "downvotes": 3,
    "net": 42
  },
  "media": [
    {
      "id": "uuid",
      "title": "Stanford UBI Study",
      "type": "PAPER",
      "position": "SUPPORTS"
    }
  ],
  "children": [
    {
      "id": "uuid",
      "content": "Counter-argument...",
      "position": "CON"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### POST `/`

Create a new argument.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "debateId": "uuid",
  "parentId": "uuid",  // Optional, null for top-level
  "content": "Economic studies demonstrate UBI feasibility",
  "position": "PRO",
  "truthScore": 8.0,
  "importanceScore": 7.5,
  "relevanceScore": 9.0
}
```

**Response:** `201 Created`

### PUT `/:id`

Update argument content (author only, within edit window).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Updated argument text with more evidence",
  "truthScore": 8.5
}
```

**Response:** `200 OK`

### DELETE `/:id`

Soft delete an argument (author or moderator).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST `/:id/votes`

Vote on an argument.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "voteType": "UPVOTE"  // or "DOWNVOTE"
}
```

**Response:** `200 OK`
```json
{
  "message": "Vote recorded",
  "newVoteCount": {
    "upvotes": 46,
    "downvotes": 3,
    "net": 43
  }
}
```

### GET `/:id/related`

Find similar arguments (for duplicate detection).

**Query Parameters:**
- `threshold` (number, 0-1) - Similarity threshold (default: 0.75)

**Response:** `200 OK`
```json
{
  "similar": [
    {
      "id": "uuid",
      "content": "Very similar argument...",
      "similarity": 0.85,
      "debateId": "uuid"
    }
  ]
}
```

---

## Media Routes

**Base:** `/api/media`

### GET `/`

List media library with filtering.

**Query Parameters:**
- `type` (string) - "BOOK", "VIDEO", "ARTICLE", "PAPER", etc.
- `search` (string) - Search title/author
- `minCredibility` (number) - Minimum credibility score
- `page`, `limit` - Pagination

**Response:** `200 OK`
```json
{
  "media": [
    {
      "id": "uuid",
      "title": "Capital in the Twenty-First Century",
      "type": "BOOK",
      "author": "Thomas Piketty",
      "year": 2013,
      "credibilityScore": 9.2,
      "biasScore": 2.5,
      "url": "https://example.com/link"
    }
  ],
  "pagination": { }
}
```

### POST `/`

Add media to library.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "The Spirit Level",
  "type": "BOOK",
  "author": "Wilkinson & Pickett",
  "year": 2009,
  "url": "https://example.com",
  "description": "Research on inequality and society",
  "credibilityScore": 8.5,
  "biasScore": 3.0
}
```

**Response:** `201 Created`

### PUT `/:id`

Update media details.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### DELETE `/:id`

Remove media from library.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST `/:id/verify`

Submit credibility verification for media.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "credibilityScore": 9.0,
  "evidenceQuality": "PEER_REVIEWED",
  "notes": "Published in Nature, peer-reviewed"
}
```

**Response:** `200 OK`

### GET `/search`

Search media by title, author, or keywords.

**Query Parameters:**
- `q` (string) - Search query
- `type` (string) - Filter by media type

**Response:** `200 OK`

---

## Comments Routes

**Base:** `/api/comments`

### POST `/`

Add a comment to an argument.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "argumentId": "uuid",
  "parentId": "uuid",  // Optional, for nested replies
  "content": "Great point! Here's additional context..."
}
```

**Response:** `201 Created`

### PUT `/:id`

Edit a comment (author only, within edit window).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

**Response:** `200 OK`

### DELETE `/:id`

Delete a comment.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST `/:id/votes`

Vote on a comment.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "voteType": "UPVOTE"
}
```

**Response:** `200 OK`

### GET `/:id/thread`

Get full comment thread (nested).

**Response:** `200 OK`
```json
{
  "comment": {
    "id": "uuid",
    "content": "Original comment",
    "votes": 15,
    "replies": [
      {
        "id": "uuid",
        "content": "Reply to comment",
        "votes": 8,
        "replies": []
      }
    ]
  }
}
```

---

## Merge Routes

**Base:** `/api/merges`

Argument merging system for consolidating duplicate or highly similar arguments.

### POST `/`

Propose merging two arguments.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "sourceArgumentId": "uuid",
  "targetArgumentId": "uuid",
  "reason": "These arguments make the same point with similar evidence"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "proposalId": "uuid",
  "status": "PENDING",
  "votesNeeded": 5
}
```

### GET `/:id`

View merge proposal details.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "sourceArgument": { },
  "targetArgument": { },
  "reason": "Duplicate content",
  "proposedBy": { },
  "status": "PENDING",
  "votes": {
    "approve": 3,
    "reject": 1
  },
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### POST `/:id/vote`

Vote on a merge proposal.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "vote": "APPROVE"  // or "REJECT"
}
```

**Response:** `200 OK`

### POST `/:id/approve`

Approve and execute merge (moderator only, or when vote threshold met).

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "message": "Arguments merged successfully",
  "mergedArgumentId": "uuid"
}
```

### POST `/:id/reject`

Reject merge proposal.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### GET `/conflicts`

Find potential merge conflicts (similar arguments).

**Query Parameters:**
- `debateId` (uuid) - Limit to specific debate
- `threshold` (number) - Similarity threshold

**Response:** `200 OK`
```json
{
  "conflicts": [
    {
      "argument1": { },
      "argument2": { },
      "similarity": 0.89
    }
  ]
}
```

---

## Moderation Routes

**Base:** `/api/moderation`

### POST `/reports`

Report content for moderation.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contentType": "ARGUMENT",  // or "COMMENT", "USER"
  "contentId": "uuid",
  "reason": "SPAM",  // SPAM, HARASSMENT, MISINFORMATION, etc.
  "details": "This argument contains misleading statistics"
}
```

**Response:** `201 Created`

### GET `/reports`

View reports (moderators only).

**Query Parameters:**
- `status` (string) - "PENDING", "RESOLVED", "DISMISSED"
- `type` (string) - Content type filter

**Response:** `200 OK`
```json
{
  "reports": [
    {
      "id": "uuid",
      "contentType": "ARGUMENT",
      "contentId": "uuid",
      "reason": "MISINFORMATION",
      "reportedBy": { },
      "status": "PENDING",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST `/reports/:id/resolve`

Resolve a report (moderator only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "action": "DELETE",  // DELETE, HIDE, WARN, DISMISS
  "notes": "Content removed for violating guidelines"
}
```

**Response:** `200 OK`

### POST `/actions`

Apply moderation action.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "targetType": "USER",
  "targetId": "uuid",
  "actionType": "BAN",  // BAN, MUTE, WARN, DELETE, HIDE, LOCK, FEATURE
  "duration": 86400,  // seconds, optional
  "reason": "Repeated policy violations"
}
```

**Response:** `200 OK`

### GET `/actions`

View moderation audit log (moderator only).

**Response:** `200 OK`

---

## Social Routes

**Base:** `/api/social`

### POST `/follow/:userId`

Follow a user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST `/unfollow/:userId`

Unfollow a user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### GET `/followers/:userId`

Get user's followers.

**Response:** `200 OK`
```json
{
  "followers": [
    {
      "id": "uuid",
      "username": "jane_doe",
      "reputation": 250
    }
  ],
  "count": 45
}
```

### POST `/messages`

Send a direct message.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "recipientId": "uuid",
  "content": "Thanks for the insightful argument!"
}
```

**Response:** `201 Created`

### GET `/messages/:userId`

Get conversation with a user.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "recipientId": "uuid",
      "content": "Message text",
      "read": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Notifications Routes

**Base:** `/api/notifications`

### GET `/`

Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `unreadOnly` (boolean) - Filter to unread
- `type` (string) - Filter by notification type

**Response:** `200 OK`
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "NEW_ARGUMENT",
      "title": "New argument in your debate",
      "message": "user123 posted a counter-argument",
      "link": "/debates/uuid/arguments/uuid",
      "read": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "unreadCount": 5
}
```

**Notification Types:**
- `NEW_ARGUMENT` - New argument in subscribed debate
- `VOTE_RECEIVED` - Someone voted on your argument
- `MENTION` - User mentioned you
- `REPLY` - Reply to your comment
- `MERGE_PROPOSAL` - Someone proposed merging your argument
- `ACHIEVEMENT` - Unlocked an achievement
- `DIRECT_MESSAGE` - New DM
- `MODERATION_ACTION` - Moderation action on your content

### PUT `/:id/read`

Mark notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### DELETE `/:id`

Delete a notification.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### POST `/subscribe/:debateId`

Subscribe to debate notifications.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "notifyOnNewArgument": true,
  "notifyOnReply": true,
  "notifyOnMention": true
}
```

**Response:** `200 OK`

---

## Template Routes

**Base:** `/api/templates`

Debate templates for common discussion formats.

### GET `/`

List available templates.

**Response:** `200 OK`
```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Policy Debate",
      "description": "Structured format for policy discussions",
      "category": "POLICY",
      "usageCount": 45
    }
  ]
}
```

### POST `/`

Create a template (verified users).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Scientific Hypothesis",
  "description": "Template for scientific discussions",
  "category": "SCIENCE",
  "structure": {
    "requireEvidence": true,
    "evidenceTiers": ["PEER_REVIEWED", "STUDY"]
  }
}
```

**Response:** `201 Created`

### GET `/:id`

View template details.

**Response:** `200 OK`

### POST `/:id/use`

Create a debate from template.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "thesis": "Your debate thesis",
  "description": "Additional context"
}
```

**Response:** `201 Created`

---

## Drafts Routes

**Base:** `/api/drafts`

Auto-save functionality for debates, arguments, and comments.

### POST `/`

Save a draft.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "contentType": "ARGUMENT",
  "debateId": "uuid",
  "content": "Work in progress argument text..."
}
```

**Response:** `201 Created`

### GET `/:id`

Retrieve a draft.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### PUT `/:id`

Update a draft.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

### DELETE `/:id`

Discard a draft.

**Headers:** `Authorization: Bearer <token>`

**Response:** `200 OK`

---

## User Routes

**Base:** `/api/users`

### GET `/:id`

Get user profile.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "username": "policy_expert",
  "reputation": 350,
  "karma": 120,
  "verified": true,
  "role": "USER",
  "bio": "Policy analyst focused on economics",
  "joinedAt": "2023-06-15T10:30:00.000Z",
  "stats": {
    "debatesCreated": 12,
    "argumentsPosted": 89,
    "karmaReceived": 450,
    "commentsPosted": 156
  }
}
```

### PUT `/:id`

Update user profile (own profile only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bio": "Updated bio text",
  "avatar": "https://example.com/avatar.jpg"
}
```

**Response:** `200 OK`

### GET `/:id/debates`

Get user's debates.

**Response:** `200 OK`

### GET `/:id/stats`

Get detailed user statistics.

**Response:** `200 OK`
```json
{
  "debatesCreated": 12,
  "argumentsPosted": 89,
  "proArguments": 45,
  "conArguments": 44,
  "karmaReceived": 450,
  "karmaGiven": 380,
  "averageReasonRank": 7.2,
  "topDebates": [],
  "achievements": []
}
```

### GET `/leaderboard`

Get user leaderboard rankings.

**Query Parameters:**
- `metric` (string) - "reputation", "karma", "arguments"
- `limit` (number) - Results to return

**Response:** `200 OK`
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "top_debater",
      "reputation": 1250,
      "karma": 890
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

Invalid request parameters or validation errors.

```json
{
  "error": "Validation Error",
  "message": "Invalid email format",
  "details": {
    "field": "email",
    "issue": "Must be a valid email address"
  }
}
```

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 403 Forbidden

Insufficient permissions.

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found

Resource doesn't exist.

```json
{
  "error": "Not Found",
  "message": "Debate not found"
}
```

### 409 Conflict

Resource conflict (e.g., duplicate vote).

```json
{
  "error": "Conflict",
  "message": "You have already voted on this argument"
}
```

### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds"
}
```

### 500 Internal Server Error

Server error.

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints:** 5 requests per minute
- **Read endpoints:** 100 requests per minute
- **Write endpoints:** 30 requests per minute
- **Media upload:** 10 requests per hour

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642253400
```

---

## Pagination

List endpoints support pagination with consistent query parameters:

- `page` (number) - Page number (1-indexed)
- `limit` (number) - Results per page (max: 100, default: 20)

Responses include pagination metadata:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Webhooks

_(Future feature)_ Subscribe to events for real-time updates.

---

For more information:
- [Getting Started](Getting-Started) - Setup and authentication
- [Database Schema](Database-Schema) - Data models
- [Architecture Overview](Architecture-Overview) - System design
