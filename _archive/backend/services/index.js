/**
 * Services Index
 *
 * Centralized export of all services for easy importing
 */

export { default as argumentExtractionService } from './argumentExtractionService.js';
export { default as argumentDecomposerService } from './argumentDecomposerService.js';
export { default as argumentClassifierService } from './argumentClassifierService.js';
export { default as strengthScoringService } from './strengthScoringService.js';
export { default as taxonomyService } from './taxonomyService.js';
export { default as beliefGenerator } from './beliefGenerator.js';
export { default as wikipediaService } from './wikipediaService.js';
export { default as topicTypeClassifier } from './topicTypeClassifier.js';

// Named exports for classes
export { ArgumentExtractionService } from './argumentExtractionService.js';
export { ArgumentDecomposerService } from './argumentDecomposerService.js';
export { ArgumentClassifierService } from './argumentClassifierService.js';
export { StrengthScoringService } from './strengthScoringService.js';
