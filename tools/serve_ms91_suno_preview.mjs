import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {browserMs91SunoScorePreview} from './ms91-suno-research-profile.ts';

// Serve only the four explicit, unapproved local candidates. No directory,
// arbitrary filesystem access, write operations or public network binding.
const preview=browserMs91SunoScorePreview('ms-1991',{hostname:'localhost',search:'?preview-suno-score=1'});
const files=new Map(Object.values(preview.paths).map(value=>{
 const pathname=new URL(value).pathname;
 return [pathname,'/private/tmp/'+pathname.slice('/files/'.length)];
}));
const origins=new Set(['http://localhost:5191','http://127.0.0.1:5191','http://[::1]:5191']);
export function createPreviewServer({stallBody=false}={}){
 return createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  const origin=req.headers.origin;
  if(origin&&!origins.has(origin)){res.writeHead(403).end();return;}
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
  const path=files.get(req.url);
  if(!path){res.writeHead(404).end();return;}
  try{
   const info=await stat(path);if(!info.isFile())throw Error('Not a file');
   res.writeHead(200,{'Content-Type':'audio/wav','Content-Length':info.size,'Cache-Control':'no-store'});
   if(req.method==='HEAD'){res.end();return;}
   if(stallBody){res.flushHeaders();console.log('Holding test transfer: '+req.url);res.on('close',()=>console.log('Closed test transfer: '+req.url));return;}
   const stream=createReadStream(path);stream.on('error',()=>res.destroy());stream.pipe(res);
  }catch{res.writeHead(404).end();}
 });
}
if(import.meta.url===pathToFileURL(process.argv[1]??'').href){
 if(process.argv.slice(2).some(value=>value!=='--stall-body'))throw Error('Unsupported preview server option');
 const server=createPreviewServer({stallBody:process.argv.includes('--stall-body')});
 server.listen(5192,'127.0.0.1',()=>console.log('Unapproved MS91 music candidates: http://127.0.0.1:5192 (four fixed files only)'));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.closeAllConnections();server.close();});
}
