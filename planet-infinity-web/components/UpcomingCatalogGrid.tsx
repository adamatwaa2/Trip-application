import type {CatalogChannel} from "@/lib/catalog-visual-theme";
import {getUpcomingWorlds} from "@/lib/upcoming-catalog";
import {UpcomingWorldGrid} from "./UpcomingWorlds";
export async function UpcomingCatalogGrid({channel,publishedSlugs=[],title}:{channel:CatalogChannel;publishedSlugs?:string[];title?:string}) {
 const published=new Set(publishedSlugs);
 const worlds=(await getUpcomingWorlds()).filter(world=>world.channels.includes(channel)&&!published.has(world.slug));
 return <UpcomingWorldGrid worlds={worlds} title={title}/>;
}
