export const GRAPHICS_UNAVAILABLE_NOTICE='Enhanced graphics are unavailable. Using original graphics; browser security settings are unchanged.';

/** Presentation-only recovery. Never advance or reset the native game. */
export function fallbackToOriginalGraphics(graphics:{enabled:boolean;chaseCamera?:0|1|2|3;resetPerformance?:()=>void;unavailable?:()=>void;notice?:(message:string)=>void},close?:()=>void){
 graphics.enabled=false;
 graphics.chaseCamera=0;
 // A failed renderer must not prevent the software presentation from working.
 try{close?.();}catch{/* The graphics session is already unusable. */}
 graphics.resetPerformance?.();
 graphics.unavailable?.();
 graphics.notice?.(GRAPHICS_UNAVAILABLE_NOTICE);
}
