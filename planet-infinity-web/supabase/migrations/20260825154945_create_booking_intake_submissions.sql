create table public.booking_intake_submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 120),
  phone_whatsapp text not null check (length(trim(phone_whatsapp)) between 7 and 40),
  experience text not null check (length(trim(experience)) between 2 and 160),
  trip_date date not null,
  guest_count integer not null check (guest_count between 1 and 100),
  guest_names text,
  package_option text,
  pickup_point text,
  special_notes text,
  total_amount numeric(12,2) not null check (total_amount >= 0),
  payment_method text not null check (payment_method in ('instapay','vodafone_cash','bank_transfer','cash','other')),
  payment_status text not null default 'paid' check (payment_status in ('paid','partial','pending')),
  payment_proof_path text not null check (payment_proof_path ~ '^incoming/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'),
  payment_proof_name text,
  created_at timestamptz not null default now()
);

alter table public.booking_intake_submissions enable row level security;

create policy "Public booking intake insert"
on public.booking_intake_submissions
for insert
to anon, authenticated
with check (
  length(trim(full_name)) between 2 and 120
  and length(trim(phone_whatsapp)) between 7 and 40
  and guest_count between 1 and 100
  and total_amount >= 0
);

grant insert on table public.booking_intake_submissions to anon, authenticated;
revoke select, update, delete on table public.booking_intake_submissions from anon, authenticated;

create policy "Public booking proof upload"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = 'incoming'
);
