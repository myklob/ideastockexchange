# IdeaStockExchange

A comprehensive debate platform inspired by Kialo, enhanced with integrated media lists to support evidence-based argumentation. IdeaStockExchange helps users engage in structured debates backed by books, videos, articles, documentaries, and other media sources.

## Vision

Debates and arguments often rely on more than just statements—they draw from books, documentaries, articles, and other media. By integrating these media into structured pro/con lists, IdeaStockExchange elevates the quality of discourse, provides comprehensive analyses, and addresses misinformation effectively.

## Key Features

### Core Debate Platform (Kialo-style)
- **Hierarchical Argument Structure**: Organize arguments in nested pro/con trees
- **Position-based Arguments**: Arguments can be Pro, Con, or Neutral (informational)
- **Debate Management**: Create, browse, and participate in public debates
- **User Authentication**: Secure registration and login system
- **Voting System**: Upvote/downvote arguments to surface quality content

### Media Integration
- **Multi-format Support**: Books, videos, articles, images, podcasts, documentaries, academic papers, and websites
- **Media Library**: Centralized repository of curated media sources
- **Argument-Media Linking**: Connect media to arguments with position tags (Supports/Refutes/Neutral)
- **Source Metadata**: Track credibility scores, bias ratings, authors, and publication dates
- **Relevance Scoring**: Rate how relevant each media item is to its linked argument

### Advanced Scoring & Ranking

#### ReasonRank Algorithm
A sophisticated ranking system that evaluates arguments based on:
- **Truth Score** (30%): Accuracy and factual correctness
- **Importance Score** (25%): Significance to the discussion
- **Relevance Score** (20%): Pertinence to the debate topic
- **Vote Score** (15%): Community voting (normalized with sigmoid function)
- **Media Score** (8%): Quality and quantity of supporting media
- **Recency Boost** (2%): Freshness of the argument

#### Media Score Calculation
Media support evaluation considers:
- Number and diversity of media sources
- Credibility of each source
- Relevance to the argument
- Position alignment (supporting vs. refuting)
- Balance of evidence

### Truth, Importance & Relevance Framework
- **Truth Score**: 0-1 rating for factual accuracy
- **Importance Score**: 0-1 rating for significance
- **Relevance Score**: 0-1 rating for topical relevance
- **Transparent Scoring**: Visible scores help users evaluate argument quality

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod schemas

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS Modules (no framework dependencies)

### Database Schema

#### Core Models
- **User**: Authentication and user profiles
- **Debate**: Discussion topics with metadata
- **Argument**: Nested pro/con arguments with scoring
- **Media**: Library of evidence sources
- **ArgumentMedia**: Junction table linking arguments to media
- **Vote**: User votes on arguments

#### Key Relationships
- Debates contain multiple Arguments
- Arguments can have child Arguments (nested structure)
- Arguments link to multiple Media items
- Media items can support/refute multiple Arguments
- Users can vote on Arguments

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd ideastockexchange

# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb ideastockexchange

# Copy environment file
cp .env.example .env

# Edit .env and configure:
# DATABASE_URL="postgresql://user:password@localhost:5432/ideastockexchange"
# JWT_SECRET="your-secret-key"
# PORT=3001

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### 3. Run the Application

#### Development Mode
```bash
# Terminal 1: Start backend server
npm run server:dev

# Terminal 2: Start frontend dev server
cd client
npm start
```

#### Production Mode
```bash
# Build both server and client
npm run build

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Prisma Studio: http://localhost:5555 (run `npm run prisma:studio`)

## Usage Guide

### Creating a Debate

1. Register/login to the platform
2. Navigate to "Create Debate"
3. Provide:
   - Title (required)
   - Description (optional, but recommended)
   - Tags (comma-separated)
   - Visibility (public/private)
4. Click "Create Debate"

### Adding Arguments

1. Open a debate
2. Click "Add Root Argument" or "Reply" on an existing argument
3. Choose position:
   - **Pro**: Agrees with parent/debate thesis
   - **Con**: Disagrees with parent/debate thesis
   - **Neutral**: Provides context/information
4. Write your argument
5. Submit

### Adding Media to Arguments

Media can be added when creating an argument or linked separately:

1. Go to Media Library
2. Click "Add Media"
3. Fill in media details:
   - Title, type, URL
   - Author, description
   - Credibility score (0-100%)
   - Bias score (-1 to 1: left/neutral/right)
4. Link media to arguments with position tags

### Voting & Scoring

- **Vote**: Click upvote/downvote on any argument
- **View Scores**: See Truth, Importance, Relevance scores on arguments
- **ReasonRank**: Arguments automatically ranked by the algorithm

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login and get JWT token

### Debates
- `GET /api/debates` - List all public debates
- `GET /api/debates/:id` - Get debate with argument tree
- `POST /api/debates` - Create debate (auth required)
- `PATCH /api/debates/:id` - Update debate (auth required)
- `DELETE /api/debates/:id` - Delete debate (auth required)

### Arguments
- `GET /api/arguments/:id` - Get argument with children
- `POST /api/arguments` - Create argument (auth required)
- `PATCH /api/arguments/:id` - Update argument (auth required)
- `POST /api/arguments/:id/score` - Update scores (auth required)
- `POST /api/arguments/:id/vote` - Vote on argument (auth required)
- `DELETE /api/arguments/:id/vote` - Remove vote (auth required)

### Media
- `GET /api/media` - List media (supports filtering and search)
- `GET /api/media/:id` - Get media details
- `POST /api/media` - Add media (auth required)
- `PATCH /api/media/:id` - Update media (auth required)
- `DELETE /api/media/:id` - Delete media (auth required)
- `POST /api/media/:mediaId/link/:argumentId` - Link media to argument

## Architecture Decisions

### Why PostgreSQL?
- Excellent support for relational data (debates, arguments, media)
- ACID compliance for data integrity
- JSON support for flexible metadata
- Powerful querying for complex argument trees

### Why Prisma?
- Type-safe database access
- Automatic migrations
- Excellent developer experience
- Built-in connection pooling

### ReasonRank Algorithm Design
The algorithm uses weighted factors to:
1. Surface high-quality, well-supported arguments
2. Balance community input with objective metrics
3. Reward evidence-based argumentation
4. Maintain recency without over-prioritizing new content

### Security Considerations
- JWT authentication with secure password hashing (bcrypt)
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- XSS protection through React's built-in escaping
- CORS configuration for API access control

## Future Enhancements

### Planned Features
1. **AI-Powered Scoring**: Automated truth/relevance scoring using NLP
2. **Fact-Checking Integration**: Real-time verification via fact-checking APIs
3. **Advanced Media Verification**: Source credibility analysis
4. **Export Capabilities**: Generate debate summaries and reports
5. **Real-time Collaboration**: WebSocket support for live debates
6. **Recommendation Engine**: Suggest relevant debates and media
7. **Moderation Tools**: Flag inappropriate content, community guidelines
8. **Analytics Dashboard**: Debate engagement metrics
9. **Mobile App**: Native iOS/Android applications
10. **API Access**: Public API for third-party integrations

### Advanced Concepts
- **Automated Conflict Resolution**: Use ReasonRank to identify consensus
- **Cost-Benefit Analysis**: AI-powered analysis of policy debates
- **Dynamic Weighting**: Adjust scoring weights based on debate type
- **Explainable AI**: Transparency in automated scoring decisions

## Contributing

This project is open for contributions. Areas of interest:
- Improving the ReasonRank algorithm
- Adding AI/ML-based scoring
- Enhancing the UI/UX
- Adding fact-checking integrations
- Writing tests
- Documentation improvements

## License

MIT License - See LICENSE file for details

## Acknowledgments

Inspired by:
- **Kialo**: For structured debate visualization
- **Captain Fact**: For real-time fact-checking concepts
- **Reddit/HN**: For voting and ranking mechanisms
- **Wikipedia**: For community-driven knowledge curation

---

**Built with the mission to improve online discourse, reduce misinformation, and promote evidence-based decision-making.**
