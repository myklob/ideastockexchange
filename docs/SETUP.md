# Setup Guide - Idea Stock Exchange

This guide will help you get the Idea Stock Exchange Book Analysis System up and running.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 20 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database (version 14 or higher)
- **Git** (for cloning the repository)

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ideastockexchange.git
cd ideastockexchange
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js 14
- React 18
- Prisma ORM
- TypeScript
- Tailwind CSS
- And other dependencies

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

If you have PostgreSQL installed locally:

1. Create a new database:

```bash
createdb ideastockexchange
```

2. Create a user (if needed):

```bash
psql postgres
CREATE USER iseuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ideastockexchange TO iseuser;
\q
```

#### Option B: Docker PostgreSQL

If you prefer Docker:

```bash
docker run --name ise-postgres \
  -e POSTGRES_DB=ideastockexchange \
  -e POSTGRES_USER=iseuser \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:16
```

#### Option C: Cloud Database

You can also use cloud providers like:

- **Supabase** (free tier available)
- **Neon** (serverless PostgreSQL)
- **Railway** (simple PostgreSQL hosting)
- **AWS RDS**
- **Heroku Postgres**

### 4. Configure Environment Variables

The `.env` file already exists, but you need to update it with your actual database credentials:

```bash
# Edit .env file
nano .env
```

Update the `DATABASE_URL` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://iseuser:your_password@localhost:5432/ideastockexchange?schema=public"
```

**Format breakdown:**

```
postgresql://[username]:[password]@[host]:[port]/[database]?schema=public
```

### 5. Initialize the Database

Push the Prisma schema to your database:

```bash
npm run db:push
```

This will create all the necessary tables:

- books
- claims
- topicOverlaps
- fallacies
- contradictions
- evidences
- metaphors
- predictions
- authors
- users

### 6. Seed the Database

Populate the database with example book analyses:

```bash
npm run db:seed
```

This will create:

- **4 example books** with complete analyses
- **4 authors** with truth equity scores
- **Multiple claims** with validity scores
- **Topic overlaps** showing belief centrality
- **Fallacies**, **evidence**, **metaphors**, and **predictions**

Example books included:

1. **Hamlet** by William Shakespeare (98/100 validity)
2. **Thinking, Fast and Slow** by Daniel Kahneman (88/100 validity)
3. **Outliers** by Malcolm Gladwell (72/100 validity)
4. **The Communist Manifesto** by Karl Marx & Friedrich Engels (65/100 validity, 9.2/10 impact)

### 7. Run the Development Server

```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000)

### 8. Verify Installation

Open your browser and navigate to:

- **Homepage**: http://localhost:3000
- **Books**: http://localhost:3000/books
- **Topics**: http://localhost:3000/topics

You should see the four example books with their complete analyses.

## Development Tools

### Prisma Studio

To view and edit your database visually:

```bash
npm run db:studio
```

This opens Prisma Studio at [http://localhost:5555](http://localhost:5555)

### Database Reset

If you need to reset the database:

```bash
npm run db:push -- --force-reset
npm run db:seed
```

**Warning**: This will delete all existing data!

## Production Deployment

### Option 1: Vercel (Recommended for Next.js)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your `DATABASE_URL` environment variable in Vercel settings
4. Deploy

### Option 2: Railway

1. Connect your GitHub repository to Railway
2. Add PostgreSQL database addon
3. Set environment variables
4. Deploy

### Option 3: Docker

Build and run with Docker:

```bash
docker build -t ideastockexchange .
docker run -p 3000:3000 \
  -e DATABASE_URL="your_database_url" \
  ideastockexchange
```

## Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"

**Solution**:

- Check PostgreSQL is running: `pg_isready`
- Verify connection string in `.env`
- Ensure database exists: `psql -l`
- Check firewall settings

### Prisma Schema Errors

**Error**: "Schema validation error"

**Solution**:

```bash
npx prisma generate
npm run db:push
```

### Port Already in Use

**Error**: "Port 3000 is already in use"

**Solution**:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### Missing Dependencies

**Error**: "Cannot find module..."

**Solution**:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Common Tasks

### Adding a New Book

1. Use Prisma Studio: `npm run db:studio`
2. Navigate to "Book" table
3. Click "Add record"
4. Fill in the details
5. Add related claims, topics, etc.

Or use the API:

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Book",
    "author": "Author Name",
    "publishYear": 2024,
    "logicalValidityScore": 75,
    "qualityScore": 80
  }'
```

### Updating Book Scores

After adding claims, recalculate the book's validity:

```typescript
import { recalculateBookValidity } from '@/lib/services/bookService'

await recalculateBookValidity(bookId)
```

### Viewing API Data

Access the API directly:

- All books: http://localhost:3000/api/books
- Single book: http://localhost:3000/api/books/[id]
- Analysis report: http://localhost:3000/api/books/[id]/analysis

## Next Steps

1. **Explore the example analyses** to understand the scoring system
2. **Read the main README.md** for architecture details
3. **Check the codebase structure** in `/lib/services/`
4. **Customize the UI** in `/app/` directory
5. **Add authentication** for user contributions
6. **Implement real-time collaboration** features

## Support

For issues or questions:

- Check the main README.md
- Review the code documentation
- Open an issue on GitHub
- Check Prisma documentation: https://www.prisma.io/docs

## Quick Reference

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio
npm run db:seed         # Seed example data

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks
```

---

**Happy analyzing! Transform reading from passive consumption to active critical analysis.**
