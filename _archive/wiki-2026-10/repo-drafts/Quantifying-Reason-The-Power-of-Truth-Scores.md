# Quantifying Reason: The Power of Truth Scores

Welcome to a new approach to argument evaluation — directly integrating two key metrics:

1. **[Logical Fallacy Score](https://sites.google.com/d/1f62q1ZSjo3Kcb7Pj5OHCNTEfaacTWuKD/p/14XmYT4seJJsG8a0v-E4MI3GiGNJk57s2/edit)** – Measures the relative performance of pro/con sub-arguments on whether an argument uses logical fallacies.
2. **[Evidence Verification Score](https://sites.google.com/d/1f62q1ZSjo3Kcb7Pj5OHCNTEfaacTWuKD/p/1Q6VmxCxMqRCIUhp4ErrI4txKeacq88AK/edit)** – Measures the degree of independent corroboration for a belief (e.g., blind studies, replication rates, scenario similarity).

Together, these scores strengthen our ability to tie belief strength to evidence quality, fostering more accurate, rational, and transparent discourse.

---

## Why This Matters
- **Logical integrity:** Detect and score fallacious reasoning.
- **Empirical validation:** Quantify verification from independent evidence.
- **Better decisions:** Connect belief strength directly to evidence strength.
- **Scalable system:** Machine learning + human input + transparent scoring.

---

## Common Logical Fallacies We Track
- **Ad hominem** – Attacking the person instead of the argument.
- **Appeal to authority** – Citing authority without supporting evidence.
- **Red herring** – Distracting from the issue with irrelevant points.
- **False cause** – Assuming causation from sequence or correlation.

By identifying these, we help prevent **non-sequiturs** and flawed reasoning from distorting conclusions.

---

## Algorithm Outline
1. Identify a set of common logical fallacies.
2. Allow users to **flag** arguments containing them.
3. Enable pro/con reasoning on whether a fallacy is truly present.
4. Use **semantic equivalency scores** to auto-flag similar arguments.
5. Develop ML algorithms to detect fallacy patterns in text.
6. Score flagged arguments based on:
   - Performance of pro/con sub-arguments.
   - Confidence intervals for detection accuracy.

---

## Role in the Larger System
The Logical Fallacy Score is **one of many algorithms** used in the Idea Stock Exchange:
- Works alongside **Equivalency Scores** to group similar arguments.
- Adjusts overall **Belief Scores** by reducing weight for fallacious reasoning.
- Tracks confidence over time, similar to stock price charts.

---

## Path Forward
- **Large, diverse dataset** – Examples of fallacies across domains and media types.
- **Domain-specific knowledge** – Tailor detection to fields like politics or science.
- **Human feedback loop** – Correct false positives and refine detection.
- **Continual improvement** – Regularly retrain algorithms on updated data.

---

## Code Reference
See the latest examples here:  
[GitHub Wiki – Logical Fallacy Score](https://github.com/myklob/ideastockexchange/wiki#logical-fallacy-score)

---

## Alternate Explanation
Think of the **Logical Fallacy Score** as:
- A **confidence meter** for whether an argument depends on flawed logic.
- Combining an **Argument Importance Score** with the likelihood it hinges on minor, moderate, or major fallacies.
- A tool to **reduce misinformation risk** by making weaknesses in reasoning transparent.

Low score → Argument likely stands without fallacies.  
High score → Argument likely relies on flawed reasoning.

---

**In summary:**  
By integrating logical fallacy detection with evidence verification, we create a transparent, data-driven way to evaluate arguments and beliefs. This supports **critical thinking**, strengthens evidence-based decisions, and improves the quality of public discourse.

