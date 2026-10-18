"use client";
import { useState } from "react";
import { REQUEST_CATEGORIES, getRequestCategory, type PlanningInput, type RequestCategory } from "@/content/planning-requests";
import { PlanningRequestForm } from "./PlanningRequestForm";

export function PlanningRequestHub({ preview = false, onPreviewSubmit }: { preview?: boolean; onPreviewSubmit?: (input: PlanningInput) => string }) {
  const [world, setWorld] = useState<"trips" | "events">("trips");
  const [category, setCategory] = useState<RequestCategory | "">("");
  const chosen = getRequestCategory(category);
  return <section aria-labelledby="planning-hub-heading">
    <h1 id="planning-hub-heading">Trip and Event Requests</h1>
    <p>Choose what you’d like to plan. We’ll take it from there.</p>
    <div className="pi-preview-tabs" role="group" aria-label="Request world">
      {(["trips", "events"] as const).map(item => <button key={item} type="button" aria-pressed={world === item} onClick={() => { setWorld(item); setCategory(""); }}>{item === "trips" ? "Trips" : "Events"}</button>)}
    </div>
    <p className="pi-admin-help">{world === "trips" ? "Senior trips, school outings, university trips and custom escapes." : "Proms, private celebrations, company events and team building."}</p>
    <label className="pi-request-category">{world === "trips" ? "Trip category" : "Event category"}<select value={category} onChange={event => setCategory(event.target.value as RequestCategory | "")}><option value="">Choose a category</option>{REQUEST_CATEGORIES.filter(item => item.world === world).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    {chosen ? <PlanningRequestForm key={chosen.id} kind={chosen.kind} category={chosen.id} preview={preview} onPreviewSubmit={onPreviewSubmit} /> : <p className="pi-admin-help">Select a category to open the right form. This is an enquiry, not a paid booking.</p>}
  </section>;
}
