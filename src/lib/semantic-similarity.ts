/**
 * Optional semantic-similarity layer (Layer 2 of the equivalency blend).
 *
 * Uses a local sentence-embedding model (default all-MiniLM-L6-v2 via
 * transformers.js, ~23MB quantized, downloaded on first use and cached).
 * Loaded lazily and defensively: when the model or package is unavailable
 * (e.g. a serverless runtime without the dev dependency), callers get null
 * and fall back to the lexical layer — nothing at request time hard-requires
 * the model.
 */

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>
}

let cachedProvider: Promise<EmbeddingProvider | null> | undefined

export function getEmbeddingProvider(): Promise<EmbeddingProvider | null> {
  cachedProvider ??= (async () => {
    try {
      const { pipeline } = await import('@huggingface/transformers')
      const configured = process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2'
      const model = configured.includes('/') ? configured : `Xenova/${configured}`
      const extractor = await pipeline('feature-extraction', model, { dtype: 'q8' })
      return {
        async embed(texts: string[]): Promise<number[][]> {
          const output = await extractor(texts, { pooling: 'mean', normalize: true })
          return output.tolist() as number[][]
        },
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Semantic embedding layer unavailable (${message}); using lexical similarity only.`)
      return null
    }
  })()
  return cachedProvider
}

/** Cosine similarity; assumes normalized vectors (as produced above). */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
