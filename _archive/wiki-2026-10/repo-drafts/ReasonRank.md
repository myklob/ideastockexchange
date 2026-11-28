Home > Page Design > ReasonRank



ReasonRank: The PageRank for Arguments
ReasonRank is a network-based scoring algorithm designed to measure the strength of a belief based on the quality of its supporting arguments, rather than its popularity. Just as Google's PageRank revolutionized the web by treating hyperlinks as "votes" for importance, ReasonRank treats logical arguments as votes for a belief's validity.

The Problem vs. The Solution
Current Online Debates	The ReasonRank Solution
Volume over Quality: The most frequent or loudest comments win, not the most truthful.	Meritocracy of Ideas: Logic and verified evidence determine the score, not "likes" or post frequency.
Echo Chambers: Algorithms optimize for engagement and outrage, not objective understanding.	Trust Graph: Mathematical weighting of connections ensures only sound reasoning moves the needle.
Information Amnesia: Debates "reset" constantly; we rarely build on previously established conclusions.	Institutional Memory: Every topic has one permanent page that grows in accuracy over time.


How ReasonRank Compares to PageRank
ReasonRank applies graph theory to logic. It functions within a network where every claim is a node and every reason is a weighted link.

Feature	Google PageRank	ISE ReasonRank
The Node	A webpage	A belief or argument
The Connection	A hyperlink	A "reason to agree" or "reason to disagree"
The Weight	Domain authority (traffic/trust)	Truth score (verified evidence and logic)
Propagation	"Link Juice" flows to important pages	"Logic Strength" flows to valid conclusions
Spam Filter	Filters link farms/spam sites	Filters redundancy using uniqueness scores


The Four Scoring Dimensions
ReasonRank calculates a composite truth score based on four critical metrics. A score of any conclusion (C) is updated dynamically using the formula:
C = Σ [(A - D) × L × V × U]

1. Truth (Evidence Score - V)
How logically sound is the argument? This is recursive; an argument's score depends on the score of its sub-arguments.
Reference: Evidence Verification Tiers

2. Linkage (Relevance Score - L)
Does the evidence actually prove the conclusion? This penalizes "True but Irrelevant" claims.
Reference: Linkage Score Methodology

3. Impact (Importance Score - A/D)
How much weight should this point carry? Does it address a core pillar or a minor triviality?
Reference: Importance Scores

4. Uniqueness (Redundancy Factor - U)
Is this a new point? We group semantically similar arguments to prevent a user from inflating a score by repeating the same point.
Reference: Belief Sorting & Uniqueness



Example: The Logic Cascade
Conclusion: "Solar energy is cost-competitive with fossil fuels"

Supporting Argument A: "Solar costs decreased 90%." (High Weight)
Calculation: 85 (Evidence) × 0.8 (Linkage) × 0.9 (Impact) = +61.2
Supporting Argument B: "Installation is cheaper." (Low Weight due to 70% overlap with A)
Calculation: 75 × 0.7 × 0.6 × 0.3 (Uniqueness) = +9.45
Current Total: +70.65

The Power of ReasonRank: If the data for Argument A is debunked, its score drops to zero. Because the system is a Network Logic, the final conclusion score immediately collapses to +9.45. The system stays current automatically as new evidence appears.


Technical Integration
Linkage Propagation: Scores flow through the entire graph.
Objective Criteria: Measurable standards for evaluation.
Bias Detection: Algorithms identify systematic reasoning errors.
Ready for Better Thinking?
Explore the Argument Structure or help us build the future of rational debate.
View the Code on GitHub | Contact the Project Lead
