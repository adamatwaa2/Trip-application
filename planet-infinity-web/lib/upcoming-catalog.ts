import "server-only";
import {cache} from "react";
import {UPCOMING_WORLDS, type UpcomingWorld} from "@/content/upcoming-worlds";
import {createServiceClient,isSupabaseServiceConfigured} from "@/lib/supabase/service";
import {isSafeCatalogUrl} from "@/lib/catalog-media";
import {CATALOG_BACKGROUNDS,CATALOG_CHANNELS,CATALOG_DEPTHS,CATALOG_FINISHES,CATALOG_TYPOGRAPHIES,isHexColor,type CatalogVisualTheme} from "@/lib/catalog-visual-theme";

function url(value:unknown) {return typeof value === "string" && value.length <= 2000 && isSafeCatalogUrl(value) ? value : undefined;}
function mergeWorld(world:UpcomingWorld, media:Record<string,unknown>):UpcomingWorld {
 const raw=(media.visualTheme && typeof media.visualTheme === "object" ? media.visualTheme : {}) as CatalogVisualTheme;
 const accent=typeof raw.primaryColor === "string" && isHexColor(raw.primaryColor)?raw.primaryColor:world.accent;
 const surface=typeof raw.secondaryColor === "string" && isHexColor(raw.secondaryColor)?raw.secondaryColor:world.surface;
 const dark=raw.surface?raw.surface==="dark":world.ink.toLowerCase()==="#fdf8f1" || world.ink.toLowerCase()==="#fff5e4";
 const theme:CatalogVisualTheme={primaryColor:accent,secondaryColor:surface,surface:dark?"dark":"light",logo:url(raw.logo),logoAlt:typeof raw.logoAlt==="string"?raw.logoAlt.slice(0,240):undefined,backgroundImage:url(raw.backgroundImage),background:raw.background&&CATALOG_BACKGROUNDS.includes(raw.background)?raw.background:"clean",depth:raw.depth&&CATALOG_DEPTHS.includes(raw.depth)?raw.depth:"raised",finish:raw.finish&&CATALOG_FINISHES.includes(raw.finish)?raw.finish:"matte",typography:raw.typography&&CATALOG_TYPOGRAPHIES.includes(raw.typography)?raw.typography:"brand"};
 const channels=Array.isArray(raw.channels)?raw.channels.filter(channel=>CATALOG_CHANNELS.includes(channel)):world.channels;
 return {...world,accent,surface,ink:dark?"#fff5e4":"#0f1e28",channels:channels.length?channels:world.channels,theme,hero:url(media.hero),video:url(media.video),logo:theme.logo,window:typeof media.planningWindow === "string" && media.planningWindow.trim()?media.planningWindow.trim().slice(0,120):world.window};
}
export const getUpcomingWorlds=cache(async():Promise<UpcomingWorld[]>=>{
 if(!isSupabaseServiceConfigured())return UPCOMING_WORLDS;
 try {
  const db=createServiceClient();
  const [trips,events]=await Promise.all([
   db.from("trips").select("slug,media").in("slug",UPCOMING_WORLDS.filter(w=>w.kind==="trip").map(w=>w.slug)),
   db.from("events").select("slug,media").in("slug",UPCOMING_WORLDS.filter(w=>w.kind==="event").map(w=>w.slug))
  ]);
  // This allowlist is public preview content. Never return arbitrary drafts or raw media.
  const rows=new Map([...trips.data??[],...events.data??[]].filter(row=>row.media?.conceptPreview===true).map(row=>[row.slug,row.media]));
  return UPCOMING_WORLDS.map(world=>rows.has(world.slug)?mergeWorld(world,rows.get(world.slug)):world);
 }catch{return UPCOMING_WORLDS;}
});
export async function getUpcomingWorld(slug:string,kind:"trip"|"event") {return (await getUpcomingWorlds()).find(world=>world.slug===slug&&world.kind===kind);}
