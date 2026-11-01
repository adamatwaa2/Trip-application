-- Share the existing private, PDF-only internal-document bucket with trip admin pages.
-- Downloads continue to require the existing active-admin SELECT policy.
create policy trip_internal_documents_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-internal-documents'
  and (select private.is_pi_admin())
  and (storage.foldername(name))[1] in (select id::text from public.trips)
);
