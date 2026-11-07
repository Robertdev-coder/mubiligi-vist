import type {
  AttendanceStatus,
  Level,
  PermissionDef,
  PermissionKey,
  Purpose,
  RegistrationStatus,
  Relationship,
  Role,
  RoleRecord,
  Trade,
} from "@/shared/types";

export const SCHOOL = {
  name: "MSGR MUBILIGI TSS",
  shortName: "Mubiligi TSS",
  project: "MUBILIGI VISIT DAY",
  district: "Huye District, Rwanda",
  phone: "+250 788 000 000",
  email: "info@mubiligi-tss.rw",
  address: "Ngoma Sector, Huye District, Southern Province, Rwanda",
  timezone: "Africa/Kigali",
  managingDirector: "Managing Director",
  dean: "Dean of Discipline",
} as const;

export const RELATIONSHIPS: { value: Relationship; label: string; hint: string }[] = [
  { value: "parent", label: "Parent", hint: "Biological or adoptive parent" },
  { value: "guardian", label: "Guardian", hint: "Legally responsible guardian" },
  { value: "relative", label: "Relative", hint: "Brother, sister, uncle, aunt, etc." },
  { value: "other", label: "Other", hint: "Any other authorized visitor" },
];

export const TRADES: { value: Trade; label: string; description: string }[] = [
  { value: "SOD", label: "SOD", description: "Software Development" },
  { value: "MMP", label: "MMP", description: "Multimedia Production" },
  { value: "CSA", label: "CSA", description: "Computer Systems & Architecture" },
  { value: "NIT", label: "NIT", description: "Networking & Internet Technology" },
];

export const LEVELS: { value: Level; label: string }[] = [
  { value: "L3", label: "Level 3 (L3)" },
  { value: "L4", label: "Level 4 (L4)" },
  { value: "L5", label: "Level 5 (L5)" },
];

export const PURPOSES: { value: Purpose; label: string }[] = [
  { value: "academic", label: "Academic progress" },
  { value: "discipline", label: "Discipline" },
  { value: "financial", label: "Financial matters" },
  { value: "welfare", label: "Student welfare" },
  { value: "consultation", label: "General consultation" },
  { value: "other", label: "Other" },
];

export const REGISTRATION_STATUSES: { value: RegistrationStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export const ATTENDANCE_STATUSES: { value: AttendanceStatus; label: string }[] = [
  { value: "expected", label: "Expected" },
  { value: "arrived", label: "Arrived" },
  { value: "on_campus", label: "On campus" },
  { value: "departed", label: "Departed" },
  { value: "no_show", label: "No show" },
];

export const PERMISSIONS: PermissionDef[] = [
  {
    key: "dashboard.view",
    label: "View dashboard",
    group: "General",
    description: "Access the dashboard and summary statistics.",
  },
  {
    key: "registrations.view",
    label: "View registrations",
    group: "Registrations",
    description: "Browse registration records and visitor details.",
  },
  {
    key: "registrations.create",
    label: "Create registrations",
    group: "Registrations",
    description: "Register visitors for a visit day.",
  },
  {
    key: "registrations.edit",
    label: "Edit registrations",
    group: "Registrations",
    description: "Update registration status and details.",
  },
  {
    key: "registrations.delete",
    label: "Delete registrations",
    group: "Registrations",
    description: "Permanently delete registration records.",
  },
  {
    key: "attendance.view",
    label: "View attendance",
    group: "Attendance",
    description: "View arrivals, departures and attendance status.",
  },
  {
    key: "attendance.create",
    label: "Record arrivals",
    group: "Attendance",
    description: "Mark visitors as arrived.",
  },
  {
    key: "attendance.edit",
    label: "Edit attendance",
    group: "Attendance",
    description: "Correct or update attendance records.",
  },
  {
    key: "attendance.delete",
    label: "Delete attendance",
    group: "Attendance",
    description: "Remove attendance records.",
  },
  {
    key: "reports.view",
    label: "View reports",
    group: "Reports",
    description: "Open attendance reports and summaries.",
  },
  {
    key: "reports.generate",
    label: "Generate reports",
    group: "Reports",
    description: "Build custom reports using date and record filters.",
  },
  {
    key: "reports.export",
    label: "Export reports",
    group: "Reports",
    description: "Download reports as Word or PDF files.",
  },
  {
    key: "reports.print",
    label: "Print reports",
    group: "Reports",
    description: "Use the printable report register.",
  },
  {
    key: "reports.email",
    label: "Email reports",
    group: "Reports",
    description: "Send reports to the Dean by email.",
  },
  {
    key: "users.view",
    label: "View users",
    group: "Users & Roles",
    description: "Browse user accounts and their access.",
  },
  {
    key: "users.create",
    label: "Create users",
    group: "Users & Roles",
    description: "Add new staff accounts.",
  },
  {
    key: "users.edit",
    label: "Edit users",
    group: "Users & Roles",
    description: "Update user details, roles and account status.",
  },
  {
    key: "users.delete",
    label: "Delete users",
    group: "Users & Roles",
    description: "Remove staff accounts.",
  },
  {
    key: "roles.manage",
    label: "Manage roles",
    group: "Users & Roles",
    description: "Create roles and edit their permissions.",
  },
  {
    key: "permissions.assign",
    label: "Assign permissions",
    group: "Users & Roles",
    description: "Grant or revoke permissions for individual users.",
  },
  {
    key: "settings.manage",
    label: "Manage settings",
    group: "Administration",
    description: "Configure visit days, email and reporting settings.",
  },
  {
    key: "audit.view",
    label: "View audit logs",
    group: "Administration",
    description: "Review every important administrative action.",
  },
  {
    key: "records.archive",
    label: "Archive records",
    group: "Record management",
    description: "Move outdated or incorrect records to the archive.",
  },
  {
    key: "records.restore",
    label: "Restore records",
    group: "Record management",
    description: "Restore archived records.",
  },
  {
    key: "records.delete",
    label: "Permanently delete records",
    group: "Record management",
    description: "Permanently erase archived records.",
  },
];

export const PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((permission) => permission.key);

export const PERMISSION_GROUPS: { group: string; permissions: PermissionDef[] }[] = PERMISSIONS.reduce(
  (groups, permission) => {
    const existing = groups.find((entry) => entry.group === permission.group);
    if (existing) {
      existing.permissions.push(permission);
    } else {
      groups.push({ group: permission.group, permissions: [permission] });
    }
    return groups;
  },
  [] as { group: string; permissions: PermissionDef[] }[],
);

export const PERMISSION_LABEL: Record<string, string> = PERMISSIONS.reduce(
  (labels, permission) => {
    labels[permission.key] = permission.label;
    return labels;
  },
  {} as Record<string, string>,
);

export const DEFAULT_ROLES: RoleRecord[] = [
  {
    key: "admin",
    name: "Super Administrator",
    description: "Full system access. Always keeps every permission.",
    is_system: true,
    created_at: "",
    updated_at: "",
  },
  {
    key: "dean",
    name: "Dean of Discipline",
    description: "Reviews visitors, attendance and reports.",
    is_system: true,
    created_at: "",
    updated_at: "",
  },
  {
    key: "prefect",
    name: "Prefect",
    description: "Registers arriving parents and records departures.",
    is_system: true,
    created_at: "",
    updated_at: "",
  },
  {
    key: "registration_staff",
    name: "Registration Staff",
    description: "Registers visitors and records attendance.",
    is_system: true,
    created_at: "",
    updated_at: "",
  },
  {
    key: "readonly_staff",
    name: "Read-only Staff",
    description: "Can view records and reports but cannot change them.",
    is_system: true,
    created_at: "",
    updated_at: "",
  },
];

export const ROLES: { value: Role; label: string }[] = DEFAULT_ROLES.map((role) => ({
  value: role.key,
  label: role.name,
}));

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  admin: [...PERMISSION_KEYS],
  dean: [
    "dashboard.view",
    "registrations.view",
    "registrations.create",
    "registrations.edit",
    "registrations.delete",
    "attendance.view",
    "attendance.create",
    "attendance.edit",
    "reports.view",
    "reports.generate",
    "reports.export",
    "reports.print",
    "reports.email",
    "audit.view",
  ],
  prefect: [
    "dashboard.view",
    "registrations.view",
    "registrations.create",
    "attendance.view",
    "attendance.create",
    "attendance.edit",
  ],
  registration_staff: [
    "dashboard.view",
    "registrations.view",
    "registrations.create",
    "registrations.edit",
    "attendance.view",
    "attendance.create",
    "attendance.edit",
    "reports.view",
    "reports.print",
  ],
  readonly_staff: [
    "dashboard.view",
    "registrations.view",
    "attendance.view",
    "reports.view",
  ],
};

export const RELATIONSHIP_LABEL: Record<Relationship, string> = {
  parent: "Parent",
  guardian: "Guardian",
  relative: "Relative",
  other: "Other",
};

export const TRADE_LABEL: Record<Trade, string> = {
  SOD: "SOD",
  MMP: "MMP",
  CSA: "CSA",
  NIT: "NIT",
};

export const TRADE_DESCRIPTION: Record<Trade, string> = {
  SOD: "Software Development",
  MMP: "Multimedia Production",
  CSA: "Computer Systems & Architecture",
  NIT: "Networking & Internet Technology",
};

export const PURPOSE_LABEL: Record<Purpose, string> = {
  academic: "Academic progress",
  discipline: "Discipline",
  financial: "Financial matters",
  welfare: "Student welfare",
  consultation: "General consultation",
  other: "Other",
};

export const REGISTRATION_STATUS_LABEL: Record<RegistrationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  expected: "Expected",
  arrived: "Arrived",
  on_campus: "On campus",
  departed: "Departed",
  no_show: "No show",
};

export const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  confirmed: "bg-blue-50 text-blue-700 ring-blue-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  expected: "bg-slate-100 text-slate-600 ring-slate-200",
  arrived: "bg-sky-50 text-sky-700 ring-sky-200",
  on_campus: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  departed: "bg-slate-100 text-slate-600 ring-slate-200",
  no_show: "bg-red-50 text-red-700 ring-red-200",
};

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  description: string;
  permission: PermissionKey;
}

export const NAV_ITEMS: NavItem[] = [
  {
    path: "",
    label: "Dashboard",
    icon: "LayoutDashboard",
    description: "Overview",
    permission: "dashboard.view",
  },
  {
    path: "/registrations",
    label: "Registrations",
    icon: "ClipboardList",
    description: "Manage all visits",
    permission: "registrations.view",
  },
  {
    path: "/attendance",
    label: "Attendance",
    icon: "UserCheck",
    description: "Arrivals & departures",
    permission: "attendance.view",
  },
  {
    path: "/reports",
    label: "Reports",
    icon: "FileBarChart",
    description: "Print & export",
    permission: "reports.view",
  },
  {
    path: "/users",
    label: "Users",
    icon: "Users",
    description: "Staff accounts & access",
    permission: "users.view",
  },
  {
    path: "/roles",
    label: "Roles & Permissions",
    icon: "ShieldCheck",
    description: "Dynamic access control",
    permission: "roles.manage",
  },
  {
    path: "/audit",
    label: "Audit Logs",
    icon: "ScrollText",
    description: "Every admin action",
    permission: "audit.view",
  },
  {
    path: "/archive",
    label: "Archive",
    icon: "Archive",
    description: "Archived records",
    permission: "records.restore",
  },
  {
    path: "/settings",
    label: "Settings",
    icon: "Settings",
    description: "Visit days, email & reports",
    permission: "settings.manage",
  },
];

export function workspaceFor(role: Role): string {
  return role === "dean" ? "/dean" : "/admin";
}

export function navItemsFor(
  permissions: PermissionKey[],
  role: Role,
): (NavItem & { href: string })[] {
  const base = workspaceFor(role);
  return NAV_ITEMS.filter((item) => permissions.includes(item.permission)).map((item) => ({
    ...item,
    href: `${base}${item.path}`,
  }));
}

export function can(permissions: PermissionKey[], permission: PermissionKey): boolean {
  return permissions.includes(permission);
}

export const DEMO_CREDENTIALS = [
  { role: "Administrator", email: "admin@mubiligi.rw", password: "Admin@12345" },
  { role: "Dean of Discipline", email: "dean@mubiligi.rw", password: "Dean@12345" },
];
