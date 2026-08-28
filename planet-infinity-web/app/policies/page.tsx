import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { POLICY_DOCUMENTS } from "@/content/policies";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Planet Infinity booking terms, payment, cancellation, refund, trip etiquette and privacy information.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesPage() {
  return (
    <div className="pi-legal">
      <header className="pi-page-intro pi-legal__intro">
        <span className="kicker">Planet Infinity · Guest documentation</span>
        <h1>Policies, clearly stated.</h1>
        <p className="tagline">
          Read the documents that apply before you send a request, reserve a seat, or make a
          payment.
        </p>
      </header>

      <Container>
        <nav className="pi-policy-grid" aria-label="Planet Infinity policies">
          {POLICY_DOCUMENTS.map((policy) => (
            <Link className="pi-policy-card" href={`/policies/${policy.slug}`} key={policy.slug}>
              <span
                className={`pi-policy-card__status pi-policy-card__status--${
                  policy.sourceStatus !== "requires-approval" ? "ready" : "missing"
                }`}
              >
                {policy.sourceStatus === "supplied"
                  ? "Policy text supplied"
                  : policy.sourceStatus === "owner-requested"
                    ? "Website privacy notice"
                    : "Approval required"}
              </span>
              <h2>{policy.title}</h2>
              <p>{policy.sourcePart}</p>
              <span className="pi-policy-card__action">Read policy →</span>
            </Link>
          ))}
        </nav>

        <aside className="pi-policy-alert" role="note">
          <strong>Every booking policy has its own page and version.</strong>
          <p>Acceptance is recorded with the request so the applicable wording remains traceable.</p>
        </aside>
      </Container>
    </div>
  );
}
