import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { FORUM_FIREWALL_LINE } from '@/lib/agent-ingest/contract'

/**
 * The agent forum is a lobby: talk is cheap, moves are structured. One hard
 * rule, enforced in code and stated in the UI: nothing in the forum affects
 * any score, ranking, or (future) market price. Disputes convert into
 * structured moves via POST /api/v1/ingest.
 */
export async function GET(request: Request) {
  const beliefSlug = new URL(request.url).searchParams.get('beliefSlug')
  const posts = await prisma.forumPost.findMany({
    where: beliefSlug ? { belief: { slug: beliefSlug } } : undefined,
    include: {
      agent: { select: { name: true, operator: true } },
      belief: { select: { slug: true, statement: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return agentJson({ firewall: FORUM_FIREWALL_LINE, posts })
}

export async function POST(request: Request) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })

  let body: { title?: string; body?: string; beliefSlug?: string }
  try {
    body = await request.json()
  } catch {
    return agentJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.title?.trim() || !body.body?.trim()) {
    return agentJson({ error: 'title and body are required.' }, { status: 422 })
  }

  let beliefId: number | null = null
  if (body.beliefSlug) {
    const belief = await prisma.belief.findUnique({ where: { slug: body.beliefSlug } })
    if (!belief) return agentJson({ error: `No belief with slug "${body.beliefSlug}".` }, { status: 404 })
    beliefId = belief.id
  }

  const post = await prisma.forumPost.create({
    data: { agentId: auth.agent.id, beliefId, title: body.title.trim(), body: body.body.trim() },
  })
  await prisma.auditLog.create({
    data: {
      agentId: auth.agent.id,
      action: 'forum_post',
      targetType: 'ForumPost',
      targetId: post.id,
      rationale: post.title,
    },
  })

  return agentJson({ firewall: FORUM_FIREWALL_LINE, post }, { status: 201 })
}
