'use client';
import {WebsiteText} from './WebsiteLanguage';
export default function ListPagination({visible,total,hasMore=false,busy=false,onMore,onReset}:{visible:number;total:number;hasMore?:boolean;busy?:boolean;onMore:()=>void;onReset:()=>void}){
 if(total<=10&&!hasMore)return null;
 return <div className="list-pagination"><span aria-live="polite">{Math.min(visible,total)} / {total}{hasMore?'+':''}</span>{(visible<total||hasMore)&&<button type="button" disabled={busy} onClick={onMore}><WebsiteText text="Show 10 more"/></button>}{visible>10&&<button type="button" disabled={busy} onClick={onReset}><WebsiteText text="Show top 10"/></button>}</div>;
}
