import Link from "next/link";

export function ExploreUniverse({ tripCount, eventCount }: { tripCount: number; eventCount: number }) {
  return (
    <div className="pi-universe">
      <div className="pi-universe__planet-wrap" aria-hidden="true">
        <div className="pi-universe__ring pi-universe__ring--one" />
        <div className="pi-universe__ring pi-universe__ring--two" />
        <div className="pi-universe__planet"><span>∞</span></div>
      </div>
      <div className="pi-universe__worlds">
        <Link href="/trips" className="pi-universe__world pi-universe__world--travel">
          <span className="pi-universe__number">01 · Travel</span>
          <h2>Follow the horizon.</h2>
          <p>Desert departures, camp nights and experiences built around a real place and date.</p>
          <strong>{tripCount > 0 ? `${tripCount} open now` : "Next departure coming soon"}</strong>
        </Link>
        <Link href="/events" className="pi-universe__world pi-universe__world--events">
          <span className="pi-universe__number">02 · Events</span>
          <h2>Change the energy.</h2>
          <p>Daytime gatherings, creative sessions and nights that transform with the people in them.</p>
          <strong>{eventCount > 0 ? `${eventCount} announced` : "Next event taking shape"}</strong>
        </Link>
      </div>
    </div>
  );
}
