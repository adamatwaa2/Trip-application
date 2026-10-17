import { notFound } from "next/navigation";
import { SiteManagementPreview } from "@/components/SiteManagementPreview";
import "@/app/admin/admin.css";
import "@/app/site-management.css";
export const metadata = { title: "Local website preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default function Preview() {
  if (process.env.NODE_ENV !== "development" || process.env.PI_LOCAL_PREVIEW !== "1") notFound();
  return <SiteManagementPreview />;
}
