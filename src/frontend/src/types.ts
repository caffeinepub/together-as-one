export type ViewType =
  | "login"
  | "register"
  | "member-dashboard"
  | "transactions"
  | "my-loans"
  | "admin-dashboard"
  | "admin-members"
  | "admin-member-detail"
  | "admin-pending-loans"
  | "admin-pending-deposits";

export interface StoredUser {
  id: string;
  name: string;
  role: string;
  email: string;
  savings: string; // bigint serialized as string
  lastLogin: string; // bigint serialized as string
}

export function formatAmount(amount: bigint): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(timestamp: bigint): string {
  return new Date(Number(timestamp) / 1_000_000).toLocaleString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
