export interface CalibrationField {x:number;y:number}
export interface CalibrationRectangle {x:number;y:number;width:number;height:number;color:number}
/** Supplied 1beb2..1c078. Host supplies the original nine-way direction and
 * terminates on keyboard input or joystick button bits 0x30. Calibration only
 * succeeds after visiting every square; repeated directions do not redraw.
 */
export function createOriginalJoystickCalibration(fields:ReadonlyArray<CalibrationField>,draw:(rectangle:CalibrationRectangle)=>void,colors:{grid:number;indicator:number}){
 if(fields.length<7)throw Error('Original calibration needs seven field positions');
 const [a,b,c,e,f,g,h]=fields,s16=(n:number)=>(n<<16)>>16;
 const rect=(x:number,y:number,width:number,height:number,color:number)=>draw({x:s16(x),y:s16(y),width:s16(width),height:s16(height),color});
 rect(b.x-4,b.y,1,h.y-b.y-8,colors.grid);rect(c.x-4,c.y,1,h.y-b.y-8,colors.grid);
 rect(a.x,f.y-4,e.x-a.x,1,colors.grid);rect(a.x,g.y-4,e.x-a.x,1,colors.grid);
 const xs=[b.x,b.x,c.x,c.x,c.x,b.x,a.x,a.x,a.x],ys=[f.y,b.y,b.y,f.y,g.y,g.y,g.y,f.y,b.y],width=b.x-a.x-8,height=f.y-a.y-8;
 let previous=-1,visited=0;
 return {
  step(direction:number){
   if(direction===previous)return;
   if(!Number.isInteger(direction)||direction<0||direction>8)throw Error('Original joystick direction must be 0 through 8');
   for(let i=0;i<9;i++)rect(xs[i],ys[i],width,height,0);
   rect(xs[direction],ys[direction],width,height,colors.indicator);previous=direction;visited|=1<<direction;
  },
  finish(){return visited===0x1ff;},
 };
}
