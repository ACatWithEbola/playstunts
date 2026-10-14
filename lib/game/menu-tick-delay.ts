/** Original PIT deadlines must not be rounded independently to display frames.
 * Keep the caller's authoritative counter and poll callback; only the browser
 * wake-up is independent of animation-frame cadence. */
export function createMenuTickDelay(counter:()=>number,poll:()=>void|Promise<void>,schedule:(wake:()=>void)=>()=>void=wake=>{const timer=setTimeout(wake,4);return()=>clearTimeout(timer);}){
 let closed=false;
 const pending=new Set<{cancel():void;reject(error:Error):void}>();
 const error=()=>new DOMException('Native menu closed','AbortError');
 const check=()=>{if(closed)throw error();};
 return {
  async waitTicks(ticks:number){
   check();const end=counter()+ticks;
   while(counter()<end){
    await new Promise<void>((resolve,reject)=>{
     const entry={cancel:()=>{},reject};pending.add(entry);
     entry.cancel=schedule(()=>{pending.delete(entry);resolve();});
    });
    check();await poll();check();
   }
  },
  close(){if(closed)return;closed=true;for(const entry of pending){entry.cancel();entry.reject(error());}pending.clear();},
 };
}
