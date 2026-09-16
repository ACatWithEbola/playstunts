'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';

export default function StuntsNavigation({children}:{children:ReactNode}){
 const [open,setOpen]=useState(false);
 const shell=useRef<HTMLDivElement>(null),navigation=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(!open)return;
  const closeOnOutside=(event:PointerEvent)=>{if(!shell.current?.contains(event.target as Node))setOpen(false);};
  const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
  const closeOnLink=(event:MouseEvent)=>{if((event.target as Element).closest('a'))setOpen(false);};
  const currentNavigation=navigation.current;
  document.addEventListener('pointerdown',closeOnOutside);
  document.addEventListener('keydown',closeOnEscape);
  currentNavigation?.addEventListener('click',closeOnLink);
  return()=>{document.removeEventListener('pointerdown',closeOnOutside);document.removeEventListener('keydown',closeOnEscape);currentNavigation?.removeEventListener('click',closeOnLink);};
 },[open]);
 return <div className="stunts-navigation-shell" data-open={open?'true':'false'} ref={shell}>
  <button className="stunts-menu-toggle" type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} aria-controls="stunts-main-navigation" onClick={()=>setOpen(value=>!value)}>
   <span>MENU</span><span className="stunts-menu-icon" aria-hidden="true"><i/><i/><i/></span>
  </button>
  <nav className="stunts-navigation" id="stunts-main-navigation" aria-label="Main navigation" ref={navigation}>{children}</nav>
 </div>;
}
