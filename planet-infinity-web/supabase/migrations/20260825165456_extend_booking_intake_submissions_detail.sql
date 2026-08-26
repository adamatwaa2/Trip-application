alter table public.booking_intake_submissions
  add column if not exists reference text,
  add column if not exists trip_id uuid references public.trips(id) on delete set null,
  add column if not exists trip_slug text,
  add column if not exists email text,
  add column if not exists guests jsonb not null default '[]'::jsonb,
  add column if not exists form_answers jsonb not null default '{}'::jsonb,
  add column if not exists amount_paid numeric(10,2) not null default 0,
  add column if not exists emergency_name text,
  add column if not exists emergency_phone text,
  add column if not exists instagram text,
  add column if not exists heard_about text,
  add column if not exists song_request text,
  add column if not exists whatsapp_opt_in boolean not null default false,
  add column if not exists policies_accepted boolean not null default false,
  add column if not exists review_status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists source text default 'intake_form';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bis_review_status_check') then
    alter table public.booking_intake_submissions
      add constraint bis_review_status_check
      check (review_status in ('new','verified','rejected','converted'));
  end if;
end $$;

create unique index if not exists bis_reference_key on public.booking_intake_submissions (reference);
create index if not exists bis_created_idx on public.booking_intake_submissions (created_at desc);
create index if not exists bis_trip_idx on public.booking_intake_submissions (trip_id);

alter table public.booking_intake_submissions alter column payment_proof_path drop not null;

do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'booking_intake_submissions'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%incoming/%'
  loop
    execute format('alter table public.booking_intake_submissions drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.booking_intake_submissions
  add constraint bis_payment_proof_path_check
  check (
    payment_proof_path is null
    or payment_proof_path ~ '^incoming/[0-9]{4}-[0-9]{2}/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$'
  );
