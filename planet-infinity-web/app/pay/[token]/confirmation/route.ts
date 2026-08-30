import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token) || !isSupabaseServiceConfigured()) return new Response("Not found", { status: 404 });

  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("booking_number, confirmation_pdf_path, confirmation_issued_at")
    .eq("payment_token", token)
    .maybeSingle();

  if (!booking?.confirmation_issued_at || !booking.confirmation_pdf_path) return new Response("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from("booking-confirmations").download(booking.confirmation_pdf_path);
  if (error || !data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${booking.booking_number}-confirmation.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
