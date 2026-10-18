import { notFound } from "next/navigation";
import { PlanningRequestForm } from "@/components/PlanningRequestForm";
import { PLANNING_TYPES, type PlanningKind } from "@/content/planning-requests";
import "@/app/admin/admin.css";
import "@/app/site-management.css";
export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  return { title: Object.hasOwn(PLANNING_TYPES, kind) ? PLANNING_TYPES[kind as PlanningKind].label : "Request", robots: { index: false, follow: true } };
}
export default async function PlanningPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!Object.hasOwn(PLANNING_TYPES, kind)) notFound();
  return <div className="pi-management-wrap"><PlanningRequestForm kind={kind as PlanningKind} /></div>;
}
