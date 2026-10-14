export type TouchDrivingAction='accelerate'|'brake'|'left'|'right'|'gearUp'|'gearDown'|'menu'|'confirm'|'dashboard'|'camera';
const bindingIndex:Partial<Record<TouchDrivingAction,number>>={accelerate:3,brake:7,left:9,right:5,gearUp:0,gearDown:1};
export function touchDrivingScan(action:TouchDrivingAction,bindings:ArrayLike<number>){return action==='menu'?1:action==='confirm'?28:action==='dashboard'?32:action==='camera'?46:bindings[bindingIndex[action]!] &255;}
export function createTouchDrivingInput(){
 const sources=new Map<number,TouchDrivingAction>(),listeners=new Set<(action:TouchDrivingAction,pressed:boolean)=>void>();
 const held=(action:TouchDrivingAction)=>Array.from(sources.values()).includes(action);
 const notify=(action:TouchDrivingAction,pressed:boolean)=>{for(const listener of listeners)listener(action,pressed);};
 const release=(id:number)=>{const action=sources.get(id);if(!action)return;sources.delete(id);if(!held(action))notify(action,false);};
 return {
  press(action:TouchDrivingAction,id:number){if(!Number.isSafeInteger(id))throw Error('Invalid touch pointer');if(sources.get(id)===action)return;release(id);const wasHeld=held(action);sources.set(id,action);if(!wasHeld)notify(action,true);},
  release,clear(){const actions=new Set(sources.values());sources.clear();for(const action of actions)notify(action,false);},
  held,scanDown(scan:number,bindings:ArrayLike<number>){return Array.from(sources.values()).some(action=>touchDrivingScan(action,bindings)===scan);},
  subscribe(listener:(action:TouchDrivingAction,pressed:boolean)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};},
 };
}
const inputs=new WeakMap<HTMLCanvasElement,ReturnType<typeof createTouchDrivingInput>>();
export function browserTouchDrivingInput(canvas:HTMLCanvasElement){let input=inputs.get(canvas);if(!input){input=createTouchDrivingInput();inputs.set(canvas,input);}return input;}
