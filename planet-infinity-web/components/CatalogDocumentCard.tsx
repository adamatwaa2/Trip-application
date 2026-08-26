type CatalogDocumentCardProps = {
  url: string;
  label: string;
  kind: "trip" | "event";
};

export function CatalogDocumentCard({
  url,
  label,
  kind,
}: CatalogDocumentCardProps) {
  return (
    <a
      className="pi-document-card"
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${label} in a new tab`}
    >
      <span className="pi-document-card__mark" aria-hidden="true">
        PDF
      </span>
      <span className="pi-document-card__copy">
        <span className="pi-document-card__eyebrow">{kind} document</span>
        <strong>{label}</strong>
        <span>Open the full information in a clean PDF.</span>
      </span>
      <span className="pi-document-card__action" aria-hidden="true">
        View PDF ↗
      </span>
    </a>
  );
}
