-- Complete Paymob Intention API support with retry-safe references and wallets.

alter table public.payments
  add column if not exists provider_reference text;

create unique index if not exists payments_provider_reference_key
  on public.payments (provider, provider_reference)
  where provider_reference is not null;

alter table public.payments
  drop constraint if exists payments_payment_method_check;

alter table public.payments
  add constraint payments_payment_method_check
  check (payment_method in (
    'cash',
    'bank_transfer',
    'instapay',
    'vodafone_cash',
    'card_terminal',
    'paymob_card',
    'paymob_wallet',
    'other'
  ));

comment on column public.payments.provider_reference is
  'Unique special_reference sent for each Paymob intention, used to reconcile retries safely.';

create or replace function private.process_paymob_transaction(
  p_transaction_id text,
  p_order_id text,
  p_merchant_reference text,
  p_amount numeric,
  p_currency text,
  p_success boolean,
  p_pending boolean,
  p_payload jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event public.payment_webhook_events;
  v_payment public.payments;
  v_currency text := upper(trim(coalesce(p_currency, '')));
  v_source_type text := lower(coalesce(p_payload #>> '{obj,source_data,type}', 'card'));
  v_payment_method text;
begin
  if char_length(trim(coalesce(p_transaction_id, ''))) not between 1 and 160
     or char_length(trim(coalesce(p_order_id, ''))) not between 1 and 160
  then raise exception 'Invalid Paymob transaction reference'; end if;
  if p_amount is null or p_amount <= 0 or v_currency = ''
  then raise exception 'Invalid Paymob transaction amount'; end if;
  if jsonb_typeof(coalesce(p_payload, '{}'::jsonb)) <> 'object'
     or pg_column_size(coalesce(p_payload, '{}'::jsonb)) > 1000000
  then raise exception 'Invalid Paymob webhook payload'; end if;

  v_payment_method := case
    when v_source_type in ('wallet', 'mobile_wallet') then 'paymob_wallet'
    else 'paymob_card'
  end;

  insert into public.payment_webhook_events(
    provider, provider_event_id, provider_transaction_id,
    hmac_verified, payload, processing_status
  ) values (
    'paymob', trim(p_transaction_id), trim(p_transaction_id),
    true, p_payload, 'received'
  ) on conflict (provider, provider_event_id) do nothing;

  select * into v_event
  from public.payment_webhook_events event
  where event.provider = 'paymob'
    and event.provider_event_id = trim(p_transaction_id)
  for update;

  if v_event.processing_status in ('processed', 'ignored') then
    return 'duplicate';
  end if;

  update public.payment_webhook_events
  set provider_transaction_id = trim(p_transaction_id), hmac_verified = true,
      payload = p_payload, processing_status = 'received',
      error_message = null, processed_at = null
  where id = v_event.id;

  if nullif(trim(coalesce(p_merchant_reference, '')), '') is not null then
    select payment.* into v_payment
    from public.payments payment
    where payment.provider = 'paymob'
      and payment.provider_reference = trim(p_merchant_reference)
    order by payment.created_at desc
    limit 1
    for update;
  end if;

  if v_payment.id is null then
    select payment.* into v_payment
    from public.payments payment
    where payment.provider = 'paymob'
      and payment.provider_order_id = trim(p_order_id)
    order by payment.created_at desc
    limit 1
    for update;
  end if;

  -- Compatibility for attempts created before provider_reference existed.
  if v_payment.id is null and nullif(trim(coalesce(p_merchant_reference, '')), '') is not null then
    select payment.* into v_payment
    from public.payments payment
    join public.bookings booking on booking.id = payment.booking_id
    where payment.provider = 'paymob'
      and booking.booking_number = trim(p_merchant_reference)
      and payment.gateway_status in ('created', 'pending')
    order by payment.created_at desc
    limit 1
    for update of payment;
  end if;

  if v_payment.id is null then
    update public.payment_webhook_events
    set processing_status = 'ignored',
        error_message = 'No matching Paymob payment attempt', processed_at = now()
    where id = v_event.id;
    return 'ignored';
  end if;

  if v_payment.amount <> round(p_amount, 2) or upper(v_payment.currency) <> v_currency then
    update public.payment_webhook_events
    set processing_status = 'failed',
        error_message = 'Paymob amount or currency mismatch', processed_at = now()
    where id = v_event.id;
    return 'rejected';
  end if;

  if coalesce(p_pending, false) then
    update public.payments
    set gateway_status = 'pending', payment_method = v_payment_method,
        provider_order_id = coalesce(provider_order_id, trim(p_order_id)),
        provider_transaction_id = trim(p_transaction_id),
        provider_data = provider_data || jsonb_build_object('last_webhook', p_payload, 'last_webhook_at', now())
    where id = v_payment.id;
  elsif coalesce(p_success, false) then
    update public.payments
    set status = 'recorded', gateway_status = 'succeeded', payment_method = v_payment_method,
        received_at = coalesce(received_at, now()),
        reference = coalesce(reference, trim(p_transaction_id)),
        provider_order_id = coalesce(provider_order_id, trim(p_order_id)),
        provider_transaction_id = trim(p_transaction_id),
        provider_data = provider_data || jsonb_build_object('last_webhook', p_payload, 'last_webhook_at', now())
    where id = v_payment.id;
  else
    update public.payments
    set status = 'void', gateway_status = 'failed', payment_method = v_payment_method,
        provider_order_id = coalesce(provider_order_id, trim(p_order_id)),
        provider_transaction_id = trim(p_transaction_id),
        provider_data = provider_data || jsonb_build_object('last_webhook', p_payload, 'last_webhook_at', now())
    where id = v_payment.id;
  end if;

  update public.payment_webhook_events
  set processing_status = 'processed', processed_at = now()
  where id = v_event.id;

  return case when coalesce(p_pending, false) then 'pending'
              when coalesce(p_success, false) then 'succeeded'
              else 'failed' end;
end;
$$;

revoke all on function private.process_paymob_transaction(
  text, text, text, numeric, text, boolean, boolean, jsonb
) from public, anon, authenticated;
grant execute on function private.process_paymob_transaction(
  text, text, text, numeric, text, boolean, boolean, jsonb
) to service_role;
