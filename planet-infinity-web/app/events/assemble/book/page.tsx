import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getUpcomingWorld} from "@/lib/upcoming-catalog";
import {CatalogThemeFrame} from "@/components/CatalogThemeFrame";
import {AssembleMission} from "@/components/AssembleMission";

export const metadata:Metadata={title:"Send your request — ASSEMBLE | Planet Infinity",description:"An Avengers: Doomsday-inspired experience. Choose your Avengers inspiration and send your ASSEMBLE interest request directly to Planet Infinity. No payment required.",robots:{index:false,follow:true}};
export default async function AssembleMissionPage(){
 const world=await getUpcomingWorld("doomsday","event");
 if(!world)notFound();
 return <CatalogThemeFrame kind="event" theme={world.theme}><AssembleMission window={world.window}/></CatalogThemeFrame>;
}
