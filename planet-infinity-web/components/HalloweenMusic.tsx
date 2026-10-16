"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import "@/app/halloween-music.css";

const EVENT="/events/halloween-party-2026";
export function HalloweenMusic(){
 const pathname=usePathname();
 const audio=useRef<HTMLAudioElement|null>(null);
 const active=useRef(false);
 const muted=useRef(false);
 const [url,setUrl]=useState<string|null>(null);
 const [visible,setVisible]=useState(false);
 const [playing,setPlaying]=useState(false);
 const [failed,setFailed]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  fetch("/api/events/halloween/music",{signal:controller.signal}).then(r=>r.ok?r.json():null).then(data=>{if(typeof data?.url==="string")setUrl(data.url);}).catch(()=>{});
  return()=>controller.abort();
 },[]);
 useEffect(()=>{
  const inEvent=pathname.startsWith(EVENT);
  const inPayment=pathname.startsWith("/pay/")||pathname==="/payment/result";
  let remembered=false;
  try{remembered=sessionStorage.getItem("pi-halloween-music-active")==="yes";}catch{}
  active.current=inEvent||(inPayment&&remembered);
  setVisible(active.current);
  try{sessionStorage.setItem("pi-halloween-music-active",active.current?"yes":"no");}catch{}
  if(!active.current){audio.current?.pause();muted.current=false;setPlaying(false);}
  else if(url&&!muted.current)void audio.current?.play().catch(()=>{});
 },[pathname,url]);
 useEffect(()=>{
  if(!url)return;
  function start(event:Event){
   const link=event.target instanceof Element?event.target.closest("a"):null;
   const entering=link?.getAttribute("href")?.startsWith(EVENT);
   if((entering||active.current)&&!muted.current){
    if(entering){active.current=true;try{sessionStorage.setItem("pi-halloween-music-active","yes");}catch{}}
    void audio.current?.play().catch(()=>{});
   }
  }
  document.addEventListener("click",start,true);
  document.addEventListener("keydown",start,true);
  return()=>{document.removeEventListener("click",start,true);document.removeEventListener("keydown",start,true);};
 },[url]);
 if(!url)return null;
 return <><audio ref={audio} src={url} loop preload="auto" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setPlaying(false);}}/>{visible?<button className="hw-music-toggle" type="button" aria-label={playing?"Mute event music":"Play event music"} aria-pressed={playing} disabled={failed} onClick={()=>{if(playing){muted.current=true;audio.current?.pause();}else{muted.current=false;void audio.current?.play().catch(()=>{});}}}>{failed?"Music unavailable":playing?"Sound on · Mute":"Play the night ♫"}</button>:null}</>;
}
