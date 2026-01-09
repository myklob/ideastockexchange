# Idea Stock Exchange: One Page Per Topic

## The Architecture of Reason

**The Core Belief:** To cure the chaos of online discourse, we must create a single, unified page for every topic. This page must organize beliefs in three simultaneous dimensions—General to Specific, Weak to Strong, and Negative to Positive—allowing users to navigate complexity with the clarity of a map.

## The Problem

Right now, online discussions fail us in four critical ways:

1. **Topic Drift:** Conversations wander, losing focus and momentum.
2. **Scattered Arguments:** Brilliant insights vanish into endless, unsearchable comment threads.
3. **Repetition Without Progress:** We argue in circles, never building on what came before.
4. **No Collective Memory:** There is no record of what has been proven, disproven, or refined over time.

**The cost?** Lost insights, wasted energy, and debates that generate heat but no light.

## The Solution: Multi-Dimensional Belief Mapping

We solve this by treating ideas not as a stream of text, but as data points in a 3D space. Every topic page allows you to sort the chaos into order using three specific axes:

### Dimension 1: General → Specific (The Abstraction Ladder)
Navigate up to see the broader principles or down to explore specific policy implementations. This prevents "category errors" where people argue about specific laws when they actually disagree on fundamental philosophy.

### Dimension 2: Weak → Strong (The Confidence Scale)
Sort beliefs by intensity. Note that the strongest claims often have lower scores because they require a higher burden of proof. This dimension helps users distinguish between nuanced reality and dogmatic extremism.

### Dimension 3: Negative → Positive (The Valence Spectrum)
View the full spectrum of positions in one view. Instead of a binary "Pro/Con," we map the nuance of the debate, allowing users to find the exact point where they stand.

## Features

- **Topic Hubs:** Each major question gets its own hub where all perspectives converge
- **Multi-Dimensional Views:** Organize beliefs by abstraction, intensity, or valence
- **Master View:** See all three dimensions combined in one comprehensive table
- **Dynamic Scoring:** Track which beliefs have the strongest evidence and support
- **Hierarchical Navigation:** Move from general principles to specific implementations

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Components** - Modular, reusable UI components

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ideastockexchange.git
cd ideastockexchange
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
ideastockexchange/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with header/footer
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── topic/[id]/          # Dynamic topic pages
│       └── page.tsx
├── components/              # React components
│   ├── AbstractionLadder.tsx    # General to Specific view
│   ├── ConfidenceScale.tsx      # Weak to Strong view
│   ├── ValenceSpectrum.tsx      # Negative to Positive view
│   └── MasterView.tsx           # Combined 3D view
├── data/                    # Sample data
│   └── sampleData.ts        # Example topics and beliefs
├── lib/                     # Utilities
│   └── utils.ts             # Helper functions
├── types/                   # TypeScript definitions
│   └── index.ts             # Core type definitions
└── README.md
```

## Data Model

### Core Types

**Topic**: A subject for debate with multiple beliefs
- `id`: Unique identifier
- `title`: Topic name
- `description`: Brief explanation
- `beliefs`: Array of belief statements
- `parentTopics`: Related broader topics

**Belief**: A specific claim about a topic
- `statement`: The belief text
- `score`: Community rating
- `abstractionLevel`: General to Specific position
- `intensity`: Weak to Strong (claim strength)
- `valence`: Negative to Positive (stance)
- `hierarchyDepth`: Position in abstraction ladder

## Sample Topics

The application includes four example topics:

1. **Congressional Term Limits** - Demonstrates the Abstraction Ladder (General → Specific)
2. **Electric Cars** - Demonstrates the Confidence Scale (Weak → Strong)
3. **Social Media Impact** - Demonstrates the Valence Spectrum (Negative → Positive)
4. **Donald Trump's Capability** - Demonstrates the Master View (all dimensions combined)

## Extending the System

### Adding New Topics

1. Create belief data in `data/sampleData.ts`:
```typescript
export const myTopicBeliefs: Belief[] = [
  {
    id: 'mt-1',
    topicId: 'my-topic',
    statement: 'Your belief statement here',
    score: 50,
    abstractionLevel: 'general',
    hierarchyDepth: 0,
    intensity: 'moderate',
    intensityPercentage: 50,
    valence: 'moderately_positive',
    valenceScore: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
```

2. Add the topic to `sampleTopics` array
3. Update `getTopicWithBeliefs()` function to include your topic

### Creating New Views

Create new components in `components/` that:
- Accept `beliefs: Belief[]` as props
- Use utility functions from `lib/utils.ts` for sorting/formatting
- Display data in a way that highlights specific dimensions

## The Vision

By giving every topic its own "room" where ideas can be organized across multiple dimensions, we create the infrastructure for collective intelligence. This isn't just better debate—it's a foundation for:

- Evidence-based governance
- Systematic conflict resolution
- Decisions that serve the common good

Ideas are tested, not just shouted. Evidence is gathered, not ignored. Progress is measured, not assumed.

**This is how democracy evolves. This is how we move from tribal warfare to collaborative wisdom.**

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this code for your own projects.

## Contact

Ready to help build it? Contact us to contribute to this vision of organized, rational discourse.
