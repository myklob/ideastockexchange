# Getting Started with Idea Stock Exchange

This guide will help you set up the Idea Stock Exchange platform for local development.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+** (critical for Next.js 16 compatibility)
  - Check version: `node --version`
  - Download: [nodejs.org](https://nodejs.org/)
- **PostgreSQL 14+** (or you can use SQLite for development)
  - Check version: `psql --version`
  - Download: [postgresql.org](https://www.postgresql.org/download/)
- **npm** or **yarn** (comes with Node.js)
- **Git** for version control
  - Check version: `git --version`

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/myklob/ideastockexchange.git
cd ideastockexchange
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages for both frontend and backend.

### 3. Set Up the Database

#### Option A: Local PostgreSQL

**Create the database:**

```bash
createdb ideastockexchange
```

**Create a PostgreSQL user (if needed):**

```sql
CREATE USER iseuser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ideastockexchange TO iseuser;
```

#### Option B: Docker PostgreSQL

```bash
docker run --name ise-postgres \
  -e POSTGRES_DB=ideastockexchange \
  -e POSTGRES_USER=iseuser \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:16
```

#### Option C: Cloud PostgreSQL

You can also use hosted PostgreSQL services:
- **Supabase** - Free tier available
- **Neon** - Serverless PostgreSQL
- **Railway** - Simple deployment
- **AWS RDS** - Enterprise option

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Database (required)
DATABASE_URL="postgresql://iseuser:your_password@localhost:5432/ideastockexchange?schema=public"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication (change in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3001
NODE_ENV=development

# Optional: NLP Features
EMBEDDING_MODEL=all-MiniLM-L6-v2
SIMILARITY_THRESHOLD=0.75
TOPIC_EXTRACTION_METHOD=semantic

# Pagination
MAX_RESULTS_PER_PAGE=20
```

**Important:** Never commit your `.env` file to version control!

### 5. Run Database Migrations

Apply the database schema:

```bash
npm run prisma:migrate
```

This creates all necessary tables and relationships.

### 6. (Optional) Seed the Database

Populate the database with sample data:

```bash
npm run prisma:seed
```

This adds example debates, arguments, users, and media for testing.

---

## Running the Application

### Development Mode

Start the development server with hot reload:

```bash
npm run dev
```

This starts:
- **Frontend** at http://localhost:3000
- **Backend API** at http://localhost:3001

The application will automatically reload when you make changes.

### Production Mode

Build and run the optimized production version:

```bash
npm run build
npm start
```

---

## Development Commands

### Database Management

```bash
# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Generate Prisma client (after schema changes)
npm run prisma:generate

# Create a new migration
npm run prisma:migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npm run prisma:reset
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run tests
npm test

# Type checking
npx tsc --noEmit
```

### Build Commands

```bash
# Build for production
npm run build

# Build only frontend
npm run build:frontend

# Build only backend
npm run build:backend
```

---

## Project Structure

```
ideastockexchange/
├── app/                    # Next.js app directory (React 19)
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── law/               # wikiLaw pages
│   ├── topics/            # Topic pages
│   ├── books/             # Book analysis
│   └── api/               # API route handlers
├── components/            # React components
│   ├── wikilaw/          # wikiLaw-specific components
│   └── ...               # Other UI components
├── lib/                   # Shared utilities and services
│   ├── types/            # TypeScript type definitions
│   └── services/         # Business logic
├── prisma/               # Database
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration history
│   └── seed.ts           # Seed data
├── src/
│   └── server/           # Express.js backend
│       ├── routes/       # API endpoints (13 modules)
│       ├── services/     # Business logic
│       └── middleware/   # Auth, validation, etc.
├── public/               # Static assets
├── docs/                 # Documentation
├── .env                  # Environment variables (not in git)
├── .env.example         # Example environment config
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

---

## Verify Installation

### 1. Check Database Connection

Visit http://localhost:3001/api/health (if you have a health endpoint) or:

```bash
npm run prisma:studio
```

This should open a browser with your database tables.

### 2. Test the API

Create a test user:

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Access the Frontend

Open http://localhost:3000 in your browser. You should see the Idea Stock Exchange home page.

---

## Common Issues & Solutions

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

Or change the port in `.env`:

```env
PORT=3002
```

### Database Connection Errors

1. **PostgreSQL not running:**
   ```bash
   # macOS
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql
   ```

2. **Wrong credentials:**
   - Double-check your `DATABASE_URL` in `.env`
   - Ensure the user and password are correct

3. **Database doesn't exist:**
   ```bash
   createdb ideastockexchange
   ```

### Node Version Issues

Idea Stock Exchange requires Node.js 20+:

```bash
# Using nvm (Node Version Manager)
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x
```

### Prisma Client Errors

After changing the schema, regenerate the client:

```bash
npm run prisma:generate
npm run prisma:migrate dev
```

### Module Not Found Errors

Reinstall dependencies:

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

---

## Next Steps

Now that you have the application running:

1. **Explore the codebase:**
   - Read [Architecture Overview](Architecture-Overview) to understand system design
   - Check [API Documentation](API-Documentation) for available endpoints
   - Review [Database Schema](Database-Schema) for data models

2. **Try key features:**
   - Create a debate at http://localhost:3000
   - Add pro/con arguments
   - Upload media evidence
   - Try the wikiLaw analysis tool

3. **Start developing:**
   - Pick an issue from the [GitHub issue tracker](https://github.com/myklob/ideastockexchange/issues)
   - Create a feature branch: `git checkout -b feature/your-feature`
   - Make your changes and submit a pull request

---

## Getting Help

- **Documentation:** [Wiki Home](Home)
- **Issues:** [GitHub Issue Tracker](https://github.com/myklob/ideastockexchange/issues)
- **Questions:** Open a new issue with the "question" label

---

## Development Workflow

### Creating a Feature

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes:**
   - Edit code
   - Test locally
   - Run linter: `npm run lint`

3. **Commit:**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

### Database Changes

1. **Edit schema:**
   ```bash
   # Edit prisma/schema.prisma
   ```

2. **Create migration:**
   ```bash
   npm run prisma:migrate dev --name your_change_name
   ```

3. **Generate client:**
   ```bash
   npm run prisma:generate
   ```

---

Welcome to the Idea Stock Exchange development community! 🚀
