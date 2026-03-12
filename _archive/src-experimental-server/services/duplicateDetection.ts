import { prisma } from '../index';
import { Argument } from '@prisma/client';

/**
 * Find similar arguments using basic text similarity
 * In production, this should use more sophisticated NLP/embedding techniques
 */
export async function findSimilarArguments(argument: Argument, threshold: number = 0.7) {
  // Get all arguments from the same debate
  const candidates = await prisma.argument.findMany({
    where: {
      debateId: argument.debateId,
      id: { not: argument.id },
      status: 'PUBLISHED',
      isDeleted: false,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  // Calculate similarity scores
  const results = candidates
    .map(candidate => ({
      argument: candidate,
      similarity: calculateTextSimilarity(argument.content, candidate.content),
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5); // Top 5 most similar

  return results;
}

/**
 * Simple Jaccard similarity for text
 * For production, use proper NLP libraries or embedding models
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * More sophisticated similarity using Levenshtein distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

export function calculateLevenshteinSimilarity(text1: string, text2: string): number {
  const distance = levenshteinDistance(text1, text2);
  const maxLength = Math.max(text1.length, text2.length);
  return 1 - distance / maxLength;
}
