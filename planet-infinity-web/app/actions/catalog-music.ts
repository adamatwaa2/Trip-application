"use server";
import {requireAdmin} from "@/lib/admin";
import {createClient} from "@/lib/supabase/server";
import {normaliseSoundtrack,soundCloudUrl,type CatalogSoundtrack} from "@/lib/catalog-music";
export async function savedCatalogSongs():Promise<CatalogSoundtrack[]> {
 await requireAdmin();const db=await createClient();
 const result=await Promise.all([db.from("trips").select("media").limit(500),db.from("events").select("media").limit(500)]);
 const songs=new Map<string,CatalogSoundtrack>();
 for(const r of result)for(const row of r.data??[]){const song=normaliseSoundtrack(row.media?.soundtrack);if(song)songs.set(song.url,song);}
 return [...songs.values()].sort((a,b)=>a.title.localeCompare(b.title));
}
export async function checkSoundCloudSong(input:string):Promise<{ok:true;song:CatalogSoundtrack}|{ok:false;error:string}> {
 await requireAdmin();const url=soundCloudUrl(input);if(!url)return {ok:false,error:"Use a full https://soundcloud.com/artist/track link, not a short or private link."};
 try{const endpoint=new URL("https://soundcloud.com/oembed");endpoint.searchParams.set("format","json");endpoint.searchParams.set("url",url);
  const r=await fetch(endpoint,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(12000)});
  if(!r.ok)return {ok:false,error:"SoundCloud could not embed this track. Try another public track link."};
  const data=await r.json();if(typeof data.title!=="string"||data.type!=="rich")return {ok:false,error:"This is not an embeddable SoundCloud track."};
  return {ok:true,song:{provider:"soundcloud",url,title:data.title.slice(0,180),enabled:true,autoplay:true,volume:35}};
 }catch{return {ok:false,error:"SoundCloud did not respond. You can retry, or preview the public track link directly."};}
}
