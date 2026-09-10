export interface OriginalTitleCardHost {
 hideMouse():void;clearVideo():void;showMouse():void;clearWindow():void;
 locate(name:'prod'|'titl'):number;
 draw():void;
 present(argument:-1,waitFlag:number):number;
 wait(argument:400,waitFlag:number):number;
}
/** Supplied 2E78..2F61. Wait arguments remain original counter units;
 * their conversion and sprite presentation belong to the original host routines.
 */
export type OriginalTitleCardRequest={type:'present';argument:-1;waitFlag:number}|{type:'wait';argument:400;waitFlag:number};
/** The same source flow can be driven asynchronously by the browser. */
export function* originalTitleCards(host:Omit<OriginalTitleCardHost,'present'|'wait'>):Generator<OriginalTitleCardRequest,number,number>{
 host.hideMouse();host.clearVideo();host.showMouse();host.clearWindow();
 let waitFlag=host.locate('prod')!==0?160:180;
 host.locate('prod');host.draw();
 let result=(yield {type:'present',argument:-1,waitFlag})&65535;
 if(result)return result;
 result=(yield {type:'wait',argument:400,waitFlag})&65535;
 if(result)return result;
 host.clearWindow();waitFlag=180;host.locate('titl');host.draw();
 result=(yield {type:'present',argument:-1,waitFlag})&65535;
 return result||(yield {type:'wait',argument:400,waitFlag})&65535;
}

/** Synchronous adapter retained for existing executable-comparison callers. */
export function runOriginalTitleCards(host:OriginalTitleCardHost){
 const flow=originalTitleCards(host);let step=flow.next();
 while(!step.done){const request=step.value;step=flow.next(request.type==='present'?host.present(request.argument,request.waitFlag):host.wait(request.argument,request.waitFlag));}
 return step.value;
}
