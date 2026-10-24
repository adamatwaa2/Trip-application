"use server";
import {requireAdmin} from "@/lib/admin";
import {createClient} from "@/lib/supabase/server";
import {isSafeCatalogUrl} from "@/lib/catalog-media";
export async function savedDirectAudio():Promise<{url:string;label:string}[]>{
 await requireAdmin();const db=await createClient();
 const results=await Promise.all([db.from("trips").select("title,media").limit(500),db.from("events").select("title,media").limit(500)]);
 const songs=new Map<string,{url:string;label:string}>();
 for(const result of results)for(const row of result.data??[]){const url=row.media?.backgroundAudio;if(typeof url==="string"&&url&&isSafeCatalogUrl(url))songs.set(url,{url,label:row.title});}
 return [...songs.values()].sort((a,b)=>a.label.localeCompare(b.label));
}
