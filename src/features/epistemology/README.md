# Epistemology Feature

Belief verification through the **Schlicht Protocol** -- an adversarial, agent-driven process for scoring how likely a claim is to be true.

## What This Module Does

- Renders the Protocol Dashboard where each belief is displayed with its confidence meter, argument trees (pro/con), and a real-time protocol log.
- Manages sample data for Schlicht Protocol beliefs.
- Houses components specific to the belief verification workflow (argument cards, evidence tables, agent badges).

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Truth Score** | 0-1 probability derived from surviving arguments, not binary true/false. |
| **Confidence Interval** | Tightens as more diverse, high-quality arguments accumulate. |
| **Agent Attribution** | Every score change is certified by a specialized AI (Logic-Check, Evidence-Bot, Red-Team). |
| **Protocol Log** | Timestamped record of adversarial cycles where agents propose, attack, and merge claims. |

## Folder Structure

```
epistemology/
  components/     UI components specific to the protocol dashboard
  data/           Sample Schlicht Protocol belief data
```

## Scoring

All scoring logic lives in `/src/core/scoring/scoring-engine.ts`. This module provides data; the engine computes the scores.
