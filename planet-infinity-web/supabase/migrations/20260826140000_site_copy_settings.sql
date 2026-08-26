insert into public.settings (key, value, label, is_public) values
  ('home_eyebrow', 'Available now', 'Home eyebrow', true),
  ('home_title', 'Your next world starts here.', 'Home headline', true),
  ('home_lede', 'Book the trips and experiences that are open now, or step into the events world.', 'Home introduction', true),
  ('home_trips_title', 'Trips you can join', 'Home trips heading', true),
  ('home_trips_lede', 'Real departures, clear details and a booking path that matches each trip.', 'Home trips introduction', true),
  ('home_events_title', 'Events worth showing up for', 'Home events heading', true),
  ('home_events_lede', 'Daytime gatherings, creative sessions and nights with their own energy.', 'Home events introduction', true),
  ('events_title', 'Events with a world of their own', 'Events page headline', true),
  ('events_lede', 'From daytime gatherings to after-dark experiences, every event is announced only when its details are ready.', 'Events page introduction', true),
  ('explore_title', 'One planet. More than one world.', 'Explore page headline', true),
  ('explore_lede', 'Move between travel and events as the Planet Infinity universe changes around you.', 'Explore page introduction', true),
  ('footer_tagline', E'Travel, experiences and events.\nOne brand, more than one world.', 'Footer tagline', true)
on conflict (key) do nothing;
