import type {RouteAssessment} from './shortcut-assessment.ts';
export function assessmentReasonText(assessment?:RouteAssessment,reason?:string){
 if(assessment==='full_route')return 'Full route confirmed';
 if(assessment==='shortcuts_detected'){
  if(reason==='grass_speed')return 'Grass-speed exploit';
  if(reason==='branch_switch')return 'Switched route branches';
  if(reason==='grass_transfer')return 'Crossed grass to skip sections';
  return 'Shortcut or exploit detected';
 }
 return reason==='grass_speed_uncertain'?'Grass-speed evidence inconclusive':'Full route not confirmed';
}
