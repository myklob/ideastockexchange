[_Home_](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/21957696/Colorado%20Should) _>_ [_Page Design_](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/159323361/Page%20Design) _>_ [_**ReasonRank**_](http://myclob.pbworks.com/w/page/159300543/ReasonRank) _**Algorithm**_

ReasonRank: The Operating System for Truth
==========================================

**ReasonRank** is a computational scoring engine that measures the validity of a belief. It is the core algorithm of the Idea Stock Exchange.

Just as Google’s PageRank revolutionized the internet by treating hyperlinks as "votes" for a website's importance, ReasonRank revolutionizes debate by treating logical arguments as "votes" for a belief's truth.

1\. The Core Philosophy
-----------------------

The internet solved the problem of **Information Access**, but it created the problem of **Information Verification**.

Currently, online debates are decided by:

1.  **Volume:** Who shouts the loudest?
    
2.  **Repetition:** Who posts the most often?
    
3.  **Tribalism:** Who has the most followers?
    

ReasonRank replaces these metrics with a single standard: **Evidence.**

### The "Trust Graph"

ReasonRank imagines all human knowledge as a directed graph.

*   **Nodes** are claims (Beliefs).
    
*   **Edges** are logical connections (Arguments).
    
*   **Weight** is the strength of the evidence (Truth Score).
    

In this system, you cannot "win" a debate by being charismatic. You can only win by constructing a graph of strong evidence that logically supports your conclusion.

2\. The Algorithm
-----------------

ReasonRank calculates a composite **Belief Score** (0 to 100) for every page on the site. This score is dynamic—it updates instantly whenever new evidence is added or old evidence is debunked.

### The Formula

Unlike a simple "Pro vs. Con" list, ReasonRank weighs every argument using four specific dimensions.

Code snippet

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   Belief Score = Base + Σ(Pro Scores) - Σ(Con Scores)   `

Where the score of any single argument is calculated as:

> **Argument Score = (V × L × I × U)**

**VariableDimensionDefinitionV**[**Truth Score**](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/21960078/truth)Is the argument itself true? Based on [Evidence Tiers](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/159353568/Evidence).**L**[**Linkage Score**](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/159338766/Linkage%20Scores)Is the argument relevant? (0.0 to 1.0). "True but irrelevant" gets a low score.**I**[**Importance Score**](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/Importance%20Score)Is this a major point or a minor nitpick?**U**[**Uniqueness Score**](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/21957126/combine%20similar%20beliefs)Is this a new point, or a duplicate? (Anti-spam filter).

3\. Deep Dive: The Four Dimensions
----------------------------------

### A. Truth Score (V)

The engine of the system. This measures the internal validity of a claim. It is **recursive**, meaning the Truth Score of a conclusion depends on the Truth Scores of its premises.

*   **Tier 1 Evidence (Meta-Analysis):** V = 1.0
    
*   **Tier 2 Evidence (Peer-Reviewed Study):** V = 0.8
    
*   **Tier 4 Evidence (Anecdote):** V = 0.1
    
*   **Refuted Evidence:** V = 0.0
    

### B. Linkage Score (L)

This prevents "Red Herring" fallacies. A user might post a fact that is 100% true (e.g., "The sun is hot") but use it to support an unrelated conclusion (e.g., "Therefore, we should lower taxes").

*   ReasonRank assigns this a **Linkage Score of 0.1**, neutralizing the argument despite its high Truth Score.
    

### C. Uniqueness Score (U)

This solves the "Echo Chamber" problem. In traditional social media, if 1,000 people repeat the same slogan, it trends. In ReasonRank, the algorithm detects semantic similarity.

*   **First Instance:** U = 1.0 (Full impact)
    
*   **Duplicate Instance:** U = 0.05 (Diminished impact)
    
*   _Result: 1,000 people shouting the same thing counts as ONE argument._
    

4\. The Logic Cascade (Recursion)
---------------------------------

This is the most powerful feature of ReasonRank. Because arguments are linked in a network, changes to the "Foundation" automatically update the "Roof."

### Scenario: The Retraction

1.  **Level 1 (Foundation):** A scientific paper claims Drug X is safe. (Score: 90)
    
2.  **Level 2 (Argument):** User argues "We should approve Drug X because it is safe." (Score: 90)
    
3.  **Level 3 (Policy):** Belief Page "Legalize Drug X" has a high score.
    

**The Event:** The scientific paper is retracted due to errors.

*   **Level 1 Score** drops to **0**.
    
*   **Level 2 Score** automatically recalculates: (Truth 0 × Linkage 1.0) = **0**.
    
*   **Level 3 Score** collapses immediately.
    

No human moderator needs to intervene. The truth updates itself.

5\. Technical Implementation
----------------------------

ReasonRank is implemented using **Matrix Propagation**. We treat the debate as a linear algebra problem, allowing us to calculate scores for millions of arguments simultaneously.

### Python Logic (Simplified)

Python

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   import numpy as np  from sklearn.feature_extraction.text import TfidfVectorizer  def calculate_reason_rank(M_pro, M_con, initial_scores, argument_texts, damping=0.85):      """      M_pro: Adjacency matrix of supporting arguments      M_con: Adjacency matrix of opposing arguments      damping: The 'friction' that prevents infinite loops (standard PageRank physics)      """      # 1. Calculate Uniqueness (The Anti-Echo Filter)      # We use TF-IDF to find and down-weight redundant text      uniqueness_scores = compute_uniqueness(argument_texts)      # 2. The Propagation Loop      # Logic flows from evidence nodes -> conclusion nodes      # Pro Arguments ADD to the score      pro_flow = np.dot(M_pro, initial_scores['pro'] * uniqueness_scores['pro'])      # Con Arguments SUBTRACT from the score      con_flow = np.dot(M_con, initial_scores['con'] * uniqueness_scores['con'])      # 3. Final Calculation      # New Score = Old Score + (Pro Flow - Con Flow) * Damping      net_score = (pro_flow - con_flow) * damping      return normalize_score(net_score)   `

6\. Comparison: PageRank vs. ReasonRank
---------------------------------------

**FeatureGoogle PageRankISE ReasonRankInput**Webpages & HyperlinksBeliefs & Arguments**Primary Metric**Popularity / AuthorityValidity / Evidence**Direction**Positive Only (Links help)Positive & Negative (Refutations hurt)**Spam Protection**Link Farm Detection[Semantic Clustering](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/21957126/combine%20similar%20beliefs)**Goal**Find the most _important_ pageFind the most _truthful_ idea

7\. The Future of Reason
------------------------

ReasonRank is not just code; it is a mechanism for **Collective Intelligence**.

By forcing arguments to compete on the basis of **Evidence (V)** and **Logic (L)** rather than rhetoric, we create a system where the best ideas naturally rise to the top. It is the first step toward a **Reason-Based Society**.

### Explore the System

*   [**Truth Scores**](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/21960078/truth)**:** How we verify facts.
    
*   [**Linkage Scores**](https://www.google.com/search?q=http://myclob.pbworks.com/w/page/159338766/Linkage%20Scores)**:** How we measure relevance.
    
*   [**GitHub Repository**](https://github.com/myklob/ideastockexchange)**:** View the source code.
