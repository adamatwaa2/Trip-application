"use client";
import {useEffect,useRef,useState} from "react";
import styles from "./ExperienceIntroVideo.module.css";

export function ExperienceIntroVideo({src,poster,label}:{src:string;poster?:string;label:string}){
 const video=useRef<HTMLVideoElement|null>(null),userPaused=useRef(false),finished=useRef(false);
 const [muted,setMuted]=useState(true),[paused,setPaused]=useState(true),[ended,setEnded]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const element=video.current;if(!element)return;
  let active=true;userPaused.current=false;finished.current=false;
  element.defaultMuted=true;element.muted=true;
  const start=(event?:Event)=>{if(event?.target instanceof Element&&event.target.closest('[data-intro-controls]'))return;if(!userPaused.current&&!finished.current&&!document.hidden)void element.play().catch(()=>{if(active)setPaused(true);});};
  start();element.addEventListener("canplay",start);document.addEventListener("visibilitychange",start);
  document.addEventListener("pointerdown",start,{passive:true});
  return()=>{active=false;element.removeEventListener("canplay",start);document.removeEventListener("visibilitychange",start);document.removeEventListener("pointerdown",start);element.pause();};
 },[src]);
 const sound=()=>{const element=video.current;if(!element)return;const next=!element.muted;element.muted=next;setMuted(next);if(!userPaused.current&&!finished.current)void element.play().catch(()=>setPaused(true));};
 const playback=()=>{const element=video.current;if(!element)return;if(element.paused){if(element.ended){element.currentTime=0;finished.current=false;setEnded(false);}userPaused.current=false;void element.play().catch(()=>setPaused(true));}else{userPaused.current=true;element.pause();}};
 return <section className={styles.intro} aria-label={label}>
  <video ref={video} src={src} poster={poster} autoPlay muted={muted} playsInline preload="auto" controls={false} aria-label={label} onPlaying={()=>{setPaused(false);setFailed(false);}} onPause={()=>setPaused(true)} onEnded={()=>{finished.current=true;setEnded(true);setPaused(true);}} onVolumeChange={()=>setMuted(video.current?.muted??true)} onError={()=>setFailed(true)}/>
  <div className={styles.controls} data-intro-controls>
   <button type="button" onClick={sound} aria-label={muted?"Turn opening sound on":"Mute opening video"} title={muted?"Sound on":"Mute"} aria-pressed={!muted}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4Z"/>{muted?<path d="m16 9 5 6m0-6-5 6"/>:<path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>}</svg></button>
   <button type="button" onClick={playback} aria-label={ended?"Replay opening video":paused?"Resume opening video":"Pause opening video"} title={ended?"Replay":paused?"Resume":"Pause"}><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">{paused?<><path d="M4 9a8 8 0 1 1 0 6M4 4v5h5"/></>:<><path d="M8 5v14M16 5v14"/></>}</svg></button>
  </div>
  {failed?<p className={styles.error} role="status">The opening could not load. <a href={src}>Open video</a></p>:null}
 </section>;
}
