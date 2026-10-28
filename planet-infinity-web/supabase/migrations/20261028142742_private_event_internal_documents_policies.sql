-- The event-internal-documents bucket is private, PDF-only and limited to 4 MB.
-- Bucket provisioning is performed through the Storage API, never object-table writes.
create policy event_internal_documents_admin_select
on storage.objects for select to authenticated
using (bucket_id = 'event-internal-documents' and (select private.is_pi_admin()));

create policy event_internal_documents_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'event-internal-documents'
  and (select private.is_pi_admin())
  and (storage.foldername(name))[1] in (select id::text from public.events)
);
