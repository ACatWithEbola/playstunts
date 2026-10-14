import type {createMs91RepaintState} from './ms91-repaint-state.ts';
export interface Ms91RepaintPresentationHost{
 selectScreen():void;
 bounds(left:number,right:number,top:number,bottom:number):void;
 beginCopy():void;
 copyRenderWindow():void;
 endCopy():void;
}
/** Bind explicit, caller-owned screen and render-bitmap descriptors to the
 * existing native drawing driver. Never assume original MS91 memory offsets. */
export function createNativeMs91RepaintHost(drawing:{selectWindow(pointer:{offset:number;segment:number}):void;bounds(left:number,right:number,top:number,bottom:number):void;bitmap(pointer:{offset:number;segment:number}):void},screen:{offset:number;segment:number},renderBitmap:{offset:number;segment:number},mouse:{beginCopy():void;endCopy():void}):Ms91RepaintPresentationHost{
 return {selectScreen(){drawing.selectWindow(screen);},bounds(...rectangle){drawing.bounds(...rectangle);},beginCopy(){mouse.beginCopy();},copyRenderWindow(){drawing.bitmap(renderBitmap);},endCopy(){mouse.endCopy();}};
}
/** Original copy-path ordering behind an explicit display-driver boundary.
 * Page-flipping plans do no copy and retain no copy-path cache. A failed driver
 * operation cannot commit the retained rectangle bank. */
export function presentMs91Repaint(plan:ReturnType<ReturnType<typeof createMs91RepaintState>['prepare']>,host:Ms91RepaintPresentationHost){
 if(!plan.presentation.length){plan.commit();return;}
 host.selectScreen();
 let begun=false;
 try{
  if(plan.beginBeforeBounds){host.beginCopy();begun=true;}
  for(const rectangle of plan.presentation){
   host.bounds(...rectangle);
   if(!begun){host.beginCopy();begun=true;}
   host.copyRenderWindow();
  }
 }finally{if(begun)host.endCopy();}
 plan.commit();
}
