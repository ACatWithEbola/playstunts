import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
import type {RouteAssessment} from '@/lib/server/shortcut-assessment';
import {routeDisplay} from '@/lib/server/route-display';
export default function RouteBadge({assessment}:{assessment?:RouteAssessment}){
 const display=routeDisplay(assessment);
 return <WebsiteElement as="span" className={'scores-route-badge'+(display.full?' scores-route-full':' scores-route-shortcut')} title={display.detail}>{<WebsiteText text={display.label}/>}</WebsiteElement>;
}
