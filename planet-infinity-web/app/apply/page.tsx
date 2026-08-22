"use client";

import { useState } from "react";
import Link from "next/link";

const MUSIC_TASTES = [
  "Mahraganat",
  "Arabic / Shaabi",
  "Techno / House",
  "R&B / Chill",
  "Rock",
  "Anything, I'm easy",
];

const TRAVELED_BEFORE = [
  "Yeah, more than once",
  "Once",
  "Nope, first time",
];

export default function ApplyPage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [instagram, setInstagram] = useState("");
  const [music, setMusic] = useState("");
  const [travelledBefore, setTravelledBefore] = useState("");
  const [why, setWhy] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    age.trim() !== "" &&
    music !== "" &&
    travelledBefore !== "" &&
    agreed;

  function resetForm() {
    setFullName("");
    setPhone("");
    setAge("");
    setInstagram("");
    setMusic("");
    setTravelledBefore("");
    setWhy("");
    setAgreed(false);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="thanks-screen">
        <div className="thanks-card">
          <div className="thanks-mark" aria-hidden="true">
            ✓
          </div>
          <h1>Thanks{fullName.trim() ? `, ${fullName.trim().split(" ")[0]}` : ""}! 🌍</h1>
          <p>
            Your application is in. We review every one and get back to you fast —
            if you&apos;re in, you&apos;ll get a link to pick your seat next.
          </p>
          <div className="thanks-recap">
            <div>
              <b>Name:</b> {fullName || "—"}
            </div>
            <div>
              <b>Mobile / WhatsApp:</b> {phone || "—"}
            </div>
            <div>
              <b>Age:</b> {age || "—"}
            </div>
            <div>
              <b>Instagram:</b> {instagram || "—"}
            </div>
            <div>
              <b>Music taste:</b> {music || "—"}
            </div>
            <div>
              <b>Travelled with us before:</b> {travelledBefore || "—"}
            </div>
            <div>
              <b>Why join:</b> {why || "—"}
            </div>
          </div>
          <button className="ghost-btn" type="button" onClick={resetForm}>
            Back to the form
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
        <h1>Apply to Join — [Trip Name]</h1>
        <p className="tagline">
          Not everyone rides with us — we curate the crew, not just fill seats.
        </p>
      </header>

      <div className="wrap">
        <div className="card intro-card">
          <p>
            Everyone who rolls with us on a trip vibes the same way — so before we
            lock your seat, we like to know who&apos;s coming. Fill this out,
            we&apos;ll review it, and get back to you fast.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit) setSubmitted(true);
          }}
        >
          {/* 1 — basics */}
          <div className="card">
            <h2>
              <span className="badge warm">1</span> Tell Us About You
            </h2>
            <p className="sub">The basics, so we can actually reach you</p>

            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Sarah Ahmed"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <label htmlFor="phone">Mobile / WhatsApp</label>
            <input
              id="phone"
              type="tel"
              placeholder="+20 1xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <label htmlFor="age">Age</label>
            <input
              id="age"
              type="number"
              placeholder="e.g. 24"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <label htmlFor="instagram">
              Instagram <span className="opt">(optional)</span>
            </label>
            <input
              id="instagram"
              type="text"
              placeholder="@username"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>

          {/* 2 — vibe */}
          <div className="card">
            <h2>
              <span className="badge warm">2</span> What&apos;s Your Vibe?
            </h2>
            <p className="sub">
              So we can match you with people on the same wavelength
            </p>

            <label id="musicLabel">Your music taste — pick what fits</label>
            <div className="chip-group" role="group" aria-labelledby="musicLabel">
              {MUSIC_TASTES.map((taste) => (
                <button
                  key={taste}
                  type="button"
                  className={`chip${music === taste ? " selected" : ""}`}
                  aria-pressed={music === taste}
                  onClick={() => setMusic(taste)}
                >
                  {taste}
                </button>
              ))}
            </div>

            <label htmlFor="travelledBefore">
              Have you traveled with us before?
            </label>
            <select
              id="travelledBefore"
              value={travelledBefore}
              onChange={(e) => setTravelledBefore(e.target.value)}
            >
              <option value="">Choose...</option>
              {TRAVELED_BEFORE.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label htmlFor="why">Why do you want to join? (a few words)</label>
            <textarea
              id="why"
              placeholder="e.g. Need to escape the routine and meet new people..."
              value={why}
              onChange={(e) => setWhy(e.target.value)}
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
          </div>

          <button className="submit-btn" type="submit" disabled={!canSubmit}>
            Submit
          </button>
        </form>

        <p className="preview-note">
          Visual preview — submitting doesn&apos;t send or save anything yet.
        </p>

        <div className="footer-note">
          Getting your application doesn&apos;t mean you&apos;re auto-approved — we
          review every one and reply.
          <br />
          Planet Infinity Entertainment
          <br />
          <Link href="/book" style={{ color: "var(--cyan)", fontWeight: 700 }}>
            Go to seat booking →
          </Link>
        </div>
      </div>
    </>
  );
}
