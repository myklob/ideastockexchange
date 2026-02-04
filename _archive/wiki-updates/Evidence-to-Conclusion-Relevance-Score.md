# Evidence to Conclusion Linkage Score (ECLS)

The **Evidence to Conclusion Linkage Score (ECLS)** measures how strongly a piece of evidence (argument) supports or weakens a conclusion **if assumed true**.  
It helps us:
- Allocate points between arguments proportionally.
- Avoid **false cause** fallacies and other logical errors.
- Maintain **logical consistency** in debates.

---

## Why ECLS Matters
Even a true statement may be irrelevant to a conclusion.  
Example:
- "The grass is green" → True, but has **low linkage** to a carbon tax policy.
- "Global warming is real" → High linkage to a carbon tax, **if** the tax is proven to reduce global warming.

By assigning linkage scores, we:
- Prevent irrelevant truths from dominating discussions.
- Automatically adjust conclusion strength when supporting assumptions weaken.
- Build a **coherent network of interconnected reasoning**.

---

## Formula

```

ECLS(A, B) = (Σ Strength of Reasons to Agree with Linkage)
/ (Σ Total Strength of Arguments, Agree + Disagree)

````

Where:
- **A** = Evidence
- **B** = Conclusion
- Strength is determined by performance metrics from **user-generated pro/con reasons**.

ECLS ranges from:
- **0.0** → No reasons to agree with linkage.
- **1.0** → All reasons agree with linkage (none disagree).

---

## Example Mottos
1. Making connections: Avoiding non-sequiturs with linkage scores.
2. Linkage scores: The missing link in practical reasoning.
3. Untangling ideas: Weaving a rational web.
4. Cutting causation confusion with linkage scores.
5. Bridging the gap between arguments.

---

## Algorithm

1. **Identify potential linkages**  
   - Allow users to tag one belief as a reason to support or oppose another.

2. **Assign unique IDs**  
   - Each linkage gets a unique identifier (e.g., `A_B` = Belief A supports Belief B).

3. **Collect pro/con arguments for each linkage**  
   - Users submit reasons **for** ("strengtheners") or **against** ("weakeners") the linkage.

4. **Score each reason**  
   - Use a `calculate_argument_strength()` function based on voting, credibility, and other metrics.

5. **Compute ECLS**  
   - For each linkage:  
     ```
     ECLS = (Σ Strength of Agree Reasons) / (Σ Strength of All Reasons)
     ```

6. **Apply linkage weight**  
   - Multiply each argument’s truth/relevance score by its ECLS to determine its **actual contribution** to the conclusion.

7. **Aggregate for conclusion score**  
   - Sum weighted contributions from all supporting/weakening evidence.

---

## Example Implementation (Python)

```python
# Example data
beliefs = ["Belief A", "Belief B", "Belief C"]
potential_linkages = {
    "A_B": [
        {"argument": "A is supported by strong evidence", "type": "strengthener"},
        {"argument": "A is irrelevant to B", "type": "weakener"}
    ]
}

linkage_ecls = {}

def calculate_argument_strength(arg_text):
    # Placeholder: replace with real scoring logic
    return len(arg_text) / 10  # Example: strength = length-based

for linkage, arguments in potential_linkages.items():
    agree_strength = 0
    total_strength = 0
    
    for arg in arguments:
        strength = calculate_argument_strength(arg["argument"])
        total_strength += strength
        if arg["type"] == "strengthener":
            agree_strength += strength
    
    ecls = agree_strength / total_strength if total_strength > 0 else 0
    linkage_ecls[linkage] = ecls

print("ECLS Scores:", linkage_ecls)
````

---

## How ECLS Integrates into the Platform

* Each **Belief Score** will eventually be multiplied by its ECLS when used as a reason in another debate.
* This ensures that only **relevant, well-supported linkages** significantly influence conclusions.
* ECLS acts as a **logical filter**, ensuring that reasoning chains remain coherent.

---

## Future Enhancements

* Integrate **machine learning** to detect weak/strong linkages automatically.
* Track ECLS over time to monitor **debate stability**.
* Visualize argument linkages with **graph networks** for better navigation.
