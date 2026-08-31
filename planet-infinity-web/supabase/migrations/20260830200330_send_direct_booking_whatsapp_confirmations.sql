-- Direct bookings do not have a request row. Their booking-level WhatsApp
-- consent must still queue the same final confirmation notification.
create or replace function private.queue_direct_booking_confirmation_whatsapp()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  customer_phone text;
begin
  if new.confirmation_issued_at is not null
     and old.confirmation_issued_at is null
     and new.request_id is null
     and new.whatsapp_opt_in
     and new.confirmation_pdf_path is not null then
    select phone into customer_phone from public.customers where id = new.customer_id;
    if customer_phone is not null then
      insert into public.notification_outbox(booking_id, request_id, channel, event_type, recipient, payload, dedupe_key)
      values (
        new.id, null, 'whatsapp', 'booking_confirmation', customer_phone,
        jsonb_build_object('booking_number', new.booking_number, 'storage_path', new.confirmation_pdf_path, 'version', new.confirmation_version),
        'booking-confirmation:' || new.id::text || ':' || new.confirmation_version::text || ':whatsapp'
      ) on conflict (dedupe_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.queue_direct_booking_confirmation_whatsapp() from public, anon, authenticated;
drop trigger if exists bookings_queue_direct_confirmation_whatsapp on public.bookings;
create trigger bookings_queue_direct_confirmation_whatsapp
after update of confirmation_issued_at on public.bookings
for each row execute function private.queue_direct_booking_confirmation_whatsapp();