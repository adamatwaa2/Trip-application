import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { SocotraRequestFlow } from "@/components/SocotraRequestFlow";
import { MediaBlock } from "@/components/MediaBlock";
export const metadata: Metadata = { title:"Request Booking — Socotra", robots:{index:false,follow:false} };
export default function SocotraRequestPage() {
 return <Section tone="white" className="pi-catalog-booking"><Container><Breadcrumbs trail={[{label:"Home",href:"/"},{label:"Travel",href:"/trips"},{label:"Socotra",href:"/trips/socotra"},{label:"Request Booking"}]} /><div className="socotra-booking-intro"><h1 className="pi-flow__heading">Socotra</h1><p>Your island journey starts here.</p><MediaBlock src="/socotra/dunes-at-dusk.jpeg" alt="Warm sunset light over white dunes and turquoise water" ratio="21-9" className="socotra-booking-photo" eager /></div><SocotraRequestFlow /></Container></Section>;
}
