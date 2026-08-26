"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { submitPublicRequest } from "@/app/actions/requests";
import { PolicyAcceptance } from "@/components/PolicyAcceptance";

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

const SMOKING_OPTIONS = ["No", "Occasionally", "Yes"];

function ApplyForm() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("product") ?? undefined;
  const queryTitle = (searchParams.get("title") ?? "").trim().slice(0, 160);
  const productType = ["trip", "event"].includes(searchParams.get("type") ?? "")
    ? (searchParams.get("type") as "trip" | "event")
    : undefined;
  const subjectTitle = queryTitle || "Planet Infinity application";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [instagram, setInstagram] = useState("");
  const [jobOrStudy, setJobOrStudy] = useState("");
  const [music, setMusic] = useState("");
  const [travelledBefore, setTravelledBefore] = useState("");
  const [smoking, setSmoking] = useState("");
  const [heardAbout, setHeardAbout] = useState("");
  const [why, setWhy] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    email.trim() !== "" &&
    age.trim() !== "" &&
    jobOrStudy.trim() !== "" &&
    music !== "" &&
    travelledBefore !== "" &&
    smoking !== "" &&
    agreed;

  function resetForm() {
    setFullName("");
    setPhone("");
    setEmail("");
    setAge("");
    setInstagram("");
    setJobOrStudy("");
    setMusic("");
    setTravelledBefore("");
    setSmoking("");
    setHeardAbout("");
    setWhy("");
    setAgreed(false);
    setWhatsappOptIn(false);
    setSubmitted(false);
    setRequestNumber(null);
    setSubmitError(null);
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
          {requestNumber ? <p className="preview-note">Request reference: {requestNumber}</p> : null}
          <div className="thanks-recap">
            <div>
              <b>Name:</b> {fullName || "—"}
            </div>
            <div>
              <b>Mobile / WhatsApp:</b> {phone || "—"}
            </div>
            <div>
              <b>Email:</b> {email || "—"}
            </div>
            <div>
              <b>Age:</b> {age || "—"}
            </div>
            <div>
              <b>Instagram:</b> {instagram || "—"}
            </div>
            <div>
              <b>Job / study:</b> {jobOrStudy || "—"}
            </div>
            <div>
              <b>Music taste:</b> {music || "—"}
            </div>
            <div>
              <b>Travelled with us before:</b> {travelledBefore || "—"}
            </div>
            <div>
              <b>Smoking:</b> {smoking || "—"}
            </div>
            <div>
              <b>Heard about us:</b> {heardAbout || "—"}
            </div>
            <div>
              <b>Why join:</b> {why || "—"}
            </div>
          </div>
          <button className="ghost-btn" type="button" onClick={resetForm}>
            Back to the form
          </button>
          <p className="preview-note">Your application has been saved.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="pi-page-intro">
        <span className="kicker">Planet Infinity · Good vibes, good times</span>
        <h1>Apply to Join{queryTitle ? ` — ${queryTitle}` : ""}</h1>
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
            if (!canSubmit) return;
            setSubmitError(null);
            startTransition(async () => {
              const result = await submitPublicRequest({
                requestType: "application",
                productId,
                subjectTitle,
                fullName,
                email,
                phone,
                termsAccepted: agreed,
                whatsappOptIn,
                selections: {
                  age,
                  instagram,
                  jobOrStudy,
                  music,
                  travelledBefore,
                  smoking,
                  heardAbout,
                  why,
                  ...(productType ? { productType } : {}),
                },
              });
              if (!result.ok) {
                setSubmitError(result.error);
                return;
              }
              setRequestNumber(result.requestNumber);
              setSubmitted(true);
            });
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

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. sarah@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

            <label htmlFor="jobOrStudy">What do you do — work or study?</label>
            <input
              id="jobOrStudy"
              type="text"
              placeholder="e.g. Designer / Engineering student"
              value={jobOrStudy}
              onChange={(e) => setJobOrStudy(e.target.value)}
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

            <label htmlFor="smoking">Do you smoke?</label>
            <select id="smoking" value={smoking} onChange={(e) => setSmoking(e.target.value)}>
              <option value="">Choose...</option>
              {SMOKING_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>

            <label htmlFor="why">Why do you want to join? (a few words)</label>
            <textarea
              id="why"
              placeholder="e.g. Need to escape the routine and meet new people..."
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />

            <label htmlFor="heardAbout">How did you hear about Planet Infinity? <span className="opt">(optional)</span></label>
            <input
              id="heardAbout"
              type="text"
              placeholder="Instagram, a friend, an earlier trip..."
              value={heardAbout}
              onChange={(e) => setHeardAbout(e.target.value)}
            />

            <PolicyAcceptance
              id="applicationPolicyAcceptance"
              scope="application"
              checked={agreed}
              onChange={setAgreed}
            />
            <label className="agree-row" htmlFor="applicationWhatsappOptIn">
              <input id="applicationWhatsappOptIn" type="checkbox" checked={whatsappOptIn} onChange={(event) => setWhatsappOptIn(event.target.checked)} />
              <span>If approved and booked, send only the final Booking Confirmation and its PDF to this number on WhatsApp.</span>
            </label>
          </div>

          <button className="submit-btn" type="submit" disabled={!canSubmit || isPending}>
            {isPending ? "Sending…" : "Submit"}
          </button>
          {submitError ? <p className="pi-flow__error" role="alert">{submitError}</p> : null}
        </form>

        <p className="preview-note">
          We review every application and reply either way.
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

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="thanks-screen">Loading application…</div>}>
      <ApplyForm />
    </Suspense>
  );
}
