import type { BookingFormField } from "@/lib/booking-form";

export const DEFAULT_CAREERS_FORM_FIELDS: BookingFormField[] = [
  { id: "role", label: "Which role are you applying for?", type: "multiselect", required: true, options: ["Content Creator", "Videographer", "Travel Consultant", "Sales", "Trip Counselor", "Experience Crew", "Operations"].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), label })) },
  { id: "music-taste", label: "What kind of music feels most like you?", help: "Choose every sound you genuinely enjoy.", type: "multiselect", required: true, options: ["Pop / Hits", "Arabic / Shaabi", "Techno / House", "R&B / Chill", "Rock", "Indie / Alternative", "Anything, I'm easy"].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), label })) },
  { id: "song-choice", label: "Choose one song that says something about you", help: "Write the song title and artist.", type: "text", required: true },
  { id: "current-status", label: "What are you doing right now?", type: "select", required: true, options: ["Working", "University", "Freelance", "Between things", "Other"].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), label })) },
  { id: "about-you", label: "Tell us about yourself", help: "Who are you when nobody is reading a CV?", type: "textarea", required: true },
  { id: "skills", label: "What are you good at? Choose all that apply.", type: "multiselect", required: true, options: ["Communication", "Leadership", "Organising", "Content creation", "Photography & video", "Social media", "Sales", "Customer service", "Trip leading", "Events", "Something else"].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), label })) },
  { id: "experience", label: "Worked in trips, events or hospitality before?", type: "select", required: true, options: [{ id: "yes", label: "Yes" }, { id: "learn-fast", label: "No, but I learn fast" }] },
  { id: "experience-note", label: "Tell us about that experience", type: "textarea" },
  { id: "travel-frequency", label: "How often do you travel?", type: "select", required: true, options: ["Rarely", "Sometimes", "Often", "Very often"].map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label })) },
  { id: "travel-for-work", label: "Comfortable travelling often for work?", type: "select", required: true, options: [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }, { id: "depends", label: "Depends" }] },
  { id: "overnight", label: "Comfortable staying overnight on trips?", type: "select", required: true, options: [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }] },
  { id: "limitations", label: "Any schedule or travel limitations?", type: "textarea" },
  { id: "why-us", label: "Why do you want to join Planet Infinity?", type: "textarea", required: true },
];
