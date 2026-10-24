"use client";
import {useEffect,useRef,useState} from "react";
import type {CatalogSoundtrack} from "@/lib/catalog-music";
import styles from "./SoundCloudPlayer.module.css";
type Widget={bind:(event:string,callback:()=>void)=>void;unbind:(event:string)=>void;play:()=>void;pause:()=>void;setVolume:(value:number)=>void};
type WidgetFactory=((frame:HTMLIFrameElement)=>Widget)&{Events:{READY:string;PLAY:string;PAUSE:string;FINISH:string;ERROR:string}};
type SoundCloudWindow=Window & {SC?:{Widget:WidgetFactory}};
let scriptPromise:Promise<void>|null=null;
function loadWidgetApi(){
 if((window as SoundCloudWindow).SC?.Widget)return Promise.resolve();
 if(scriptPromise)return scriptPromise;
 scriptPromise=new Promise<void>((resolve,reject)=>{const script=document.createElement("script");script.src="https://w.soundcloud.com/player/api.js";script.async=true;script.onload=()=>resolve();script.onerror=()=>{scriptPromise=null;reject(new Error("SoundCloud unavailable"));};document.head.append(script);});return scriptPromise;
}
export function SoundCloudPlayer({song,remember=false}:{song:CatalogSoundtrack;remember?:boolean}){
 const frame=useRef<HTMLIFrameElement|null>(null),widget=useRef<Widget|null>(null),cancelled=useRef(false);
 const [ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[muted,setMuted]=useState(song.volume===0),[failed,setFailed]=useState(false);
 const [volume,setVolume]=useState(song.volume);
 const key="pi-soundcloud-paused:"+song.url;
 function rememberPaused(paused:boolean){if(remember)try{sessionStorage.setItem(key,paused?"yes":"no");}catch{}}
 useEffect(()=>{cancelled.current=false;return()=>{cancelled.current=true;const active=widget.current;widget.current=null;/* Removing an iframe stops its audio. React may detach its window before passive cleanup. */if(frame.current?.contentWindow){try{active?.pause();const e=(window as SoundCloudWindow).SC?.Widget.Events;if(e)for(const event of Object.values(e))active?.unbind(event);}catch{/* The iframe has already gone away. */}}};},[]);
 async function attach(){try{await loadWidgetApi();if(cancelled.current||!frame.current)return;const factory=(window as SoundCloudWindow).SC?.Widget;if(!factory)return;const e=factory.Events;for(const event of Object.values(e))widget.current?.unbind(event);widget.current?.pause();const next=factory(frame.current);widget.current=next;
  next.bind(e.READY,()=>{if(cancelled.current)return;setReady(true);next.setVolume(song.volume);let stopped=false;try{stopped=remember&&sessionStorage.getItem(key)==="yes";}catch{}if(song.autoplay&&!stopped)next.play();});
  next.bind(e.PLAY,()=>{if(!cancelled.current){setPlaying(true);setFailed(false);}});
  next.bind(e.PAUSE,()=>{if(!cancelled.current)setPlaying(false);});
  next.bind(e.FINISH,()=>{if(!cancelled.current)setPlaying(false);});
  next.bind(e.ERROR,()=>{if(!cancelled.current){setFailed(true);setPlaying(false);}});
 }catch{if(!cancelled.current)setFailed(true);}}
 const src="https://w.soundcloud.com/player/?"+new URLSearchParams({url:song.url,auto_play:"false",show_artwork:"false",show_comments:"false",show_playcount:"false",show_user:"true",visual:"false",single_active:"true",color:"#f27127"}).toString();
 return <section className={styles.player} aria-label="Experience music"><p className={styles.title}>{song.title||"Experience soundtrack"}</p>
  <iframe ref={frame} src={src} title={song.title||"SoundCloud soundtrack"} allow="autoplay; encrypted-media" height="166" width="100%" scrolling="no" frameBorder="0" onLoad={attach}/>
  <div className={styles.controls}><button type="button" disabled={!ready||failed} aria-pressed={playing} onClick={()=>{if(playing){rememberPaused(true);widget.current?.pause();}else{rememberPaused(false);widget.current?.play();}}}>{playing?"Pause music":"Play music"}</button><button type="button" disabled={!ready||failed} aria-pressed={muted} onClick={()=>{const nextVolume=muted?(volume||song.volume||35):0;widget.current?.setVolume(nextVolume);if(muted)setVolume(nextVolume);setMuted(!muted);}}>{muted?"Unmute":"Mute"}</button><label>Volume<input type="range" min="0" max="100" value={volume} onChange={e=>{const v=Number(e.target.value);setVolume(v);setMuted(v===0);widget.current?.setVolume(v);}} /></label></div>
  {failed?<p className={styles.help} role="status">This track is unavailable here. Choose another track or open it on SoundCloud.</p>:!playing?<p className={styles.help}>If your browser blocks automatic sound, press Play music or the SoundCloud play button.</p>:null}
  <a className={styles.source} href={song.url} target="_blank" rel="noopener noreferrer">Listen on SoundCloud</a>
 </section>;
}

