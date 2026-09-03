"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitPublicRequest } from "@/app/actions/requests";

/**
 * Careers — the hiring flow.
 *
 * Deliberately not /apply. /apply is a guest asking for a seat on a trip;
 * this is someone asking to work with us. Same house, different door.
 *
 * The questions are shaped around what actually decides a hire here:
 * character, energy, reliability and whether someone can carry a group.
 * Experience is asked for, but it is not the gate.
 */

const SKILLS = [
  "Communication",
  "Leadership",
  "Organising",
  "Content creation",
  "Photography & video",
  "Social media",
  "Sales",
  "Customer service",
  "Trip leading",
  "Events",
  "Something else",
];

const MUSIC_TASTES = [
  "Mahraganat",
  "Arabic / Shaabi",
  "Techno / House",
  "R&B / Chill",
  "Rock",
  "Anything, I'm easy",
];

const CURRENT_STATUS = ["Working", "University", "Freelance", "Between things", "Other"];
const TRAVEL_FREQUENCY = ["Rarely", "Sometimes", "Often", "Very often"];
const YES_NO_DEPENDS = ["Yes", "No", "Depends"];
const YES_NO = ["Yes", "No"];
const EXPERIENCE_ANSWER = ["Yes", "No, but I learn fast"];

export default function CareersPage() {
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [aboutYou, setAboutYou] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [music, setMusic] = useState("");
  const [hasExperience, setHasExperience] = useState("");
  const [experience, setExperience] = useState("");
  const [travelFrequency, setTravelFrequency] = useState("");
  const [travelsForWork, setTravelsForWork] = useState("");
  const [overnight, setOvernight] = useState("");
  const [limitations, setLimitations] = useState("");
  const [limitationsDetail, setLimitationsDetail] = useState("");
  const [why, setWhy] = useState("");
  const [consent, setConsent] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSubmit =
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    email.trim() !== "" &&
    location.trim() !== "" &&
    currentStatus !== "" &&
    aboutYou.trim() !== "" &&
    skills.length > 0 &&
    travelFrequency !== "" &&
    travelsForWork !== "" &&
    overnight !== "" &&
    why.trim() !== "" &&
    consent;

  function toggleSkill(skill: string) {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
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
            Thanks{fullName.trim() ? `, ${fullName.trim().split(" ")[0]}` : ""} — we
            have it 🌍
          </h1>
          <p>
            We read every single one of these ourselves. If your energy fits what
            we&apos;re building, we&apos;ll reach out on WhatsApp or email.
          </p>
          {requestNumber ? (
            <p className="preview-note">Your reference: {requestNumber}</p>
          ) : null}
          <p className="preview-note">
            Keep an eye on your phone — we usually move fast.
          </p>
          <Link href="/" className="ghost-btn">
            Back to Planet Infinity
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="pi-page-intro">
        <span className="kicker">Planet Infinity · Careers</span>
        <h1>Join the story</h1>
        <p className="tagline">We&apos;re looking for characters, not employees.</p>
      </header>

      <div className="wrap">
        <div className="card intro-card">
          <p>
            We don&apos;t hire CVs. We hire people — the ones with a bit of soul,
            who make a bus of strangers feel like a family by hour two. Tell us
            who you are, what you&apos;re good at, and how you move through the
            world. Experience helps. Personality decides.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            setSubmitError(null);
            startTransition(async () => {
              const result = await submitPublicRequest({
                requestType: "application",
                subjectTitle: `Careers — ${fullName.trim()}`,
                fullName,
                email,
                phone,
                termsAccepted: consent,
                whatsappOptIn,
                notes: `CAREER APPLICATION — ${fullName.trim()}`,
                selections: {
                  kind: "career",
                  birthDate,
                  location,
                  instagram,
                  currentStatus,
                  aboutYou,
                  skills,
                  music,
                  hasExperience,
                  experience,
                  travelFrequency,
                  travelsForWork,
                  overnight,
                  limitations,
                  limitationsDetail,
                  why,
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
              <span className="badge warm">1</span> The basics
            </h2>
            <p className="sub">So we can actually reach you</p>

            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              type="text"
              placeholder="e.g. Sarah Ahmed"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />

            <label htmlFor="birthDate">
              Date of birth <span className="opt">(optional)</span>
            </label>
            <input
              id="birthDate"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
            />

            <label htmlFor="phone">Mobile / WhatsApp</label>
            <input
              id="phone"
              type="tel"
              placeholder="+20 1xxxxxxxxx"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="e.g. sarah@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <label htmlFor="location">Where are you based?</label>
            <input
              id="location"
              type="text"
              placeholder="Cairo, Giza, Alexandria…"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />

            <label htmlFor="instagram">
              Instagram <span className="opt">(optional)</span>
            </label>
            <input
              id="instagram"
              type="text"
              placeholder="@username"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
            />

            <label htmlFor="currentStatus">What are you doing right now?</label>
            <select
              id="currentStatus"
              value={currentStatus}
              onChange={(event) => setCurrentStatus(event.target.value)}
            >
              <option value="">Choose…</option>
              {CURRENT_STATUS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* 2 — who you are */}
          <div className="card">
            <h2>
              <span className="badge warm">2</span> Who you are
            </h2>
            <p className="sub">The part we actually care about</p>

            <label htmlFor="aboutYou">Tell us about yourself</label>
            <textarea
              id="aboutYou"
              placeholder="Who are you? What are you like in a group? What should we know that a CV would never say?"
              value={aboutYou}
              onChange={(event) => setAboutYou(event.target.value)}
            />

            <label id="skillsLabel">What are you good at? Pick everything that fits</label>
            <div className="chip-group" role="group" aria-labelledby="skillsLabel">
              {SKILLS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  className={`chip${skills.includes(skill) ? " selected" : ""}`}
                  aria-pressed={skills.includes(skill)}
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </button>
              ))}
            </div>

            <label id="musicLabel">
              Your music taste <span className="opt">(this matters more than you think)</span>
            </label>
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

            <label htmlFor="hasExperience">
              Worked in trips, events or hospitality before?
            </label>
            <select
              id="hasExperience"
              value={hasExperience}
              onChange={(event) => setHasExperience(event.target.value)}
            >
              <option value="">Choose…</option>
              {EXPERIENCE_ANSWER.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label htmlFor="experience">
              Tell us about it <span className="opt">(optional)</span>
            </label>
            <textarea
              id="experience"
              placeholder="Roles, trips, events, volunteering, projects — anything that shows how you work."
              value={experience}
              onChange={(event) => setExperience(event.target.value)}
            />
          </div>

          {/* 3 — the road */}
          <div className="card">
            <h2>
              <span className="badge warm">3</span> The road
            </h2>
            <p className="sub">
              Travel is the job, so we need an honest picture of your life
            </p>

            <label htmlFor="travelFrequency">How often do you travel?</label>
            <select
              id="travelFrequency"
              value={travelFrequency}
              onChange={(event) => setTravelFrequency(event.target.value)}
            >
              <option value="">Choose…</option>
              {TRAVEL_FREQUENCY.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label htmlFor="travelsForWork">
              Comfortable travelling often for work?
            </label>
            <select
              id="travelsForWork"
              value={travelsForWork}
              onChange={(event) => setTravelsForWork(event.target.value)}
            >
              <option value="">Choose…</option>
              {YES_NO_DEPENDS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label htmlFor="overnight">Comfortable staying overnight on trips?</label>
            <select
              id="overnight"
              value={overnight}
              onChange={(event) => setOvernight(event.target.value)}
            >
              <option value="">Choose…</option>
              {YES_NO.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label htmlFor="limitations">
              Any schedule or travel limitations we should know about?
            </label>
            <select
              id="limitations"
              value={limitations}
              onChange={(event) => setLimitations(event.target.value)}
            >
              <option value="">Choose…</option>
              {YES_NO.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            {limitations === "Yes" ? (
              <>
                <label htmlFor="limitationsDetail">Tell us more</label>
                <textarea
                  id="limitationsDetail"
                  placeholder="Study days, another job, family commitments, anything with fixed timing."
                  value={limitationsDetail}
                  onChange={(event) => setLimitationsDetail(event.target.value)}
                />
              </>
            ) : null}
          </div>

          {/* 4 — why us */}
          <div className="card">
            <h2>
              <span className="badge warm">4</span> Why us
            </h2>
            <p className="sub">Be honest. We can tell.</p>

            <label htmlFor="why">Why do you want to join Planet Infinity?</label>
            <textarea
              id="why"
              placeholder="What made you want to be part of this?"
              value={why}
              onChange={(event) => setWhy(event.target.value)}
            />

            <label className="agree-row" htmlFor="careersConsent">
              <input
                id="careersConsent"
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
              />
              <span>
                I&apos;m happy for Planet Infinity to keep my details on file and
                contact me about working together.
              </span>
            </label>

            <label className="agree-row" htmlFor="careersWhatsappOptIn">
              <input
                id="careersWhatsappOptIn"
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(event) => setWhatsappOptIn(event.target.checked)}
              />
              <span>You can reach me about this application on WhatsApp.</span>
            </label>
          </div>

          <button className="submit-btn" type="submit" disabled={!canSubmit || isPending}>
            {isPending ? "Sending…" : "Send my application"}
          </button>
          {submitError ? (
            <p className="pi-flow__error" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>

        <p className="preview-note">
          No CV needed. If we want to take it further we&apos;ll ask you for the
          rest directly.
        </p>

        <div className="footer-note">
          Planet Infinity Entertainment
          <br />
          Looking for a seat on a trip instead?{" "}
          <Link href="/apply" style={{ color: "var(--cyan)", fontWeight: 700 }}>
            Send a trip request →
          </Link>
        </div>
      </div>
    </>
  );
}
