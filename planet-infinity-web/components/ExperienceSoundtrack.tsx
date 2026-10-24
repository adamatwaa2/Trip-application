"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import styles from "./ExperienceSoundtrack.module.css";

function NativeMusic({url}:{url:string}) {
 const audio=useRef<HTMLAudioElement|null>(null),stopped=useRef(false);
 const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const key="pi-direct-music-paused:"+url;
 useEffect(()=>{
  const element=audio.current;if(!element)return;
  try{stopped.current=sessionStorage.getItem(key)==="yes";}catch{}
  element.volume=.3;
  function start(event?:Event){
   if(event?.target instanceof Element&&event.target.closest('[data-experience-music]'))return;
   if(!stopped.current)void element!.play().catch(()=>{});
  }
  start();document.addEventListener("pointerdown",start,true);document.addEventListener("keydown",start,true);
  return()=>{document.removeEventListener("pointerdown",start,true);document.removeEventListener("keydown",start,true);element.pause();};
 },[url,key]);
 function toggle(){const next=!playing;stopped.current=!next;try{sessionStorage.setItem(key,next?"no":"yes");}catch{}if(next)void audio.current?.play().catch(()=>{});else audio.current?.pause();}
 const label=failed?"Music unavailable":playing?"Pause background music":"Play background music";
 return <><audio ref={audio} src={url} loop preload="auto" onPlay={()=>{setPlaying(true);setFailed(false);}} onPause={()=>setPlaying(false)} onError={()=>{setFailed(true);setPlaying(false);}}/><button data-experience-music className={styles.toggle} type="button" aria-label={label} title={label} aria-pressed={playing} onClick={toggle} disabled={failed}>
  <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>{playing?<><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></>:<path d="m16 9 5 6m0-6-5 6"/>}</svg>
 </button></>;
}
export function ExperienceSoundtrack(){
 const pathname=usePathname();
 const match=pathname.match(/^\/(trips|events)\/([a-z0-9-]+)(?:\/book)?\/?$/);
 const canonical=match?`/${match[1]}/${match[2]}`:"";
 const payment=pathname.startsWith("/pay/")||pathname==="/payment/result";
 const [paymentRoot,setPaymentRoot]=useState("");
 const previousRoot=useRef("");
 const [selection,setSelection]=useState<{root:string;url:string}|null>(null);
 const root=canonical||(payment?previousRoot.current||paymentRoot:"");
 useEffect(()=>{if(canonical)previousRoot.current=canonical;else if(!payment)previousRoot.current="";try{if(canonical)sessionStorage.setItem("pi-direct-music-root",canonical);else if(payment)setPaymentRoot(sessionStorage.getItem("pi-direct-music-root")||"");else sessionStorage.removeItem("pi-direct-music-root");}catch{}},[canonical,payment]);
 useEffect(()=>{if(!root)return;const abort=new AbortController();fetch("/api/catalog-music?path="+encodeURIComponent(root),{cache:"no-store",signal:abort.signal}).then(response=>response.ok?response.json():null).then(data=>{if(!abort.signal.aborted)setSelection(typeof data?.audioUrl==="string"?{root,url:data.audioUrl}:null);}).catch(()=>{});return()=>abort.abort();},[root]);
 const current=selection?.root===root?selection:null;
 return current?<NativeMusic key={current.root+current.url} url={current.url}/>:null;
}
