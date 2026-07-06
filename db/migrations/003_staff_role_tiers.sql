-- Remap legacy staff tiers → developer, admin, support

UPDATE staff_members
SET role_tier = 'developer'
WHERE lower(role_tier) IN ('owner', 'developer', 'dev');

UPDATE staff_members
SET role_tier = 'admin'
WHERE lower(role_tier) IN ('manager', 'admin');

UPDATE staff_members
SET role_tier = 'support'
WHERE lower(role_tier) IN ('team', 'mod', 'support', 'mod/support', 'moderator');
