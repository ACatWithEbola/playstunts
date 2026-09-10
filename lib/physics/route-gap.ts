/** Original0x12c7f..0x12d10 after no connection record was selected. */
export function routeGap(state:number,skipped:number,run:number,heading:number,column:number,row:number,previousColumn:number,previousRow:number){
 const result={action:'backtrack',error:0,column,row,skipped,run};
 if(state!==1||skipped>=2)return result;
 if(run<2)return {...result,action:'error',error:9};
 const distance=skipped+2;
 return {...result,action:'advance',skipped:(skipped+1)&255,run:(run+1)&255,column:(previousColumn+(heading===256?distance:heading===768?-distance:0))&255,row:(previousRow+(heading===512?distance:heading===0?-distance:0))&255};
}
