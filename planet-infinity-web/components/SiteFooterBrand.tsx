"use client";

import { usePathname } from "next/navigation";
import { BrandLockup } from "./BrandLockup";

export function SiteFooterBrand() {
  const pathname = usePathname() ?? "/";
  return <BrandLockup tone="ivory" world={pathname.startsWith("/events") ? "events" : "general"} />;
}
