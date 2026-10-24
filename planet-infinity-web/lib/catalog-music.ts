export type CatalogSoundtrack = { provider:"soundcloud"; url:string; title:string; enabled:boolean; autoplay:boolean; volume:number };
export function soundCloudUrl(value:unknown):string|null {
 if(typeof value!=="string"||value.length>2048)return null;
 try{const u=new URL(value.trim());const parts=u.pathname.split("/").filter(Boolean);
  if(u.protocol!=="https:"||!["soundcloud.com","www.soundcloud.com"].includes(u.hostname)||u.username||u.password||u.port||parts.length<2||parts.length>3||!parts.every(p=>/^[a-zA-Z0-9_-]+$/.test(p))||["search","discover","you","settings","upload","pages"].includes(parts[0]))return null;
  if(parts.length===3&&parts[1]!=="sets")return null;
  return "https://soundcloud.com/"+parts.join("/");
 }catch{return null;}
}
export function normaliseSoundtrack(value:unknown):CatalogSoundtrack|null {
 if(!value||typeof value!=="object")return null;
 const v=value as Record<string,unknown>,url=soundCloudUrl(v.url);
 if(v.provider!=="soundcloud"||!url)return null;
 const volume=typeof v.volume==="number"&&Number.isFinite(v.volume)?Math.round(Math.min(100,Math.max(0,v.volume))):35;
 return {provider:"soundcloud",url,title:typeof v.title==="string"?v.title.trim().slice(0,180):"Experience soundtrack",enabled:v.enabled===true,autoplay:v.autoplay===true,volume};
}
