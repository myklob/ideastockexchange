<p style="text-align: right;"><em><a href="https://myclob.pbworks.com/w/page/21957696/Colorado%20Should">Home</a> &gt; <a href="https://myclob.pbworks.com/w/page/159323361/Page%20Design">Page Design</a> &gt; <em><a href="/w/page/21956697/algorithms">Algorithms</a><strong> &gt;&nbsp;</strong></em><strong><a href="https://myclob.pbworks.com/w/page/159300543/ReasonRank">ReasonRank</a>&nbsp;</strong></em></p>
<h1>ReasonRank: PageRank for Truth</h1>
<p>Imagine if every argument automatically showed its score. Not based on how many people believe it, how loudly someone shouts it, or how slickly it's packaged. Based on <em>evidence</em>.</p>
<p>That's ReasonRank.</p>
<p>Google revolutionized web search by treating links as votes. A webpage matters when other important pages link to it. The algorithm doesn't care about popularity contests or paid placement. It follows the network of trust.</p>
<p>ReasonRank does the same thing for ideas. Instead of counting hyperlinks, it weighs arguments. Instead of ranking websites, it scores beliefs. The truth rises not because we voted for it, but because the evidence demands it.</p>
<hr />
<h2>Why Traditional Debate Is Broken</h2>
<p>Here's what happens in a typical online debate:</p>
<ul>
<li>Arguments scatter across threads, lost in chronological chaos</li>
<li>The same tired points get repeated endlessly, each time counting as "new"</li>
<li>Debunked claims linger forever because nobody updates the old posts</li>
<li>Weak reasoning hides behind confident rhetoric</li>
<li>Important evidence gets buried while catchy soundbites go viral</li>
</ul>
<p>We've built a system where being <em>persuasive</em> beats being <em>correct</em>. Where tribal loyalty trumps factual accuracy. Where feelings matter more than data.</p>
<p>This isn't how we solve hard problems. This is how we keep having the same stupid arguments forever.</p>
<hr />
<h2>How ReasonRank Fixes This</h2>
<h3>The Core Insight: Truth Flows Upstream</h3>
<p>Think of arguments as a river system. Evidence is the source, flowing from small tributaries (individual studies, data points, expert testimony) into larger streams (sub-arguments), eventually feeding the main river (your conclusion).</p>
<p>Here's what makes this powerful:</p>
<ul>
<li><strong>Nodes are beliefs.</strong> Each claim gets <a href="https://myclob.pbworks.com/w/page/159323433/One%20Page%20Per%20Topic">one canonical page</a>, not scattered fragments across a thousand comment threads.</li>
<li><strong>Edges are logical connections.</strong> Supporting or opposing links show how arguments relate to each other.</li>
<li><strong>Strength propagates automatically.</strong> When the foundation is solid, the conclusion strengthens. When evidence crumbles, everything built on it collapses.</li>
</ul>
<p>The system doesn't care about your credentials, your charisma, or how many followers you have. It cares about one thing: <em>Can you show your work?</em></p>
<hr />
<h2>The Math Behind the Magic</h2>
<p>Every argument gets scored using three multiplied factors:</p>
<blockquote>
<p><strong>Argument Strength = <a href="https://myclob.pbworks.com/w/page/21960078/truth">Truth Score</a> &times; <a href="https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores">Linkage Score</a> &times; <a href="https://myclob.pbworks.com/w/page/162731388/Importance%20Score">Importance Weight</a></strong></p>
</blockquote>
<table style="border-collapse: collapse; width: 100%;" border="1" cellpadding="8">
<thead style="background-color: #f2f2f2;"> 
<tr>
<th>Component</th> <th>What It Measures</th> <th>Range</th>
</tr>
</thead> 
<tbody>
<tr>
<td><strong>Truth Score</strong></td>
<td>Is this claim actually true based on evidence?</td>
<td>0% to 100%</td>
</tr>
<tr>
<td><strong>Linkage Score</strong></td>
<td>If true, does it actually prove your point?</td>
<td>-100% (contradicts) to +100% (proves)</td>
</tr>
<tr>
<td><strong>Importance Weight</strong></td>
<td>Does this actually matter, or is it trivial?</td>
<td>0.0 to 1.0 multiplier</td>
</tr>
</tbody>
</table>
<p>Notice what this prevents:</p>
<ul>
<li><strong>True but irrelevant</strong> claims get filtered out (high truth, low importance)</li>
<li><strong>Important but unproven</strong> claims get flagged (high importance, low truth)</li>
<li><strong>Logically disconnected</strong> arguments can't hide (low linkage score)</li>
</ul>
<p>You can't game this system by shouting louder. You have to <em>show your math</em>.</p>
<hr />
<h2>Recursion: The Key to Scaling Reason</h2>
<p>Here's where it gets interesting. Every argument is itself a belief page with its own supporting and opposing arguments. The scoring cascades through multiple levels:</p>
<ol>
<li><strong>Foundation Level:</strong> A peer-reviewed study confirms Process X is safe. <em>(Truth Score: 95%)</em></li>
<li><strong>Middle Level:</strong> That study supports "Process X is safe." <em>(Updated Score: 85%)</em></li>
<li><strong>Conclusion Level:</strong> "We should implement Process X" gains strength. <em>(Updated Score: 70%)</em></li>
</ol>
<p>Now watch what happens when new evidence appears. If that peer-reviewed study gets retracted, the score doesn't just update on one page. It ripples through the entire network instantly. Every conclusion built on that foundation automatically adjusts.</p>
<p>This is what makes ReasonRank revolutionary. <strong>The truth updates itself.</strong></p>
<hr />
<h2>Example: Should We Build Roundabouts?</h2>
<p>Let's see this in action. The city is debating whether to replace stop signs with roundabouts.</p>
<table border="1" cellpadding="10" width="100%">
<thead> 
<tr style="background-color: #e6ffe6;">
<th colspan="4">✅ Reasons to Agree</th>
</tr>
<tr>
<th>Argument</th> <th>Truth</th> <th>Linkage</th> <th>Impact</th>
</tr>
</thead> 
<tbody>
<tr>
<td>"Reduces fatal accidents by 90%"</td>
<td><strong>95%</strong> (multiple studies)</td>
<td><strong>1.0</strong> (critical safety factor)</td>
<td><strong>+0.95</strong></td>
</tr>
<tr>
<td>"Improves traffic flow during off-peak"</td>
<td><strong>80%</strong> (good data)</td>
<td><strong>0.5</strong> (minor convenience)</td>
<td><strong>+0.40</strong></td>
</tr>
</tbody>
<thead> 
<tr style="background-color: #ffe6e6;">
<th colspan="4">❌ Reasons to Disagree</th>
</tr>
</thead> 
<tbody>
<tr>
<td>"Confusing for elderly drivers"</td>
<td><strong>60%</strong> (mostly anecdotal)</td>
<td><strong>0.8</strong> (real safety concern)</td>
<td><strong>-0.48</strong></td>
</tr>
<tr>
<td>"Construction causes delays"</td>
<td><strong>100%</strong> (obviously true)</td>
<td><strong>0.1</strong> (temporary, not policy-relevant)</td>
<td><strong>-0.10</strong></td>
</tr>
</tbody>
<tfoot> 
<tr style="background-color: #f9f9f9;">
<td colspan="3" align="right"><strong>TOTAL SCORE:</strong></td>
<td><strong>+0.77</strong> (Strongly Favor)</td>
</tr>
</tfoot>
</table>
<p>Look at that last row. The "construction delays" argument is 100% true, but contributes almost nothing to the final decision because its linkage and importance scores are low. This is exactly how reasoning should work. Being technically correct about an irrelevant detail doesn't win you the debate.</p>
<hr />
<h2>What Makes This Different</h2>
<table style="border-collapse: collapse; width: 100%;" border="1" cellpadding="10">
<thead> 
<tr>
<th width="50%">Traditional Debate</th> <th width="50%">Idea Stock Exchange</th>
</tr>
</thead> 
<tbody>
<tr>
<td>Arguments appear chronologically</td>
<td>Arguments organized by logical structure</td>
</tr>
<tr>
<td>Winner determined by rhetoric</td>
<td>Winner determined by evidence weight</td>
</tr>
<tr>
<td>Same points repeated endlessly</td>
<td>Duplicates merged via semantic clustering</td>
</tr>
<tr>
<td><strong>Static:</strong> Debunked claims stay visible</td>
<td><strong>Dynamic:</strong> Scores update when evidence changes</td>
</tr>
<tr>
<td>No way to measure argument strength</td>
<td>Every claim gets a quantified score</td>
</tr>
<tr>
<td>Tribal warfare and loyalty tests</td>
<td>Show your work or lose credibility</td>
</tr>
</tbody>
</table>
<hr />
<h2>Quality Control: Preventing Garbage In, Garbage Out</h2>
<p>Any scoring system is only as good as its inputs. ReasonRank includes three layers of protection:</p>
<h3>1. Semantic Clustering</h3>
<p>The system groups similar arguments automatically. "Roundabouts reduce crashes" and "Roundabouts improve safety" don't get counted twice. You can't inflate your score by restating the same point fifty different ways.</p>
<h3>2. Community Validation</h3>
<p>Users can flag weak linkage scores, identify missing counterarguments, and challenge the relevance of evidence. Crowdsourced verification catches what automation misses.</p>
<h3>3. Expert Review</h3>
<p>Specialists assess <a href="https://myclob.pbworks.com/w/page/159353568/Evidence">evidence quality</a>, evaluate logical consistency, and review the <a href="https://myclob.pbworks.com/w/page/21956746/Assumptions">assumptions</a> underlying major claims. This prevents sophisticated manipulation while keeping the system open to new contributors.</p>
<hr />
<h2>The Bigger Picture</h2>
<p>ReasonRank isn't just an algorithm. It's a commitment to a specific vision of how we make decisions:</p>
<ul>
<li>Beliefs should be <strong>proportional to evidence</strong>, not popularity</li>
<li>Arguments should be <strong>transparent</strong>, not hidden behind rhetoric</li>
<li>Truth should <strong>update dynamically</strong> as facts change</li>
<li>Reasoning should be <strong>systematic</strong>, not tribal</li>
</ul>
<p>We've spent centuries developing the scientific method for testing physical reality. ReasonRank applies those same principles to evaluating arguments about policy, values, and complex social questions.</p>
<p>This is how we complete the Enlightenment project. This is how we build collective intelligence that actually works.</p>
<hr />
<h2>Technical Deep Dives</h2>
<p>Want to understand the implementation details? Explore these resources:</p>
<ul>
<li><a href="https://github.com/myklob/ideastockexchange">Full codebase on GitHub</a></li>
<li><a href="https://myclob.pbworks.com/w/page/21960078/truth">How Truth Scores Work</a></li>
<li><a href="https://myclob.pbworks.com/w/page/159338766/Linkage%20Scores">Understanding Linkage Scores</a></li>
<li><a href="https://myclob.pbworks.com/w/page/159353568/Evidence">Evidence Evaluation Framework</a></li>
<li><a href="https://myclob.pbworks.com/w/page/162731388/Importance%20Score">Importance Weighting System</a></li>
<li><a href="https://myclob.pbworks.com/w/page/159333015/Argument%20scores%20from%20sub-argument%20scores">Sub-Argument Score Calculation</a></li>
<li><a href="https://myclob.pbworks.com/w/page/156187122/cost-benefit%20analysis">Integration with Cost-Benefit Analysis</a></li>
</ul>
<hr />
<h2>Join the Movement</h2>
<p>The Idea Stock Exchange isn't complete. It's not perfect. It never will be, because the pursuit of truth is an ongoing process, not a destination.</p>
<p>But it's <em>better</em>. Better than shouting matches. Better than tribal warfare. Better than letting the loudest voice or the slickest marketing win.</p>
<p>We're building Wikipedia for policy debates. A system where you can see every argument, trace every claim back to its evidence, and watch the scores update as truth emerges.</p>
<p><strong><a href="https://myclob.pbworks.com/w/page/160433328/Contact%20Me">Help us improve the algorithm.</a></strong> Submit edge cases. Challenge our assumptions. Propose better weighting systems. The strength of this platform depends on people like you who care about getting things right.</p>
<p>Because here's what's at stake: Democracy requires informed citizens. Markets require accurate information. Progress requires distinguishing good ideas from bad ones. And none of that works when we can't agree on basic facts or evaluate arguments systematically.</p>
<p>ReasonRank is our answer. Not perfect. But measurable. Transparent. Self-correcting.</p>
<p><strong>Show us your math. Let's build something better together.</strong></p>
<hr />
<h1>Related Scores Needed to be Calculated:</h1>
<p><a href="https://myclob.pbworks.com/w/page/159333015/Argument%20scores%20from%20sub-argument%20scores">Argument scores from sub-argument scores</a></p>
<p><a href="https://myclob.pbworks.com/w/page/159353568/Evidence%20Scores">Evidence Scores</a></p>
<p><a href="https://myclob.pbworks.com/w/page/160432560/Book%20Logical%20Validity%20Score">Book Logical Validity Score</a></p>
<p><a href="https://myclob.pbworks.com/w/page/162731388/Importance%20Score">Importance Score</a></p>
<p><a href="https://myclob.pbworks.com/w/page/159338799/Linkage%20Score%20Code">Linkage Score Code</a></p>
<p><a href="https://myclob.pbworks.com/w/page/159300627/Truth%20Scores">Truth Scores</a></p>
<p><a href="https://myclob.pbworks.com/w/page/162409713/Media%20Truth%20Score">Media Truth Score</a></p>
<p><a href="https://myclob.pbworks.com/w/page/162854901/topic_overlap_scores">topic overlap scores</a></p>
<p><a href="https://myclob.pbworks.com/w/page/159351732/Objective%20criteria%20scores">Objective criteria scores</a></p>
<p><a href="https://myclob.pbworks.com/w/page/162410988/Media%20Genre%20and%20Style%20Scores%3A">Media Genre and Style Scores</a></p>
<p>&nbsp;</p>
