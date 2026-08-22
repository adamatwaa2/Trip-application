"use client";

import { useState } from "react";
import Link from "next/link";
import { SeatSelection } from "@/components/SeatSelection";
import { HIACE_14 } from "@/content/trips";

/**
 * Standalone seat-selection preview.
 *
 * THIS IS NOT THE UNIVERSAL BOOKING PAGE. Seat booking is rare and belongs to
 * the trips that enable it: the real path is /trips/[slug] → its booking flow,
 * which decides whether a seat step exists at all.
 *
 * The page is kept because it is a useful isolated preview of the seat map,
 * and it now renders the SAME shared <SeatSelection> component the trip flow
 * uses, rather than a second copy of the geometry.
 *
 * Preview only: nothing is sent, saved or charged.
 */
const PREVIEW_SEAT_CONFIG = {
  layout: HIACE_14,
  taken: [4, 9],
  unavailable: [],
};

export default function BookPage() {
  const [seat, setSeat] = useState<number | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [guestNames, setGuestNames] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function resetForm() {
    setSeat(null);
    setFullName("");
    setEmail("");
    setGuestNames("");
    setAgreed(false);
    setSubmitted(false);
  }

  const canSubmit =
    seat !== null && fullName.trim() !== "" && email.trim() !== "" && agreed;

  if (submitted) {
    return (
      <div className="thanks-screen">
        <div className="thanks-card">
          <div className="thanks-mark" aria-hidden="true">
            ✓
          </div>
          <h1>
            Thanks{fullName.trim() ? `, ${fullName.trim().split(" ")[0]}` : ""}!
          </h1>
          <p>
            Your seat request is in. Sit tight — the trip host will confirm it
            shortly.
          </p>
          <div className="thanks-recap">
            <div>
              <b>Seat:</b> {seat === null ? "—" : seat}
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
            Pick another seat
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
        <span className="kicker">Planet Infinity · Seat selection preview</span>
        <h1>Reserve Your Seat</h1>
        <p className="tagline">
          A standalone preview of the seat map. On a real trip, this step only
          appears when that trip enables seat booking.
        </p>
      </header>

      <div className="wrap">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) setSubmitted(true);
          }}
        >
          <div className="card">
            <h2>
              <span className="badge warm">1</span> Pick your seat
            </h2>
            <p className="sub">
              Most Planet Infinity trips do not use seat selection at all.
            </p>

            <SeatSelection
              config={PREVIEW_SEAT_CONFIG}
              selected={seat}
              onSelect={setSeat}
            />

            <div className="selected-summary">
              {seat === null
                ? "No seat picked yet — tap one above"
                : `Seat ${seat} selected`}
            </div>
          </div>

          <div className="card">
            <h2>
              <span className="badge warm">2</span> Your details
            </h2>

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
                I have read and agree to the Booking Terms &amp; Guest Policies
                <span className="placeholder-note">
                  The policy pages are not published yet.
                </span>
              </label>
            </div>

            <button className="submit-btn" type="submit" disabled={!canSubmit}>
              Request to book
            </button>
          </div>
        </form>

        <p className="preview-note">
          Visual preview — nothing is sent or saved yet.
        </p>

        <div className="footer-note">
          Looking for a real trip?{" "}
          <Link href="/trips" style={{ color: "var(--pi-cyan)", fontWeight: 700 }}>
            Browse travel →
          </Link>
        </div>
      </div>
    </>
  );
}
