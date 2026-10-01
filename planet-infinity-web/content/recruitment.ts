export type RecruitmentCategoryId = "world-crew" | "core-team" | "creative-studio";
export const applicationStatuses = ["new", "reviewing", "shortlisted", "interview", "challenge", "accepted", "rejected", "waitlist"] as const;
export type ApplicationStatus = (typeof applicationStatuses)[number];
export type RecruitmentQuestion = {
  id: string;
  label: string;
  type?: "text" | "textarea" | "select" | "multiselect" | "url";
  options?: string[];
  required?: boolean;
};
export type RecruitmentRole = {
  id: string;
  title: string;
  description: string;
  questions?: RecruitmentQuestion[];
  portfolioRecommended?: boolean;
};

const yesNo = ["Yes", "No"];

export const worldCrewRoles: RecruitmentRole[] = [
  { id: "world-lead", title: "World Lead / Experience Producer", description: "Own the concept and coordinate the complete world.", questions: [
    { id: "organize-team", label: "How would you organize a team around this experience?", type: "textarea" },
    { id: "first-week", label: "What would you do in the first week?", type: "textarea" },
  ] },
  { id: "growth-community", title: "Growth / Community", description: "Build demand, community and outreach around the world.", questions: [
    { id: "audience-reach", label: "What community or audience can you reach?", type: "textarea" },
    { id: "first-20", label: "How would you get the first 20 people interested?", type: "textarea" },
  ] },
  { id: "content-storyteller", title: "Content Creator / Storyteller", description: "Create videos, explain the world and document the process.", portfolioRecommended: true, questions: [
    { id: "best-content", label: "Link your best 3 pieces of content.", type: "textarea" },
    { id: "content-skills", label: "What can you create yourself? Tell us about shooting, editing, presenting and the tools you use.", type: "textarea" },
  ] },
  { id: "operations", title: "Operations", description: "Suppliers, pricing research, quotes, logistics, permits and execution.", questions: [
    { id: "organized-before", label: "Tell us about something you have organized before.", type: "textarea" },
    { id: "supplier-quotes", label: "Are you comfortable sourcing suppliers and getting quotations?", type: "select", options: yesNo },
    { id: "local-connections", label: "Do you have relevant local connections?", type: "textarea" },
  ] },
  { id: "trip-leader", title: "Trip Leader / Experience Host", description: "Lead the people and the experience on execution day.", questions: [
    { id: "lead-groups", label: "Are you comfortable leading groups?", type: "select", options: yesNo },
    { id: "group-history", label: "Have you handled groups, events or trips before?", type: "textarea" },
  ] },
];

export const coreTeamRoles: RecruitmentRole[] = [
  { id: "finance-pricing", title: "Finance & Pricing", description: "Costing, margins, break-even, recommendations and reporting.", questions: [{ id: "pricing-example", label: "Tell us about a budget or pricing model you have built.", type: "textarea" }] },
  { id: "marketing", title: "Marketing", description: "Campaign strategy, positioning, offers and launches.", questions: [{ id: "launch-plan", label: "How would you launch a new Planet Infinity experience?", type: "textarea" }] },
  { id: "social-content", title: "Social Media / Content Lead", description: "Own the content calendar and publishing strategy.", portfolioRecommended: true, questions: [{ id: "channel-growth", label: "Show us a channel or content plan you helped grow.", type: "textarea" }] },
  { id: "sales-booking", title: "Sales / Booking", description: "Convert leads into bookings and manage follow-ups.", questions: [{ id: "sales-example", label: "How do you turn an interested lead into a confident booking?", type: "textarea" }] },
  { id: "customer-care", title: "Community / Customer Care", description: "DMs, comments, WhatsApp and guest questions.", questions: [{ id: "guest-care", label: "How would you handle an upset guest in a public comment?", type: "textarea" }] },
  { id: "partnerships", title: "Partnerships / Influencers", description: "Creators, brands, collaborations and strategic partnerships.", questions: [{ id: "partnership-idea", label: "Name one partnership you would pursue and why.", type: "textarea" }] },
  { id: "web-crm", title: "Web / CRM", description: "Website, forms, customer systems, CRM and automations.", portfolioRecommended: true, questions: [{ id: "systems", label: "Which websites, CRMs or automations have you worked with?", type: "textarea" }] },
];

export const creativeStudioRoles: RecruitmentRole[] = [
  { id: "costume-apparel", title: "Costume / Apparel Design", description: "Costumes, uniforms, merchandise and clothing concepts.", portfolioRecommended: true },
  { id: "production-manufacturing", title: "Production & Manufacturing", description: "Turn creative concepts into physical products.", portfolioRecommended: true },
  { id: "graphic-design", title: "Graphic Design", description: "Social posts, print material and world assets.", portfolioRecommended: true },
  { id: "video-motion", title: "Video Editing / Motion", description: "Reels, trailers and motion content.", portfolioRecommended: true },
  { id: "photo-video", title: "Photographer / Videographer", description: "Campaign and execution-day production.", portfolioRecommended: true },
  { id: "props-set", title: "Props / Set Design", description: "Physical props, environments and themed elements.", portfolioRecommended: true },
].map((role) => ({ ...role, questions: [{ id: "creative-process", label: "Tell us about one project that best represents your craft.", type: "textarea" as const }] }));

export const recruitmentWorlds = [
  { id: "pirates", title: "Pirates", subtitle: "Pirates of the Red Sea" },
  { id: "cursed", title: "Cursed", subtitle: "Halloween in the Desert" },
  { id: "arena", title: "Arena", subtitle: "Hunger Games" },
  { id: "dune", title: "Dune", subtitle: "Siwa" },
  { id: "doomsday", title: "Doomsday", subtitle: "Avengers" },
  { id: "zero-hour", title: "Zero Hour", subtitle: "New Year’s Eve" },
  { id: "white", title: "White", subtitle: "The White Desert" },
  { id: "school-hunt", title: "School Hunt", subtitle: "Schools Championship" },
] as const;

export const recruitmentCategories = [
  { id: "world-crew" as const, number: "01", title: "World Crew", description: "Build one specific experience.", roles: worldCrewRoles, compensation: "Project-based or experience-based compensation, with possible performance upside depending on the role." },
  { id: "core-team" as const, number: "02", title: "Core Team", description: "Build Planet Infinity across every experience.", roles: coreTeamRoles, compensation: "Salary, retainer, internship or part-time structures may apply depending on the position." },
  { id: "creative-studio" as const, number: "03", title: "Creative Studio", description: "Build what the worlds look and feel like.", roles: creativeStudioRoles, compensation: "Project fee, day rate, deliverable fee or retainer may apply depending on the work." },
];

export const commonRecruitmentQuestions: RecruitmentQuestion[] = [
  { id: "music-taste", label: "What kind of music feels most like you?", type: "multiselect", options: ["Pop / Hits", "Arabic / Shaabi", "Techno / House", "R&B / Chill", "Rock", "Indie / Alternative", "Anything, I’m easy"] },
  { id: "song-choice", label: "Choose one song that says something about you", type: "text" },
  { id: "current-status", label: "What are you doing right now?", type: "select", options: ["Working", "University", "Freelance", "Between things", "Other"] },
  { id: "skills", label: "What are you good at? Choose all that apply.", type: "multiselect", required: true, options: ["Communication", "Leadership", "Organising", "Content creation", "Photography & video", "Social media", "Sales", "Customer service", "Trip leading", "Events", "Something else"] },
  { id: "why-us", label: "Why do you want to join Planet Infinity?", type: "textarea", required: true },
];

export const worldCrewQuestions: RecruitmentQuestion[] = [
  { id: "why-world", label: "Why this world, and what do you already know or love about it?", type: "textarea" },
  { id: "thirty-days", label: "What would you bring to it in your first 30 days?", type: "textarea" },
];

export function getRecruitmentCategory(id: string) { return recruitmentCategories.find((item) => item.id === id); }
export function getRecruitmentWorld(id: string) { return recruitmentWorlds.find((item) => item.id === id); }
export function getRecruitmentRole(categoryId: string, roleId: string) { return getRecruitmentCategory(categoryId)?.roles.find((item) => item.id === roleId); }
