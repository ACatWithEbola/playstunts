import type {Metadata} from 'next';
import Image from 'next/image';
import StuntsBrand from '../StuntsBrand';
import StuntsNavigation from '../StuntsNavigation';
import Leaderboards from './Leaderboards';
import './high-scores.css';
export const metadata:Metadata={title:'High Scores — Play Stunts',description:'Explore the shared Stunts leaderboards: fastest drivers, tracks, cars, verified times and optional replays.',alternates:{canonical:'/high-scores'}};
export default function HighScoresPage(){return <main className="game-shell stunts-universe scores-page">
 <header className="stunts-masthead"><div className="stunts-masthead-brand"><h1><a href="/" aria-label="Play Stunts home"><StuntsBrand/></a></h1><p className="stunts-developer-credit">BY DISTINCTIVE SOFTWARE, THE DEVELOPERS OF TEST DRIVE™ &amp; THE DUEL: TEST DRIVE II™</p></div><div className="stunts-masthead-art" aria-hidden="true"><Image unoptimized width={790} height={309} src="/site/manual-red-car.webp" alt=""/></div><div className="stunts-masthead-copy"><span>THE SHARED LEADERBOARDS</span><strong>EVERY TRACK.<br/>EVERY SECOND.</strong><p>The original game. A worldwide challenge.</p></div></header>
 <StuntsNavigation><a href="/#play">PLAY</a><a href="/#setup">SETUP</a><a href="/#about">THE GAME</a><a href="/?view=cars#play">3D CARS</a><a className="nav-play" href="/high-scores" aria-current="page">HIGH SCORES</a><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer">MANUAL ↗</a><a href="/#saves">TRACKS &amp; REPLAYS</a><a href="/faq">FAQ</a><a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer">GITHUB ↗</a></StuntsNavigation>
 <Leaderboards/>
 <footer className="scores-footer"><a href="/#play">YOUR NEXT RECORD STARTS HERE <span aria-hidden="true">↗</span></a><p>Unofficial browser reconstruction · Public beta</p><a href="/faq#global-scores">How scoring works</a></footer>
 </main>;}
