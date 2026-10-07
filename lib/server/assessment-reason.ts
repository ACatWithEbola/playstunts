import type {RouteAssessment} from './shortcut-assessment.ts';
export function assessmentReasonText(assessment?:RouteAssessment,reason?:string){
 if(assessment==='full_route')return 'Original finish accepted';
 if(assessment==='shortcuts_detected'){
  if(reason==='grass_speed')return 'Grass-speed exploit';
  if(reason==='branch_switch')return 'Switched route branches';
  if(reason==='grass_transfer')return 'Crossed grass to skip sections';
  return 'Shortcut or exploit detected';
 }
 if(reason==='tunnel_unconfirmed')return 'Tunnel passage not confirmed';
 if(reason==='checkpoint_unconfirmed')return 'Road checkpoint not covered';
 return reason==='grass_speed_uncertain'?'Grass-speed evidence inconclusive':'Full route not confirmed';
}
