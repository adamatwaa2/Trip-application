import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getUpcomingWorld} from "@/lib/upcoming-catalog";
import {AssembleExperience} from "@/components/AssembleExperience";

export const metadata:Metadata={title:"ASSEMBLE — Avengers: Doomsday-inspired | Planet Infinity",description:"Before Doomsday, we assemble. A fan-inspired Avengers: Doomsday community concept with costumes, cinematic atmosphere and a new team.",alternates:{canonical:"/events/assemble"}};
export default async function AssemblePage(){
 const world=await getUpcomingWorld("doomsday","event");
 if(!world)notFound();
 return <AssembleExperience world={world}/>;
}
