export type PolicySlug =
  | "booking"
  | "payment"
  | "cancellation"
  | "refund"
  | "terms"
  | "etiquette"
  | "privacy";

export type PolicyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly string[]; ordered?: boolean };

export type PolicySection = {
  number?: string;
  title: string;
  blocks: readonly PolicyBlock[];
};

export type PolicyDocument = {
  slug: PolicySlug;
  title: string;
  shortTitle: string;
  sourcePart: string;
  sourceStatus: "supplied" | "owner-requested" | "requires-approval";
  intro: readonly string[];
  sections: readonly PolicySection[];
};

const paragraph = (text: string): PolicyBlock => ({ kind: "paragraph", text });
const bullets = (...items: string[]): PolicyBlock => ({ kind: "list", items });
const numbered = (...items: string[]): PolicyBlock => ({ kind: "list", items, ordered: true });

/**
 * English source copy from the supplied "Booking Terms & Guest Policies" pack.
 *
 * The source pack contains three long documents. They are split here into six
 * focused public pages without rewriting their legal meaning:
 *
 * - Booking: starting a booking and prices/quotations.
 * - Payment: deposit, balance and booking-confirmation rules.
 * - Cancellation: cancellation process and booking changes/cancellation events.
 * - Refund: refund eligibility, deductions and processing.
 * - Terms: amendments, liability, belongings, communications and force majeure.
 * - Etiquette: the complete Planet Infinity Trip Etiquette.
 *
 * The Privacy Policy was added separately at the owner's request and describes
 * the data flows implemented by this website, Supabase, Paymob and the optional
 * WhatsApp confirmation integration.
 */
export const POLICY_DOCUMENTS: readonly PolicyDocument[] = [
  {
    slug: "booking",
    title: "Booking Terms",
    shortTitle: "Booking",
    sourcePart: "Booking Terms & Conditions - sections 01-02",
    sourceStatus: "supplied",
    intro: [
      "We believe that a premium travel experience starts with clear expectations. We therefore ask all our guests to read the following booking terms and conditions carefully before confirming their booking.",
    ],
    sections: [
      {
        number: "01",
        title: "Starting the Booking Process & Trip Confirmation",
        blocks: [
          bullets(
            "Any Quotation / price offer sent to the client is considered a preliminary offer and is not regarded as a confirmed booking.",
            "The Quotation is valid for the period stated within it, and prices or availability may change after that period expires.",
            "The client's initial approval of the trip, or sending their details, does not mean the booking is confirmed.",
            "The booking request begins after the client approves the Quotation and pays the required deposit.",
            "Availability of the hotel, transport, activities, or any other service remains subject to availability and supplier terms until the booking process is completed.",
            "Planet Infinity reserves the right to amend the offer before issuing the final confirmation, should availability or supplier service prices change.",
            "The booking is not considered confirmed until the required payment is received and a Booking Confirmation is sent by Planet Infinity to the client's registered email address.",
          ),
        ],
      },
      {
        number: "02",
        title: "Prices & the Quotation",
        blocks: [
          bullets(
            "The price stated in the Quotation covers only the services clearly listed in the offer.",
            "Any additional service or request not stated in the Quotation is not included in the price and is charged separately.",
            "Prices may vary according to travel date, season, availability, number of travelers, and supplier prices.",
            "After the booking is confirmed and the procedures and remaining balance are completed, the price and services stated in the Booking Confirmation apply.",
            "Any additional service requested after the booking is confirmed is subject to availability and may incur an extra cost.",
            "No service or feature is considered included in the trip unless it is clearly stated in the Quotation or Booking Confirmation.",
          ),
        ],
      },
    ],
  },
  {
    slug: "payment",
    title: "Payment & Booking Confirmation",
    shortTitle: "Payment",
    sourcePart: "Booking Terms & Conditions - section 03",
    sourceStatus: "supplied",
    intro: [],
    sections: [
      {
        number: "03.1",
        title: "Deposit Paid",
        blocks: [
          bullets(
            "50% of the booking value is paid as a deposit (Deposit) to start the booking process.",
            "Once the deposit is received, the payment status becomes: DEPOSIT PAID.",
            "The client sends the Payment Receipt to Planet Infinity after making the payment.",
            "The Planet Infinity team begins confirming services with suppliers according to availability and the terms specific to each service.",
          ),
        ],
      },
      {
        number: "03.2",
        title: "Fully Paid",
        blocks: [
          bullets(
            "The remaining 50% is paid no later than 3 days before the trip date.",
            "Once the full booking value is received, the payment status becomes: FULLY PAID.",
            "The client sends the final payment receipt to Planet Infinity.",
          ),
        ],
      },
      {
        number: "03.3",
        title: "Booking Confirmation Issued",
        blocks: [
          bullets(
            "After the full booking value (100%) is received and all trip-related services are confirmed, Planet Infinity issues the Booking Confirmation.",
            "The booking status becomes: BOOKING CONFIRMATION ISSUED - the final booking confirmation has been issued to the client.",
            "The Booking Confirmation is sent to the client's registered email or WhatsApp.",
            "A Booking Confirmation Issued status is only reached once payment requirements are met and services are confirmed by Planet Infinity.",
            "If the remaining balance is not paid by the due date, Planet Infinity has the right to cancel the booking in line with the trip and supplier terms.",
            "Bank or transfer fees may apply, and are borne by the client where applicable.",
            "No booking that has not been paid in full guarantees the continued availability of services or prices, unless confirmed in writing by Planet Infinity.",
          ),
        ],
      },
    ],
  },
  {
    slug: "cancellation",
    title: "Cancellation Policy",
    shortTitle: "Cancellation",
    sourcePart: "Cancellation & Refund Policy - cancellation sections",
    sourceStatus: "supplied",
    intro: [
      "We understand that travel plans can change. Our cancellation and refund policy aims to strike a fair balance between our guests' flexibility and Planet Infinity's commitments to hotels, camps, transport companies, tour operators, and other suppliers.",
    ],
    sections: [
      {
        number: "01",
        title: "Scope of the Cancellation Policy",
        blocks: [
          bullets(
            "This policy applies to bookings confirmed through Planet Infinity.",
            "Some trips or services may be subject to special cancellation terms imposed by suppliers.",
            "Where special trip terms apply, these are explained to the client in the Quotation or Booking Confirmation before payment is completed.",
          ),
        ],
      },
      {
        number: "02",
        title: "Cancellation Requests",
        blocks: [
          bullets(
            "Cancellation requests must be submitted in writing through one of the official communication channels approved by Planet Infinity.",
            "The date and time the company receives the cancellation request determines the cancellation period and the refund policy applied.",
            "Informing the Tour Leader, the driver, or any person not officially authorized is not considered a booking cancellation request.",
          ),
        ],
      },
      {
        number: "04",
        title: "Changing the Date Instead of Cancelling",
        blocks: [
          paragraph(
            "If the client wishes to change the trip date rather than cancel it, they may submit a request to do so. Planet Infinity will make reasonable efforts to amend the booking, subject to:",
          ),
          bullets(
            "Availability of the new date.",
            "Supplier terms.",
            "Any difference in prices.",
            "Any change or rebooking fees.",
          ),
          paragraph(
            "A date change is not considered confirmed until the company approves it in writing and sends it by email.",
          ),
        ],
      },
      {
        number: "05",
        title: "Replacing a Traveler",
        blocks: [
          paragraph(
            "If one of the travelers is unable to participate and the client wishes to replace them with another person, the request may be considered according to the nature of the trip and supplier terms. This is subject to:",
          ),
          bullets(
            "The company's approval.",
            "Whether the traveler's name can be changed.",
            "Any fees imposed by the supplier.",
            "The replacement traveler meeting all trip requirements.",
          ),
        ],
      },
      {
        number: "06",
        title: "Group Trips & Minimum Participant Numbers",
        blocks: [
          paragraph(
            "Some group trips may require a minimum number of participants for the trip to run as planned. If the required minimum is not met:",
          ),
          numbered(
            "The company will seek, wherever possible, to offer a suitable alternative, such as: an alternative date, an alternative program, a different trip arrangement, or any suitable and available alternative.",
            "If the client accepts the alternative, the booking is amended according to the new details.",
            "If the client does not accept the proposed alternative, the amount paid is refunded in line with the trip and booking terms.",
            "The company is not obliged to provide the same trip, on the same date, at the same price, if the required minimum is not met.",
          ),
        ],
      },
      {
        number: "07",
        title: "Trip Cancellation by Planet Infinity",
        blocks: [
          paragraph(
            "If Planet Infinity has to cancel the trip entirely from its side, and not as a result of a client request, the company will inform the client as soon as possible. Depending on the nature of the case, the company may offer:",
          ),
          bullets(
            "Alternative Trip - a suitable alternative trip or date.",
            "Transfer - transferring the booking value to another trip agreed by both parties.",
            "Refund - refunding the amount due in line with the trip terms and refundable costs.",
          ),
        ],
      },
      {
        number: "08",
        title: "No-Show",
        blocks: [
          paragraph(
            "If the guest does not attend at the specified meeting time and place, and the trip has to depart without them, the booking is considered a No-Show.",
          ),
          paragraph(
            "The amount paid is not refunded, unless the terms of the relevant trip state otherwise. The company does not bear any additional costs resulting from non-attendance.",
          ),
        ],
      },
    ],
  },
  {
    slug: "refund",
    title: "Refund Policy",
    shortTitle: "Refund",
    sourcePart: "Cancellation & Refund Policy - refund sections",
    sourceStatus: "supplied",
    intro: [
      "We understand that travel plans can change. Our cancellation and refund policy aims to strike a fair balance between our guests' flexibility and Planet Infinity's commitments to hotels, camps, transport companies, tour operators, and other suppliers.",
    ],
    sections: [
      {
        number: "03",
        title: "Cancellation by the Client",
        blocks: [
          paragraph("The refundable amount depends on:"),
          bullets(
            "The cancellation date.",
            "The nature of the trip.",
            "The services booked.",
            "Costs already incurred by the company.",
            "Non-refundable costs.",
            "The terms of the relevant suppliers.",
          ),
          paragraph(
            "Any refunded amount is subject to non-refundable costs and the supplier terms specific to the booked services.",
          ),
          paragraph(
            "Refund policy: Final refund percentages and deadlines are determined for each trip according to its own terms, and the client is informed of these before payment is completed.",
          ),
          paragraph(
            "Planet Infinity does not guarantee a full refund where non-refundable costs or bookings exist.",
          ),
        ],
      },
      {
        number: "09",
        title: "Unused Services",
        blocks: [
          paragraph(
            "If the guest chooses not to use one of the services included in the package after the booking is confirmed, such as:",
          ),
          bullets("Accommodation.", "Meals.", "Activities.", "Transport.", "Part of the program."),
          paragraph(
            "Not using a service does not automatically mean its value is refunded. Refund eligibility, if any, is determined according to the nature of the service and the supplier's terms.",
          ),
        ],
      },
      {
        number: "10",
        title: "Early Departure or Not Completing the Trip",
        blocks: [
          paragraph("If the guest decides to:"),
          bullets(
            "Leave the trip early.",
            "Return separately.",
            "Not complete the program.",
            "Leave the hotel before the scheduled time.",
            "Not take part in a portion of the trip.",
          ),
          paragraph(
            "They are not automatically entitled to claim a refund for the value of unused services.",
          ),
        ],
      },
      {
        number: "11",
        title: "Refund & Transfer Fees",
        blocks: [
          paragraph(
            "Any non-refundable fees or costs may be deducted from the amount due to the client, including, where applicable:",
          ),
          bullets(
            "Bank transfer fees.",
            "Electronic payment fees.",
            "Cancellation fees imposed by the supplier.",
            "Any other non-refundable costs already incurred.",
          ),
        ],
      },
      {
        number: "12",
        title: "Refund Method & Timeframe",
        blocks: [
          paragraph("Where a Refund is approved:"),
          bullets(
            "The amount is refunded using the original payment method wherever possible.",
            "The amount may take additional time to reach the client's account depending on the bank or payment service provider.",
            "The client is informed once the refund process begins.",
          ),
        ],
      },
      {
        number: "13",
        title: "Special Cases",
        blocks: [
          paragraph(
            "Cancellation and refund terms for some trips or services may differ from the general policy, particularly in the case of:",
          ),
          bullets(
            "Hotels, camps, or campsites with special cancellation terms.",
            "Desert trips.",
            "Private trips.",
            "Peak seasons and holidays.",
            "Bookings requiring a non-refundable advance payment.",
            "Services for which the supplier imposes special terms.",
          ),
          paragraph(
            "In such cases, the special terms are explained in the Quotation or Booking Confirmation before payment is completed.",
          ),
        ],
      },
      {
        number: "14",
        title: "Force Majeure",
        blocks: [
          paragraph(
            "Force Majeure & Changes to the Trip cases are governed by the clause on force majeure and emergency changes set out in the Booking Terms & Conditions, in addition to supplier terms and applicable law.",
          ),
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    shortTitle: "Terms",
    sourcePart: "Booking Terms & Conditions - sections 04-08",
    sourceStatus: "supplied",
    intro: [],
    sections: [
      {
        number: "04",
        title: "Booking Amendments",
        blocks: [
          paragraph(
            "Any request to change booking details is considered a Change Request. This includes, for example:",
          ),
          bullets(
            "Trip date.",
            "Number of travelers.",
            "Hotel.",
            "Room type.",
            "Transport.",
            "Activities.",
            "Program.",
            "Trip duration.",
            "Any other service included in the booking.",
          ),
          paragraph(
            "Amendment requests are subject to Availability + Supplier Terms + Additional Cost.",
          ),
          paragraph(
            "No amendment is considered confirmed until Planet Infinity approves it and sends a written confirmation to the client by email. No verbal agreement or undocumented promise is treated as a confirmed amendment to the booking.",
          ),
        ],
      },
      {
        number: "05",
        title: "Guest Liability",
        blocks: [
          paragraph(
            "The guest is responsible for any damage they cause deliberately, or as a result of clear misuse of hotel or transport property, or any services or facilities provided during the trip, in line with supplier terms and applicable law.",
          ),
        ],
      },
      {
        number: "06",
        title: "Personal Belongings",
        blocks: [
          paragraph(
            "The guest is responsible for their personal belongings throughout the trip, including but not limited to:",
          ),
          bullets(
            "Money",
            "Phones",
            "Cameras",
            "Bags",
            "Passports and documents",
            "Electronic devices",
            "Any other personal possessions",
          ),
          paragraph(
            "Planet Infinity is not responsible for the loss of or damage to personal belongings.",
          ),
        ],
      },
      {
        number: "07",
        title: "Communication & Official Documentation",
        blocks: [
          bullets(
            "All important booking requests and amendments must be made through the official communication channels approved by Planet Infinity.",
            "No verbal promise or agreement is binding on the company unless confirmed in writing through the official channels.",
            "The client must keep the Quotation, Booking Confirmation, payment receipts, and any official correspondence relating to the booking.",
            "The client must ensure the email address and contact details provided to the company are correct, as these are used to send booking documents and important updates.",
          ),
        ],
      },
      {
        number: "08",
        title: "Emergencies & Force Majeure",
        blocks: [
          paragraph(
            "Operational or force majeure circumstances beyond the control of the company or its suppliers may arise, requiring a change to part of the program or one of the services, including but not limited to:",
          ),
          bullets(
            "Severe weather conditions.",
            "Road closures or roads becoming impassable.",
            "Government or official decisions and instructions.",
            "Closure of tourist sites.",
            "Natural disasters.",
            "Emergency events.",
            "Unavailability of a service for reasons beyond the control of the company or its suppliers.",
            "Any other circumstances beyond the reasonable control of the company or its suppliers.",
          ),
          paragraph(
            "In such cases, Planet Infinity may need to Modify / Replace / Reschedule part of the program or one of the services, in a manner appropriate to the circumstances and mindful of guest safety and the quality of the travel experience. The company will make reasonable efforts to provide a suitable alternative wherever possible.",
          ),
          paragraph(
            "The company is not liable for any losses or additional costs arising directly from circumstances beyond its control, in line with supplier terms and applicable law. Any refunds, if applicable, are subject to the Cancellation & Refund Policy applied to the trip and the terms of the relevant suppliers.",
          ),
        ],
      },
    ],
  },
  {
    slug: "etiquette",
    title: "Planet Infinity Trip Etiquette",
    shortTitle: "Trip etiquette",
    sourcePart: "Trip Etiquette - complete document",
    sourceStatus: "supplied",
    intro: [
      "We believe that a premium travel experience starts with mutual respect. We ask all guests to treat our team, partners, and fellow travelers with the same courtesy and respect they expect from us.",
    ],
    sections: [
      {
        number: "01",
        title: "Mutual Respect",
        blocks: [
          paragraph("Our trips are built on mutual respect among everyone involved."),
          bullets(
            "Treat all guests, Planet Infinity crew, and our partners with courtesy and respect.",
            "Respect the Tour Leader, Tour Guide, drivers, and the entire trip team.",
            "No offensive, abusive, or insulting language toward anyone.",
            "No verbal abuse, threats, intimidation, or aggressive behavior.",
            "No harassment, bullying, or discrimination of any kind.",
            "Respect others' privacy and personal space, and avoid causing discomfort.",
          ),
        ],
      },
      {
        number: "02",
        title: "Punctuality",
        blocks: [
          paragraph("Time on group trips is a shared responsibility."),
          bullets(
            "Follow the meeting and departure times set in the trip program and the Tour Leader's instructions.",
            "Please arrive at the meeting point at least 15 minutes before departure.",
            "On group trips, the bus cannot wait in a way that disrupts the program or inconveniences other guests.",
            "If a guest is not at the meeting point on time, the bus may need to depart on schedule.",
            "In that case, the guest is responsible for arranging - and covering the cost of - their own transport to the group.",
            "Planet Infinity is not liable for any costs or losses resulting from a guest's delay.",
          ),
          paragraph(
            "Our trips run on a shared schedule. We appreciate your understanding that we cannot delay the entire group for an individual guest.",
          ),
        ],
      },
      {
        number: "03",
        title: "Your Seat Is Part of Your Booking",
        blocks: [
          bullets(
            "Keep to the seat assigned to you as booked, both on the outbound and return journey.",
            "Do not change or occupy a seat in a way that prevents its assigned guest from using it.",
            "If seating arrangements need to change, this is done in coordination with the Tour Leader.",
          ),
        ],
      },
      {
        number: "04",
        title: "We Follow the Trip's Flow",
        blocks: [
          paragraph(
            "The Tour Leader coordinates the group's movement throughout the trip. We therefore ask that you:",
          ),
          bullets(
            "Follow their instructions on gathering, moving between locations, and activities.",
            "Keep to the agreed return times to the bus or meeting point.",
            "Cooperate with the trip team when organizing transfers or changing the activity order.",
            "Avoid individual actions that could disrupt the program or affect other guests' comfort.",
          ),
          paragraph(
            "The Tour Leader is responsible for coordinating the group and keeping the trip running smoothly. Your cooperation helps ensure a comfortable experience for everyone.",
          ),
        ],
      },
      {
        number: "05",
        title: "We Protect the Places We Visit",
        blocks: [
          paragraph(
            "We love Egypt and the places we visit, and we ask our guests to leave every place as they found it.",
          ),
          bullets(
            "Keep buses, hotels, and visited sites clean.",
            "Dispose of waste only in designated areas.",
            "No littering in streets, natural areas, reserves, or tourist sites.",
            "Respect natural, archaeological, and cultural sites.",
            "Do not damage or misuse hotel or transport property, or any property belonging to suppliers or the places visited.",
          ),
        ],
      },
      {
        number: "06",
        title: "Safety First",
        blocks: [
          bullets(
            "Follow all safety instructions and guidance during the trip and activities.",
            "Follow the trip team's instructions in places requiring special precautions - especially desert and marine trips, or any activity requiring special safety procedures.",
            "Never act in a way that could endanger yourself or another group member, or cause deliberate disturbance.",
          ),
        ],
      },
      {
        number: "07",
        title: "Laws & Public Conduct",
        blocks: [
          bullets(
            "Comply with Egyptian laws and regulations.",
            "Respect local rules and customs in the places we visit.",
            "No possession or use of drugs or any illegal substances.",
            "Do not behave under the influence of alcohol in a way that endangers yourself or others, or affects the running of the trip.",
          ),
        ],
      },
      {
        number: "08",
        title: "Remember, We're a Group",
        blocks: [
          paragraph(
            "On group trips, not every detail will always match everyone's personal preference - and that's a natural part of traveling with a group. We ask you to be considerate of others, cooperate with the trip team, and bring flexibility and a positive spirit, so everyone can enjoy a comfortable and enjoyable experience.",
          ),
        ],
      },
      {
        number: "09",
        title: "If Inappropriate Behavior Occurs",
        blocks: [
          paragraph(
            "We understand that everyone has their own personality and way of being, but we believe respect goes both ways. Behavior that negatively affects the safety, comfort, or dignity of others will not be accepted, and Planet Infinity will handle such cases seriously and according to the nature of the situation. In cases of severe or repeated conduct, Planet Infinity reserves the right to take appropriate action in line with the nature of the case, the booking terms, and applicable law - which may include ending a guest's participation in the trip.",
          ),
        ],
      },
      {
        title: "Our Commitment to You",
        blocks: [
          paragraph(
            "Just as we ask you to respect our team, our partners, and your fellow guests, we commit to treating every guest with respect and professionalism, providing information clearly, doing our utmost to deliver the trip as agreed, and listening to any concern or feedback - and handling it seriously and respectfully.",
          ),
        ],
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    shortTitle: "Privacy",
    sourcePart: "Owner-requested website privacy notice",
    sourceStatus: "owner-requested",
    intro: [
      "Planet Infinity Entertainment respects your privacy. This policy explains what personal information we collect through our website, why we use it, who may receive it, and the choices available to you.",
      "By using the website or submitting a booking request or application, you acknowledge this Privacy Policy. Consent to receive transactional WhatsApp messages is always optional and is collected separately.",
    ],
    sections: [
      {
        number: "01",
        title: "Information We Collect",
        blocks: [
          bullets(
            "Identity and contact information, including your name, email address, mobile or WhatsApp number, and any optional social-media handle you provide.",
            "Application information, such as age, work or study, music preferences, previous travel experience, smoking preference, how you heard about us, and your reason for joining.",
            "Booking information, including the selected trip or event, travel dates, guest count, package choices, seat choices, notes, policy acceptances, booking reference, and booking status.",
            "Payment records, including amount, currency, payment status, payment reference, and gateway transaction identifiers. Planet Infinity does not receive or store your full card number, CVV, or card authentication credentials.",
            "Technical and security information generated when you use the website, such as service logs, timestamps, device or browser information, and information needed to prevent abuse and protect accounts.",
          ),
        ],
      },
      {
        number: "02",
        title: "How We Use Your Information",
        blocks: [
          bullets(
            "To review applications and booking requests, contact you, and manage your trip or event.",
            "To confirm availability, reserve services and seats, record payments, and issue your Booking Confirmation.",
            "To send the final Booking Confirmation through WhatsApp when you have expressly chosen that option.",
            "To provide customer support, respond to questions, manage cancellations or refunds, and keep an operational audit trail.",
            "To secure the website, prevent fraud or duplicate requests, diagnose faults, and comply with legal, accounting, or regulatory obligations.",
          ),
        ],
      },
      {
        number: "03",
        title: "Legal Grounds",
        blocks: [
          paragraph("Depending on the context, we process personal information to take steps requested before a booking, perform a confirmed booking, comply with legal obligations, protect our legitimate business and security interests, or act on your consent. WhatsApp communication is based on your separate opt-in and can be withdrawn at any time."),
        ],
      },
      {
        number: "04",
        title: "Who We Share Information With",
        blocks: [
          bullets(
            "Supabase, which provides the website database, authentication, and file storage infrastructure.",
            "Paymob, when card payment is enabled, to create and verify the payment transaction. Paymob processes card details directly under its own privacy and security terms.",
            "Meta and WhatsApp, only when you opt in to receive the transactional Booking Confirmation on WhatsApp.",
            "Hotels, camps, transport providers, activity providers, guides, and other travel suppliers, but only the information reasonably required to deliver your booking.",
            "Professional advisers, authorities, or service providers where disclosure is required by law or reasonably necessary to protect rights, safety, payments, or the service.",
          ),
          paragraph("Planet Infinity does not sell or rent personal information to third parties."),
        ],
      },
      {
        number: "05",
        title: "Payments",
        blocks: [
          paragraph("Online card payments are completed on Paymob's secure checkout. Planet Infinity stores the booking amount, payment status, and Paymob references needed to reconcile the booking, but does not store full payment-card credentials."),
        ],
      },
      {
        number: "06",
        title: "WhatsApp Messages",
        blocks: [
          paragraph("WhatsApp is optional. If you tick the WhatsApp consent box and provide a valid number, Planet Infinity may send the final transactional Booking Confirmation and its PDF to that number. We do not use this opt-in for promotional marketing. You may withdraw the opt-in by contacting us through the website."),
        ],
      },
      {
        number: "07",
        title: "Retention",
        blocks: [
          paragraph("We keep personal information only for as long as reasonably necessary to manage requests and bookings, provide support, maintain payment and accounting records, resolve disputes, prevent fraud, and meet legal obligations. Information that is no longer required is deleted, anonymized, or securely archived where deletion is not immediately possible."),
        ],
      },
      {
        number: "08",
        title: "Security",
        blocks: [
          paragraph("We use access controls, authenticated administration, restricted database permissions, private storage for Booking Confirmations, signed links, and payment-webhook verification. No internet service can be guaranteed to be completely secure, so please avoid sending unnecessary sensitive information in free-text fields."),
        ],
      },
      {
        number: "09",
        title: "Your Choices and Rights",
        blocks: [
          paragraph("Subject to applicable law, you may ask to access, correct, or delete your personal information, object to or restrict certain uses, or withdraw consent for WhatsApp messages. Use the Contact page on this website and include enough information for us to identify the relevant request or booking. Withdrawing consent does not affect processing already completed lawfully."),
        ],
      },
      {
        number: "10",
        title: "International Services and Updates",
        blocks: [
          paragraph("Some technology or travel providers may process information in other countries. We use providers needed to operate the service and expect them to apply appropriate contractual and security protections. We may update this policy when the website, providers, or legal requirements change; the current version and date are published on this page."),
        ],
      },
    ],
  },
] as const;

export const POLICY_PAGES = POLICY_DOCUMENTS.map(({ slug, title }) => ({ slug, title }));

export const BOOKING_ACCEPTANCE_POLICIES = POLICY_DOCUMENTS.filter(({ slug }) =>
  ["booking", "payment", "cancellation", "refund", "terms", "etiquette", "privacy"].includes(slug),
);

export const APPLICATION_ACCEPTANCE_POLICIES = POLICY_DOCUMENTS.filter(({ slug }) =>
  ["booking", "payment", "cancellation", "refund", "terms", "etiquette", "privacy"].includes(slug),
);

export function getPolicyPage(slug: string): PolicyDocument | undefined {
  return POLICY_DOCUMENTS.find((policy) => policy.slug === slug);
}

export function policyToPlainText(policy: PolicyDocument): string {
  if (policy.sourceStatus === "requires-approval") return "";

  const lines = [...policy.intro];
  for (const section of policy.sections) {
    lines.push("", [section.number, section.title].filter(Boolean).join(" "));
    for (const block of section.blocks) {
      if (block.kind === "paragraph") {
        lines.push("", block.text);
      } else {
        lines.push(
          "",
          ...block.items.map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`),
        );
      }
    }
  }
  return lines.join("\n").trim();
}

/**
 * Seed-ready records. The six supplied policies retain the source-pack
 * version; the separately requested Privacy Policy has its own dated version.
 */
export const POLICY_SEED_RECORDS = POLICY_DOCUMENTS.map((policy) => ({
  slug: policy.slug,
  title: policy.title,
  version: policy.sourceStatus === "supplied"
    ? "supplied-policy-pack"
    : policy.sourceStatus === "owner-requested"
      ? "privacy-2026-08-25"
      : "requires-approval",
  body: policyToPlainText(policy),
  isActive: policy.sourceStatus !== "requires-approval",
}));
