export type Role = "admin" | "seller";

export type UserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
};

const FALLBACK_ADMIN_EMAIL = "admin@warungpedia.id";

const adminEmails = [process.env.NEXT_PUBLIC_ADMIN_EMAIL || FALLBACK_ADMIN_EMAIL];

export const inferRole = (user?: UserLike | null): Role | undefined => {
  if (!user) return undefined;
  const userMetaRole = typeof user.user_metadata?.role === "string" ? user.user_metadata.role : undefined;
  const appMetaRole = typeof user.app_metadata?.role === "string" ? user.app_metadata.role : undefined;
  const resolvedRole = userMetaRole || appMetaRole;
  if (resolvedRole === "admin" || resolvedRole === "seller") return resolvedRole;
  if (user.email && adminEmails.includes(user.email)) return "admin";
  return undefined;
};

export const dashboardPathByRole = (role?: Role): string | undefined => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller") return "/penjual/dashboard";
  return undefined;
};
