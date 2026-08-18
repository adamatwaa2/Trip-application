import Link from "next/link";

export default function Home() {
  return (
    <main>
      <header className="site-header warm">
        <span className="kicker">Planet Infinity · Good vibes, good times</span>
        <h1>Planet Infinity — Web Preview</h1>
        <p className="tagline">
          Two pages, visual preview only. Nothing is sent or saved yet.
        </p>
      </header>

      <div className="wrap">
        <div className="landing-grid">
          <Link href="/apply" className="landing-link">
            <div className="card">
              <h2>
                <span className="badge nova">1</span> Trip Application — /apply
              </h2>
              <p>
                Tell us who you are, your vibe, and why you want in. Submitting
                shows a thanks screen.
              </p>
            </div>
          </Link>

          <Link href="/book" className="landing-link">
            <div className="card">
              <h2>
                <span className="badge warm">2</span> Seat Booking — /book
              </h2>
              <p>
                14-seat Hiace map with seats 4 and 9 already taken, plus guest
                details and a thanks screen.
              </p>
            </div>
          </Link>
        </div>

        <div className="footer-note">
          Planet Infinity Entertainment · Dahab · South Sinai
        </div>
      </div>
    </main>
  );
}
