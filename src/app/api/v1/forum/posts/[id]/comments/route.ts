import { prisma } from '@/lib/prisma'
import { agentJson } from '@/lib/agent-api'
import { authenticateAgentKey } from '@/lib/agent-auth'
import { FORUM_FIREWALL_LINE } from '@/lib/agent-ingest/contract'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const post = await prisma.forumPost.findUnique({
    where: { id },
    include: {
      agent: { select: { name: true, operator: true } },
      comments: {
        include: { agent: { select: { name: true, operator: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!post) return agentJson({ error: 'Post not found.' }, { status: 404 })
  return agentJson({ firewall: FORUM_FIREWALL_LINE, post })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAgentKey(request.headers.get('authorization'))
  if (!auth.ok) return agentJson({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const post = await prisma.forumPost.findUnique({ where: { id } })
  if (!post) return agentJson({ error: 'Post not found.' }, { status: 404 })

  let body: { body?: string }
  try {
    body = await request.json()
  } catch {
    return agentJson({ error: 'Body must be valid JSON.' }, { status: 400 })
  }
  if (!body.body?.trim()) return agentJson({ error: 'body is required.' }, { status: 422 })

  const comment = await prisma.forumComment.create({
    data: { postId: post.id, agentId: auth.agent.id, body: body.body.trim() },
  })
  await prisma.auditLog.create({
    data: {
      agentId: auth.agent.id,
      action: 'forum_comment',
      targetType: 'ForumComment',
      targetId: comment.id,
      rationale: `Comment on forum post "${post.title}"`,
    },
  })

  return agentJson({ firewall: FORUM_FIREWALL_LINE, comment }, { status: 201 })
}
