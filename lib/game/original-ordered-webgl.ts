import {ShapeUtils,Vector2} from 'three';
import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {originalPolygonEdgePlan} from './original-polygon-edge-plan.ts';
import {originalCirclePlan} from './original-circle-plan.ts';
import {originalLargeEllipseContour} from './original-large-ellipse-contour.ts';
import {originalWheelDrawPlan} from './wheel-draw-plan.ts';

/** High-resolution screen polygons in source painter order. No depth buffer,
 * lighting, geometric offsets or multisample seams are introduced here.
 * Source projection, visibility and command order remain upstream.
 */
export function createOriginalOrderedWebGL(canvas:HTMLCanvasElement,memory:Uint8Array,palette:readonly number[],rectangle:readonly number[]=[0,320,9,130],sharedContext?:WebGL2RenderingContext){
 let activeRectangle=rectangle;
 const gl=sharedContext??canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:true});
 if(!gl)throw Error('Ordered scene presentation requires WebGL 2');
 const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'Scene shader failed');return s;};
 const vertex=shader(gl.VERTEX_SHADER,`#version 300 es
 in vec2 position;out vec2 sourcePoint;uniform vec2 screenSize;
 void main(){sourcePoint=position;gl_Position=vec4(position.x/(screenSize.x*0.5)-1.0,1.0-position.y/(screenSize.y*0.5),0,1);}`);
 const fragment=shader(gl.FRAGMENT_SHADER,`#version 300 es
 precision highp float;precision highp int;
 in vec2 sourcePoint;out vec4 ink;uniform vec3 primaryColor;uniform vec3 secondaryColor;
 uniform int mode;uniform int mask;uniform sampler2D background;uniform vec2 screenSize;
 void main(){
 if(mode==3){ink=texture(background,sourcePoint/screenSize);return;}
 bool bit=false;if(mode!=0){int x=int(floor(sourcePoint.x))&7;int y=int(floor(sourcePoint.y))&1;int row=y==0?(mask>>8)&255:mask&255;bit=(row&(128>>x))!=0;}
 if(mode==1&&!bit)discard;ink=vec4(mode==2&&bit?secondaryColor:primaryColor,1);
 }`);
 const program=gl.createProgram()!;gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'Scene program failed');
 gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
 const vertexArray=gl.createVertexArray()!;gl.bindVertexArray(vertexArray);
 const buffer=gl.createBuffer()!,texture=gl.createTexture()!;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 let capacity=1024;gl.bufferData(gl.ARRAY_BUFFER,capacity*4,gl.DYNAMIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const uniform=(name:string)=>gl.getUniformLocation(program,name);
 const primary=uniform('primaryColor'),secondary=uniform('secondaryColor'),mode=uniform('mode'),mask=uniform('mask');
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,320,200,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
 gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DITHER);
 let rgba=new Uint8Array(64000*4),textureWidth=320,textureHeight=200;
 const signed=(n:number)=>(n<<16)>>16;
 const color=(where:WebGLUniformLocation|null,index:number)=>{const i=(index&255)*3;gl.uniform3f(where,palette[i]/255,palette[i+1]/255,palette[i+2]/255);};
 const triangles=(coordinates:number[])=>{if(!coordinates.length)return;const data=new Float32Array(coordinates);if(data.length>capacity){capacity=data.length;gl.bufferData(gl.ARRAY_BUFFER,capacity*4,gl.DYNAMIC_DRAW);}gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.drawArrays(gl.TRIANGLES,0,data.length/2);};
 const quad=(x:number,y:number,w:number,h:number)=>triangles([x,y,x+w,y,x+w,y+h,x,y,x+w,y+h,x,y+h]);
 const solid=(index:number)=>{color(primary,index);gl.uniform1i(mode,0);};
 const line=(p:readonly number[],index:number)=>{solid(index);const [x0,y0,x1,y1]=p.map(signed),dx=x1-x0,dy=y1-y0,length=Math.hypot(dx,dy);if(!length){quad(x0,y0,1,1);return;}const nx=-dy/length/2,ny=dx/length/2;const a=[x0+.5+nx,y0+.5+ny],b=[x1+.5+nx,y1+.5+ny],c=[x1+.5-nx,y1+.5-ny],d=[x0+.5-nx,y0+.5-ny];triangles([...a,...b,...c,...a,...c,...d]);};
 const polygon=(points:readonly (readonly number[])[],index:number,pattern?:number,other?:number,floatingPoints?:number[][])=>{
 const plan=originalPolygonEdgePlan(points,activeRectangle,index);if(plan&&!plan.length)return;
 if(plan&&plan[0].type==='line'){line(plan[0].coordinates,index);return;}if(plan&&!plan.some(e=>e.type==='fill'))return;
 const contour=(floatingPoints??points).map(p=>new Vector2(floatingPoints?p[0]:signed(p[0]),floatingPoints?p[1]:signed(p[1])));
 color(primary,index);if(other!==undefined)color(secondary,other);gl.uniform1i(mode,pattern===undefined?0:other===undefined?1:2);gl.uniform1i(mask,(pattern??0)&65535);
 const indices=ShapeUtils.triangulateShape(contour,[]),coordinates:number[]=[];for(const face of indices)for(const i of face)coordinates.push(contour[i].x,contour[i].y);triangles(coordinates);
 };
 return {
 begin(background:Uint8Array,width=320,height=200,clip:readonly number[]=rectangle){
 activeRectangle=clip;
 if(background.length!==width*height)throw Error('Background dimensions do not match pixels');
 gl.useProgram(program);gl.bindVertexArray(vertexArray);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniform('background'),0);gl.uniform2f(uniform('screenSize'),width,height);
 gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER,null);gl.pixelStorei(gl.UNPACK_ALIGNMENT,4);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
 gl.pixelStorei(gl.UNPACK_ROW_LENGTH,0);gl.pixelStorei(gl.UNPACK_SKIP_PIXELS,0);gl.pixelStorei(gl.UNPACK_SKIP_ROWS,0);
 gl.colorMask(true,true,true,true);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.STENCIL_TEST);gl.disable(gl.DITHER);gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);gl.disable(gl.RASTERIZER_DISCARD);
 gl.viewport(0,0,canvas.width,canvas.height);gl.disable(gl.SCISSOR_TEST);
 if(textureWidth!==width||textureHeight!==height){textureWidth=width;textureHeight=height;rgba=new Uint8Array(width*height*4);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);}
 for(let i=0;i<width*height;i++){const c=background[i]*3,j=i*4;rgba[j]=palette[c];rgba[j+1]=palette[c+1];rgba[j+2]=palette[c+2];rgba[j+3]=255;}
 gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,rgba);gl.uniform1i(mode,3);quad(0,0,width,height);
 gl.enable(gl.SCISSOR_TEST);const top=Math.round(canvas.height*clip[2]/height),bottom=Math.round(canvas.height*clip[3]/height);const left=Math.round(canvas.width*clip[0]/width),right=Math.round(canvas.width*clip[1]/width);gl.scissor(left,canvas.height-bottom,right-left,bottom-top);
 },
 draw(call:OriginalRasterCall,fractionalPolygons=false){const a=call.args;switch(call.address){
 case 0x2372a:polygon(call.points!,a[0],undefined,undefined,fractionalPolygons?call.presentationPoints:undefined);break;
 case 0x246bc:polygon(call.points!,a[1],a[0],undefined,fractionalPolygons?call.presentationPoints:undefined);break;
 case 0x21394:polygon(call.points!,a[1],a[0],a[2],fractionalPolygons?call.presentationPoints:undefined);break;
 case 0x21d98:line(a.slice(0,4),a[4]);break;
 case 0x2795a:solid(a[2]);quad(signed(a[0]),signed(a[1]),1,1);break;
 case 0x28ab2:for(const face of originalWheelDrawPlan(call.points!,a[0],a.slice(1)))polygon(face.points,face.color);break;
 case 0x24ea8:{const plan=originalCirclePlan(memory,0x2d1a0,a[0],a[1],a[2],a[3],activeRectangle);
 if(plan.type==='ellipse')polygon(originalLargeEllipseContour(plan.points),plan.color);
 else if(plan.type==='point'){solid(plan.color);quad(plan.point[0],plan.point[1],1,1);}
 else if(plan.type==='spans'){solid(plan.color);for(let y=0;y<plan.left.length;y++){const count=signed(plan.right[y]-plan.left[y]+1);if(count>0)quad(plan.left[y],plan.start+y,count,1);}}break;}
 default:throw Error(`Unsupported original GPU entry ${call.address.toString(16)}`);
 }},
 dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteVertexArray(vertexArray);if(!sharedContext)gl.getExtension('WEBGL_lose_context')?.loseContext();},
 };
}
