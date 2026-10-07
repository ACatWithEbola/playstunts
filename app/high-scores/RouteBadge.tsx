'use client';
import {WebsiteText} from '@/app/WebsiteLanguage';
import {useId,useState,useRef} from 'react';
import {createPortal} from 'react-dom';
import {assessmentReasonText} from '@/lib/server/assessment-reason';
import type {RouteAssessment} from '@/lib/server/shortcut-assessment';
import {routeDisplay} from '@/lib/server/route-display';
export default function RouteBadge({assessment,reason}:{assessment?:RouteAssessment;reason?:string}){
 const display=routeDisplay(assessment);
 const id=useId(),anchor=useRef<HTMLButtonElement>(null),[position,setPosition]=useState<{left:number;top:number}>();
 const show=()=>{const rect=anchor.current?.getBoundingClientRect();if(rect)setPosition({left:Math.max(8,Math.min(rect.right-220,window.innerWidth-228)),top:Math.max(8,rect.top-44)});};
 return <><button type="button" ref={anchor} className={'scores-route-badge scores-route-help'+(display.full?' scores-route-full':' scores-route-shortcut')} aria-describedby={position?id:undefined} onMouseEnter={show} onMouseLeave={()=>setPosition(undefined)} onFocus={show} onBlur={()=>setPosition(undefined)} onClick={show} onKeyDown={event=>{if(event.key==='Escape')setPosition(undefined);}}><WebsiteText text={display.label}/></button>{position&&createPortal(<span id={id} role="tooltip" className="scores-route-tooltip" style={{left:position.left,top:position.top}}><WebsiteText text={assessmentReasonText(assessment,reason)}/></span>,document.body)}</>;
}
