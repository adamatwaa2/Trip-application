import { HalloweenBookingFlow } from "@/components/HalloweenBookingFlow";
import { HALLOWEEN_EVENT } from "@/content/events/halloween";
import "@/app/halloween.css";
export const metadata={title:"Campus checkout preview",robots:{index:false,follow:false}};
export default function CampusPreview(){return <HalloweenBookingFlow event={HALLOWEEN_EVENT} preview appearance="blend"/>;}
