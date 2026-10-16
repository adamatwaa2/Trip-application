"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {createHalloweenDraft} from "@/app/actions/event-bookings";
export function HalloweenDraftButton(){
  const router=useRouter();const [pending,startTransition]=useTransition();const [error,setError]=useState("");
  return <div><button className="pi-admin-button" disabled={pending} type="button" onClick={()=>startTransition(async()=>{setError("");const result=await createHalloweenDraft();if(!result.ok){setError(result.error);return;}router.push(`/admin/events/${result.id}`);router.refresh();})}>{pending?"Creating draft…":"Add Halloween draft"}</button>{error?<p role="alert" className="pi-admin-error">{error}</p>:null}</div>;
}
