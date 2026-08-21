/**
 * The awaiting-content state of a card.
 *
 * Used when there is genuinely nothing to show yet. It deliberately does NOT
 * invent a trip or an event: no name, no destination, no date, no price. It
 * shows the shape the real content will take, and says so.
 */
export function CardPlaceholder({ label }: { label: string }) {
  return (
    <div className="pi-card pi-card--placeholder" aria-hidden="true">
      <div className="pi-media pi-media--3-2 pi-media--radius-card pi-media--empty">
        <span className="pi-media__note">Photography pending</span>
      </div>
      <div className="pi-card__body">
        <p className="pi-card__meta">
          <span className="pi-skeleton pi-skeleton--meta" />
        </p>
        <p className="pi-card__placeholder-label">{label}</p>
        <p className="pi-card__summary">
          <span className="pi-skeleton pi-skeleton--line" />
          <span className="pi-skeleton pi-skeleton--line pi-skeleton--short" />
        </p>
      </div>
    </div>
  );
}
