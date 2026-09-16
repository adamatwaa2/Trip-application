import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { markAllAdminNotificationsRead } from "@/app/actions/admin-notifications";
import { requireAdmin } from "@/lib/admin";
import { getAdminNotifications } from "@/lib/admin-notifications";
import { formatDate } from "@/lib/admin-requests";

export const metadata = { title: "Admin notifications" };

export default async function NotificationsPage() {
  const profile = await requireAdmin();
  const result = await getAdminNotifications();
  return <AdminShell profile={profile} current="/admin/notifications"><header className="pi-admin-page-head"><p className="pi-admin-kicker">Activity</p><h1>Notifications and follow-ups.</h1><p>New bookings, requests, payment receipts, and booking changes are kept here even when the admin panel was closed.</p></header><section className="pi-admin-section"><div className="pi-admin-section__head"><h2>Latest activity</h2><form action={markAllAdminNotificationsRead}><button className="pi-admin-button pi-admin-button--secondary" type="submit">Mark all read</button></form></div>{result.error ? <p className="pi-admin-error">Notifications could not be loaded.</p> : result.items.length ? <ol className="pi-admin-notifications">{result.items.map((item) => { const href = item.booking_id ? `/admin/bookings/${item.booking_id}` : item.request_id ? `/admin/requests/${item.request_id}` : "/admin/payments"; return <li className={item.read_at ? undefined : "is-unread"} key={item.id}><div><strong>{item.title}</strong><p>{item.body}</p><time>{formatDate(item.created_at)}</time></div><Link href={href}>View →</Link></li>; })}</ol> : <div className="pi-admin-empty">No notifications yet. New customer activity will appear here automatically.</div>}</section></AdminShell>;
}
