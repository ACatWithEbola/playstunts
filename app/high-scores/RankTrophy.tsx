import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
const metals=[{name:'Gold',fill:'#f2c65b',edge:'#a37c28'},{name:'Silver',fill:'#c3cfdb',edge:'#7d8e9f'},{name:'Bronze',fill:'#cc9564',edge:'#8b5834'}];
export default function RankTrophy({rank}:{rank:number}){
 const metal=metals[rank-1];if(!metal)return null;
 return <WebsiteElement as="svg" className="scores-rank-trophy" width="32" height="36" viewBox="0 0 32 36" role="img" aria-label={`${rank}${rank===1?'st':rank===2?'nd':'rd'} place — ${metal.name} trophy`}>
  <path d="M8 6H3v5c0 5 3 8 8 8M24 6h5v5c0 5-3 8-8 8" fill="none" stroke={metal.fill} strokeWidth="3" strokeLinejoin="round"/>
  <path d="M8 3h16v9c0 6-3.5 10-8 10s-8-4-8-10Z" fill={metal.fill} stroke={metal.edge} strokeWidth="1.2"/>
  <path d="M10 5h4v14c-3-2-4-4-4-8Z" fill="#fff" opacity=".2"/>
  <path d="M14 22h4v6h-4Z" fill={metal.fill}/>
  <path d="M10 28h12l3 5H7Z" fill={metal.fill} stroke={metal.edge} strokeWidth="1.2" strokeLinejoin="round"/>
  <text x="16" y="16.5" textAnchor="middle" fill="#18232c" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="14">{rank}</text>
 </WebsiteElement>;
}
