"use client";

import { useState } from "react";
import Link from "next/link";

/** Preview-only: these seats render as already booked. */
const TAKEN_SEATS = [4, 9];

/** Toyota Hiace, 14 seats: two-on-the-left + aisle + one-on-the-right rows. */
const CABIN_ROWS: { left: number[]; right: number[] }[] = [
  { left: [2, 3], right: [4] },
  { left: [5, 6], right: [7] },
  { left: [8, 9], right: [10] },
];
const BACK_ROW = [11, 12, 13, 14];

export default function BookPage() {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [guestNames, setGuestNames] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleSeat(seat: number) {
    if (TAKEN_SEATS.includes(seat)) return;
    setSelectedSeats((current) =>
      current.includes(seat)
        ? current.filter((s) => s !== seat)
        : [...current, seat].sort((a, b) => a - b)
    );
  }

  function resetForm() {
    setSelectedSeats([]);
    setFullName("");
    setEmail("");
    setGuestNames("");
    setAgreed(false);
    setSubmitted(false);
  }

  const canSubmit =
    selectedSeats.length > 0 &&
    fullName.trim() !== "" &&
    email.trim() !== "" &&
    agreed;

  function renderSeat(seat: number) {
    const taken = TAKEN_SEATS.includes(seat);
    const selected = selectedSeats.includes(seat);
    return (
      <button
        key={seat}
        type="button"
        className={`seat${selected ? " selected" : ""}${taken ? " taken" : ""}`}
        aria-pressed={selected}
        aria-disabled={taken}
        aria-label={
          taken ? `Seat ${seat}, already taken` : `Seat ${seat}, available`
        }
        onClick={() => toggleSeat(seat)}
      >
        <span className="seat-num">{seat}</span>
      </button>
    );
  }

  if (submitted) {
    return (
      <div className="thanks-screen">
        <div className="thanks-card">
          <div className="thanks-mark" aria-hidden="true">
            ✓
          </div>
          <h1>
            Thanks{fullName.trim() ? `, ${fullName.trim().split(" ")[0]}` : ""}! 🚐
          </h1>
          <p>
            Your seat request is in. Sit tight — the trip host will confirm it
            shortly.
          </p>
          <div className="thanks-recap">
            <div>
              <b>Seats:</b>{" "}
              {selectedSeats.length ? selectedSeats.join(", ") : "—"}
            </div>
            <div>
              <b>Name:</b> {fullName || "—"}
            </div>
            <div>
              <b>Email:</b> {email || "—"}
            </div>
            <div className="multiline">
              <b>Other guests:</b> {guestNames || "—"}
            </div>
          </div>
          <button className="ghost-btn" type="button" onClick={resetForm}>
            Book another seat
          </button>
          <p className="preview-note">
            Preview only — nothing was sent or saved anywhere.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="pi-page-intro">
        <span className="kicker">Planet Infinity · Good vibes, good times</span>
        <h1>Reserve Your Seat — [Trip Name]</h1>
        <p className="tagline">
          Toyota Hiace · 14 seats · We don&apos;t sell rides. We sell the day
          you&apos;ll keep talking about.
        </p>
      </header>

      <div className="wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) setSubmitted(true);
          }}
        >
          {/* 1 — seat map */}
          <div className="card">
            <h2>
              <span className="badge warm">1</span> Pick Your Seat
            </h2>
            <p className="sub">
              Every seat, same price — front row doesn&apos;t cost extra
            </p>

            <div className="van">
              <div className="van-label">▲ Front of the van</div>

              <div className="seat-row">
                <div className="driver">
                  <span>Driver</span>
                </div>
                {renderSeat(1)}
              </div>

              {CABIN_ROWS.map((row) => (
                <div className="seat-row" key={row.left.join("-")}>
                  <div className="seat-group">{row.left.map(renderSeat)}</div>
                  {row.right.map(renderSeat)}
                </div>
              ))}

              <div className="seat-row back-row">{BACK_ROW.map(renderSeat)}</div>

              <div className="van-label bottom">Back of the van ▼</div>

              <div className="legend">
                <span>
                  <i className="dot driver-dot" /> Driver
                </span>
                <span>
                  <i className="dot available" /> Available
                </span>
                <span>
                  <i className="dot selected" /> Selected
                </span>
                <span>
                  <i className="dot taken" /> Taken
                </span>
              </div>
            </div>

            <div className="selected-summary">
              {selectedSeats.length === 0
                ? "No seat picked yet — tap one above"
                : `Selected: ${selectedSeats.join(", ")} (${
                    selectedSeats.length
                  } seat${selectedSeats.length > 1 ? "s" : ""})`}
            </div>
          </div>

          {/* 2 — guest details */}
          <div className="card">
            <h2>
              <span className="badge warm">2</span> You In?
            </h2>
            <p className="sub">So we know who&apos;s in the van</p>

            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Ahmed Mohamed"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. ahmed@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label htmlFor="guestNames">
              Other guest names <span className="opt">(optional)</span>
            </label>
            <textarea
              id="guestNames"
              placeholder="One name per line, if you're booking for friends"
              value={guestNames}
              onChange={(e) => setGuestNames(e.target.value)}
            />

            <div className="agree-row">
              <input
                id="agreeTerms"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <label htmlFor="agreeTerms">
                I&apos;ve read and I agree to the Terms &amp; Conditions
                <span className="placeholder-note">
                  Placeholder — the Booking Terms &amp; Guest Policies PDF gets
                  linked here later.
                </span>
              </label>
            </div>

            <button className="submit-btn" type="submit" disabled={!canSubmit}>
              Confirm Booking
            </button>
          </div>
        </form>

        <p className="preview-note">
          Visual preview — confirming doesn&apos;t send or save anything yet.
        </p>

        <div className="footer-note">
          Once you send this, sit tight for confirmation from the trip host.
          <br />
          Planet Infinity Entertainment · Dahab · South Sinai
          <br />
          <Link href="/apply" style={{ color: "var(--cyan)", fontWeight: 700 }}>
            Go to trip application →
          </Link>
        </div>
      </div>
    </>
  );
}
