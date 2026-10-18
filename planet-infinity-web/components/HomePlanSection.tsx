import Link from "next/link";
import { Container } from "./Container";
import type { SiteCopy } from "@/content/site-copy";
import "@/app/home-plan.css";

export function HomePlanSection({ copy }: { copy: SiteCopy }) {
  const items = [
    { title: "Prom", detail: copy.plan_prom_detail, href: "prom", cta: copy.home_prom_cta },
    { title: "Senior Trip", detail: copy.plan_senior_detail, href: "senior", cta: "Request a Senior Trip" },
    { title: "Universities & Groups", detail: copy.plan_groups_detail, href: "university", cta: "Plan a University Trip", extra: { href: "group", cta: "Plan a Group Trip" } },
    { title: "Companies", detail: copy.plan_companies_detail, href: "company", cta: "Plan a Company Trip", extra: { href: "team-building", cta: "Team Building & Events" } },
    { title: "Schools", detail: copy.plan_schools_detail, href: "school", cta: "Request a School Trip" },
  ];
  return <section className="pi-home-plan" id="plan" aria-labelledby="home-plan-heading"><Container>
    <header className="pi-home-plan__head"><div><h2 id="home-plan-heading">{copy.home_plan_title}</h2><p>{copy.home_plan_lede}</p></div><Link href="/requests">Trip and Event Requests →</Link></header>
    <div className="pi-home-plan__grid">{items.map((item, index) => <article key={item.href}><span className="pi-home-plan__number" aria-hidden="true">0{index + 1}</span><h3>{item.title}</h3><p>{item.detail}</p><Link href={`/requests?category=${item.href}`}>{item.cta} →</Link>{item.extra ? <Link href={`/requests?category=${item.extra.href}`}>{item.extra.cta} →</Link> : null}</article>)}</div>
  </Container></section>;
}
