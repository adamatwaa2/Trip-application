import Link from "next/link";
import "@/app/planning-highlights.css";

const highlights = [
  { title: "Prom", detail: "Your night, designed around you.", links: [{ label: "Plan Your Prom", category: "prom" }] },
  { title: "Senior Trip", detail: "One class. A new chapter.", links: [{ label: "Plan a senior trip", category: "senior" }] },
  { title: "Universities & Groups", detail: "Bring your people together.", links: [{ label: "University trips", category: "university" }, { label: "Group trips", category: "group" }] },
  { title: "Companies", detail: "Trips, events and team building.", links: [{ label: "Company trips", category: "company" }, { label: "Team building", category: "team-building" }] },
  { title: "Schools", detail: "A day beyond the classroom.", links: [{ label: "School trips", category: "school" }] },
];
export function HomePlanningLinks() {
  return <section className="pi-planning-highlights" aria-labelledby="planning-highlights-title"><div className="pi-planning-highlights__heading"><p>Made for your people</p><h2 id="planning-highlights-title">Your next story. Let’s plan it.</h2></div><div className="pi-planning-highlights__grid">{highlights.map(item => <article key={item.title}><h3>{item.title}</h3><p>{item.detail}</p><div>{item.links.map(link => <Link key={link.category} href={`/requests?category=${link.category}`}>{link.label} →</Link>)}</div></article>)}</div></section>;
}
