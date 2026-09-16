'use client';
import Image from 'next/image';
import {useId,useState} from 'react';
/** Frame the original manual wordmark and key out its neutral paper background.
 * Only yellow ink contributes to alpha. Display color is the original
 * opening lettering, RGB252/244/32 (#FCF420). */
export default function StuntsBrand(){
 const [missing,setMissing]=useState(false);
 const filterId='stunts-ink-'+useId().replace(/:/g,'');
 if(missing)return <span style={{font:'900 italic clamp(48px,8vw,100px) Archivo,Arial,sans-serif',color:'#fcf420',lineHeight:1}}>STUNTS</span>;
 return <span className="stunts-brand">
  <svg width="0" height="0" aria-hidden="true" focusable="false" className="stunts-ink-filter"><defs><filter id={filterId} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.9882352941  0 0 0 0 0.9568627451  0 0 0 0 0.1254901961  3 3 -6 0 -0.2"/></filter></defs></svg>
  <Image onError={()=>setMissing(true)} unoptimized width={480} height={120} src="/site/stunts-wordmark.webp" alt="Stunts" priority style={{filter:`url(#${filterId})`}}/>
 </span>;
}
