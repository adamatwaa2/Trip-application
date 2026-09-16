"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminNotificationLink({ current, initialUnreadCount }: { current: boolean; initialUnreadCount: number }) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  useEffect(() => {
    const supabase = createClient();
    const refreshCount = async () => {
      const { count } = await supabase.from("admin_notifications").select("id", { count: "exact", head: true }).is("read_at", null);
      if (typeof count === "number") setUnreadCount(count);
    };
    const channel = supabase
      .channel("planet-infinity-admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "admin_notifications" }, () => { void refreshCount(); })
      .subscribe((status) => { if (status === "SUBSCRIBED") void refreshCount(); });
    const interval = window.setInterval(() => { void refreshCount(); }, 30_000);
    const onVisibilityChange = () => { if (document.visibilityState === "visible") void refreshCount(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, []);
  return <Link className={current ? "is-current" : undefined} href="/admin/notifications">Notifications {unreadCount ? <span className="pi-admin-nav-badge" aria-label={`${unreadCount} unread notifications`}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}</Link>;
}
