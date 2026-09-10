import type {CSSProperties,ReactNode} from 'react';
import cockpitIndex from '@/public/game/cockpit/index.json';
type Sprite={file:string;width:number;height:number;x:number;y:number;source:string};
/** Shared original base artwork only. Instruments, masks and special dashboard
 * animations remain car-specific children; their presence in the asset manifest
 * does not imply that their original drawing behavior has been implemented.
 */
export default function CockpitArtwork({car,wheel,children}:{car:keyof typeof cockpitIndex;wheel:number;children:ReactNode}){
 const layout=cockpitIndex[car],frames:Record<string,Sprite>=layout.frames;
 const height=200-layout.dashboardTop;
 const position=(frame:Sprite,top=0,totalHeight=200):CSSProperties=>({left:`${frame.x/320*100}%`,top:`${(frame.y-top)/totalHeight*100}%`,width:`${frame.width/320*100}%`,height:`${frame.height/totalHeight*100}%`});
 return <>
  {frames.roof&&<img className="cockpit-roof" src={`/game/cockpit/${car}/${frames.roof.file}`} alt="" aria-hidden="true" style={position(frames.roof)}/>}
  <div className="cockpit-art" aria-hidden="true" style={{height:`${height/200*100}%`}}>
   <div className="cockpit-layers">
    <img className="cockpit-base" src={`/game/cockpit/${car}/dashboard.png`} alt=""/>
    {[0,1,2].map(index=>{
     const frame=frames[`whl${index+1}`];
     if(!frame)throw Error(`Original ${car} wheel frame is missing`);
     return <img key={index} className="cockpit-wheel" src={`/game/cockpit/${car}/${frame.file}`} alt="" style={{...position(frame,layout.dashboardTop,height),visibility:index===wheel?'visible':'hidden'}}/>;
    })}
    {children}
   </div>
  </div>
 </>;
}
