import type {RouteAssessment} from '@/lib/server/shortcut-assessment';
export default function RouteBadge({assessment}:{assessment?:RouteAssessment}){
 const detected=assessment==='shortcuts_detected',full=assessment==='full_route';
 return <span className={'scores-route-badge'+(detected?' scores-route-shortcut':full?' scores-route-full':'')} title={detected?'Verified replay confirms a shortcut or sustained grass-speed exploit. Informational only; this time remains eligible.':full?'Positive replay evidence covers a complete connected route.':'Route not conclusively assessed. This does not mean the run used shortcuts or followed the full route.'}>{detected?'Shortcuts / exploits':full?'Full route':'Unassessed'}</span>;
}
