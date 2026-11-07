import type { PermissionKey, UserPermissionOverride } from "@/shared/types";
import { PERMISSION_KEYS } from "@/shared/constants";

export function computePermissions(
  roleKey: string,
  rolePermissions: PermissionKey[],
  overrides: UserPermissionOverride[] = [],
): PermissionKey[] {
  if (roleKey === "admin") return [...PERMISSION_KEYS];

  const effective = new Set(rolePermissions);
  for (const override of overrides) {
    if (override.allowed) {
      effective.add(override.permission_key);
    } else {
      effective.delete(override.permission_key);
    }
  }
  return PERMISSION_KEYS.filter((key) => effective.has(key));
}

export function hasPermission(user: { permissions: PermissionKey[] } | null, key: PermissionKey): boolean {
  return Boolean(user?.permissions.includes(key));
}
