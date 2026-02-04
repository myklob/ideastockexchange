# Evidence Verification Score (EVS)

The **Evidence Verification Score (EVS)** measures the degree to which a belief is supported by reliable, independent, and high-quality evidence.  
It incorporates:
- Independence and quality of sources
- Replication consistency
- Relevance of evidence to the conclusion

---

## 1. Purpose
The EVS ensures that conclusions are backed by **verified** evidence, reducing reliance on weak or biased sources.  
This score is essential for:
- Ranking beliefs based on their evidentiary strength
- Encouraging higher-quality research and references
- Making transparent, data-driven decisions

---

## 2. Core Components

### 2.1 Evidence Source Independence Weighting (ESIW)
Weights evidence types based on **independence** and **reliability**.

| Rank | Evidence Type | Weight |
|------|---------------|--------|
| 1 | Statistics & Data (with sources) | 0.90 |
| 2 | Formal Scientific Studies – RCTs, Meta-analyses | 0.85–0.80 |
| 3 | Observational & Correlational Studies | 0.75 |
| 4 | Historical Trends (with references) | 0.70 |
| 5 | Expert Testimony (with supporting data) | 0.65 |
| 6 | Expert & Social Media Claims | 0.60 |
| 7 | Personal Experience / Anecdotes | 0.55 |
| 8 | Common Sense / Logic | 0.50 |
| 9 | Analogies / Metaphors | 0.45 |
| 10 | Cultural Norms | 0.40 |
| 11 | Intuition / Gut Feeling | 0.35 |
| 12 | News & Media Reports | 0.30 |
| 13 | Surveys & Polls | 0.25 |
| 14 | Eyewitness Testimony | 0.20 |
| 15 | Visual Evidence | 0.15 |
| 16 | Historical Artifacts | 0.10 |

The category choice for each piece of evidence is **debated in pro/con form** with voting to ensure accuracy.

---

### 2.2 Evidence Replication Quantity (ERQ)
Number of **independent replications** of a study or finding.

---

### 2.3 Evidence Replication Percentage (ERP)
Percentage of replications producing **consistent results**.

---

### 2.4 Evidence-to-Conclusion Relevance Score (ECRS)
Measures how strongly the evidence **directly supports or weakens** a belief’s conclusion.  
For example:
- High ECRS → Evidence would likely confirm the conclusion if infinitely replicated under ideal conditions.
- Low ECRS → Evidence may be true but is **not directly relevant**.

---

## 3. Calculation Formula

```

EVS(evidence) = ESIW × ECRS × ERQ × (ERP / 100)

````

Where:
- **ESIW** = Evidence category weight (independence/quality)
- **ECRS** = Relevance score from pro/con performance
- **ERQ** = Number of replications
- **ERP** = Replication success rate (%)

The **Overall EVS** for a belief is the sum of EVS scores across all its evidence.

---

## 4. Example Python Implementation

```python
# Example: Evidence category weights
evidence_categories = {
    "statistics_and_data": 0.9,
    "formal_scientific_studies_randomized_controlled_trials": 0.85,
    "formal_scientific_studies_meta_analysis": 0.8
}

# Example replication and relevance data
evidence_data = {
    "study_1": {"category": "statistics_and_data", "erq": 5, "erp": 90, "ecrs": 0.8},
    "study_2": {"category": "formal_scientific_studies_randomized_controlled_trials", "erq": 10, "erp": 95, "ecrs": 0.9},
    "study_3": {"category": "formal_scientific_studies_meta_analysis", "erq": 3, "erp": 85, "ecrs": 0.7}
}

# Calculate EVS per evidence
evidence_evs = {}
for study, details in evidence_data.items():
    esiw = evidence_categories[details["category"]]
    evs = esiw * details["ecrs"] * details["erq"] * (details["erp"] / 100)
    evidence_evs[study] = evs

# Overall EVS for the belief
belief_evs = sum(evidence_evs.values())

print("EVS per study:", evidence_evs)
print("Overall EVS for belief:", belief_evs)
````

---

## 5. Transparency Commitment

* All EVS calculations will be **publicly visible**.
* All category assignments and scoring decisions will be **open to community review**.
* Users can challenge evidence classification via the **debate system**.

---

## 6. Benefits

* Encourages **higher-quality evidence**
* Rewards **replication and consistency**
* Reduces **bias from anecdotal or low-quality sources**
* Improves **debate fairness and accuracy**

