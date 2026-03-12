/**
 * ReasonRank Dependency Graph — In-Memory Graph Store
 *
 * An in-memory property graph that models the dependency topology
 * described in the TDD. Designed as a standalone module that can
 * later be backed by Neo4j without changing the public API.
 *
 * Operations:
 * - Node CRUD (Claim, Argument, Evidence)
 * - Edge CRUD (SUPPORTS, ATTACKS, HAS_EVIDENCE, SIMILAR_TO)
 * - Traversal (parents, children, evidence, siblings)
 */

import type {
  GraphNode, GraphEdge, ClaimNode, ArgumentNode, EvidenceNode,
  SupportsEdge, AttacksEdge, HasEvidenceEdge, SimilarToEdge,
  EdgeType,
} from './types'

export class DependencyGraph {
  private nodes: Map<string, GraphNode> = new Map()
  private edges: Map<string, GraphEdge> = new Map()

  // Adjacency indexes for fast traversal
  /** Edges where node is the source (outgoing) */
  private outEdges: Map<string, Set<string>> = new Map()
  /** Edges where node is the target (incoming) */
  private inEdges: Map<string, Set<string>> = new Map()

  // ─── Node Operations ─────────────────────────────────────────

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node)
    if (!this.outEdges.has(node.id)) this.outEdges.set(node.id, new Set())
    if (!this.inEdges.has(node.id)) this.inEdges.set(node.id, new Set())
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id)
  }

  getClaim(id: string): ClaimNode | undefined {
    const node = this.nodes.get(id)
    return node?.type === 'CLAIM' ? node : undefined
  }

  getArgument(id: string): ArgumentNode | undefined {
    const node = this.nodes.get(id)
    return node?.type === 'ARGUMENT' ? node : undefined
  }

  getEvidence(id: string): EvidenceNode | undefined {
    const node = this.nodes.get(id)
    return node?.type === 'EVIDENCE' ? node : undefined
  }

  updateNode(id: string, updates: Partial<GraphNode>): void {
    const node = this.nodes.get(id)
    if (!node) throw new Error(`Node ${id} not found`)
    this.nodes.set(id, { ...node, ...updates } as GraphNode)
  }

  removeNode(id: string): void {
    // Remove all connected edges first
    const outgoing = this.outEdges.get(id)
    if (outgoing) {
      for (const edgeId of outgoing) {
        this.removeEdge(edgeId)
      }
    }
    const incoming = this.inEdges.get(id)
    if (incoming) {
      for (const edgeId of incoming) {
        this.removeEdge(edgeId)
      }
    }
    this.nodes.delete(id)
    this.outEdges.delete(id)
    this.inEdges.delete(id)
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values())
  }

  getNodesByType<T extends GraphNode>(type: T['type']): T[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type) as T[]
  }

  // ─── Edge Operations ─────────────────────────────────────────

  addEdge(edge: GraphEdge): void {
    if (!this.nodes.has(edge.sourceId)) {
      throw new Error(`Source node ${edge.sourceId} not found`)
    }
    if (!this.nodes.has(edge.targetId)) {
      throw new Error(`Target node ${edge.targetId} not found`)
    }
    this.edges.set(edge.id, edge)
    this.outEdges.get(edge.sourceId)!.add(edge.id)
    this.inEdges.get(edge.targetId)!.add(edge.id)
  }

  getEdge(id: string): GraphEdge | undefined {
    return this.edges.get(id)
  }

  updateEdge(id: string, updates: Partial<GraphEdge>): void {
    const edge = this.edges.get(id)
    if (!edge) throw new Error(`Edge ${id} not found`)
    this.edges.set(id, { ...edge, ...updates } as GraphEdge)
  }

  removeEdge(id: string): void {
    const edge = this.edges.get(id)
    if (!edge) return
    this.outEdges.get(edge.sourceId)?.delete(id)
    this.inEdges.get(edge.targetId)?.delete(id)
    this.edges.delete(id)
  }

  // ─── Traversal ───────────────────────────────────────────────

  /**
   * Get all child arguments that SUPPORT a given node.
   * Returns the argument nodes along with their edge data.
   */
  getSupporters(nodeId: string): Array<{ argument: ArgumentNode; edge: SupportsEdge }> {
    const results: Array<{ argument: ArgumentNode; edge: SupportsEdge }> = []
    const incoming = this.inEdges.get(nodeId)
    if (!incoming) return results

    for (const edgeId of incoming) {
      const edge = this.edges.get(edgeId)
      if (edge?.type === 'SUPPORTS') {
        const arg = this.getArgument(edge.sourceId)
        if (arg) results.push({ argument: arg, edge: edge as SupportsEdge })
      }
    }
    return results
  }

  /**
   * Get all child arguments that ATTACK a given node.
   */
  getAttackers(nodeId: string): Array<{ argument: ArgumentNode; edge: AttacksEdge }> {
    const results: Array<{ argument: ArgumentNode; edge: AttacksEdge }> = []
    const incoming = this.inEdges.get(nodeId)
    if (!incoming) return results

    for (const edgeId of incoming) {
      const edge = this.edges.get(edgeId)
      if (edge?.type === 'ATTACKS') {
        const arg = this.getArgument(edge.sourceId)
        if (arg) results.push({ argument: arg, edge: edge as AttacksEdge })
      }
    }
    return results
  }

  /**
   * Get all evidence linked to an argument.
   */
  getEvidenceFor(argumentId: string): EvidenceNode[] {
    const results: EvidenceNode[] = []
    const outgoing = this.outEdges.get(argumentId)
    if (!outgoing) return results

    for (const edgeId of outgoing) {
      const edge = this.edges.get(edgeId)
      if (edge?.type === 'HAS_EVIDENCE') {
        const ev = this.getEvidence(edge.targetId)
        if (ev) results.push(ev)
      }
    }
    return results
  }

  /**
   * Get all arguments similar to a given argument.
   * Returns similarity edges to compute uniqueness penalty.
   */
  getSimilarArguments(argumentId: string): Array<{ argument: ArgumentNode; similarityScore: number }> {
    const results: Array<{ argument: ArgumentNode; similarityScore: number }> = []

    // Check both directions of SIMILAR_TO edges
    const outgoing = this.outEdges.get(argumentId)
    if (outgoing) {
      for (const edgeId of outgoing) {
        const edge = this.edges.get(edgeId)
        if (edge?.type === 'SIMILAR_TO') {
          const arg = this.getArgument(edge.targetId)
          if (arg) results.push({ argument: arg, similarityScore: (edge as SimilarToEdge).similarityScore })
        }
      }
    }

    const incoming = this.inEdges.get(argumentId)
    if (incoming) {
      for (const edgeId of incoming) {
        const edge = this.edges.get(edgeId)
        if (edge?.type === 'SIMILAR_TO') {
          const arg = this.getArgument(edge.sourceId)
          if (arg) results.push({ argument: arg, similarityScore: (edge as SimilarToEdge).similarityScore })
        }
      }
    }

    return results
  }

  /**
   * Get all parent nodes of a given node (nodes that this node supports/attacks).
   */
  getParents(nodeId: string): Array<{ node: GraphNode; edge: GraphEdge }> {
    const results: Array<{ node: GraphNode; edge: GraphEdge }> = []
    const outgoing = this.outEdges.get(nodeId)
    if (!outgoing) return results

    for (const edgeId of outgoing) {
      const edge = this.edges.get(edgeId)
      if (edge && (edge.type === 'SUPPORTS' || edge.type === 'ATTACKS')) {
        const node = this.nodes.get(edge.targetId)
        if (node) results.push({ node, edge })
      }
    }
    return results
  }

  /**
   * Get all sibling arguments (arguments that share the same parent).
   */
  getSiblings(argumentId: string): ArgumentNode[] {
    const parents = this.getParents(argumentId)
    const siblings = new Set<string>()

    for (const { node: parent } of parents) {
      const supporters = this.getSupporters(parent.id)
      const attackers = this.getAttackers(parent.id)
      for (const { argument } of [...supporters, ...attackers]) {
        if (argument.id !== argumentId) {
          siblings.add(argument.id)
        }
      }
    }

    return Array.from(siblings)
      .map(id => this.getArgument(id))
      .filter((a): a is ArgumentNode => a !== undefined)
  }

  /**
   * Get all children (supporters + attackers) of a node.
   */
  getChildren(nodeId: string): Array<{ argument: ArgumentNode; edge: SupportsEdge | AttacksEdge }> {
    return [
      ...this.getSupporters(nodeId),
      ...this.getAttackers(nodeId),
    ]
  }

  // ─── Graph Metrics ───────────────────────────────────────────

  get nodeCount(): number {
    return this.nodes.size
  }

  get edgeCount(): number {
    return this.edges.size
  }

  /**
   * Check if adding an edge would create a cycle.
   * The dependency graph must remain a DAG.
   */
  wouldCreateCycle(sourceId: string, targetId: string): boolean {
    if (sourceId === targetId) return true

    // BFS from target to see if we can reach source
    const visited = new Set<string>()
    const queue = [targetId]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === sourceId) return true
      if (visited.has(current)) continue
      visited.add(current)

      const outgoing = this.outEdges.get(current)
      if (outgoing) {
        for (const edgeId of outgoing) {
          const edge = this.edges.get(edgeId)
          if (edge && (edge.type === 'SUPPORTS' || edge.type === 'ATTACKS')) {
            queue.push(edge.targetId)
          }
        }
      }
    }

    return false
  }

  /** Clear the entire graph */
  clear(): void {
    this.nodes.clear()
    this.edges.clear()
    this.outEdges.clear()
    this.inEdges.clear()
  }
}
