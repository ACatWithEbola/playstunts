import type {RouteAssessment} from './shortcut-assessment.ts';
export function routeDisplay(assessment?:RouteAssessment){
 if(assessment==='full_route')return {full:true,label:'Full run',detail:'Positive replay evidence covers a complete connected route.'};
 return {full:false,label:'Possibly exploited',detail:assessment==='shortcuts_detected'?'Replay evidence confirms a shortcut or sustained grass-speed exploit. Original rules still apply; this score remains eligible.':'A full route could not be confirmed. This label does not prove exploitation. A retained replay can be reviewed and the classification corrected.'};
}
