alter table public.trips
  add column if not exists currency text not null default 'EGP',
  add column if not exists price_unit text;

alter table public.trips
  drop constraint if exists trips_currency_check;

alter table public.trips
  add constraint trips_currency_check
  check (currency ~ '^[A-Z]{3}$');

insert into public.trips (
  slug,
  title,
  short_description,
  description,
  destination,
  duration_label,
  departure_at,
  return_at,
  meeting_point,
  departure_point,
  return_point,
  package_label,
  accommodation,
  transportation,
  price_egp,
  currency,
  price_unit,
  booking_mode,
  application_required,
  seat_selection_enabled,
  payment_proof_required,
  is_published,
  is_featured,
  media,
  options,
  booking_form_fields,
  document_url,
  document_label,
  inclusions,
  exclusions,
  itinerary,
  important_information
)
values (
  'socotra',
  'Socotra',
  'Eight days of white dunes, turquoise lagoons and dragon blood forests. Meet the group in Jeddah; island flights, the ground program and Socotra visa are included, subject to confirmation.',
  'Start at Detwah Lagoon, take a boat to Shuab Beach, and camp among the dragon blood trees of Firmhin. Continue through caves, dunes and natural pools to the coast at Arher, Dihamri and Delisha.',
  'Socotra, Yemen',
  '8 days / 7 nights · Nov 2026, Jan & Mar 2027 (proposed)',
  '2026-11-26 00:00:00+03',
  '2026-12-03 00:00:00+03',
  'Jeddah, Saudi Arabia',
  'Jeddah, Saudi Arabia',
  'Jeddah, Saudi Arabia',
  'Your island journey · 8 days / 7 nights',
  'Camping, following the supplied program.',
  'Return flights from Jeddah to Socotra, plus 4×4 transport on the island.',
  2190,
  'USD',
  'per person · Early Bird estimate',
  'request',
  false,
  false,
  false,
  true,
  true,
  jsonb_build_object(
    'hero', '/socotra/white-dunes-and-sea.jpeg',
    'heroAlt', 'White dunes and the sea in Socotra, image supplied for this trip',
    'galleryLayout', 'grid',
    'gallery', jsonb_build_array(
      jsonb_build_object('src', '/socotra/dunes-at-dusk.jpeg', 'alt', 'White sand dunes beside the turquoise sea at dusk'),
      jsonb_build_object('src', '/socotra/white-dunes-and-sea.jpeg', 'alt', 'Travelers walking on white dunes above the sea'),
      jsonb_build_object('src', '/socotra/dragon-blood-forest.jpeg', 'alt', 'A traveler looking over the dragon blood tree forest'),
      jsonb_build_object('src', '/socotra/kalisan-canyon.jpeg', 'alt', 'Kalisan Canyon, credited to Kristina Makeeva in the supplied filename'),
      jsonb_build_object('src', '/socotra/flowers-and-dragon-trees.jpeg', 'alt', 'Pink flowers framing dragon blood trees'),
      jsonb_build_object('src', '/socotra/desert-rose-night.jpeg', 'alt', 'Desert rose trees beneath a star-filled sky'),
      jsonb_build_object('src', '/socotra/island-moments.jpeg', 'alt', 'Supplied collage of dunes, dragon blood trees and the night sky'),
      jsonb_build_object('src', '/socotra/camp-at-sunset.jpeg', 'alt', 'Supplied collage of camping among dragon blood trees at sunset'),
      jsonb_build_object('src', '/socotra/desert-rose-portrait.jpeg', 'alt', 'Portrait among flowering desert rose trees')
    ),
    'visualTheme', jsonb_build_object(
      'primaryColor', '#7bcfd8',
      'secondaryColor', '#f59b23',
      'surface', 'light',
      'finish', 'soft-metal',
      'background', 'sea-blur',
      'depth', 'raised',
      'typography', 'brand',
      'explorerMotion', 'gentle',
      'explorerScale', 1,
      'channels', jsonb_build_array('trips')
    )
  ),
  jsonb_build_array(
    jsonb_build_object(
      'id', 'departure',
      'kind', 'date',
      'label', 'Choose your departure',
      'hint', '8 days / 7 nights. Proposed dates, subject to flight and availability confirmation.',
      'required', true,
      'choices', jsonb_build_array(
        jsonb_build_object('id', 'socotra-2026-11-26', 'label', '26 November – 3 December 2026', 'detail', '8 days / 7 nights · proposed departure', 'duration', '8 days / 7 nights', 'scheduledAt', '2026-11-26T00:00:00+03:00', 'returnAt', '2026-12-03T00:00:00+03:00'),
        jsonb_build_object('id', 'socotra-2027-01-07', 'label', '7 – 14 January 2027', 'detail', '8 days / 7 nights · proposed departure', 'duration', '8 days / 7 nights', 'scheduledAt', '2027-01-07T00:00:00+03:00', 'returnAt', '2027-01-14T00:00:00+03:00'),
        jsonb_build_object('id', 'socotra-2027-03-11', 'label', '11 – 18 March 2027', 'detail', '8 days / 7 nights · proposed departure', 'duration', '8 days / 7 nights', 'scheduledAt', '2027-03-11T00:00:00+03:00', 'returnAt', '2027-03-18T00:00:00+03:00')
      )
    )
  ),
  jsonb_build_array(
    jsonb_build_object('id', 'origin-country', 'label', 'Country', 'type', 'text', 'required', true, 'help', 'Where are you flying from?'),
    jsonb_build_object('id', 'origin-city-airport', 'label', 'City or airport', 'type', 'text', 'required', true),
    jsonb_build_object(
      'id', 'jeddah-plan',
      'label', 'Getting to Jeddah',
      'type', 'select',
      'required', true,
      'help', 'We meet in Jeddah, Saudi Arabia, and fly together to Socotra. Your flight to Jeddah is arranged separately.',
      'options', jsonb_build_array(
        jsonb_build_object('id', 'help-me-connect', 'label', 'Help me get to the meeting point', 'detail', 'Ask our team for flight options to Jeddah and a separate quote.'),
        jsonb_build_object('id', 'self-arranged', 'label', 'I will arrange my flight to Jeddah', 'detail', 'Wait for our confirmed group flight schedule before buying your ticket.')
      )
    )
  ),
  '/documents/Socotra Trip Program.pdf',
  'Socotra Trip Program · 8 days',
  jsonb_build_array(
    'Your flight from Jeddah to Socotra and back, according to the confirmed package',
    'Socotra entry visa, subject to eligibility and approval',
    '4×4 transport and an English-speaking guide',
    'Camping equipment, campsite fees and a cook',
    'Three meals daily with drinks',
    'The boat trip in the program'
  ),
  jsonb_build_array(
    'Travel from your home country to Jeddah and back',
    'Personal expenses and tips',
    'Saudi entry or transit requirements, travel insurance and snorkeling or diving equipment rental'
  ),
  jsonb_build_array(
    jsonb_build_object('label', 'Day 1', 'title', 'Qalansiyah & Detwah Lagoon', 'body', 'Meet your guide at Socotra Airport and drive towards Qalansiyah, stopping at the old Russian tanks. Walk from the Detwah viewpoint to the lagoon, enjoy beach time and lunch at camp, then visit a sunset viewpoint. Overnight at Detwah Lagoon.'),
    jsonb_build_object('label', 'Day 2', 'title', 'Shuab Beach & Detwah', 'body', 'Boat trip to Shuab Beach with a swimming and snorkeling stop as conditions permit. Dolphins and seabirds may be seen along the way. Return to Detwah for lunch, then visit Abdullah at his cave. Overnight at Detwah Lagoon.'),
    jsonb_build_object('label', 'Day 3', 'title', 'Dixam, Wadi Dirhur & Firmhin Forest', 'body', 'Explore Dixam Plateau, the dragon blood trees and viewpoints over Wadi Dirhur. Descend into the canyon for lunch and free time, then continue to Firmhin Forest for an overnight camp.'),
    jsonb_build_object('label', 'Day 4', 'title', 'Degub Cave, Omak Beach & Zahaq Dunes', 'body', 'A short walk to Degub Cave, lunch by the sea at Omak Beach, and an afternoon visit to Zahaq sand dunes for sunset. Overnight at Omak Beach.'),
    jsonb_build_object('label', 'Day 5', 'title', 'Wadi Kalasan & Arher Beach', 'body', 'Approximately a 30-minute descent to Wadi Kalasan''s natural pool, followed by a picnic at the top. Continue to Arher Beach for swimming, relaxing and photography. Dinner and overnight at Arher Beach.'),
    jsonb_build_object('label', 'Day 6', 'title', 'Homhil & Ras Ersal', 'body', 'A pre-dawn dune walk at Arher, followed by a drive to Homhil and an approximately 30-minute walk to its natural pool. Visit Ras Ersal in the afternoon and return to Arher camp.'),
    jsonb_build_object('label', 'Day 7', 'title', 'Dihamri & Delisha', 'body', 'Lunch in a shady wadi, followed by Dihamri Marine Protected Area and Delisha Beach. Snorkeling and diving equipment can be rented at Dihamri; rental costs require separate confirmation. Dinner and overnight by Delisha Beach.'),
    jsonb_build_object('label', 'Day 8', 'title', 'Hadibo & departure', 'body', 'Morning shopping in Hadibo and a visit to the fish market, depending on flight timing. Transfer to Socotra Airport for the return flight to Jeddah.')
  ),
  jsonb_build_array(
    'Early Bird estimate: USD 2,190 per traveler. Regular price: USD 2,290.',
    'Dates are proposed. Flight schedule, availability and visa eligibility are confirmed individually before a booking is accepted.',
    'The package starts and ends in Jeddah. Connections from other countries are quoted separately.',
    'The operator PDF excludes flights; Planet Infinity adds return Jeddah–Socotra flights to this package.',
    'Wildlife sightings and water activities depend on conditions.',
    'Review travel advice from your country and check insurance cover before requesting the trip.',
    'This is a request-only trip. No payment is collected before the request is reviewed and accepted.'
  )
)
on conflict (slug) do update set
  title = excluded.title,
  short_description = excluded.short_description,
  description = excluded.description,
  destination = excluded.destination,
  duration_label = excluded.duration_label,
  departure_at = excluded.departure_at,
  return_at = excluded.return_at,
  meeting_point = excluded.meeting_point,
  departure_point = excluded.departure_point,
  return_point = excluded.return_point,
  package_label = excluded.package_label,
  accommodation = excluded.accommodation,
  transportation = excluded.transportation,
  price_egp = excluded.price_egp,
  currency = excluded.currency,
  price_unit = excluded.price_unit,
  booking_mode = excluded.booking_mode,
  application_required = excluded.application_required,
  seat_selection_enabled = excluded.seat_selection_enabled,
  payment_proof_required = excluded.payment_proof_required,
  is_published = excluded.is_published,
  is_featured = excluded.is_featured,
  media = excluded.media,
  options = excluded.options,
  booking_form_fields = excluded.booking_form_fields,
  document_url = excluded.document_url,
  document_label = excluded.document_label,
  inclusions = excluded.inclusions,
  exclusions = excluded.exclusions,
  itinerary = excluded.itinerary,
  important_information = excluded.important_information,
  updated_at = now();
