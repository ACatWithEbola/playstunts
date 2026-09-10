/** Shared world origin of an original track element's anchor square.
 * Flags extend toward +x and -z; continuation squares do not draw models.
 */
export function trackModelOrigin(column:number,row:number,multiTile:number):[number,number,number]{
 return [column*1024+(multiTile&2?1024:512),2,row*1024+(multiTile&1?0:512)];
}
