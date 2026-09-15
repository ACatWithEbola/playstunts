'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';

export default function StuntsNavigation({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false);
 const shell=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(!open)return;
  const closeOnOutside=(event:PointerEvent)=>{if(!shell.current?.contains(event.target as Node))setOpen(false);};
  const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  document.addEventListener('pointerdown',closeOnOutside);
  document.addEventListener('keydown',closeOnEscape);
  return()=>{document.removeEventListener('pointerdown',closeOnOutside);document.removeEventListener('keydown',closeOnEscape);};
 },[open]);
 return <div className="stunts-navigation-shell" data-open={open?'true':'false'} ref={shell}>
  <button className="stunts-menu-toggle" type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="stunts-main-navigation" onClick={()=>setOpen(value=>!value)}>
   <span>MENU</span><span className="stunts-menu-icon" aria-hidden="true"><i/><i/><i/></span>
  </button>
  <nav className="stunts-navigation" id="stunts-main-navigation" aria-label="Main navigation" onClick={event=>{if((event.target as Element).closest('a'))setOpen(false);}}>{children}</nav>
 </div>;
}
