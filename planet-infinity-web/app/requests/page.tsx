import { PlanningRequestHub } from "@/components/PlanningRequestHub";
import { getRequestCategory } from "@/content/planning-requests";
import { getPageSeoMetadata } from "@/lib/site-presentation";
import "@/app/site-management.css";
import "@/app/admin/admin.css";
export function generateMetadata() { return getPageSeoMetadata("/requests", "Trip and Event Requests", "Request an individual trip, a company or institution trip, or event planning with Planet Infinity."); }
export default async function RequestsHub({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const category = getRequestCategory((await searchParams).category)?.id;
  return <div className="pi-management-wrap"><PlanningRequestHub key={category ?? "default"} initialCategory={category} preview={process.env.PI_LOCAL_PREVIEW === "1"} /></div>;
}
