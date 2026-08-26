import { requireAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("booking_number, confirmation_pdf_path")
    .eq("id", id)
    .maybeSingle();

  if (!booking?.confirmation_pdf_path) return new Response("Not found", { status: 404 });

  const { data, error } = await supabase.storage
    .from("booking-confirmations")
    .download(booking.confirmation_pdf_path);
  if (error || !data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${booking.booking_number}-confirmation.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
