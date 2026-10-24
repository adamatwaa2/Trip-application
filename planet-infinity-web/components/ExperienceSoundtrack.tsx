"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {normaliseSoundtrack,type CatalogSoundtrack} from "@/lib/catalog-music";
import {SoundCloudPlayer} from "@/components/SoundCloudPlayer";
import styles from "./ExperienceSoundtrack.module.css";
export function ExperienceSoundtrack(){
 const pathname=usePathname(),match=pathname.match(/^\/(trips|events)\/([a-z0-9-]+)(?:\/book)?\/?$/),root=match?`/${match[1]}/${match[2]}`:"";
 const [selection,setSelection]=useState<{root:string;song:CatalogSoundtrack}|null>(null),[closed,setClosed]=useState<string|null>(null);
 useEffect(()=>{if(!root)return;const abort=new AbortController();fetch("/api/catalog-music?path="+encodeURIComponent(root),{cache:"no-store",signal:abort.signal}).then(r=>r.ok?r.json():null).then(data=>{const song=normaliseSoundtrack(data?.song);setSelection(song?.enabled?{root,song}:null);}).catch(()=>{});return()=>abort.abort();},[root]);
 const current=selection?.root===root?selection.song:null;if(!current)return null;
 const id=root+current.url;
 return closed===id?<button type="button" className={styles.reopen} onClick={()=>setClosed(null)}>Music ♫</button>:<aside className={styles.panel} aria-label="Experience soundtrack"><div className={styles.head}><strong>Experience soundtrack</strong><button type="button" onClick={()=>setClosed(id)} aria-label="Stop music and close player">Stop & close</button></div><SoundCloudPlayer key={id} song={current} remember/></aside>;
}
