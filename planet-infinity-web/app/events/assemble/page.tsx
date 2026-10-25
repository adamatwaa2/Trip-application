import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getUpcomingWorld} from "@/lib/upcoming-catalog";
import {AssembleExperience} from "@/components/AssembleExperience";

export const metadata:Metadata={title:"ASSEMBLE — An Avengers-inspired experience | Planet Infinity",description:"The next team is us. Discover ASSEMBLE, an independent Avengers-inspired community concept by Planet Infinity.",alternates:{canonical:"/events/assemble"}};
export default async function AssemblePage(){
 const world=await getUpcomingWorld("doomsday","event");
 if(!world)notFound();
 return <AssembleExperience world={world}/>;
}
