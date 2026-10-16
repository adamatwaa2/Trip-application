import {notFound} from "next/navigation";
import {HalloweenAdminPreview} from "@/components/HalloweenAdminPreview";
import "@/app/halloween.css";
export const dynamic="force-dynamic";
export const metadata={title:"Halloween admin preview",robots:{index:false,follow:false}};
export default function PreviewPage(){if(process.env.NODE_ENV!=="development")notFound();return <HalloweenAdminPreview/>;}
