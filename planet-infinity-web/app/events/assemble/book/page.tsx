import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getUpcomingWorld} from "@/lib/upcoming-catalog";
import {CatalogThemeFrame} from "@/components/CatalogThemeFrame";
import {AssembleMission} from "@/components/AssembleMission";

export const metadata:Metadata={title:"Your mission profile — ASSEMBLE | Planet Infinity",description:"Explore your hero identity and squad in the ASSEMBLE concept preview. Booking is not open yet.",robots:{index:false,follow:true}};
export default async function AssembleMissionPage(){
 const world=await getUpcomingWorld("doomsday","event");
 if(!world)notFound();
 return <CatalogThemeFrame kind="event" theme={world.theme}><AssembleMission window={world.window}/></CatalogThemeFrame>;
}
