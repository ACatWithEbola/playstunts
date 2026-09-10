/** Original DS:34d8/34e2/34ec/34f6, passed to 0x1b1ca from editor 0x1d01f. */
export const editorHitRegions=[
 {left:9,right:199,top:181,bottom:187},
 {left:202,right:206,top:4,bottom:179},
 {left:220,right:315,top:132,bottom:139},
 {left:8,right:199,top:4,bottom:179},
 {left:220,right:315,top:36,bottom:187},
];
/** Inclusive bounds, first matching region wins; disabled mouse returns 255. */
export function editorHitRegion(x:number,y:number,enabled:boolean){
 if(!enabled)return 255;
 x=(x<<16)>>16;y=(y<<16)>>16;
 const index=editorHitRegions.findIndex(r=>x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom);
 return index<0?255:index;
}
