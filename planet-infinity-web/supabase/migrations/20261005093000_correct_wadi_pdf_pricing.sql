-- Match the published Wadi El Hitan Nocturne quotation exactly.
update public.trips
set
  price_egp = 2850,
  important_information = '["Early Bird: EGP 2,850 per person for a limited time; regular price is EGP 3,100 per person.","Foreigners Early Bird: EGP 4,850 per person; foreigners regular price is EGP 5,100 per person.","A 50% deposit starts the booking. The remaining 50% is due no later than 3 days before the trip date.","A booking is confirmed only when Planet Infinity issues the Booking Confirmation.","Private double tent: EGP 450 per tent, sleeps two; request before the trip.","Pottery workshop, horse riding and beach buggy activities in Tunis Village are optional add-ons with extra fees.","Groups of 5 guests or more can request a special group rate and booking code.","Trip times are approximate and may shift with the group''s pace and road conditions.","Special supplier cancellation terms may apply and will be stated before payment is completed."]'::jsonb,
  updated_at = now()
where slug = 'wadi-el-hitan-nocturne';
