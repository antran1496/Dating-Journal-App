/**
 * Anti-abuse internal quota limits for AI and high-frequency features.
 * Note: These are internal abuse prevention limits, NOT tied to any subscription or paid tier.
 */
export const LIMITS = {
  CUPID_PER_DAY: 200,
  READING_PER_DAY: 30,
} as const;

export type FeatureLimitKey = keyof typeof LIMITS;
