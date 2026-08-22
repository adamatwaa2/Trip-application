/**
 * Marks an architecture test case so it can never be mistaken for a real
 * Planet Infinity trip.
 */
export function DemoBadge() {
  return (
    <span className="pi-demo-badge" title="Architecture test case — not a real trip">
      Demo data
    </span>
  );
}
