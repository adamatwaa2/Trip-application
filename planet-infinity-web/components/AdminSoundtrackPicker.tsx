"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkSoundCloudSong, savedCatalogSongs } from "@/app/actions/catalog-music";
import { normaliseSoundtrack, soundCloudUrl, type CatalogSoundtrack } from "@/lib/catalog-music";
import { SoundCloudPlayer } from "./SoundCloudPlayer";
import styles from "./AdminSoundtrackPicker.module.css";

export function AdminSoundtrackPicker({value,onChange,resetKey}:{value:CatalogSoundtrack|null;onChange:(song:CatalogSoundtrack|null)=>void;resetKey:string}) {
  const [url,setUrl] = useState(value?.url ?? ""), [query,setQuery] = useState("");
  const [songs,setSongs] = useState<CatalogSoundtrack[]>([]), [message,setMessage] = useState("");
  const [preview,setPreview] = useState<CatalogSoundtrack|null>(null), [pending,startTransition] = useTransition();
  const generation = useRef(0);
  useEffect(() => { let active=true; savedCatalogSongs().then(rows=>{if(active)setSongs(rows);}).catch(()=>{if(active)setMessage("Saved songs could not be loaded. You can still paste a track link.");}); return()=>{active=false;}; },[]);
  function select(song:CatalogSoundtrack) {generation.current++;setUrl(song.url);onChange({...song,enabled:true});setPreview({...song,autoplay:false});setMessage("Selected. Save this trip or event to publish the soundtrack.");}
  const filtered=songs.filter(song=>(song.title+" "+song.url).toLowerCase().includes(query.toLowerCase()));
  return <fieldset className={`pi-admin-form__section ${styles.picker}`} key={resetKey}><legend>Music · SoundCloud</legend>
    <p className="pi-admin-help">Paste a public SoundCloud track link once, preview it, then save. Reuse songs already saved on your trips and events. No audio file or API key needed.</p>
    <label>Find a song<input type="search" placeholder="Song, film or artist — e.g. Pirates of the Caribbean" value={query} onChange={event=>setQuery(event.target.value)}/></label>
    <a href={"https://soundcloud.com/search/sounds?q="+encodeURIComponent(query||"soundtrack")} target="_blank" rel="noopener noreferrer">Search SoundCloud in a new tab</a>
    <p className="pi-admin-hint">Search above opens SoundCloud. The library below searches your saved selections, not the full SoundCloud catalog.</p>
    <label>Saved song library<select value="" onChange={event=>{const song=songs.find(row=>row.url===event.target.value);if(song)select(song);}}><option value="">{filtered.length?"Choose a saved song":"No matching saved songs yet"}</option>{filtered.map(song=><option key={song.url} value={song.url}>{song.title||song.url}</option>)}</select></label>
    <label>Public SoundCloud link<input type="url" placeholder="https://soundcloud.com/artist/track" maxLength={2048} value={url} onChange={event=>{generation.current++;setUrl(event.target.value);setMessage("");}}/></label>
    <div className={styles.actions}><button type="button" disabled={pending||!url.trim()} onClick={()=>{const version=++generation.current;startTransition(async()=>{const result=await checkSoundCloudSong(url);if(version!==generation.current)return;if(result.ok)select(result.song);else setMessage(result.error);});}}>{pending?"Checking…":"Check & select track"}</button>
    <button type="button" disabled={!soundCloudUrl(url)} onClick={()=>{const song=normaliseSoundtrack({provider:"soundcloud",url,title:value?.url===soundCloudUrl(url)?value.title:"SoundCloud soundtrack",enabled:true,autoplay:true,volume:35});if(song)select(song);}}>Preview link directly</button></div>
    {value?<><label>Song label<input value={value.title} maxLength={180} onChange={event=>onChange({...value,title:event.target.value})}/></label>
      <label className="pi-admin-check"><input type="checkbox" checked={value.enabled} onChange={event=>onChange({...value,enabled:event.target.checked})}/>Enable music on this experience</label>
      <label className="pi-admin-check"><input type="checkbox" checked={value.autoplay} onChange={event=>onChange({...value,autoplay:event.target.checked})}/>Attempt automatic playback</label>
      <label>Starting volume ({value.volume}%)<input type="range" min="0" max="100" value={value.volume} onChange={event=>onChange({...value,volume:Number(event.target.value)})}/></label>
      <p className="pi-admin-hint">Browsers may require the visitor to press Play first. Visitors can pause, mute, change volume, or close the player.</p>
      <div className={styles.actions}><button type="button" onClick={()=>setPreview({...value,autoplay:false})}>Preview selected song</button><button type="button" onClick={()=>{generation.current++;onChange(null);setUrl("");setPreview(null);setMessage("Music removed. Save to apply.");}}>Remove SoundCloud song</button></div></>:null}
    {message?<p role="status" className="pi-admin-help">{message}</p>:null}
    {preview?<div className={styles.preview}><button type="button" onClick={()=>setPreview(null)}>Close preview</button><SoundCloudPlayer key={preview.url} song={preview}/></div>:null}
  </fieldset>;
}
