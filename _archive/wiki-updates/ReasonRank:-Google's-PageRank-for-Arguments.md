# ReasonRank: Google’s PageRank for Arguments

Google’s **PageRank** measures the number and quality of links to a website to determine importance.  
However, it does **not** assess the *strength or validity* of the arguments in that content.  

**ReasonRank** adapts PageRank to a **pro/con forum**, evaluating the persuasiveness, relevance, and quality of individual arguments.

---

## How It Works
ReasonRank modifies PageRank to:
- Evaluate both **pro** and **con** arguments.
- **ADD** scores from supporting/pro arguments (like positive incoming links).
- **SUBTRACT** scores from con/weakening arguments (like negative incoming links).
- Weigh arguments by **quantity** and **quality** of their supporting or opposing reasons.
- Consider *linkage strength*, *uniqueness*, *verification*, and *logical soundness*.
- Incorporate **user feedback** (votes, credibility scores) to refine rankings over time.

### The Core Algorithm
Just as PageRank scores pages higher when they receive links from high-quality pages, **ReasonRank promotes beliefs that have:**
1. **Strong supporting arguments** (high scores that ADD to the belief's score)
2. **Weak opposing arguments** (low scores that SUBTRACT minimally from the belief's score)

**Formula:**
```
Belief Score = BaseScore + Σ(Supporting Argument Scores) - Σ(Opposing Argument Scores)
```

Where:
- `BaseScore = 50` (neutral starting point)
- Supporting argument scores are weighted by their ReasonRank and lifecycle status
- Opposing argument scores are weighted by their ReasonRank and lifecycle status
- Final score is normalized to 0-100 range

---

## Variables Needed
To implement ReasonRank, the algorithm uses:

1. **`M_pro` / `M_con`** – adjacency matrices for pro and con arguments.
2. **`M_linkage_pro` / `M_linkage_con`** – matrices for argument-to-conclusion linkage.
3. **`uniqueness_scores_pro` / `uniqueness_scores_con`** – argument uniqueness values.
4. **`initial_scores_pro` / `initial_scores_con`** – starting scores for arguments.
5. **`num_iterations`** – number of PageRank-like update cycles (default: `100`).
6. **`d`** – damping factor (default: `0.85`).
7. **`feedback_data`** – optional user feedback (votes, credibility, sentiment).

---

## Sample Code

```python
import numpy as np
import dask.array as da
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from typing import Dict, List, Optional

nlp = spacy.load("en_core_web_lg")

def reason_rank(M_pro, M_con, initial_scores, argument_texts,
                num_iterations=100, feedback_data=None, damping_factor=0.85):
    uniqueness_scores = compute_uniqueness_scores(argument_texts)
    feedback_scores = integrate_feedback(feedback_data) if feedback_data else {
        'pro': np.ones_like(initial_scores['pro']),
        'con': np.ones_like(initial_scores['con'])
    }
    scores = {'pro': initial_scores['pro'].copy(), 'con': initial_scores['con'].copy()}

    for _ in range(num_iterations):
        scores = propagate_scores(M_pro, M_con, scores, uniqueness_scores, feedback_scores, damping_factor)

    return apply_domain_specific_enhancements(scores, argument_texts)

def propagate_scores(M_pro, M_con, scores, uniqueness_scores, feedback_scores, damping_factor):
    updated_scores = {}
    for arg_type, M in [('pro', M_pro), ('con', M_con)]:
        dask_M = da.from_array(M, chunks=(1000, 1000))
        dask_scores = da.from_array(scores[arg_type] * uniqueness_scores[arg_type] * feedback_scores[arg_type], chunks=(1000,))
        updated_scores[arg_type] = da.dot(dask_M, dask_scores).compute() * damping_factor
    return updated_scores

def compute_uniqueness_scores(argument_texts):
    all_texts = argument_texts['pro'] + argument_texts['con']
    vectorizer = TfidfVectorizer().fit(all_texts)
    return {
        arg_type: 1 - vectorizer.transform(argument_texts[arg_type]).toarray().max(axis=1)
        for arg_type in ['pro', 'con']
    }

def integrate_feedback(feedback_data):
    return {
        arg_type: np.mean(feedback_data[arg_type], axis=0) if arg_type in feedback_data else np.ones(len(feedback_data[arg_type]))
        for arg_type in ['pro', 'con']
    }

def apply_domain_specific_enhancements(scores, argument_texts):
    enhanced_scores = scores.copy()
    for arg_type in ['pro', 'con']:
        for i, text in enumerate(argument_texts[arg_type]):
            doc = nlp(text)
            sentiment = doc.sentiment
            enhanced_scores[arg_type][i] *= (1 + sentiment)
    return enhanced_scores

# Example
M_pro = np.array([[0.1, 0.2], [0.2, 0.1]])
M_con = np.array([[0.1, 0.2], [0.2, 0.1]])
initial_scores = {'pro': np.array([1, 1]), 'con': np.array([1, 1])}
argument_texts = {'pro': ["Pro 1", "Pro 2"], 'con': ["Con 1", "Con 2"]}
feedback_data = {'pro': np.array([[0.9, 1.1]]), 'con': np.array([[0.8, 1.2]])}

final_scores = reason_rank(M_pro, M_con, initial_scores, argument_texts, feedback_data=feedback_data)
print("Final Scores:", final_scores)
````

---

## Why It Matters

* **Objective ranking** of arguments instead of relying on loudness or popularity.
* **Transparent scoring** – every factor in the score is visible and open to challenge.
* **Dynamic updates** – scores shift as evidence, feedback, and arguments change.

---

**See Also:**
http://myclob.pbworks.com/w/page/159300543/ReasonRank
https://en.wikipedia.org/wiki/PageRank
