import Link from "next/link";
import type { ReactNode } from "react";
import { AdminSignOut } from "./AdminSignOut";
import { AdminNotificationLink } from "./AdminNotificationLink";
import type { AdminProfile } from "@/lib/admin";
import { getAdminNotificationCount } from "@/lib/admin-notifications";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/trips", label: "Trips" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/team", label: "Admin team" },
];

export async function AdminShell({
  profile,
  current,
  children,
}: {
  profile: AdminProfile;
  current: string;
  children: ReactNode;
}) {
  const unreadCount = await getAdminNotificationCount();
  return (
    <div className="pi-admin-shell">
      <aside className="pi-admin-sidebar">
        <Link className="pi-admin-brand" href="/admin">
          <span aria-hidden="true">∞</span>
          <strong>Planet Infinity</strong>
          <small>Admin</small>
        </Link>
        <nav aria-label="Admin navigation">
          {nav.slice(0, 4).map((item) => (
            <Link
              className={current === item.href ? "is-current" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <AdminNotificationLink current={current === "/admin/notifications"} initialUnreadCount={unreadCount} />
          {nav.slice(4).map((item) => (
            <Link
              className={current === item.href ? "is-current" : undefined}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="pi-admin-user">
          <span>{profile.full_name || "Administrator"}</span>
          <AdminSignOut />
        </div>
      </aside>
      <main className="pi-admin-main">{children}</main>
    </div>
  );
}
