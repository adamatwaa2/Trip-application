import type { ReactNode } from "react";
import "./admin.css";

// Admin routes depend on per-request Auth cookies and must never be cached as
// a shared static response, even while local Supabase variables are absent.
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="pi-admin">{children}</div>;
}
