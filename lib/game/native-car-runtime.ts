import {drawOriginalMenuButton} from './menu-button-raster.ts';
import {originalCarMenuList} from './car-menu-list.ts';
import {advanceOriginalCarMenu,type OriginalCarMenuState} from './car-menu-input.ts';
import {originalCarMenuBounds,drawOriginalCarMenuPanel,originalCarAccelerationGraph} from './car-menu-raster.ts';
import {createOriginalCarMenuModel} from './car-menu-model.ts';
import {originalMenuSelectionFlash} from './menu-selection-flash.ts';
import type {EngineTuning} from '../physics/engine.ts';
import type {NativeMenuInput} from './native-dialog-runtime.ts';
export interface NativeMenuCar extends EngineTuning {id:string;rawSimulation:string}
export interface NativeCarMenuHost {
 captureModel?:Parameters<typeof createOriginalCarMenuModel>[3];
 pixels:Uint8Array;font:Uint8Array;smallFont:Uint8Array;baseline:Uint8Array;
 art:Record<string,ReadonlyArray<number>>;resources:Record<string,ReadonlyArray<number>>;descriptions:Record<string,ReadonlyArray<number>>;
 cars:ReadonlyArray<NativeMenuCar>;bank(id:string):Promise<Uint8Array>;
 configuration:number[];opponent:number;opponentArt?:ReadonlyArray<number>;
 input():Promise<NativeMenuInput>;counter():number;present(mode:number):void;
}
export interface NativeCarMenuPresentation {
 car(id:string):Promise<{paintCount:number;render(angle:number,paint:number):void}>;
 panel(car:NativeMenuCar,transmission:number):void;
 portrait():void;
 captureButtons():{restore():void;close():void};
 outline(selection:number,colour:number):void;
 transmission(value:number):void;
}
/** Source car menu host. Original model submission and presentation alternate;
 * configuration bytes change in place, while car ID is committed on Done. */
export async function runNativeCarMenu(host:NativeCarMenuHost,display?:NativeCarMenuPresentation){
 const offset=host.opponent?7:0,paintOffset=offset+4,transmissionOffset=offset+5,list=originalCarMenuList(host.cars.map(c=>c.id),String.fromCharCode(...host.configuration.slice(offset,offset+4)));
 if(!list.names.length)return;
 let state:OriginalCarMenuState={selected:0,car:list.selected,carCount:list.names.length,paint:host.configuration[paintOffset],transmission:host.configuration[transmissionOffset],ready:false,renderPhase:3,idleExpired:0};
 let previousCar=-1,previousSelected=-1,phase=0,color=0,idle=0,delta=0,angle=0,queuedAngle=0,time=host.counter(),mode=-1,background=host.pixels.slice(),renderer:{paintCount:number;render(target:Uint8Array,angle:number,paint:number):void},buttons:ReturnType<NativeCarMenuPresentation['captureButtons']>|undefined;
 const portrait=()=>{if(display){display.portrait();return;}const art=host.opponentArt;if(!art)return;const width=art[0]|art[1]<<8,height=art[2]|art[3]<<8;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const c=art[16+y*width+x];if(c!==255)host.pixels[y*320+240+x]=c;}};
 const panel=()=>{const car=host.cars.find(c=>c.id===list.names[state.car])!;if(display){display.panel(car,state.transmission);return;}const simulation=Uint8Array.from(car.rawSimulation.match(/../g)!,b=>parseInt(b,16)),graph=originalCarAccelerationGraph(car,simulation);drawOriginalCarMenuPanel(host.pixels,host.font,host.smallFont,host.art,host.resources,host.descriptions[car.id],state.transmission,graph.points);};
 try{for(;;){
  if(previousCar!==state.car){const car=host.cars.find(c=>c.id===list.names[state.car])!;buttons?.close();if(display){const model=await display.car(car.id);renderer={paintCount:model.paintCount,render:(_target,angle,paint)=>model.render(angle,paint)};}else renderer=createOriginalCarMenuModel(host.baseline,await host.bank(car.id),host.art.stop,host.captureModel);panel();if(display)buttons=display.captureButtons();else background=host.pixels.slice();previousCar=state.car;previousSelected=-1;state.renderPhase=3;state.ready=false;}
  angle=(angle+delta)&65535;
  if(state.renderPhase===0||state.renderPhase===3){if((state.paint<<24>>24)>=renderer!.paintCount)state.paint=0;queuedAngle=angle;host.configuration[paintOffset]=state.paint;if(state.renderPhase===0)state.renderPhase=1;else{renderer!.render(host.pixels,queuedAngle,state.paint);portrait();state.renderPhase=0;state.ready=true;host.present(mode);mode=-2;}}
  else if(state.renderPhase===1){renderer!.render(host.pixels,queuedAngle,state.paint);portrait();state.renderPhase=0;state.ready=true;host.present(mode);mode=-2;}
  if(previousSelected!==state.selected){
   if(buttons)buttons.restore();else for(let y=107;y<197;y++)host.pixels.set(background.subarray(y*320+229,y*320+317),y*320+229);
   previousSelected=state.selected;phase=0;color=0;idle=0;time=host.counter();
  }
  const now=host.counter();delta=(now-time)&65535;time=now;const flash=originalMenuSelectionFlash(phase,delta);phase=flash.counter;
  if(flash.color!==color){color=flash.color;if(display)display.outline(state.selected,color);else {const r=originalCarMenuBounds[state.selected];for(let x=r.left;x<=r.right;x++){host.pixels[r.top*320+x]=color;host.pixels[r.bottom*320+x]=color;}for(let y=r.top;y<=r.bottom;y++){host.pixels[y*320+r.left]=color;host.pixels[y*320+r.right]=color;}}host.present(0);}
  idle=(idle+delta)&65535;if((idle<<16>>16)>12000){idle=0;state.idleExpired=(state.idleExpired+1)&255;}
  const input=await host.input(),hover=input.mouseActive?originalCarMenuBounds.findIndex(r=>input.x>=r.left&&input.x<=r.right&&input.y>=r.top&&input.y<=r.bottom):-1,result=advanceOriginalCarMenu(state,input.key,hover);state=result.state;
  host.configuration[paintOffset]=state.paint;host.configuration[transmissionOffset]=state.transmission;
  if(result.action==='done'){host.configuration.splice(offset,4,...Array.from(list.names[state.car],c=>c.charCodeAt(0)));return;}
  if(result.action==='transmission'){
   // Source redraws only the button interior, retaining the active flash border.
   if(display){buttons!.restore();display.transmission(state.transmission);buttons!.close();buttons=display.captureButtons();display.outline(state.selected,color);}else for(const target of [host.pixels,background])drawOriginalMenuButton(target,host.font,host.resources[state.transmission?'ebau':'ebma'],230,162,86,16,15,8,7,0);
   host.present(0);
  }
 }
 }finally{buttons?.close();}
}
