'use client';

import {useEffect,useRef,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent} from 'react';
import Image from 'next/image';

const FACE_IMAGE={
 front:{src:'/site/stunts-box/Stunts-front.webp',width:360,height:478},
 back:{src:'/site/stunts-box/Stunts-back.webp',width:360,height:478},
 top:{src:'/site/stunts-box/Stunts-top.webp',width:56,height:360},
 bottom:{src:'/site/stunts-box/Stunts-bottom.webp',width:56,height:360},
 right:{src:'/site/stunts-box/Stunts-right.webp',width:56,height:478},
 left:{src:'/site/stunts-box/Stunts-left.webp',width:56,height:478},
} as const;

export default function StuntsBox(){
 const box=useRef<HTMLDivElement>(null),drag=useRef<{pointer:number;x:number;y:number}|null>(null),rotation=useRef({x:-7,y:-24});
 const apply=()=>{if(box.current)box.current.style.transform=`rotateX(${rotation.current.x}deg) rotateY(${rotation.current.y}deg)`;};
 useEffect(()=>{
  apply();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=performance.now();
  const animate=(now:number)=>{
   const elapsed=Math.min(32,now-last);last=now;
   if(!reduced.matches&&!drag.current){rotation.current.y+=elapsed*.006;apply();}
   frame=requestAnimationFrame(animate);
  };
  frame=requestAnimationFrame(animate);
  return()=>cancelAnimationFrame(frame);
 },[]);
 const pointerDown=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  event.currentTarget.setPointerCapture(event.pointerId);drag.current={pointer:event.pointerId,x:event.clientX,y:event.clientY};
 };
 const pointerMove=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  const current=drag.current;if(!current||current.pointer!==event.pointerId)return;
  rotation.current.y+=(event.clientX-current.x)*.45;
  rotation.current.x=Math.max(-38,Math.min(38,rotation.current.x-(event.clientY-current.y)*.32));
  current.x=event.clientX;current.y=event.clientY;apply();
 };
 const pointerUp=(event:ReactPointerEvent<HTMLButtonElement>)=>{
  if(drag.current?.pointer===event.pointerId)drag.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };
 const keyDown=(event:ReactKeyboardEvent<HTMLButtonElement>)=>{
  const movement:{x:number;y:number}|undefined={ArrowLeft:{x:0,y:-8},ArrowRight:{x:0,y:8},ArrowUp:{x:5,y:0},ArrowDown:{x:-5,y:0}}[event.key];
  if(!movement)return;event.preventDefault();rotation.current.x=Math.max(-38,Math.min(38,rotation.current.x+movement.x));rotation.current.y+=movement.y;apply();
 };
 return <button className="stunts-box-viewer" type="button" aria-label="Rotate the 3D Stunts game box. Drag it or use the arrow keys." onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onKeyDown={keyDown}>
  <div className="stunts-box-model" ref={box}>
   {(Object.keys(FACE_IMAGE) as Array<keyof typeof FACE_IMAGE>).map(face=>{const image=FACE_IMAGE[face];return <div className={`stunts-box-face stunts-box-face-${face}`} key={face}><Image unoptimized alt="" draggable={false} src={image.src} width={image.width} height={image.height}/></div>;})}
  </div>
 </button>;
}
