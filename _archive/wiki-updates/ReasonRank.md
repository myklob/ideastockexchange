_[Home](Home) > [Page Design](Page-Design) > **[ReasonRank](ReasonRank) Algorithm**_

# ReasonRank: PageRank for Truth

Imagine if every argument automatically showed its score. Not based on how many people believe it, how loudly someone shouts it, or how slickly it's packaged. Based on _evidence_.

That's ReasonRank.

Google changed web search by treating links as votes. A webpage matters when other important pages link to it. The algorithm doesn't care about popularity contests or paid placement. It follows the network of trust.

ReasonRank does the same thing for ideas. Instead of counting hyperlinks, it weighs arguments. Instead of ranking websites, it scores beliefs. The truth rises not because we voted for it, but because the evidence demands it.

---

## Why Traditional Debate Is Broken

Here's what happens in a typical online debate:

- Arguments scatter across threads, lost in chronological chaos
- The same tired points get repeated endlessly, each time counting as "new"
- Debunked claims linger forever because nobody updates the old posts
- Weak reasoning hides behind confident rhetoric
- Important evidence gets buried while catchy soundbites go viral

We've built a system where being _persuasive_ beats being _correct_. Where tribal loyalty trumps factual accuracy. Where feelings matter more than data.

This isn't how we solve hard problems. This is how we keep having the same stupid arguments forever.

---

## How ReasonRank Fixes This

### The Core Insight: Truth Flows Upstream

Think of arguments as a river system. Evidence is the source, flowing from small tributaries (individual studies, data points, expert testimony) into larger streams (sub-arguments), eventually feeding the main river (your conclusion).

Here's what makes this powerful:

- **Nodes are beliefs.** Each claim gets [one canonical page](One-Page-Per-Topic), not scattered fragments across a thousand comment threads.
- **Edges are logical connections.** Supporting or opposing links show how arguments relate to each other.
- **Strength propagates automatically.** When the foundation is solid, the conclusion strengthens. When evidence crumbles, everything built on it collapses.

The system doesn't care about your credentials, your charisma, or how many followers you have. It cares about one thing: _Can you show your work?_

---

## The Math Behind the Magic

Every argument gets scored using three multiplied factors:

> **Argument Strength = [Truth Score](Truth-Score) × [Linkage Score](Linkage-Scores) × [Importance Weight](Importance-Score)**

| Component | What It Measures | Range |
|-----------|------------------|-------|
| **Truth Score** | Is this claim actually true based on evidence? | 0% to 100% |
| **Linkage Score** | If true, does it actually prove your point? | -100% (contradicts) to +100% (proves) |
| **Importance Weight** | Does this actually matter, or is it trivial? | 0.0 to 1.0 multiplier |

Notice what this prevents:

- **True but irrelevant** claims get filtered out (high truth, low importance)
- **Important but unproven** claims get flagged (high importance, low truth)
- **Logically disconnected** arguments can't hide (low linkage score)

You can't game this system by shouting louder. You have to _show your math_.

---

## Recursion: The Key to Scaling Reason

Here's where it gets interesting. Every argument is itself a belief page with its own supporting and opposing arguments. The scoring cascades through multiple levels:

1. **Foundation Level:** A peer-reviewed study confirms Process X is safe. _(Truth Score: 95%)_
2. **Middle Level:** That study supports "Process X is safe." _(Updated Score: 85%)_
3. **Conclusion Level:** "We should implement Process X" gains strength. _(Updated Score: 70%)_

Now watch what happens when new evidence appears. If that peer-reviewed study gets retracted, the score doesn't just update on one page. It ripples through the entire network instantly. Every conclusion built on that foundation automatically adjusts.

This is what makes ReasonRank different. **The truth updates itself.**

---

## Example: Should We Build Roundabouts?

Let's see this in action. The city is debating whether to replace stop signs with roundabouts.

### ✅ Reasons to Agree

| Argument | Truth | Linkage | Impact |
|----------|-------|---------|--------|
| "Reduces fatal accidents by 90%" | **95%** (multiple studies) | **1.0** (critical safety factor) | **+0.95** |
| "Improves traffic flow during off-peak" | **80%** (good data) | **0.5** (minor convenience) | **+0.40** |

### ❌ Reasons to Disagree

| Argument | Truth | Linkage | Impact |
|----------|-------|---------|--------|
| "Confusing for elderly drivers" | **60%** (mostly anecdotal) | **0.8** (real safety concern) | **-0.48** |
| "Construction causes delays" | **100%** (obviously true) | **0.1** (temporary, not policy-relevant) | **-0.10** |

**TOTAL SCORE: +0.77** (Strongly Favor)

Look at that last row. The "construction delays" argument is 100% true, but contributes almost nothing to the final decision because its linkage and importance scores are low. This is exactly how reasoning should work. Being technically correct about an irrelevant detail doesn't win you the debate.

---

## What Makes This Different

| Traditional Debate | Idea Stock Exchange |
|-------------------|---------------------|
| Arguments appear chronologically | Arguments organized by logical structure |
| Winner determined by rhetoric | Winner determined by evidence weight |
| Same points repeated endlessly | Duplicates merged via semantic clustering |
| **Static:** Debunked claims stay visible | **Dynamic:** Scores update when evidence changes |
| No way to measure argument strength | Every claim gets a quantified score |
| Tribal warfare and loyalty tests | Show your work or lose credibility |

---

## Quality Control: Preventing Garbage In, Garbage Out

Any scoring system is only as good as its inputs. ReasonRank includes three layers of protection:

### 1. Semantic Clustering

The system groups similar arguments automatically. "Roundabouts reduce crashes" and "Roundabouts improve safety" don't get counted twice. You can't inflate your score by restating the same point fifty different ways.

### 2. Community Validation

Users can flag weak linkage scores, identify missing counterarguments, and challenge the relevance of evidence. Crowdsourced verification catches what automation misses.

### 3. Expert Review

Specialists assess [evidence quality](Evidence), evaluate logical consistency, and review the [assumptions](Assumptions) underlying major claims. This prevents sophisticated manipulation while keeping the system open to new contributors.

---

## The Bigger Picture

ReasonRank isn't just an algorithm. It's a commitment to a specific vision of how we make decisions:

- Beliefs should be **proportional to evidence**, not popularity
- Arguments should be **transparent**, not hidden behind rhetoric
- Truth should **update dynamically** as facts change
- Reasoning should be **systematic**, not tribal

We've spent centuries developing the scientific method for testing physical reality. ReasonRank applies those same principles to evaluating arguments about policy, values, and complex social questions.

This is how we complete the Enlightenment project. This is how we build collective intelligence that actually works.

---

## Technical Deep Dives

Want to understand the implementation details? Explore these resources:

- [Full codebase on GitHub](https://github.com/myklob/ideastockexchange)
- [How Truth Scores Work](Truth-Scores)
- [Understanding Linkage Scores](Linkage-Scores)
- [Evidence Evaluation Framework](Evidence)
- [Importance Weighting System](Importance-Score)
- [Sub-Argument Score Calculation](Argument-scores-from-sub-argument-scores)
- [Integration with Cost-Benefit Analysis](cost-benefit-analysis)

---

## Join the Movement

The Idea Stock Exchange isn't complete. It's not perfect. It never will be, because the pursuit of truth is an ongoing process, not a destination.

But it's _better_. Better than shouting matches. Better than tribal warfare. Better than letting the loudest voice or the slickest marketing win.

We're building Wikipedia for policy debates. A system where you can see every argument, trace every claim back to its evidence, and watch the scores update as truth emerges.

**[Help us improve the algorithm.](Contact-Me)** Submit edge cases. Challenge our assumptions. Propose better weighting systems. The strength of this platform depends on people like you who care about getting things right.

Because here's what's at stake: Democracy requires informed citizens. Markets require accurate information. Progress requires distinguishing good ideas from bad ones. And none of that works when we can't agree on basic facts or evaluate arguments systematically.

ReasonRank is our answer. Not perfect. But measurable. Transparent. Self-correcting.

**Show us your math. Let's build something better together.**

---

## Related Scores Needed to be Calculated:

- [Argument scores from sub-argument scores](Argument-scores-from-sub-argument-scores)
- [Evidence Scores](Evidence-Scores)
- [Book Logical Validity Score](Book-Logical-Validity-Score)
- [Importance Score](Importance-Score)
- [Linkage Score Code](Linkage-Score-Code)
- [Truth Scores](Truth-Scores)
- [Media Truth Score](Media-Truth-Score)
- [topic overlap scores](topic_overlap_scores)
- [Objective criteria scores](Objective-criteria-scores)
- [Media Genre and Style Scores](Media-Genre-and-Style-Scores)
