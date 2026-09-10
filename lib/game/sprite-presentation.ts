export interface OriginalSpritePresentationHost {
 selectVideo():void;hideMouse():void;showMouse():void;drawWhole():void;drawPass(pass:number):void;
}
export type OriginalPresentationRequest={type:'timer'}|{type:'input';delta:number};
/** Supplied 1B95A..1B9E2. Yield input/timer requests so the browser can keep
 * processing events. All four reveal passes and early-copy exits stay original.
 */
export function* originalSpritePresentation(host:OriginalSpritePresentationHost,mode:number):Generator<OriginalPresentationRequest,number,number>{
 host.selectVideo();host.hideMouse();
 if((mode&65535)===65534){host.drawWhole();host.showMouse();return 0;}
 for(let pass=0;pass<4;pass++){
  const delta=(yield {type:'timer'})&65535;
  const key=(yield {type:'input',delta})&65535;
  if(key){host.selectVideo();host.drawWhole();host.showMouse();return key;}
  host.drawPass(pass);
 }
 host.showMouse();return 0;
}
