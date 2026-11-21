## The Likelihood Score: Calibrated Probability for [Cost-Benefit Analysis](http://myclob.pbworks.com/w/page/163167864/)

In the Idea Stock Exchange, a **Likelihood Score** is not a subjective guess, a slider, or a gut feeling. It is a **nested belief** that must earn its probability through structured reasoning.

In any Cost-Benefit Analysis (CBA), the final contribution of a line item is its **Expected Value**:

For example, a predicted benefit of **$1,000,000** with a **50%** Likelihood Score contributes exactly **$500,000** to the final decision. A catastrophic risk of **$10M** with a **10%** likelihood subtracts **$1M**. This ensures that high-impact but low-probability outcomes do not distort the analysis, and that uncertainty is accounted for mathematically.

---

### How the Score is Generated: A Competition of Reasons

A Likelihood Score is derived from a transparent competition between arguments using [ReasonRank](https://github.com/myklob/ideastockexchange/wiki). The system does not ask users to "vote" on a probability; it asks them to **argue** for one.

1. **The Likelihood is a "Conclusion"**
* When a user adds a cost or benefit (e.g., "This project will save $1M"), they are implicitly making a second claim: *"There is an X% chance this will happen."* This probability claim becomes a nested belief node [with its own page](http://myclob.pbworks.com/w/page/163167864/). Multiple competing estimates (e.g., "30%", "50, 60%", "90%+") can coexist and compete for dominance.


2. **Arguments Build the Score (The Tree)**
* Users and AI agents submit pro/con arguments that branch into further sub-arguments, forming a recursive "argument tree" for each proposed likelihood. A high score requires strong supporting arguments and weak opposing ones.
* High-quality arguments typically appeal to **Reference Class Forecasting** and related super-forecasting techniques. For example:
* **Base Rates:** "In 100 similar bridge projects, 60% went over budget."
* **Historical Data:** "When inflation exceeds 5%, this asset class drops in value 80% of the time."
* **Falsifiable Assumptions:** "This outcome assumes the law passes: currently, it has only 30% polling support."




3. **ReasonRank Scoring**
* The system scores every argument and sub-argument using three recursive metrics:
* **[Truth](http://myclob.pbworks.com/w/page/163167864/)**: Is the underlying evidence factually accurate?
* **[Linkage](http://myclob.pbworks.com/w/page/163167864/)**: How strongly does this reasoning connect to *this specific* prediction? (e.g., A weak analogy like "twice the size = twice the cost" has low linkage if data shows non-linear scaling.)
* **[Importance](http://myclob.pbworks.com/w/page/163167864/)**: How much does this argument move the probability?




4. **The "Winning" Likelihood**
* The Likelihood Score is **not an average** and **not a vote**. It is the specific probability (or range) supported by the **strongest surviving argument tree**.
* If arguments for a "90% likelihood" rely on wishful thinking (low Truth/Linkage), that score decays.
* If arguments for a "50% likelihood" are backed by solid reference classes and survive scrutiny, **50% becomes the active Likelihood Score**.



---

### Why This Matters

* **Combats [Optimism Bias](http://myclob.pbworks.com/w/page/163167864/):** Proponents cannot just claim a "Best Case Scenario." They must build a surviving argument tree justifying why that outcome is *probable*.
* **Standardizes Comparisons:** A 10% chance of $10M and a 100% chance of $1M are treated as equal expected value ($1M).
* **Rejects Intuition:** To reject this method is to claim that human intuition handles complexity better than mathematical expected value; a claim that is demonstrably false.

> **The Blunt Rule:** Impacts do not count unless their probabilities survive attack.

---

Would you like me to create a draft for the **Linkage Score** page that specifically defines how we score non-linear scaling in these models?
