"use client";
import { useState } from "react";
import { PRESENTATION_DEFAULTS } from "@/content/site-presentation";
import { PLANNING_TYPES, type PlanningInput, type PlanningKind } from "@/content/planning-requests";
import { PlanningRequestForm } from "./PlanningRequestForm";
import { SitePresentationEditor } from "./SitePresentationEditor";
import { AdminSiteCopyForm } from "./AdminSiteCopyForm";
import { SITE_COPY_DEFAULTS } from "@/content/site-copy";

type PreviewRequest = { reference: string; input: PlanningInput; status: string };
export function SiteManagementPreview() {
  const [tab, setTab] = useState("overview");
  const [presentation, setPresentation] = useState(PRESENTATION_DEFAULTS);
  const [requests, setRequests] = useState<PreviewRequest[]>([]);
  function receive(input: PlanningInput) {
    const reference = `PREVIEW-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
    setRequests(current => [...current, { reference, input, status: "pending" }]);
    return reference;
  }
  return <div className="pi-management-wrap">
    <p className="pi-eyebrow">Planet Infinity · Website management</p><h1>A simpler way to plan.</h1>
    <p>Trip enquiries, event planning and website controls — together, without changing how existing bookings work.</p>
    <div className="pi-preview-notice" dir="rtl">دي معاينة محلية فقط. جرّب الفورم والإعدادات: الطلبات هتظهر في صندوق المعاينة هنا، من غير إرسال أو حفظ على الموقع الحقيقي. تحديث الصفحة يمسح التجربة.</div>
    <nav className="pi-preview-tabs" aria-label="Website preview sections">{[["overview", "Overview"], ...Object.entries(PLANNING_TYPES).map(([key, info]) => [key, info.label]), ["inbox", `Request inbox (${requests.length})`], ["settings", "Website controls"]].map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {tab === "overview" ? <><div className="pi-planning-options">{Object.entries(PLANNING_TYPES).map(([key, info]) => <article className="pi-planning-card" key={key}><h2>{info.label}</h2><p>{info.description}</p><button className="pi-btn" onClick={() => setTab(key)}>Preview form →</button></article>)}</div><section className="pi-planning-card"><h2>Coming soon</h2><p>App · V-hubs · V-houses</p><p>No invented launch dates, prices or unavailable booking links.</p></section></> : null}
    {Object.hasOwn(PLANNING_TYPES, tab) ? <PlanningRequestForm key={tab} kind={tab as PlanningKind} preview onPreviewSubmit={receive} /> : null}
    {tab === "inbox" ? <section className="pi-planning-card pi-preview-inbox"><h2>Request inbox — preview only</h2><p>In the live version, these requests use the existing protected Requests section, not a separate customer database.</p>{!requests.length ? <p>No preview requests yet. Try one of the forms first.</p> : requests.map(request => <article key={request.reference}><strong>{request.reference} · {PLANNING_TYPES[request.input.kind].label}</strong><p>{request.input.fullName} · {request.input.email} · {request.input.phone}</p><p>{request.input.organisationName} {request.input.destination} · {request.input.guestCount} guests</p><p>Preferred date: {request.input.preferredDate || "Not decided"} · {request.input.flexible ? "Flexible" : "Fixed"}</p><p>Budget: {request.input.budget || "Not provided"} · {request.input.services.join(", ")}</p><p>{request.input.notes}</p><label>Status <select value={request.status} onChange={e => setRequests(current => current.map(item => item.reference === request.reference ? { ...item, status: e.target.value } : item))}>{["pending", "accepted", "rejected", "confirmed"].map(status => <option key={status}>{status}</option>)}</select></label></article>)}</section> : null}
    {tab === "settings" ? <section className="pi-planning-card"><h2>Website controls</h2><p>These same controls are prepared under Admin → Pages. Here, changes only update this preview.</p><SitePresentationEditor initial={presentation} preview onPreviewSave={setPresentation} /><section className="pi-preview-footer"><p>{presentation.footerBrand}</p><div className="pi-preview-footer-columns">{presentation.columns.map((column, index) => <div key={index}><h3>{column.title}</h3>{column.items.filter(item => item.visible).map((item, i) => <p key={i}>{item.label}{item.soon ? " · Coming soon" : ` → ${item.href}`}</p>)}</div>)}</div>{presentation.showApp ? <><h3>{presentation.appTitle}</h3><p>{presentation.appDescription}</p></> : null}</section><details><summary>Website copy: Home, Explore & contact</summary><AdminSiteCopyForm initial={SITE_COPY_DEFAULTS} preview fieldKeys={["home_eyebrow", "home_title", "home_lede", "explore_title", "explore_lede", "footer_tagline", "contact_whatsapp", "contact_email", "contact_address"]} /></details></section> : null}
  </div>;
}
