/** MS91 expanded graphics dispatcher. Presentation/audio lifecycle belongs to
 * the existing options host. Configured cadence is applied by the next race,
 * never by mutating an active or recorded replay's rate here. */
export interface Ms91GraphicsSettings {
  graphics:number;
  slowVideoManagement:boolean;
  configuredFramesPerSecond:10|20;
}
export type Ms91GraphicsRequest =
  | {type:'graphics-menu';resource:'emrl';selected:number;marked:readonly boolean[]}
  | {type:'rate-change-notice';resource:'emrs'};
export function* ms91GraphicsOptions(settings:Ms91GraphicsSettings):Generator<Ms91GraphicsRequest,void,number> {
  if(!Number.isInteger(settings.graphics)||settings.graphics<0||settings.graphics>4)throw Error('Invalid graphics level');
  if(settings.configuredFramesPerSecond!==10&&settings.configuredFramesPerSecond!==20)throw Error('Invalid simulation rate');
  const initialRate=settings.configuredFramesPerSecond;
  let selected=0;
  for(;;){
    const marked=Array.from({length:9},()=>false);
    marked[settings.graphics]=true;
    marked[settings.slowVideoManagement?6:5]=true;
    marked[settings.configuredFramesPerSecond===10?7:8]=true;
    const reply=yield {type:'graphics-menu',resource:'emrl',selected,marked};
    selected=(reply<<24)>>24;
    if(selected===-1||selected===9)break;
    if(selected>=0&&selected<=4)settings.graphics=selected;
    else if(selected===5||selected===6)settings.slowVideoManagement=selected===6;
    else if(selected===7||selected===8)settings.configuredFramesPerSecond=selected===7?10:20;
    else throw Error('Invalid MS91 graphics menu selection');
  }
  if(initialRate!==settings.configuredFramesPerSecond)yield {type:'rate-change-notice',resource:'emrs'};
}
