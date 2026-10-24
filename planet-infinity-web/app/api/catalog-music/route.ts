import { createClient } from "@/lib/supabase/server";
import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { findUpcomingWorld } from "@/content/upcoming-worlds";
import { normaliseSoundtrack } from "@/lib/catalog-music";

export async function GET(request: Request) {
  const reply = (song: ReturnType<typeof normaliseSoundtrack>) => Response.json({song}, {headers:{"Cache-Control":"no-store"}});
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const match = path.match(/^\/(trips|events)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!match || match[2].length > 160 || !isSupabaseConfigured()) return reply(null);
  const kind = match[1] as "trips" | "events", slug = match[2];
  try {
    const db = await createClient();
    const {data, error} = await db.from(kind).select("media").eq("slug",slug).eq("is_published",true).maybeSingle();
    if (error) return reply(null);
    let media = data?.media;
    // Only explicitly public concept previews may read an unpublished row.
    if (!data && findUpcomingWorld(slug,kind === "trips" ? "trip" : "event") && isSupabaseServiceConfigured()) {
      const {data: preview} = await createServiceClient().from(kind).select("media").eq("slug",slug).maybeSingle();
      if (preview?.media?.conceptPreview === true) media = preview.media;
    }
    const song = normaliseSoundtrack(media?.soundtrack);
    return reply(song?.enabled ? song : null);
  } catch { return reply(null); }
}
