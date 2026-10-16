alter table public.bookings add column if not exists event_ticket_issued_at timestamptz;

create or replace function private.issue_paid_halloween_ticket()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.booking_type='event' and exists(select 1 from public.events e where e.id=new.event_id and e.slug='halloween-party-2026') then
  if new.status<>'cancelled' and new.total_amount>0 and new.amount_paid>=new.total_amount then
   new.status:='confirmed';
   new.services_confirmed_at:=coalesce(new.services_confirmed_at,now());
   new.confirmation_ready_at:=coalesce(new.confirmation_ready_at,now());
   new.event_ticket_issued_at:=coalesce(new.event_ticket_issued_at,now());
  else
   new.event_ticket_issued_at:=null;
   if new.status='confirmed' then new.status:='pending'; end if;
  end if;
 end if;
 return new;
end;$$;
revoke all on function private.issue_paid_halloween_ticket() from public,anon,authenticated;
create trigger z_issue_paid_halloween_ticket before insert or update of amount_paid,total_amount,status on public.bookings for each row execute function private.issue_paid_halloween_ticket();
