"use client";
import {useEffect,useState} from "react";
import {savedDirectAudio} from "@/app/actions/direct-audio";
export function AdminAudioLibrary({value,onChange}:{value:string;onChange:(url:string)=>void}){
 const [songs,setSongs]=useState<{url:string;label:string}[]>([]),[query,setQuery]=useState("");
 useEffect(()=>{let active=true;savedDirectAudio().then(data=>{if(active)setSongs(data);}).catch(()=>{});return()=>{active=false;};},[]);
 return <><label>Search uploaded songs<input type="search" value={query} placeholder="Reuse an existing song" onChange={event=>setQuery(event.target.value)}/></label><label>Saved audio library<select value={songs.some(song=>song.url===value)?value:""} onChange={event=>{if(event.target.value)onChange(event.target.value);}}><option value="">Choose a song already uploaded</option>{songs.filter(song=>song.label.toLowerCase().includes(query.toLowerCase())||song.url===value).map(song=><option key={song.url} value={song.url}>{song.label}</option>)}</select></label><label>Direct audio URL<input type="url" value={value} placeholder="https://…/song.mp3" onChange={event=>onChange(event.target.value)}/></label></>;
}
