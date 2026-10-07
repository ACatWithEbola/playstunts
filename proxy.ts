import {NextRequest,NextResponse} from 'next/server';
export function proxy(request:NextRequest){
 if(process.env.NODE_ENV!=='development'&&request.nextUrl.pathname==='/work/reference'){
  const url=request.nextUrl.clone();url.pathname='/cars';return NextResponse.redirect(url,308);
 }
 if(process.env.NODE_ENV!=='development'&&(request.nextUrl.pathname==='/work'||request.nextUrl.pathname.startsWith('/work/'))){return new NextResponse('Not found',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
 if(request.nextUrl.hostname==='www.playstunts.com'){const url=request.nextUrl.clone();url.hostname='playstunts.com';url.protocol='https:';return NextResponse.redirect(url,308);}
 const response=NextResponse.next();
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
 // Report only: do not block game scripts, WASM, audio or Site embedding.
 response.headers.set('Content-Security-Policy-Report-Only',"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'");
 return response;
}
