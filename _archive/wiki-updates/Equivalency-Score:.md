# Equivalency Score

The **Equivalency Score (ES)** measures how similar two arguments or beliefs are.  
It’s determined by combining:
- **Computer-generated analysis** (semantic similarity + machine learning).
- **User-generated evaluation** (pro/con reasoning and voting).
- **Performance weighting** from **Validity Comparison Arguments (VCA)**.

This creates a **dynamic, evolving score**, much like how stock prices reflect changing market sentiment over time.

---

## How It Works

### 1. Computer-Generated Equivalency Score (CES)
The CES is calculated using:
- **Semantic Similarity Metrics (SSM)** — comparing meaning and structure.
- **Machine Learning Algorithms** — trained to recognize when two statements mean the same thing.

Example:  
"Carbon emissions cause climate change" and "Climate change is driven by greenhouse gases" may receive a high CES.

---

### 2. User-Generated Equivalency Score (UES)
Users contribute by:
- Submitting **reasons** why two arguments are equivalent (or why one is superior).
- Voting **up or down** on those reasons.
- Engaging in **pro/con debates** about the equivalence claim.

The **UES** reflects community consensus, updated continuously as new reasoning emerges.

---

### 3. Validity Comparison Argument (VCA)
The VCA decides **how much weight** to give CES vs. UES.  
- If users demonstrate that CES is more accurate, the CES weight increases.
- If the UES consistently produces better results, its weight grows.

Mathematically:

```

ES(A,B) = w\_ces \* CES(A,B) + w\_ues \* UES(A,B)

````
Where:
- `w_ces` + `w_ues` = 1  
- `w_ces` and `w_ues` are set based on **VCA results**.

---

## Example: Semantic Similarity Metric (SSM)

We can use [spaCy](https://spacy.io/) to generate document vectors and compute cosine similarity.

```python
import spacy

# Load English language model
nlp = spacy.load("en_core_web_md")

def ssm_score(statement1, statement2):
    """
    Calculates semantic similarity between two statements.
    Returns a float between 0 (no similarity) and 1 (identical meaning).
    """
    doc1 = nlp(statement1)
    doc2 = nlp(statement2)
    return doc1.similarity(doc2)
````

---

## Example: Full Equivalency Score Calculation

```python
def equivalency_score(statement1, statement2, user_scores, vca_multiplier=0.8):
    """
    Calculates the overall Equivalency Score between two statements.

    statement1, statement2: str
    user_scores: list of floats from community ratings
    vca_multiplier: weight given to user-generated score based on VCA results
    """
    # Step 1: Calculate computer-generated score
    ssm = ssm_score(statement1, statement2)
    
    # Step 2: Calculate user-generated score (average of votes)
    user_score = sum(user_scores) / len(user_scores) if user_scores else 0
    
    # Step 3: Combine scores based on VCA weight
    final_score = (ssm * (1 - vca_multiplier)) + (user_score * vca_multiplier)
    
    return final_score
```

---

## Why It Matters

The Equivalency Score:

* **Reduces redundancy** by detecting when two arguments are effectively the same.
* **Links reasoning** so evidence supporting one claim automatically supports others.
* **Improves debate quality** by merging duplicate points and focusing on unique reasoning.
* **Tracks confidence over time**, just like financial markets track stock performance.

---

## Future Improvements

* Refine machine learning models using debate platform history.
* Improve VCA tracking to adjust weights in real time.
* Use argument graphs to propagate equivalency relationships across related debates.

