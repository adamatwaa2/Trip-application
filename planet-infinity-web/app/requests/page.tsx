import { PlanningRequestHub } from "@/components/PlanningRequestHub";
import { getPageSeoMetadata } from "@/lib/site-presentation";
import "@/app/site-management.css";
import "@/app/admin/admin.css";
export function generateMetadata() { return getPageSeoMetadata("/requests", "Trip and Event Requests", "Request an individual trip, a company or institution trip, or event planning with Planet Infinity."); }
export default function RequestsHub() {
  return <div className="pi-management-wrap"><PlanningRequestHub /></div>;
}
