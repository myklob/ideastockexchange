// Client-safe caps for the public /demo playground (no server imports, so
// the browser UI and the routes share one source of truth).

export const DEMO_MAX_MESSAGES = 30
export const DEMO_MAX_TRANSCRIPT_CHARS = 6000
export const DEMO_MAX_ACTIONS_PER_REQUEST = 10
export const DEMO_DAILY_IMPORT_CAP = 200
export const DEMO_IMPORTS_PER_MINUTE = 6
export const DEMO_REVIEWS_PER_MINUTE = 20
