/** State belongs only to the optional camera. Returning near the start must
 * not restart the transporter presentation after it has completed. */
export function createRolloutCameraPhase(){
 let origin:readonly number[]|undefined,complete=false;
 const distance=(position:readonly number[])=>origin?Math.hypot(position[0]-origin[0],position[2]-origin[2])/(240*64):undefined;
 return {
  begin(position:readonly number[]){if(!origin)origin=[...position];},
  update(position:readonly number[]){const progress=distance(position);if(progress!==undefined&&progress>=5/3)complete=true;},
  at(position:readonly number[]){return complete?undefined:distance(position);},
  reset(){origin=undefined;complete=false;},
 };
}
