import Link from "next/link";

export type Crumb = {
  label: string;
  /** Omit on the current page. */
  href?: string;
};

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav className="pi-crumbs" aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.label}>
              {crumb.href && !isLast ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
