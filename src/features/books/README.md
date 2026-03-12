# Book Analysis Feature

Structured analysis of claims made by books. Each book is decomposed into testable propositions scored across four dimensions.

## What This Module Does

- Provides services for loading and analyzing book data.
- Identifies logical battlegrounds (claims where books make falsifiable assertions).
- Scores book arguments using a 4D framework.

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Centrality** | How central a claim is to the book's thesis (thesis, supporting, tangential, footnote). |
| **Fallacy Detection** | Identifies 10 types of logical fallacies within book arguments. |
| **Evidence Tiers** | T1 (peer-reviewed) through T4 (opinion/anecdote). |
| **4D Scoring** | Logical Validity, Quality, Topic Overlap, Reach Weight. |

## Folder Structure

```
books/
  services/       Book loading, analysis generation, and logic battleground identification
```
