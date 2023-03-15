The GitHub project aims to create an open online cost-benefit analysis of policy. To achieve this, we've implemented a few key components:

Cost-benefit-risk analysis: We're using the techniques taught by Cass Sunstein in The Cost-Benefit Revolution to help us evaluate the costs, benefits, and risks of different policy options. These techniques involve systematically identifying, quantifying, and weighing the costs and benefits of each option, and considering the likelihood and magnitude of potential risks.

Conflict resolution and mediation: We're using the techniques taught in conflict resolution and mediation by Roger Fisher and William Ury and the Harvard Negotiation Project to encourage helpful behavior in the discussion/debate forum. These techniques include active listening, asking questions, and finding common ground.

Argument ranking algorithms: To help identify the most persuasive arguments, we've implemented two ranking algorithms:

Semantic similarity ranking: This algorithm compares the semantic similarity between arguments to identify those that are essentially saying the same thing. We're using the Universal Sentence Encoder from TensorFlow to generate semantic embeddings of each argument, which we then compare using cosine similarity. Arguments with high cosine similarity scores are considered more similar.

User voting ranking: Users can submit and vote on pro/con reasons that argue two statements are essentially saying the same thing. These votes are used to adjust the semantic similarity scores over time, helping to refine the ranking algorithm.

Effective altruism: Finally, we're aligning our project with the effective altruism movement, which uses evidence and reasoning to determine the most effective government policy. This involves doing the most good (i.e., maximizing benefits and minimizing costs and risks) with what is available, rather than following political dogma or philosophy.
Overall, our project aims to provide a platform for open, evidence-based discussion and evaluation of policy options, helping to inform policymakers and the public alike.
