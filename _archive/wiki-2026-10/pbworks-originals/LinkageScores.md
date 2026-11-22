<p style="text-align: right;"><em><a href="/w/page/21957696/Colorado%20Should">Home</a> &gt; <a href="/w/page/159323361/Page%20Design">Page Design</a> &gt; <strong>Linkage Scores</strong></em></p>
<h1>Linkage Scores: Measuring Logical Relevance</h1>
<h2>The Problem: True but Irrelevant</h2>
<p>In traditional debate, people often win arguments by shouting facts that are technically true but completely irrelevant to the conclusion. The <strong>Linkage Score</strong> is the filter that solves this.</p>
<p><strong>Example:</strong></p>
<table border="1" cellpadding="10" width="100%">
<thead> 
<tr style="background-color: #f2f2f2;">
<th>Conclusion</th> <th>Supporting Argument</th> <th>Truth Score</th> <th>Linkage Score</th>
</tr>
</thead> 
<tbody>
<tr>
<td>"We should implement a Carbon Tax."</td>
<td>"The sky is blue."</td>
<td><strong>100%</strong> (Fact)</td>
<td><strong>0%</strong> (Irrelevant)</td>
</tr>
<tr>
<td>"We should implement a Carbon Tax."</td>
<td>"Sweden has a Carbon Tax."</td>
<td><strong>100%</strong> (Fact)</td>
<td><strong>30%</strong> (Weak Relevance)</td>
</tr>
<tr>
<td>"We should implement a Carbon Tax."</td>
<td>"Carbon Taxes reduce emissions by 20%."</td>
<td><strong>85%</strong> (Study)</td>
<td><strong>90%</strong> (Direct Relevance)</td>
</tr>
</tbody>
</table>
<p><strong>The Critical Question:</strong> "If this argument is true, how much does it <em>actually force</em> the conclusion to be true?"</p>
<hr />
<h2>Why Linkage Scores Matter</h2>
<h3>1. Preventing the "Gish Gallop"</h3>
<p>Debaters often overwhelm opponents with a blizzard of weak arguments. Without Linkage Scores, 100 weak arguments might outweigh 1 strong argument. With Linkage Scores, weak arguments (Linkage &lt; 0.2) are mathematically silenced.</p>
<h3>2. Exposing Non Sequiturs</h3>
<p>A non sequitur is an argument where the conclusion does not follow from the premise.   <em>Argument: "Candidate X is a nice person." &rarr; Conclusion: "Candidate X will be a good President."</em> Linkage Score: <strong>15%</strong>. Being nice is a positive trait, but it has very low predictive power for executive competence.</p>
<h3>3. Revealing Hidden Assumptions</h3>
<p>A low Linkage Score often indicates a missing <a href="/w/page/159353568/Assumptions">Assumption</a>.   <em>Argument: "We have global warming." &rarr; Conclusion: "We need a Carbon Tax."</em> (Linkage: 40%)   What is missing? The assumption that <em>"Carbon Taxes are the most effective way to stop global warming."</em> When you add that assumption, the linkage strengthens.</p>
<hr />
<h2>How We Calculate Linkage</h2>
<p>The Linkage Score is a multiplier between <strong>-1.0</strong> (Contradicts) and <strong>+1.0</strong> (Proves).</p>
<ul>
<li><strong>1.0 (Proof):</strong> If the premise is true, the conclusion <em>must</em> be true. (Mathematical logic).</li>
<li><strong>0.7 - 0.9 (Strong Support):</strong> The argument provides direct, causal evidence for the conclusion.</li>
<li><strong>0.4 - 0.6 (Context):</strong> The argument provides helpful context but is not decisive.</li>
<li><strong>0.1 - 0.3 (Weak):</strong> Tangential or anecdotal connection.</li>
<li><strong>0.0 (Irrelevant):</strong> True facts that have no bearing on the topic.</li>
<li><strong>-1.0 (Refutation):</strong> If the premise is true, the conclusion <em>cannot</em> be true.</li>
</ul>
<h3>The Formula Integration</h3>
<p>In the <a href="/w/page/159300543/ReasonRank">ReasonRank Algorithm</a>, the total weight of an argument is:</p>
<blockquote>
<p><strong>Net Weight = <a href="/w/page/21960078/truth">Truth Score</a> &times; Linkage Score &times; <a href="/w/page/162731388/Importance%20Score">Importance</a></strong></p>
</blockquote>
<p>This means a "Perfect Truth" (100%) with "Zero Linkage" (0%) contributes <strong>Zero</strong> to the discussion. This automatically filters out noise.</p>
<hr />
<h2>Community Evaluation</h2>
<p>How do we determine the score? Users are asked specific diagnostic questions:</p>
<ol>
<li><strong>Necessity:</strong> "If this argument were proven false, would the conclusion suffer?"</li>
<li><strong>Sufficiency:</strong> "Does this argument alone justify the conclusion?"</li>
<li><strong>Directness:</strong> "How many logical steps are required to connect A to B?"</li>
</ol> 
<hr />
<h2>Why This Changes the Game</h2>
<p>Linkage Scores force debaters to focus on <strong>Relevance</strong> rather than just <strong>Fact-Checking</strong>. It moves the conversation from "Is this true?" to "Does this matter?"</p>
<p>This is how we separate a pile of random facts from a structured, logical argument.</p>
<hr />
<p><strong>See Also:</strong></p>
<ul>
<li><a href="/w/page/21960078/truth">Truth Scores</a> - Measuring factual accuracy.</li>
<li><a href="/w/page/159353568/Evidence">Evidence Framework</a> - Evaluating data sources.</li>
<li><a href="/w/page/159300543/ReasonRank">ReasonRank</a> - The master algorithm.</li>
<li><a href="/w/page/159353568/Assumptions">Assumptions</a> - Bridging the gap in low-linkage arguments.</li>
</ul>
<p><strong><a href="/w/page/160433328/Contact%20Me">Contact me</a></strong> to help refine the Linkage scoring definitions.</p>
<p>&nbsp;</p>
