A **systematic, discourse-driven platform** for resolving disputes — inspired by Wikipedia’s collaborative editing model but designed for **structured, evidence-based decision-making**.

This platform:
- Lets anyone participate in conflict resolution.
- Ranks solutions based on evidence, not popularity.
- Updates conclusions dynamically when new evidence appears.

---

## How It Works
The platform applies:
- **Conflict resolution principles** from *Getting to Yes* (Harvard Negotiation Project).
- **Collective intelligence methods** (not AI hype).
- **Google’s PageRank algorithm** — adapted to evaluate arguments and solutions.

When a belief changes, all dependent conclusions are **automatically recalculated** based on the latest and strongest evidence.

---

## Why It Matters
Current online discourse (Twitter, Facebook, YouTube, etc.) is optimized for:
- Emotion over reason.
- Engagement over accuracy.
- Echo chambers over open-minded dialogue.

Our approach flips that:
- Structure > chaos.
- Evidence > emotion.
- Shared truth > tribal loyalty.

---

## Conflict Resolution Methods Implemented
1. [Separate the people from the problem](#separate-people-from-the-problem)
2. [Insist on using objective criteria](https://sites.google.com/d/1f62q1ZSjo3Kcb7Pj5OHCNTEfaacTWuKD/p/1QKE1_z4d58ZPVSvfHYdpkiPszBPG8Ukz/edit)
3. [Focus on interests, not positions](#focus-on-interests-not-positions)
4. [Invent options for mutual gain](https://sites.google.com/d/1f62q1ZSjo3Kcb7Pj5OHCNTEfaacTWuKD/p/1tS20NXnxbYfYHfhoNZSAnStyGW4La__U/edit)

---

## Separate People from the Problem
### Why?
Political conversations often get personal fast. People side with “their team” rather than engage with the actual issue. This platform:
- **Strips out personalities** and focuses only on claims and evidence.
- Uses **argument analysis algorithms** (NLP, logic scoring, machine learning) to break debates into components.
- **Shows the math** behind conclusions so bias and hidden agendas are exposed.

Think of it like replaying a controversial referee call — everyone sees the evidence, frame by frame.

### How?
We use:
1. **Preprocessing** — Remove noise (emojis, URLs, etc.).
2. **Topic Modeling** — Group arguments by issue, not person.
3. **Sentiment Analysis** — Flag emotional attacks.
4. **Entity Recognition** — Detect when people are mentioned rather than the issue.
5. **Argument Consistency Tracking** — Show when someone uses a principle inconsistently.
6. **Anonymization** — Hide author identity during analysis.
7. **Ranking** — Prioritize logic and evidence over personalities.
8. **Continuous Learning** — Algorithms improve based on feedback.

<details>
<summary>Example Python Snippet</summary>

```python
import re
import spacy
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from textblob import TextBlob

nlp = spacy.load("en_core_web_sm")

def preprocess(text):
    return re.sub(r'http\S+|www.\S+|@\S+|[^A-Za-z0-9\s]+', '', text).lower()

def topic_modeling(corpus):
    vec = CountVectorizer()
    data = vec.fit_transform(corpus)
    lda = LatentDirichletAllocation(n_components=5)
    lda.fit(data)
    return lda, vec

def sentiment(text):
    return TextBlob(text).sentiment.polarity

comments = [
    "This policy is a disaster for our economy.",
    "The policy is terrible, just like the person who proposed it!",
    "We need to focus on education and healthcare.",
]

cleaned = [preprocess(c) for c in comments]
lda, vec = topic_modeling(cleaned)

for c in cleaned:
    if sentiment(c) > -0.5:
        print(c)
````

</details>

---

## Focus on Interests, Not Positions

### Why?

When people lock into a “position” (e.g., “Build the wall”), they:

* Stop considering alternatives.
* Seek to “win” rather than solve.
* Ignore creative, mutually beneficial solutions.

Instead, **interests** look at *why* someone holds a view — the underlying values and needs.
Focusing here leads to more solutions both sides can live with.

### How?

1. **Identify values/interests** tied to each argument.
2. **Encourage submissions** of potential motives from participants.
3. **Reward agreement/disagreement analysis** of those motives.
4. **Use scoring algorithms** (ReasonRank, Linkage Scores, Truth Scores) to weigh them.
5. **Classify motives** (e.g., Maslow’s needs).
6. **Rank importance** relative to other motives.
7. **Produce Interest Attribution Confidence Intervals (IACI)** and **Interest Validity Scores (IVS)**.

<details>
<summary>Code Outline</summary>

```python
def evaluate_arguments(arguments):
    # Placeholder for scoring logic
    return sum(a.importance for a in arguments) / len(arguments)

def identify_interests(arguments):
    return [a.interest for a in arguments]

# Example usage
arguments = [{"importance": 0.8, "interest": "security"},
             {"importance": 0.6, "interest": "economic stability"}]

score = evaluate_arguments(arguments)
interests = identify_interests(arguments)

print(score, interests)
```

</details>

---

## The Goal

A web platform where:

* **Every belief has a structured page** with pros/cons ranked by strength.
* **Conflicts are resolved in public** using evidence and reason.
* **Policies are chosen based on merit**, not party loyalty.

This is **conflict resolution as public infrastructure** — a truth engine for democracy.