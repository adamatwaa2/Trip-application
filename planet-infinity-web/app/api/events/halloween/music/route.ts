import {createClient} from "@/lib/supabase/server";
import {normaliseSoundtrack} from "@/lib/catalog-music";
import {isSupabaseConfigured} from "@/lib/supabase/env";
export async function GET(){
 if(!isSupabaseConfigured())return Response.json({url:null});
 const {data}=await (await createClient()).from("events").select("media").eq("slug","halloween-party-2026").eq("is_published",true).maybeSingle();
 const media=data?.media as {backgroundAudio?:unknown;soundtrack?:unknown}|null;
 if(normaliseSoundtrack(media?.soundtrack)?.enabled)return Response.json({url:null},{headers:{"Cache-Control":"no-store"}});
 const url=typeof media?.backgroundAudio==="string"?media.backgroundAudio:null;
 return Response.json({url:url&&(/^(https?:\/\/|\/(?!\/))/.test(url))?url:null},{headers:{"Cache-Control":"public, max-age=30"}});
}

