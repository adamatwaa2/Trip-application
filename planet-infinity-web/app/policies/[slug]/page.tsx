import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import {
  getPolicyPage,
  POLICY_DOCUMENTS,
  POLICY_PAGES,
  type PolicyBlock,
  type PolicyDocument,
} from "@/content/policies";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return POLICY_PAGES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const policy = getPolicyPage((await params).slug);
  if (!policy) return {};
  return {
    title: policy.title,
    description: `${policy.title} for Planet Infinity bookings and guest experiences.`,
  };
}

function PolicyBlockView({ block }: { block: PolicyBlock }) {
  if (block.kind === "paragraph") return <p>{block.text}</p>;
  const List = block.ordered ? "ol" : "ul";
  return (
    <List>
      {block.items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </List>
  );
}

function StructuredPolicy({ policy }: { policy: PolicyDocument }) {
  return (
    <>
      {policy.intro.map((paragraph) => (
        <p className="pi-policy-lede" key={paragraph}>
          {paragraph}
        </p>
      ))}
      {policy.sections.map((section) => (
        <section className="pi-policy-section" key={`${section.number ?? "section"}-${section.title}`}>
          <header className="pi-policy-section__head">
            {section.number ? <span>{section.number}</span> : null}
            <h2>{section.title}</h2>
          </header>
          <div className="pi-policy-section__copy">
            {section.blocks.map((block, index) => (
              <PolicyBlockView block={block} key={`${block.kind}-${index}`} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = getPolicyPage(slug);
  if (!fallback) notFound();

  let title = fallback.title;
  let version = fallback.sourceStatus === "supplied"
    ? "Supplied policy pack"
    : fallback.sourceStatus === "owner-requested"
      ? "Privacy notice · 25 August 2026"
      : "Requires approval";
  let body = "";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("policies")
      .select("title, version, body")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (data?.body?.trim()) {
      title = data.title;
      version = data.version;
      body = data.body;
    }
  }

  const hasStoredPolicy = body.trim().length > 0;
  const hasBundledPolicy = fallback.sourceStatus !== "requires-approval";
  const currentIndex = POLICY_DOCUMENTS.findIndex((policy) => policy.slug === fallback.slug);
  const previous = currentIndex > 0 ? POLICY_DOCUMENTS[currentIndex - 1] : null;
  const next = currentIndex < POLICY_DOCUMENTS.length - 1 ? POLICY_DOCUMENTS[currentIndex + 1] : null;

  return (
    <article className="pi-legal">
      <header className="pi-page-intro pi-legal__intro">
        <span className="kicker">Planet Infinity · Guest policy</span>
        <h1>{title}</h1>
        <p className="tagline">{version}</p>
      </header>

      <Container size="read">
        <nav className="pi-policy-breadcrumb" aria-label="Policy navigation">
          <Link href="/policies">All policies</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{fallback.shortTitle}</span>
        </nav>

        <div className="pi-policy-body">
          {hasStoredPolicy ? (
            <div className="pi-policy-stored-copy">
              {body
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
                ))}
            </div>
          ) : hasBundledPolicy ? (
            <StructuredPolicy policy={fallback} />
          ) : (
            <div className="pi-policy-alert pi-policy-alert--blocking" role="alert">
              <strong>Approved Privacy Policy required.</strong>
              <p>
                The supplied Booking Terms & Guest Policies pack does not include privacy
                wording. This page is intentionally not filled with generated legal copy.
              </p>
              <p>
                An approved Privacy Policy must be published before checkout and payment can be
                opened.
              </p>
            </div>
          )}
        </div>

        <nav className="pi-policy-pager" aria-label="More policies">
          {previous ? (
            <Link href={`/policies/${previous.slug}`}>← {previous.shortTitle}</Link>
          ) : (
            <span />
          )}
          {next ? <Link href={`/policies/${next.slug}`}>{next.shortTitle} →</Link> : <span />}
        </nav>
      </Container>
    </article>
  );
}
