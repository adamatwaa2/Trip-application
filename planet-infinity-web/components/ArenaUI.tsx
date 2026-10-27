import type {CSSProperties} from "react";
import styles from "./ArenaWorld.module.css";

export function ArenaArrow({down=false}:{down?:boolean}) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,transform:down?"rotate(90deg)":undefined}}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter"/></svg>;
}

export function ArenaSelectionMark() {
  return <span className={styles.selectionMark} aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="1.8"/></svg></span>;
}

export function ArenaAtmosphere() {
  return <div className={styles.atmosphere} aria-hidden="true">{Array.from({length:18},(_,index)=><span className={styles.spark} key={index} style={{"--x":`${(index*31+7)%100}%`,"--y":`${(index*17+3)%100}%`,"--delay":`${-index*1.7}s`,"--duration":`${9+index%5}s`} as CSSProperties}/>)}</div>;
}
