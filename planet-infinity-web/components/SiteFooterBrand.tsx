"use client";

import { usePathname } from "next/navigation";
import { eventBrandLogo } from "@/lib/event-branding";
import { BrandLockup } from "./BrandLockup";

export function SiteFooterBrand({ logo = "" }: { logo?: string }) {
  const pathname = usePathname() ?? "/";
  const experienceLogo = eventBrandLogo(pathname);
  return <BrandLockup tone="ivory" height={experienceLogo ? 44 : 34} logoOverride={experienceLogo || logo} world={pathname.startsWith("/events") ? "events" : "general"} />;
}
