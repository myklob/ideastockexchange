# wikiLaw: Evidence-Based Legal Analysis

wikiLaw is an application built on the Idea Stock Exchange platform for analyzing legislation and legal documents using structured, evidence-based methods.

---

## Overview

wikiLaw applies the Idea Stock Exchange's analytical framework to decode laws, identify assumptions, audit evidence claims, and track stakeholder impacts. The goal is to make legislation **transparent, testable, and improvable**.

### Core Philosophy

Traditional legal analysis focuses on interpretation and precedent. wikiLaw adds:

1. **Plain-English Decoding** - Simplify complex legal language
2. **Assumption Extraction** - Identify implicit beliefs embedded in laws
3. **Evidence Auditing** - Test mechanistic claims against research
4. **Stakeholder Ledgers** - Track who benefits and who is harmed
5. **Purpose Auditing** - Compare stated intent vs. operative effects

---

## Key Features

### 1. Diagnostic Sections

Laws are analyzed using structured diagnostic templates that organize issues into severity categories:

**Severity Levels:**
- 🔴 **Critical** - Fatal flaws requiring immediate attention
- 🟡 **Moderate** - Significant issues that should be addressed
- 🟢 **Minor** - Improvements that enhance quality

**Diagnostic Categories:**
- **Assumption Errors** - Testable beliefs contradicted by evidence
- **Mechanistic Claims** - Causal predictions without support
- **Contradictions** - Internal inconsistencies
- **Ambiguities** - Vague or unclear language
- **Unintended Consequences** - Overlooked effects
- **Stakeholder Impacts** - Who wins and loses

### 2. Plain-English Decoding

Complex legal language is translated into clear, accessible explanations:

**Before (Legal Text):**
> "Notwithstanding any other provision of law, the Secretary shall, in consultation with relevant stakeholders and subject to the availability of appropriations, establish a program to provide technical assistance..."

**After (Plain English):**
> The agency must create a help program if Congress provides funding, after talking to affected groups.

**Decoding Principles:**
- Remove jargon and legalese
- Break complex sentences into simple statements
- Identify conditional logic (if X, then Y)
- Highlight discretionary vs. mandatory actions
- Call out vague terms that allow wiggle room

### 3. Assumption Cards

Every law rests on implicit assumptions about how the world works. wikiLaw extracts and tests these:

**Example: Minimum Wage Law**

**Assumption:** "Raising the minimum wage will not significantly reduce employment"

**Evidence Quality:** 🟡 Moderate (Mixed research)

**Key Evidence:**
- ✅ Card & Krueger (1994): No job loss in fast food
- ❌ CBO (2021): Moderate employment reduction predicted
- ⚖️ Meta-analysis: Small negative effects in some sectors

**Testability:** High - Can measure employment changes
**Centrality:** Critical - If false, undermines entire policy

### 4. Evidence Audits

Laws often include mechanistic claims about cause-and-effect. wikiLaw tracks and verifies these:

**Claim Types:**
1. **Causal Claims** - "X will cause Y"
2. **Empirical Claims** - "X percent of people do Y"
3. **Predictive Claims** - "This will happen by year Z"
4. **Comparative Claims** - "Our approach works better than alternatives"

**Evidence Quality Tiers:**
- ⭐⭐⭐⭐⭐ Peer-reviewed systematic reviews/meta-analyses
- ⭐⭐⭐⭐ Peer-reviewed experimental studies
- ⭐⭐⭐ Observational studies with controls
- ⭐⭐ Expert opinions from credentialed sources
- ⭐ Anecdotes, speculation, or no evidence

**Example Audit:**

```
Legislative Text: "This program will reduce recidivism by 30%"

Evidence Audit:
├─ Evidence Quality: ⭐⭐ (Expert opinion only)
├─ Supporting Research: None cited
├─ Similar Programs: Mixed results (10-40% reduction)
├─ Risk Assessment: HIGH - No pilot data
└─ Recommendation: Require pilot program before full rollout
```

### 5. Stakeholder Ledgers

Track how laws affect different groups:

**Example: Tax Credit for Electric Vehicles**

| Stakeholder | Impact | Magnitude | Evidence |
|-------------|--------|-----------|----------|
| EV buyers | ✅ Benefit | $7,500/vehicle | Direct transfer |
| Taxpayers | ❌ Cost | $7.5B/year | Treasury estimate |
| Auto workers | ⚖️ Mixed | Unknown | Depends on domestic production |
| Oil companies | ❌ Harm | Reduced demand | Industry projections |
| Climate | ✅ Benefit | CO2 reduction | EPA modeling |

**Distributional Analysis:**
- Who pays? (Income level, geography, industry)
- Who benefits? (Direct vs. indirect)
- Net social welfare change
- Equity implications

### 6. Purpose Auditing

Compare what a law *says* it does vs. what it *actually* does:

**Example: "Affordable Housing Act"**

**Stated Purpose:**
> "Increase affordable housing availability for low-income families"

**Operative Mechanism:**
> Tax credits for developers building "affordable" units (80% of area median income)

**Purpose Gap:**
- ❌ 80% AMI ≠ "low-income" in most areas
- ❌ Tax credits benefit developers, not renters directly
- ❌ No rent control or tenant protections
- ⚠️ May accelerate gentrification

**Verdict:** Law may increase housing supply but **likely won't help target population** (low-income families). Name misleading.

### 7. Law Proposals (Version Control)

Suggest improvements to existing laws with full justification:

**Structure:**
```markdown
## Proposed Amendment: [Bill Name]

### Current Text
[Original language]

### Proposed Text
[New language]

### Justification
- Problem: [What's wrong with current version]
- Evidence: [Research supporting change]
- Expected Impact: [How this improves outcomes]
- Trade-offs: [Costs or downsides]

### Stakeholder Analysis
[Who supports/opposes and why]
```

**Versioning:**
- Track all proposed changes
- Community voting on amendments
- Evidence-based prioritization
- Implementation tracking

---

## Implementation

### Data Model

wikiLaw uses specialized types extending the Idea Stock Exchange core:

**Core Types (from ISE):**
```typescript
interface Evidence {
  content: string;
  quality: EvidenceQuality; // PEER_REVIEWED, STUDY, etc.
  source: string;
  year?: number;
  credibility: number; // 0-10
}

interface Assumption {
  content: string;
  testable: boolean;
  centrality: number; // How critical to the law
  evidenceQuality: EvidenceQuality;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
}

interface Interest {
  stakeholder: string;
  impact: 'BENEFIT' | 'HARM' | 'MIXED';
  magnitude: number; // -10 to 10
  evidence: Evidence[];
}

interface LinkageScore {
  relevance: number; // 0-10
  strength: number; // 0-10
  confidence: number; // 0-1
}
```

**wikiLaw-Specific Types:**
```typescript
interface Law {
  id: string;
  title: string;
  jurisdiction: string;
  yearEnacted: number;
  fullText: string;
  plainEnglishSummary: string;
  documentHierarchy: DocumentSection[];
  assumptions: Assumption[];
  mechanisticClaims: MechanisticClaim[];
  stakeholders: Interest[];
  diagnostics: Diagnostic[];
}

interface DocumentSection {
  id: string;
  type: 'TITLE' | 'SECTION' | 'SUBSECTION' | 'PARAGRAPH';
  number: string;
  heading?: string;
  text: string;
  plainEnglish?: string;
  children: DocumentSection[];
}

interface MechanisticClaim {
  id: string;
  claim: string;
  claimType: 'CAUSAL' | 'EMPIRICAL' | 'PREDICTIVE' | 'COMPARATIVE';
  evidence: Evidence[];
  evidenceQuality: EvidenceQuality;
  testable: boolean;
  tested: boolean;
  result?: 'SUPPORTED' | 'REFUTED' | 'MIXED';
}

interface Diagnostic {
  id: string;
  category: 'ASSUMPTION_ERROR' | 'CONTRADICTION' | 'AMBIGUITY' | 'UNINTENDED_CONSEQUENCE';
  severity: 'CRITICAL' | 'MODERATE' | 'MINOR';
  description: string;
  evidence: Evidence[];
  suggestedFix?: string;
}
```

### React Components

**DiagnosticSection.tsx**
Displays organized lists of issues by severity:

```tsx
<DiagnosticSection
  title="Critical Issues"
  severity="critical"
  issues={criticalIssues}
  expanded={true}
/>
```

**AssumptionCard.tsx**
Shows individual assumptions with evidence:

```tsx
<AssumptionCard
  assumption="Raising minimum wage won't reduce employment"
  testable={true}
  centrality={0.9}
  evidenceQuality="MODERATE"
  supportingEvidence={[...]}
  contradictingEvidence={[...]}
/>
```

**EvidenceCard.tsx**
Displays evidence with quality scoring:

```tsx
<EvidenceCard
  title="Meta-analysis of minimum wage effects"
  quality="PEER_REVIEWED"
  credibility={9}
  source="Dube (2019)"
  year={2019}
  summary="Small negative employment effects in some sectors"
/>
```

### Pages

**Law Detail Page:** `/app/law/[id]/page.tsx`

Comprehensive law analysis with:
- Plain-English summary
- Hierarchical document navigation
- Diagnostic sections (critical/moderate/minor issues)
- Assumption cards
- Stakeholder ledger
- Evidence audit
- Proposed amendments

**Topics Page:** `/app/topics/page.tsx`

Browse laws by topic/category with overlap scoring.

### API Endpoints

**GET `/api/laws`** - List laws with filtering
**GET `/api/laws/:id`** - Full law analysis
**POST `/api/laws/:id/assumptions`** - Add assumption
**POST `/api/laws/:id/evidence`** - Submit evidence
**POST `/api/laws/:id/amendments`** - Propose changes
**GET `/api/laws/:id/stakeholders`** - Stakeholder analysis

---

## Example: Analyzing a Real Law

### Clean Air Act Section 111(d)

**Plain-English Summary:**
> EPA must regulate greenhouse gas emissions from existing power plants by setting state-specific targets.

**Key Assumptions:**

1. **"States can achieve emission reductions cost-effectively"**
   - Testability: ✅ High
   - Evidence Quality: 🟢 Good (Multiple state programs)
   - Centrality: 🔴 Critical

2. **"EPA can determine 'best system of emission reduction'"**
   - Testability: ⚠️ Moderate (Depends on court interpretation)
   - Evidence Quality: 🟡 Mixed (Legal precedents vary)
   - Centrality: 🔴 Critical

**Mechanistic Claims:**

**Claim:** "Regulation will reduce CO2 emissions by 32% by 2030"
- Evidence Quality: ⭐⭐⭐⭐ (EPA modeling)
- Tested: Yes
- Result: ⚖️ Mixed (Repealed before full implementation)

**Stakeholder Ledger:**

| Stakeholder | Impact | Magnitude | Evidence |
|-------------|--------|-----------|----------|
| Coal industry | ❌ Major harm | -$8B revenue | Industry analysis |
| Natural gas | ✅ Benefit | +15% demand | Market projections |
| Public health | ✅ Benefit | 3,600 lives saved/yr | EPA health analysis |
| Ratepayers | ⚖️ Mixed | +$2-3/month | Utility estimates |

**Diagnostics:**

🔴 **Critical: Legal Ambiguity**
- Issue: "Best system" undefined, led to Supreme Court challenge
- Evidence: West Virginia v. EPA (2022) limited EPA authority
- Fix: Congressional clarification needed

🟡 **Moderate: Economic Assumptions**
- Issue: Cost projections assume stable natural gas prices
- Evidence: Prices highly volatile (2020-2022 spike)
- Fix: Include price sensitivity analysis

---

## Use Cases

### 1. Legislative Transparency
- Citizens can understand what laws actually do
- Journalists can fact-check legislative claims
- Researchers can evaluate policy effectiveness

### 2. Evidence-Based Policymaking
- Legislators can identify assumptions needing research
- Agencies can audit their own rulemakings
- Advocates can propose evidence-based amendments

### 3. Legal Education
- Law students learn to identify assumptions
- Teach critical analysis of legislative language
- Demonstrate real-world policy impacts

### 4. Litigation Support
- Identify weak evidentiary foundations
- Challenge faulty mechanistic claims
- Document legislative intent vs. outcome

---

## Design Principles

### 1. No Editorializing
- Present evidence neutrally
- Show both supporting and contradicting research
- Let users draw own conclusions

### 2. Testability Focus
- Prioritize claims that can be empirically verified
- Track predictions and outcomes
- Build feedback loops for continuous improvement

### 3. Stakeholder Neutrality
- Document all affected parties
- Don't privilege any interest group
- Make trade-offs explicit

### 4. Version Control
- Track all changes to laws
- Preserve historical analysis
- Enable comparative analysis over time

### 5. Hierarchical Organization
- Laws → Sections → Assumptions → Evidence
- Each level independently verifiable
- Drill down for detail, zoom out for overview

---

## Roadmap

### Current Features (Implemented)
- ✅ Plain-English decoding
- ✅ Assumption extraction
- ✅ Evidence cards with quality scoring
- ✅ Diagnostic sections by severity
- ✅ Document hierarchy navigation
- ✅ React components (AssumptionCard, EvidenceCard, DiagnosticSection)

### In Development
- 🚧 Stakeholder ledger visualization
- 🚧 Purpose auditing framework
- 🚧 Amendment proposal system
- 🚧 Comparative law analysis
- 🚧 Prediction tracking

### Planned Features
- 📋 AI-assisted assumption extraction
- 📋 Automated evidence discovery
- 📋 Real-time legislative tracking
- 📋 Impact simulation modeling
- 📋 Cross-jurisdiction comparison
- 📋 Expert review system
- 📋 Public comment integration

---

## Technical Stack

**Frontend:**
- Next.js 16 pages under `/app/law/`
- React 19 components in `/components/wikilaw/`
- Tailwind CSS for styling
- TypeScript for type safety

**Backend:**
- Express.js API endpoints under `/api/laws/`
- PostgreSQL database (Law, Assumption, Evidence tables)
- Prisma ORM
- Zod validation

**Data Sources:**
- Congress.gov API
- Federal Register API
- State legislative databases
- Research paper APIs (Semantic Scholar, etc.)

---

## Contributing

### Adding Law Analyses

1. **Find the law** - Full text from official source
2. **Write plain-English summary** - Clear, concise explanation
3. **Extract assumptions** - What must be true for this to work?
4. **Find evidence** - Research supporting/contradicting each assumption
5. **Score quality** - Rate evidence on quality tiers
6. **Identify stakeholders** - Who benefits? Who is harmed?
7. **Create diagnostics** - Flag issues by severity

### Evidence Standards

**Required for each claim:**
- Source (author, title, year)
- Quality tier (peer-reviewed, study, opinion, etc.)
- Credibility score (0-10)
- Summary of relevant findings
- Link to full source

**Prefer:**
- Peer-reviewed research over opinion
- Recent studies over old
- Systematic reviews over single studies
- Experimental over observational
- Replicated findings over one-offs

---

## Example Law Analyses

Browse existing wikiLaw analyses:
- [Affordable Care Act - Individual Mandate](../wiki/wikiLaw-Example-ACA)
- [Dodd-Frank Wall Street Reform](../wiki/wikiLaw-Example-Dodd-Frank)
- [Clean Air Act Section 111(d)](../wiki/wikiLaw-Example-Clean-Air)

---

## Resources

- [wikiLaw Component Documentation](Frontend-Architecture#wikilaw-components)
- [Law Analysis Template](https://github.com/myklob/ideastockexchange/tree/main/templates/law-analysis-template.md)
- [Evidence Quality Standards](Evidence-Verification-Score-(EVS))
- [ISE Core Types](Architecture-Overview#type-system)

---

**wikiLaw transforms legal analysis from interpretation to empirical investigation** — making laws testable, stakeholders visible, and improvements systematic.
