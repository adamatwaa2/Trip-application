# Campus Ambassadors

The live checkout uses server quotes, never browser-calculated charges. Codes are optional:
without a code, the ordinary booking/payment journey works at the current price with no discount. Apply one
individual ambassador code to any booking size. Discounts are 5% for 1–4 tickets,
10% for 5–9, 20% for 10–14 and 30% for 15+. Booking fees are added afterward.

## Inventory and ticket price

The event row lock serializes quotes and booking creation. Each quote holds tickets
and its exact price for 20 minutes. Moving to payment converts it into a pending
booking with an immutable price. Pending bookings reserve inventory until an admin
confirms or cancels them. Review abandoned pending bookings regularly. There is no
automatic cancellation of a booking that may already have been paid externally.

Price positions count confirmed and pending paid-ticket bookings plus unexpired
quotes. This prevents simultaneous customers from buying the same cheap inventory.
Complimentary ambassador entries consume capacity but do not advance paid price tiers.
Expired unused quotes and cancelled bookings release inventory. The next price is
based on current committed inventory; previously saved bookings never change.

Crossing ticket 50 in one three-ticket booking with 49 committed tickets charges
1 × 1,000 + 2 × 1,200 = 3,400 EGP before discount and fees. All line prices, discounts,
fees, total and commission rules are saved. Later rule edits apply to new quotes.
Capacity is enforced whenever the event has a configured capacity. An unset
capacity means no numeric limit, as in the existing event catalogue.

## Progressive commission decision

Commission accrues only when payment is verified and the booking is confirmed.
Every paid ticket counts, including individual bookings. Commission uses that
ticket's saved original price before customer discounts and booking fees.

The first 9 confirmed tickets earn 5%, positions 10–14 earn 7.5%, 15–19 earn 10%,
20–24 earn 12.5%, and 25 onward earn 15%. A booking crossing a boundary is split
across rates. The database serializes confirmations for each ambassador and writes
one ledger row per ticket. It never revalues earlier tickets after advancement.

Cancellation or loss of payment/confirmation voids the booking's ledger entries.
Reconfirmation restores the saved entries and rates. New confirmations use the
current count of non-void confirmed tickets. Historical rate snapshots are retained
even if the active ticket count later falls. Existing bookings retain the commission
rules saved at checkout when future rules are edited.

## Administration and admission

`/admin/ambassadors` requires an active admin session. It manages ambassadors,
individual codes, code retirement, free entry tickets, price/discount/commission
tiers, and bookings filtered by their original code. Retired codes cannot be
reassigned to another person. Rule edits and ambassador changes are audited.

Enter the leader name and their university/group, email and phone. Type the exact
code you want, such as FOFA-D1, and click **Save & generate code**. The database
checks uniqueness under the event lock and activates the chosen code. Editing a
code retires the old code and preserves existing attribution. Retired codes cannot
be assigned to another leader. The internal allocator remains backward compatible;
the panel uses owner-chosen codes.
No demonstration ambassadors are seeded in the live database.

Leaders can register at `/ambassadors/apply`. The form collects name, university
or group, email, phone, university abbreviation, preferred code and privacy consent. Codes
start with a 2–10-letter university/faculty abbreviation, followed by letters, numbers or
a dash, with 3–24 characters total. Abbreviations are self-reported: the form does not
certify university affiliation. At the owner's explicit request, valid registrations
activate immediately with NO admin approval. The service-only registration transaction
locks the event, checks code availability, creates the ambassador, active code and
registration record atomically, and returns a private random tracking link.
The private `/ambassadors/status/[token]` page displays the active code and ready-to-copy
English/Arabic customer messages using current discount rules. It is dynamic and noindex.
Keep this link private; share only the code and messages. Admin can access it for support.
Retries with the same token are idempotent. Another person cannot retrieve the private
link by submitting an existing email. Duplicate code/email attempts never overwrite
contacts, create partial registrations or reactivate a paused ambassador.
Legacy pending applications retain an admin review option, but new registrations bypass it.
There is no automatic email or WhatsApp dispatch: the leader copies and sends the prepared
message. Admin can pause or change any code. Pausing is reflected on the private code page.

Issue complimentary entry once per ambassador using their real name, email and
phone. It includes no fee and earns no commission. Entry still requires the
ambassador to satisfy university admission and the original physical ID checks.

General admission text remains men 21+, women 18+, door selection. A validated
active university code shows 18+ for both, mixed groups exactly 50:50, couples or
girls-only. Age is checked at the event date and the university ratio is checked
in the database before payment. Date of birth and gender are stored privately in
the existing guest-roster booking snapshot, under the existing admin access rules.

`/preview/campus` is explicitly a demonstration. It accepts FOFA-D1 and AUC-D1 as
sample codes only, uses no real customer records and cannot charge or issue entry.
Real codes are created by real leader registration or manual admin entry.
`/preview/campus/admin` demonstrates adding leaders and saving chosen codes
without writing to the live database.

## Verification

Release in two steps: install `campus_ambassadors_and_ticket_tiers`, verify it,
deploy and verify the new checkout, then install `retire_fixed_event_checkout`.
The initial migration leaves the old checkout available for existing deployments.
The release migration makes stale checkout clients refresh their page.

The preparation migration was verified locally and applied to the specified
Supabase project. Its integration assertions also passed there with all fixtures
rolled back. The four existing event bookings retained their saved totals. The final release
migration was applied after checkout deployment; it retires an obsolete fixed-price
RPC only, not the ordinary no-code booking journey. No booking or payment data is deleted.

Run `npm run typecheck`, `npm run lint`, `npm run build` and the transaction-wrapped
`supabase/tests/campus_ambassadors.test.sql`. Database fixtures roll back. Also
verify simultaneous reservations at a tier and capacity boundary, receipt upload,
and the live checkout/server total before promoting the release.
