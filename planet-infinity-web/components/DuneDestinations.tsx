import styles from "./DuneWorldExperience.module.css";

const photographs = [
  {file:"white-desert",title:"The White Desert",alt:"Wind-sculpted chalk formations in Egypt’s White Desert beneath a blue sky",width:1280,height:853,author:"Vyacheslav Argenberg",source:"White_Desert,_Egypt.jpg",shareAlike:false},
  {file:"siwa-shali",title:"Shali / Siwa",alt:"Sunlit earthen walls and ruins of Shali fortress in Siwa",width:1280,height:960,author:"Amr F.Nagy",source:"Shali_fortress.jpg",shareAlike:true},
  {file:"black-desert",title:"The Black Desert",alt:"Dark volcanic hills overlooking the golden plains of Egypt’s Black Desert",width:1280,height:853,author:"Moataz EL-Sharaky",source:"Black_Desert_-_New_Valley_-_Egypt.jpg",shareAlike:true},
  {file:"white-desert-night",title:"White Desert / After dark",alt:"The White Desert’s mushroom-shaped chalk rock at night, behind a protective barrier",width:1280,height:853,author:"Moataz EL-Sharaky",source:"Mushroom_Rock_-_Night_-_White_Desert_-_New_Valley_-_Egypt.jpg",shareAlike:true},
  {file:"siwa-oasis",title:"Siwa / The oasis",alt:"Siwa’s buildings and palm groves with desert dunes on the horizon",width:1280,height:853,author:"Vyacheslav Argenberg",source:"Siwa_Oasis,_Sahara_Desert,_Egypt.jpg",shareAlike:false},
] as const;

export function DuneDestinations(){
  return <section className={styles.destinations} id="dune-landscapes" aria-labelledby="dune-landscapes-title"><div className={styles.wrap}>
    <p className={styles.eyebrow}>The real landscapes / Egypt</p>
    <h2 id="dune-landscapes-title">Otherworldly.<br/>Here on Earth.</h2>
    <p className={styles.galleryIntro}>White chalk. Black hills. An oasis beyond the dunes. Real photographs of the destinations shaping our proposed journey—not photographs of a confirmed Planet Infinity itinerary.</p>
    <div className={styles.destinationGallery}>{photographs.map(photo=><figure key={photo.file}>
      <a href={`/media/dune/destinations/${photo.file}.webp`} target="_blank" rel="noopener noreferrer" aria-label={`Open full photograph: ${photo.title}`}><img src={`/media/dune/destinations/${photo.file}.webp`} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" decoding="async"/></a>
      <figcaption><span>{photo.title}</span><small>© {photo.author}</small></figcaption>
    </figure>)}</div>
    <details className={styles.photoCredits}><summary>Photograph credits &amp; sources</summary><p>Images resized and converted to WebP; no cropping or colour changes. Each photograph retains its linked licence. No photographer endorsement is implied.</p><ul>{photographs.map(photo=><li key={photo.file}><a href={`https://commons.wikimedia.org/wiki/File:${photo.source}`} target="_blank" rel="noopener noreferrer">{photo.title}</a> — © {photo.author} / Wikimedia Commons / <a href={`https://creativecommons.org/licenses/${photo.shareAlike?"by-sa":"by"}/4.0/`} target="_blank" rel="noopener noreferrer">CC {photo.shareAlike?"BY-SA":"BY"} 4.0</a>.</li>)}</ul></details>
    <div className={styles.screenReference}><div><p className={styles.eyebrow}>From the screen / The inspiration</p><h3>The world that sparked it.</h3><p>Explore the cinematic atmosphere through the official DUNE trailer, shared by Legendary. Our Egyptian journey is independent and fan-inspired.</p></div><a className={styles.primary} href="https://www.youtube.com/watch?v=8g18jFHCLXk" target="_blank" rel="noopener noreferrer">Watch the official trailer <span aria-hidden="true">↗</span></a></div>
  </div></section>;
}
