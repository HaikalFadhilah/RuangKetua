export const ALLOCATION_STRATEGIES = [
  "round_robin",
  "weighted_round_robin",
  "least_used",
  "most_free",
  "custom",
] as const;

export type AllocationStrategy = (typeof ALLOCATION_STRATEGIES)[number];
export const DEFAULT_STRATEGY: AllocationStrategy = "round_robin";
