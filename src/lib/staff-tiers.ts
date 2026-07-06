export const STAFF_TIERS = [
  { key: "developer", label: "Developer" },
  { key: "admin", label: "Admin" },
  { key: "support", label: "Mod / Support" },
] as const;

export type StaffTier = (typeof STAFF_TIERS)[number]["key"];

export const STAFF_TIER_DEFAULT: StaffTier = "support";

/** SQL fragment for tier display order: developer → admin → support */
export const STAFF_TIER_ORDER_SQL = `
  CASE role_tier
    WHEN 'developer' THEN 0
    WHEN 'admin' THEN 1
    WHEN 'support' THEN 2
    ELSE 3
  END
`;

export function staffTierLabel(tier: string): string {
  return STAFF_TIERS.find((t) => t.key === tier)?.label ?? tier;
}
