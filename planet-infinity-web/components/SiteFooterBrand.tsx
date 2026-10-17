"use client";

import { usePathname } from "next/navigation";
import { BrandLockup } from "./BrandLockup";

export function SiteFooterBrand({ logo = "" }: { logo?: string }) {
  const pathname = usePathname() ?? "/";
  return <BrandLockup tone="ivory" logoOverride={logo} world={pathname.startsWith("/events") ? "events" : "general"} />;
}
