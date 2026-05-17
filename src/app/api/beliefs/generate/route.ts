import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

// Cached across all requests — never changes
const ISE_SYSTEM_PROMPT = `You are an expert analyst for the Idea Stock Exchange (ISE) framework. The ISE evaluates beliefs by scoring arguments, evidence, and criteria on a 0–100 scale.

Scoring rules:
- truthScore (0–100): How well-supported is this claim by evidence?
- linkageScore (0–100): How directly does this point connect to the thesis?
- strengthening = truthScore * linkageScore / 100 (for pro arguments)
- weakening = -(truthScore * linkageScore / 100) (for con arguments, stored as negative)

Evidence tiers:
- T1: Official records, government data, peer-reviewed studies
- T2: Institutional analysis, major journalism
- T3: Expert opinion, credible advocacy
- T4: Anecdotal or speculative

You will be given a thesis. Respond ONLY with a single valid JSON object matching this exact schema — no markdown, no preamble:

{
  "shortTitle": "string (≤80 chars)",
  "topic": "string (main topic area)",
  "topicHierarchy": "string (e.g. 'Economics > Labor Policy')",
  "beliefPositivity": "integer -100 to +100",
  "beliefPositivityLabel": "string (e.g. 'Supportive' or 'Critical')",
  "reasonsToAgree": [
    {
      "id": "string",
      "title": "string (2–6 words, bold label style)",
      "content": "string (full argument, 1–3 sentences)",
      "position": "pro",
      "score": { "truthScore": 0, "linkageScore": 0, "strengthening": 0 }
    }
  ],
  "reasonsToDisagree": [
    {
      "id": "string",
      "title": "string (2–6 words)",
      "content": "string",
      "position": "con",
      "score": { "truthScore": 0, "linkageScore": 0, "weakening": 0 }
    }
  ],
  "supportingEvidence": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "score": 0,
      "linkageScore": 0,
      "type": "T1|T2|T3|T4",
      "typeName": "string",
      "position": "supporting",
      "contribution": 0
    }
  ],
  "weakeningEvidence": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "score": 0,
      "linkageScore": 0,
      "type": "T1|T2|T3|T4",
      "typeName": "string",
      "position": "weakening",
      "contribution": 0
    }
  ],
  "objectiveCriteria": [
    {
      "id": "string",
      "description": "string",
      "independenceScore": 0,
      "linkageScore": 0,
      "criteriaType": "string",
      "totalScore": 0
    }
  ],
  "valueConflict": {
    "supportingSide": {
      "advertised": ["string"],
      "actual": ["string"],
      "fears": "string",
      "desire": "string"
    },
    "opposingSide": {
      "advertised": ["string"],
      "actual": ["string"],
      "fears": "string",
      "desire": "string"
    }
  },
  "benefits": [{ "description": "string", "category": "string" }],
  "costs": [{ "description": "string", "category": "string" }],
  "compromiseSolutions": [
    { "id": "string", "title": "string", "description": "string" }
  ],
  "biases": [
    { "name": "string", "description": "string", "affectsSide": "supporters|opponents" }
  ],
  "importantFacts": ["string"],
  "unintendedConsequences": ["string"],
  "finalScore": 0,
  "scoreInterpretation": "Strongly Valid|Tending Valid|Slightly Valid|Slightly Invalid|Tending Invalid|Strongly Invalid"
}

Generate 4–6 entries for reasonsToAgree and reasonsToDisagree, 3–5 for each evidence list, 3–4 objectiveCriteria, 2–3 compromiseSolutions, and 3–4 biases.`

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: { 'anthropic-beta': 'prompt-caching-2024-07-31' },
})

export async function POST(request: Request) {
  let thesis: string
  try {
    const body = (await request.json()) as { thesis?: unknown }
    if (typeof body.thesis !== 'string' || !body.thesis.trim()) {
      return NextResponse.json({ error: 'thesis is required' }, { status: 400 })
    }
    thesis = body.thesis.trim()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const stream = client.messages.stream({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    system: [
      {
        type: 'text',
        text: ISE_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate a complete ISE analysis for this thesis: "${thesis}"`,
      },
    ],
  })

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (obj: Record<string, unknown>) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            send({ type: 'text', text: event.delta.text })
          }
        }
        const msg = await stream.finalMessage()
        send({ type: 'done', usage: msg.usage })
      } catch (err) {
        send({
          type: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
