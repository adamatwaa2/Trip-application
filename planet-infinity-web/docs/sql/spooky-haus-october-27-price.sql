-- Spooky Haus only. Existing quotes and booking functions already read this schedule.
-- Cairo is UTC+3 at this deadline: 27 October 2026, 23:59 = 20:59 UTC.
-- Existing bookings retain the totals saved when they were created.
update public.events
set price_egp = 1200,
    ticket_label = 'Admission',
    media = jsonb_set(coalesce(media, '{}'::jsonb), '{priceSchedule}',
      '{"before":1200,"after":1500,"changesAt":"2026-10-27T20:59:00Z"}'::jsonb),
    important_information = (select jsonb_agg(case
      when item = to_jsonb('EGP 900 Early Bird. EGP 1200 from 25 October 2026, 11:59 PM Cairo.'::text)
      then to_jsonb('EGP 1,200 per ticket. EGP 1,500 from 27 October 2026, 11:59 PM Cairo.'::text)
      else item end order by position)
      from jsonb_array_elements(important_information) with ordinality as entries(item, position))
where id = '06b70736-8154-4cbd-8d8b-b58ab1067ddf'
  and slug = 'spooky-haus'
  and media->'priceSchedule' = '{"before":900,"after":1200,"changesAt":"2026-10-25T20:59:00Z"}'::jsonb
returning id, slug, price_egp, booking_fee_egp, ticket_label, media->'priceSchedule' as price_schedule;
