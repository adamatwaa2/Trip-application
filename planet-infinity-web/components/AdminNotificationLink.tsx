"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminNotificationLink({ current, initialUnreadCount }: { current: boolean; initialUnreadCount: number }) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("planet-infinity-admin-notifications").on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, () => setUnreadCount((count) => count + 1)).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  return <Link className={current ? "is-current" : undefined} href="/admin/notifications">Notifications {unreadCount ? <span className="pi-admin-nav-badge" aria-label={`${unreadCount} unread notifications`}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</Link>;
}
