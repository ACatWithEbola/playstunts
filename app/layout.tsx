import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={icons:{icon:[{url:'/stunts-favicon.png',type:'image/png',sizes:'64x64'}]},title:'Stunts — Browser edition',description:'Try the native Stunts reconstruction: opening, menus, track editor, racing and replays.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
