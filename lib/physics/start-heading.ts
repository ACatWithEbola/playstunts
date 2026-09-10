/** Original track initialization dispatch0x1270d and0x12620..0x1266c. */
export function startHeading(tile:number):number|null{
 switch(tile&255){
  case 1:case 134:case 147:return 0;
  case 135:case 148:case 179:return 512;
  case 136:case 149:case 180:return 256;
  case 137:case 150:case 181:return 768;
  default:return null;
 }
}
