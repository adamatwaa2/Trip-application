import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

// Admin routes depend on per-request Auth cookies and must never be cached as
// a shared static response, even while local Supabase variables are absent.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="pi-admin">{children}</div>;
}
