# Campus Ambassadors

The live checkout uses server quotes, never browser-calculated charges. Apply one
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

Enter the leader name and their university/group, email and phone. Choose a short
group prefix such as FOFA or AUC and click **Save & generate code**. The database
allocates FOFA-A, FOFA-B, etc. under the same event lock, so simultaneous admin
saves cannot assign a duplicate. After Z it continues AA, AB, up to ZZ. Code
regeneration retires the old code permanently and preserves existing attribution.
No ambassadors are seeded before actual leaders have been confirmed.

Issue complimentary entry once per ambassador using their real name, email and
phone. It includes no fee and earns no commission. Entry still requires the
ambassador to satisfy university admission and the original physical ID checks.

General admission text remains men 21+, women 18+, door selection. A validated
active university code shows 18+ for both, mixed groups exactly 50:50, couples or
girls-only. Age is checked at the event date and the university ratio is checked
in the database before payment. Date of birth and gender are stored privately in
the existing guest-roster booking snapshot, under the existing admin access rules.

`/preview/campus` is explicitly a demonstration. It accepts FOFA-A and AUC-A as
sample codes only, uses no real customer records and cannot charge or issue entry.
Real codes require real ambassador assignment in the admin panel.
`/preview/campus/admin` demonstrates adding leaders and allocating short codes
without writing to the live database.

## Verification

Release in two steps: install `campus_ambassadors_and_ticket_tiers`, verify it,
deploy and verify the new checkout, then install `retire_fixed_event_checkout`.
The initial migration leaves the old checkout available for existing deployments.
The release migration makes stale checkout clients refresh their page.

The preparation migration was verified locally and applied to the specified
Supabase project. Its integration assertions also passed there with all fixtures
rolled back. The four existing event bookings retained the same saved totals and
snapshot checksum. The final release migration follows checkout deployment.

Run `npm run typecheck`, `npm run lint`, `npm run build` and the transaction-wrapped
`supabase/tests/campus_ambassadors.test.sql`. Database fixtures roll back. Also
verify simultaneous reservations at a tier and capacity boundary, receipt upload,
and the live checkout/server total before promoting the release.
