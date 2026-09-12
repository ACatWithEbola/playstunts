import {NextRequest,NextResponse} from 'next/server';
export function middleware(request:NextRequest){
 if(process.env.NODE_ENV!=='development'&&request.nextUrl.pathname==='/work/reference'){
  const url=request.nextUrl.clone();url.pathname='/cars';return NextResponse.redirect(url,308);
 }
 if(process.env.NODE_ENV!=='development'&&(request.nextUrl.pathname==='/work'||request.nextUrl.pathname.startsWith('/work/'))){return new NextResponse('Not found',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});}
 if(request.nextUrl.hostname==='www.playstunts.com'){const url=request.nextUrl.clone();url.hostname='playstunts.com';url.protocol='https:';return NextResponse.redirect(url,308);}
 return NextResponse.next();
}
