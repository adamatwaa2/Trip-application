"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SiteFooterFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const events = pathname.startsWith("/events");
  return <footer className={`pi-night pi-footer${events ? " pi-footer--events" : ""}`}>{children}</footer>;
}
