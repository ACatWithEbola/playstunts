/** Original save-loop decisions 0x1d82c..0x1d914; external results supplied by caller. */
export function editorSaveResult(input:{selected:number;exists:number;overwrite:number;writeResult:number},modified=1){
 if(!(input.selected&255))return {status:255,modified,wrote:false};
 if(input.exists){
  if((input.overwrite&65535)===65535)return {status:255,modified,wrote:false};
  if((input.overwrite&65535)===0)return {status:0,modified,wrote:false};
 }
 return (input.writeResult&65535)===0?{status:1,modified:0,wrote:true}:{status:0,modified,wrote:true};
}
