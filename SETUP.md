# Setup Guide - Idea Stock Exchange

This guide will help you get the Idea Stock Exchange application up and running.

## Prerequisites

- Python 3.11 or higher
- Node.js 16 or higher
- npm or yarn

## Backend Setup

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

### 3. Activate the virtual environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Initialize the database

The database will be created automatically when you first run the application.
To seed it with example data:

```bash
python -m backend.seed_data
```

This will create example topics including:
- **Climate Change Severity** with criteria like:
  - Glacier Mass Balance (92% score)
  - Average Global Temperature (85% score)
  - Frequency of Hot Days (60% score)
  - Twitter Sentiment (15% score)

- **Economic Health** with criteria like:
  - Median Real Wage Growth
  - GDP Growth Rate
  - Stock Market Performance

### 6. Run the backend server

```bash
uvicorn backend.main:app --reload
```

The API will be available at: http://localhost:8000

API documentation: http://localhost:8000/docs

## Frontend Setup

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

The application will open in your browser at: http://localhost:3000

## Using the Application

### Creating a Topic

1. Go to http://localhost:3000
2. Click "Create New Topic"
3. Enter a title like "Is Universal Healthcare Effective?"
4. Add a description (optional)
5. Click "Create Topic"

### Proposing Criteria

1. Open a topic
2. Click "Propose New Criterion"
3. Enter a criterion name like "Life Expectancy"
4. Add a description explaining what it measures
5. Click "Create Criterion"

### Adding Arguments

1. On a criterion card, click "Add Argument for this Criterion"
2. Select a dimension (Validity, Reliability, Independence, or Linkage)
3. Choose direction (Supporting or Opposing)
4. Write your argument content
5. Adjust the quality scores:
   - **Evidence Quality**: How well-supported is this argument?
   - **Logical Validity**: How logically sound is this argument?
   - **Importance**: How important is this consideration?
6. Click "Add Argument"

The criterion scores will automatically recalculate!

### Understanding the Scores

Each criterion is scored 0-100% based on four dimensions:

- **Validity** (✓): Does this measure what we think it measures?
- **Reliability** (⚖): Can different people measure this consistently?
- **Independence** (◉): Is the data source neutral?
- **Linkage** (↔): How strongly does this correlate with the goal?

The overall score is calculated from these four dimensions, weighted by the balance of supporting vs. opposing arguments.

### Viewing Score Breakdowns

Click "Show Detailed Breakdown" on any criterion to see:
- How each dimension was scored
- All supporting and opposing arguments
- The weight of each argument
- How the final score was calculated

## Architecture

### Backend (Python/FastAPI)

- **models.py**: Database models using SQLAlchemy
- **schemas.py**: Pydantic schemas for API validation
- **main.py**: FastAPI application with all endpoints
- **algorithms/scoring.py**: ReasonRank algorithm implementation
- **database.py**: Database configuration
- **seed_data.py**: Example data for testing

### Frontend (React/TypeScript)

- **components/HomePage.tsx**: Topic listing and creation
- **components/TopicPage.tsx**: Criteria display for a topic
- **components/CriterionCard.tsx**: Individual criterion display
- **components/ArgumentForm.tsx**: Form for creating arguments
- **components/DimensionBreakdown.tsx**: Detailed score breakdown
- **components/ScoreBar.tsx**: Visual score display
- **services/api.ts**: API client
- **types/index.ts**: TypeScript type definitions

## API Endpoints

### Topics
- `POST /topics/` - Create topic
- `GET /topics/` - List topics
- `GET /topics/{id}` - Get topic with criteria
- `DELETE /topics/{id}` - Delete topic

### Criteria
- `POST /criteria/` - Create criterion
- `GET /criteria/{id}` - Get criterion with arguments
- `GET /topics/{id}/criteria/` - List topic's criteria
- `DELETE /criteria/{id}` - Delete criterion
- `POST /criteria/{id}/recalculate` - Recalculate scores
- `GET /criteria/{id}/breakdown` - Get score breakdown

### Arguments
- `POST /arguments/` - Create argument
- `PUT /arguments/{id}` - Update argument
- `GET /criteria/{id}/arguments/` - List criterion's arguments
- `DELETE /arguments/{id}` - Delete argument

### Evidence
- `POST /evidence/` - Create evidence
- `GET /criteria/{id}/evidence/` - List criterion's evidence

## Troubleshooting

### Backend won't start

- Make sure Python 3.11+ is installed: `python --version`
- Check that virtual environment is activated
- Verify all dependencies installed: `pip list`

### Frontend won't start

- Check Node.js version: `node --version` (needs 16+)
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

### Database errors

- Delete the database file and recreate: `rm ideastockexchange.db`
- Run seed script again: `python -m backend.seed_data`

### API connection errors

- Verify backend is running on port 8000
- Check that CORS is configured in backend/main.py
- Verify frontend .env file has correct API URL

## Next Steps

- Explore the example data
- Create your own topics and criteria
- Add arguments to see scores update in real-time
- Review the detailed breakdowns to understand the algorithm
- Read the CONTRIBUTING.md for how to extend the system

## Support

For issues or questions:
- Check the documentation in docs/
- Review the code comments
- Open an issue on GitHub
