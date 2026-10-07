import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
import type {Metadata} from 'next';
import Image from 'next/image';
import StuntsBrand from '../StuntsBrand';
import StuntsNavigation from '../StuntsNavigation';
import Leaderboards from './Leaderboards';
import './high-scores.css';
export const metadata:Metadata={title:'High Scores — Play Stunts',description:'Explore the shared Stunts leaderboards: fastest drivers, tracks, cars, verified times and optional replays.',alternates:{canonical:'/high-scores'}};
export default function HighScoresPage(){return <main className="game-shell stunts-universe scores-page">
 <header className="stunts-masthead"><div className="stunts-masthead-brand"><h1><WebsiteElement as="a" href="/" aria-label="Play Stunts home"><StuntsBrand/></WebsiteElement></h1><p className="stunts-developer-credit"><WebsiteText text={"BY DISTINCTIVE SOFTWARE, THE DEVELOPERS OF TEST DRIVE™ & THE DUEL: TEST DRIVE II™"}/></p></div><div className="stunts-masthead-art" aria-hidden="true"><Image unoptimized width={790} height={309} src="/site/manual-red-car.webp" alt=""/></div><div className="stunts-masthead-copy"><span><WebsiteText text={"THE SHARED LEADERBOARDS"}/></span><strong><WebsiteText text={"EVERY TRACK."}/><br/><WebsiteText text={"EVERY SECOND."}/></strong><p><WebsiteText text={"The original game. A worldwide challenge."}/></p></div></header>
 <StuntsNavigation><a href="/#play"><WebsiteText text={"PLAY"}/></a><a href="/#setup"><WebsiteText text={"SETUP"}/></a><a href="/#about"><WebsiteText text={"THE GAME"}/></a><a href="/?view=cars#play"><WebsiteText text={"3D CARS"}/></a><a className="nav-play" href="/high-scores" aria-current="page"><WebsiteText text={"HIGH SCORES"}/></a><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer"><WebsiteText text={"MANUAL"}/></a><a href="/#saves"><WebsiteText text={"TRACKS & REPLAYS"}/></a><a href="/faq"><WebsiteText text={"FAQ"}/></a><a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer"><WebsiteText text={"GITHUB"}/></a></StuntsNavigation>
 <Leaderboards/>
 <footer className="scores-footer"><a href="/#play"><WebsiteText text={"YOUR NEXT RECORD STARTS HERE "}/><span aria-hidden="true">↗</span></a><p><WebsiteText text={"Unofficial browser reconstruction · Public beta"}/></p><a href="/faq#global-scores"><WebsiteText text={"How scoring works"}/></a></footer>
 </main>;}
