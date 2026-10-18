import { AdminShell } from "@/components/AdminShell";
import { AdminSiteCopyForm } from "@/components/AdminSiteCopyForm";
import { AdminCareersFormEditor } from "@/components/AdminCareersFormEditor";
import type { SiteCopy } from "@/content/site-copy";
import { requireAdmin } from "@/lib/admin";
import { getSiteCopy } from "@/lib/site-copy";
import { getCareersFormFields } from "@/lib/careers-form";
import { getSitePresentation } from "@/lib/site-presentation";
import { SitePresentationEditor } from "@/components/SitePresentationEditor";
import "@/app/site-management.css";

export const metadata = { title: "Page editor" };

const pageKeys: Array<keyof SiteCopy> = [
  "home_plan_title", "home_plan_lede", "home_senior_cta", "home_prom_cta",
  "plan_prom_detail", "plan_senior_detail", "plan_groups_detail", "plan_companies_detail", "plan_schools_detail",
  "home_eyebrow", "home_title", "home_lede", "home_trips_cta", "home_events_cta",
  "trips_title", "trips_lede", "events_title", "events_lede",
  "themes_eyebrow", "themes_title", "themes_lede",
  "explore_title", "explore_lede",
  "careers_eyebrow", "careers_title", "careers_subtitle", "careers_lede",
  "careers_roles_question", "careers_roles_options", "careers_music_question", "careers_music_options",
  "contact_title", "contact_lede",
  "footer_tagline",
  "contact_whatsapp", "contact_email", "contact_address", "contact_office_hours", "contact_emergency",
];

export default async function AdminPagesPage() {
  const [profile, copy, careersFields] = await Promise.all([requireAdmin(), getSiteCopy(), getCareersFormFields()]);
  const presentation = await getSitePresentation();
  return (
    <AdminShell profile={profile} current="/admin/pages">
      <header className="pi-admin-page-head">
        <p className="pi-admin-kicker">Page editor</p>
        <h1>Edit the public pages without touching code.</h1>
        <p>Home and page headers, introductions, Careers choices, Themes, Explore, Contact and the footer are collected here.</p>
      </header>
      <section className="pi-admin-section">
        <h2>Website appearance, footer & SEO</h2>
        <SitePresentationEditor initial={presentation} />
      </section>
      <section className="pi-admin-section">
        <h2>Website copy</h2>
        <AdminSiteCopyForm initial={copy} fieldKeys={pageKeys} />
      </section>
      <section className="pi-admin-section">
        <div className="pi-admin-section__head"><div><p className="pi-admin-kicker">Careers</p><h2>Application questions</h2></div></div>
        <p className="pi-admin-help">Add, remove, pause, reorder and edit every Careers question and its choices. Contact details and private photo upload stay as protected basics.</p>
        <AdminCareersFormEditor initial={careersFields} />
      </section>
    </AdminShell>
  );
}
