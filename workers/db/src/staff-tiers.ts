export const STAFF_TIER_DEFAULT = "support";

export const STAFF_TIER_ORDER_SQL = `
  CASE role_tier
    WHEN 'developer' THEN 0
    WHEN 'admin' THEN 1
    WHEN 'support' THEN 2
    ELSE 3
  END
`;
