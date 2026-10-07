'use client';
import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
import NativeSetupPanel from '../NativeSetupPanel';
export default function Setup(){return <main className="game-shell standalone-setup"><header><span className="wordmark"><WebsiteText text={"STUNTS"}/></span><a href="/"><WebsiteText text={"← Back to game"}/></a></header><h1><WebsiteText text={"Setup"}/></h1><NativeSetupPanel/><p><WebsiteText text={"Your saved settings apply the next time you start the game."}/></p></main>;}
