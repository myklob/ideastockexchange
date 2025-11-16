# ReasonRank: Enlightenment Promotion Algorithm

The **ReasonRank** framework evaluates arguments by breaking them into components and scoring each one using specialized algorithms.  
The goal is to **tie the strength of a conclusion directly to the strength of the evidence** supporting it — and to make this process transparent by showing the math.

---

## Guiding Principles
- **"Extraordinary claims require extraordinary evidence."** – Carl Sagan  
- **"The wise man proportions his belief to the evidence."** – David Hume  
- From Aristotle to modern science, progress has relied on linking belief strength to evidence quality.  
- For the first time, we define these principles explicitly in software, enabling large-scale, simultaneous reasoning.

---

## Belief Score
The **Belief Score** is the primary output of ReasonRank.  
It continuously updates based on the performance of multiple sub-scores, including:
- Truth scores
- Linkage scores
- Equivalency scores
- Logical fallacy penalties
- Evidence verification

**Purpose:** Reflect the **current best estimate** of a belief's validity given all available arguments and evidence.

---

## Argument Ranking Algorithm
Below is a simplified Python example showing how arguments can be ranked using pro/con votes and evidence strength.

```python
def rank_arguments(arguments):
    """
    Ranks arguments based on pro/con votes and evidence strength.
    arguments: list of dicts with 'pro_votes', 'con_votes', 'evidence_strength'
    """
    for arg in arguments:
        total_votes = arg['pro_votes'] + arg['con_votes']
        if total_votes == 0:
            pro_score = con_score = 0
        else:
            pro_score = arg['pro_votes'] / total_votes
            con_score = arg['con_votes'] / total_votes

        # Strength score: assumed to be between 0 and 1
        strength_score = arg['evidence_strength']

        # Overall argument score
        arg['score'] = (pro_score - con_score) * strength_score

    # Sort arguments from strongest to weakest
    return sorted(arguments, key=lambda x: x['score'], reverse=True)
````

---

## Transparency

* Every component of the score is public and **open to challenge**.
* Users can see exactly how each argument influences the overall belief score.
* Algorithms are linked across the wiki (see sidebar) so the scoring process is auditable.

---

**See Also:**

* [[Evidence Verification Score](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/Evidence-Verification-Score-%28EVS%29)](Evidence-Verification-Score-%28EVS%29)
* [[Logical Fallacy Score](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/6897d671-d650-832b-8023-136f71fcc17f#)](#)
* [[Equivalency Score](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/Equivalency-Score)](Equivalency-Score)
* [[Evidence-to-Conclusion Linkage Score (ECLS)](https://chatgpt.com/g/g-zEqCtLTMb-idea-stock-exchange/c/Evidence-to-Conclusion-Relevance-Score)](Evidence-to-Conclusion-Relevance-Score)

