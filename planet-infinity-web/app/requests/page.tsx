import Link from "next/link";
import { PLANNING_TYPES } from "@/content/planning-requests";
import { getPageSeoMetadata } from "@/lib/site-presentation";
import "@/app/site-management.css";
export function generateMetadata() { return getPageSeoMetadata("/requests", "Plan a trip or event", "Request an individual trip, a company or institution trip, or event planning with Planet Infinity."); }
export default function RequestsHub() {
  return <div className="pi-management-wrap"><p className="pi-eyebrow">Made around you</p><h1>What are we planning?</h1><p>Tell us your idea. We’ll help with the details.</p><div className="pi-planning-options">{Object.entries(PLANNING_TYPES).map(([key, item]) => <Link className="pi-planning-card" key={key} href={`/requests/${key}`}><h2>{item.label}</h2><p>{item.description}</p><span>Start your request →</span></Link>)}</div></div>;
}
