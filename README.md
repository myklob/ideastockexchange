# wikiLaw: The Operating System for Law

**Every law is a bet on reality.** It says: "If we enforce X, we'll get outcome Y." But unlike every other bet humans make, we're not allowed to check the math. The statute books are written in code the public can't read, updated with patches nobody tracks, and defended with arguments that would get you laughed out of an engineering review.

**We are running a 21st-century society on an operating system the public isn't allowed to debug.**

wikiLaw changes that. It takes every law in every state and turns it into something you can actually test, argue about, and improve.

## What Makes This Different

Most legal databases just catalog words. **wikiLaw catalogs the beliefs those words operationalize.**

We sort laws two ways at once:

1. **By Category** (Tax, housing, education, criminal justice)
2. **By the Actual Claims About Reality They Depend On**

When you link a law to its operating belief, you force a different kind of conversation. Politicians can't hide behind "values" anymore. Either the mechanism works or it doesn't. Either the tradeoffs are worth it or they're not. **You stop debating vibes and start debugging code.**

## The Law Page: A Diagnostic Panel

Each law gets one permanent, canonical page. Not a blog post. A **verification dashboard**:

### Plain-English Decode
What the law actually changes in the real world, stripped of legalese. If you can't explain it clearly, you don't understand it.

### Stated vs. Operative Purpose
What the law *claims* it's doing (the marketing copy in the title) vs. the incentives it *actually* creates (the mechanics under the hood).

**Example:** A law titled "Affordable Housing Preservation Act" that makes it illegal to build anything but single-family homes isn't preserving affordability. It's preserving scarcity for current homeowners.

### Evidence Audit
The best arguments and data for/against effectiveness, organized using quality scoring. Not cherry-picked studies. The strongest case on both sides, with explicit quality ratings.

### Justification Stress-Test
- Does this law conflict with the Constitution?
- Does it violate American Values like equal protection or due process?
- Can it survive scrutiny when the other tribe is in power? (The Reversibility Test)

### Stakeholder Ledger
Who pays? Who benefits? Who's the silent victim of second-order effects? Every law has winners and losers. We make them visible.

### Implementation Tracker
What the law says on paper vs. what actually gets enforced. Because the gap between statute and reality is where most of the harm (and gaming) happens.

## The Killer Feature: "Suggest a Change"

wikiLaw doesn't just audit existing laws. It generates **versioned upgrades** through structured proposals:

### 1. Goal (tied to Interests)
What measurable failure are you fixing? Not "make things better." What specific outcome, for which specific people, would change?

### 2. Mechanism (tied to Assumptions)
How does your wording change incentives or behavior? Walk through the causal chain. "People will do X because Y" requires you to show your work.

### 3. Evidence
Why will your fix work? What data from similar contexts supports this? More importantly: What data would prove you wrong?

### 4. Trade-off Audit
Explicit costs, risks, and burdens. Who loses? What gets worse? **Honesty about tradeoffs earns you credibility in the scoring system.** Pretending your solution has no downsides earns you nothing.

Then the community stress-tests every link in your logic chain. The "best" version rises because it survives scrutiny, not because it got the most applause.

## Technology Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Structured Data Models** - Complete type system for laws, evidence, assumptions, proposals

## Project Structure

```
ideastockexchange/
├── app/                    # Next.js app directory
│   ├── law/[id]/          # Individual law diagnostic pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   └── globals.css        # Global styles
├── components/
│   └── wikilaw/           # wikiLaw-specific components
│       ├── DiagnosticSection.tsx
│       ├── EvidenceCard.tsx
│       └── AssumptionCard.tsx
├── lib/
│   ├── types/             # TypeScript type definitions
│   │   ├── ise-core.ts    # ISE framework types (Evidence, Assumptions, etc.)
│   │   └── wikilaw.ts     # wikiLaw-specific types (Law, Proposal, etc.)
│   └── data/
│       └── example-laws.ts # Example law data
└── public/                # Static assets
```

## Core Data Models

### ISE Framework Types

The Idea Stock Exchange framework provides foundational concepts:

- **Evidence** - Empirical data or logical arguments with quality scores
- **Assumptions** - Testable beliefs about how reality works
- **Interests** - Measurable stakeholder goals
- **Truth Assessment** - Framework for evaluating claims
- **Linkage Scores** - Dependency mapping between concepts

### wikiLaw Types

Built on ISE foundations:

- **Law** - Complete diagnostic data for a statute
- **Evidence Audit** - Effectiveness analysis with quality scoring
- **Justification Test** - Constitutional and values scrutiny
- **Stakeholder Ledger** - Who wins, loses, and gets caught in crossfire
- **Implementation Tracker** - Statute vs. reality gap analysis
- **Law Proposal** - Structured amendment with required justification

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Example Laws

The system ships with two fully-analyzed example laws:

1. **Mandatory Minimum Sentencing (California)** - Demonstrates a law with questionable assumptions about deterrence and rational decision-making, high costs, and significant unintended consequences.

2. **Rent Control (AB 1482)** - Shows a law with contested economic assumptions, clear purpose gap between stated and operative goals, and complex stakeholder impacts.

Each example demonstrates:
- Plain-English decoding of legal text
- Identification of operating assumptions
- Quality-scored evidence for and against
- Constitutional and values analysis
- Stakeholder impact assessment
- Implementation gap documentation

## Integration with ISE Framework

wikiLaw is not a standalone project—it's the application of Idea Stock Exchange architecture to the legal code:

- **Structure:** Uses One Page Per Topic so debates don't fragment
- **Logic:** Uses Linkage Scores to map which laws prop up which beliefs
- **Ethos:** Embodies the MyClob pledge: No ideological ownership. Good ideas win by surviving reality.

### Related Framework Resources

- [Truth Framework](https://myclob.pbworks.com/w/page/21960078/truth) - Methods for verifying claims
- [Interests](https://myclob.pbworks.com/w/page/159301140/Interests) - Stakeholder goal analysis
- [Evidence](https://myclob.pbworks.com/w/page/159353568/Evidence) - Quality assessment of data
- [Assumptions](https://myclob.pbworks.com/Assumptions) - Identifying testable beliefs
- [Cost-Benefit Analysis](https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis) - Trade-off evaluation

## The Scalable On-Ramp

You don't need to reform the entire legal system on Day One. You need proof of concept:

1. **Pick one state** (probably yours)
2. **Pick one bad law** (you know at least three)
3. **Tag the belief** it operationalizes
4. **Add one strong Pro and one strong Con**, with evidence
5. **Propose one patch** that fixes the failure mode

Do that 50 times and you've built a reference library. Do that 500 times and you've changed what "legal reform" looks like.

## Why This Matters

The legal code stops being sacred when it becomes auditable. **wikiLaw makes it auditable.**

We replace moral theater with mechanism design. We replace tribal loyalty with consequential analysis. We turn law from priesthood to engineering.

And once you see the legal code through this lens, **you can't unsee it.** You can't go back to pretending that "criminal justice reform" or "housing affordability" are slogans instead of testable hypotheses about how humans respond to incentives.

## Contributing

This is an open platform for debugging the operating system society runs on. Contributions should maintain the core principles:

1. **No ideological litmus tests** - Good mechanisms win, regardless of tribal origin
2. **Show your work** - Claims require evidence; arguments require logic
3. **Acknowledge tradeoffs** - Every policy has costs; hiding them destroys credibility
4. **Make it falsifiable** - If you can't name what would prove you wrong, you're not making an argument

## License

This project is part of the Idea Stock Exchange and Process Party platform.

## Contact & Links

- MyClob Framework: [https://myclob.pbworks.com](https://myclob.pbworks.com)
- Process Party Platform: [MyClob Use Data Pledge](https://myclob.pbworks.com/w/page/160978236/Use%20data%20to%20drive%20collaborative%20and%20effective%20solutions%2C%20regardless%20of%20their%20ideological%20source)

---

**The Founders built a Constitution with separation of powers, checks and balances, and amendment processes because they knew humans couldn't be trusted with unchecked authority. wikiLaw applies that same institutional design philosophy to every statute in the code.**

When the operating system is transparent, the public can finally maintain it.
