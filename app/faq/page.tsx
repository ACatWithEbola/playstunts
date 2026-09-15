import type {Metadata} from 'next';
import Image from 'next/image';
import type {ReactNode} from 'react';
import StuntsBrand from '../StuntsBrand';
import StuntsNavigation from '../StuntsNavigation';

export const metadata:Metadata={
 title:'FAQ — Play Stunts',
 description:'Answers about playing Stunts in the browser, enhanced graphics, sound, tracks, replays, saves and building PlayStunts from GitHub.',
 alternates:{canonical:'/faq'},
 openGraph:{url:'https://playstunts.com/faq',title:'FAQ — Play Stunts',description:'Answers about playing Stunts in the browser, enhanced graphics, sound, tracks, replays, saves and local installation.'},
};

const Section=({id,kicker,title,children}:{id:string;kicker:string;title:string;children:ReactNode})=><section className="faq-section" id={id} aria-labelledby={`${id}-heading`}>
 <div className="faq-section-heading"><span>{kicker}</span><h2 id={`${id}-heading`}>{title}</h2></div>
 <div className="faq-list">{children}</div>
</section>;

const Answer=({question,children,open=false}:{question:string;children:ReactNode;open?:boolean})=><details className="faq-answer" open={open}>
 <summary><span>{question}</span><span className="faq-marker" aria-hidden="true">+</span></summary>
 <div>{children}</div>
</details>;

export default function FaqPage(){return <main className="game-shell stunts-universe faq-page">
 <header className="stunts-masthead">
  <div className="stunts-masthead-brand"><h1><a href="/" aria-label="Play Stunts home"><StuntsBrand/></a></h1><p className="stunts-developer-credit">BY DISTINCTIVE SOFTWARE, THE DEVELOPERS OF <span style={{whiteSpace:'nowrap'}}>TEST DRIVE™</span> &amp; <span style={{whiteSpace:'nowrap'}}>THE DUEL: TEST DRIVE II™</span></p></div>
  <div className="stunts-masthead-art" aria-hidden="true"><Image unoptimized width={790} height={309} src="/site/manual-red-car.png" alt=""/></div>
  <div className="stunts-masthead-copy"><span>PLAYER &amp; PROJECT GUIDE</span><strong>FREQUENTLY&nbsp;ASKED<br/>QUESTIONS</strong><p>Playing, graphics, sound, saves and local installation.</p></div>
 </header>
 <StuntsNavigation><a href="/#play">PLAY</a><a href="/#setup">SETUP</a><a href="/#about">THE GAME</a><a href="/?view=cars#play">3D CARS</a><a href="/#roland">MT-32</a><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer">MANUAL ↗</a><a href="/#saves">TRACKS &amp; REPLAYS</a><a className="nav-play" href="/faq" aria-current="page">FAQ</a><a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer">GITHUB ↗</a></StuntsNavigation>

 <section className="faq-intro" aria-labelledby="faq-intro-heading">
  <div><span className="rail-kicker">QUICK ANSWERS</span><h2 id="faq-intro-heading">Start driving.<br/>Keep your files.</h2></div>
  <div><p>PlayStunts brings the 1990 racing and track-building game to a modern browser. The hosted version runs immediately; the open-source reconstruction can also be built locally with a supported original installation.</p><div className="faq-actions"><a className="faq-primary" href="/#play">PLAY STUNTS</a><a href="https://github.com/ACatWithEbola/playstunts#readme" target="_blank" rel="noreferrer">LOCAL INSTALLATION ↗</a></div></div>
 </section>

 <div className="faq-layout">
  <aside className="faq-index" aria-label="FAQ sections"><span>ON THIS PAGE</span><a href="#getting-started">Getting started</a><a href="#graphics-sound">Graphics &amp; sound</a><a href="#files-saves">Tracks, replays &amp; saves</a><a href="#local-build">GitHub &amp; local builds</a><a href="#project-support">Project &amp; support</a></aside>
  <div className="faq-content">
   <Section id="getting-started" kicker="01" title="Getting started">
    <Answer question="What is PlayStunts?" open><p>PlayStunts is a browser-native reconstruction of <em>Stunts</em>, also released as <em>4D Sports Driving</em>. You can choose from eleven cars, race against the clock or an opponent, build tracks and watch replays.</p></Answer>
    <Answer question="Is this an official release?"><p>No. PlayStunts is an independent, unofficial reconstruction and is not affiliated with the original developers, publishers or Roland.</p></Answer>
    <Answer question="Do I need to install anything to play here?"><p>No. The hosted game runs directly at <a href="https://playstunts.com">playstunts.com</a>. A local installation is only needed if you want to build the project from GitHub.</p></Answer>
    <Answer question="What computer and browser should I use?"><p>A desktop or laptop with a keyboard and a current browser supporting WebAssembly, Web Audio and WebGL is recommended. Browser audio begins after your first click because browsers block automatic sound.</p></Answer>
    <Answer question="What are the main controls?"><p>Use the arrow keys to accelerate, brake and steer. <kbd>A</kbd> and <kbd>Z</kbd> shift gears; <kbd>Esc</kbd> opens the game menu; <kbd>C</kbd> or <kbd>F1</kbd>–<kbd>F4</kbd> changes camera; <kbd>D</kbd> toggles the dashboard; and <kbd>V</kbd> cycles the enhanced chase distances. The complete list is beside the game on the home page.</p></Answer>
   </Section>

   <Section id="graphics-sound" kicker="02" title="Graphics &amp; sound">
    <Answer question="What is enhanced graphics mode?" open><p>Enhanced mode redraws the race with full-colour scenery, detailed 3D cars, live steering and suspension, improved lighting, shadows and additional chase-camera distances. It is selected by default on the hosted site.</p></Answer>
    <Answer question="Can I use the original graphics?"><p>Yes. Choose <strong>Use original graphics</strong> above the game to switch to the display mode selected in Setup. Only that website control changes the renderer; opening an in-game menu does not change your graphics choice.</p></Answer>
    <Answer question="What does the audio update change?"><p><strong>Enable audio update</strong> switches the four original music cues to their remixed versions. Sound effects and engine audio remain unchanged. Both versions follow the same playback clock, so changing modes continues at the corresponding position instead of restarting the music. The in-game Options menu still controls whether music is on or off; turning it back on restarts the current score in either version.</p></Answer>
    <Answer question="What does Setup change?"><p>Setup selects the original display mode and sound device. Saving changed settings restarts the game automatically. Enhanced graphics remains a separate website option.</p></Answer>
    <Answer question="Do I need Roland MT-32 ROMs?"><p>Only for MT-32 sound. You must legally provide compatible control and PCM ROMs yourself when building locally. PC speaker, Tandy, AdLib and Sound Blaster options do not require Roland ROMs.</p></Answer>
    <Answer question="Are the cars in the showroom the same as the cars in the race?"><p>Yes. The 3D showroom and enhanced race renderer use the same decoded models and materials for all eleven cars. In the showroom, drag to rotate, scroll to zoom and choose the available source colours.</p></Answer>
   </Section>

   <Section id="files-saves" kicker="03" title="Tracks, replays &amp; saves">
    <Answer question="Can I import tracks from the original game?" open><p>Yes. Open <strong>Tracks, replays and save backups</strong> on the home page and upload an original <code>.TRK</code> file. Supported tracks are 1,802 bytes.</p></Answer>
    <Answer question="Can I import and watch original replays?"><p>Yes. Upload the <code>.RPL</code> file before starting the game, then load it from the in-game replay menu. Names may contain 1–8 letters, numbers, underscores or hyphens, and supported recordings contain no more than 12,000 frames.</p></Answer>
    <Answer question="Where are my tracks, replays and settings stored?"><p>They are stored locally by your browser and belong to the exact site address you are using. They are not attached to an account or synchronized online.</p></Answer>
    <Answer question="How do I move my saves to another browser or computer?"><p>Export a save backup from the home page before changing browser, computer, hostname or port. Import that backup at the new address. Individual track and replay downloads preserve their original DOS filenames and bytes.</p></Answer>
   </Section>

   <Section id="local-build" kicker="04" title="GitHub &amp; local builds">
    <Answer question="Are the original game files included on GitHub?" open><p>No. The repository contains the reconstruction source, preparation tools and redistributable dependencies. You must supply your own compatible original game files, and optional Roland ROMs, artwork and box scans are not included.</p></Answer>
    <Answer question="Which original game version is supported?"><p>Use the complete extracted PC installation of Mindscape’s <strong>4D Sports Driving 1.1, finalized 13 December 1990</strong>, identified as <strong>MS 1990</strong> in the <a href="https://wiki.stunts.hu/wiki/Game_versions" target="_blank" rel="noreferrer">Stunts version table ↗</a>. The community archive named <strong>4D Sports Driving 1.1, Dec 13</strong> is a tested input.</p></Answer>
    <Answer question="Will the original copy-protection crash occur locally?"><p>The reconstructed browser game does not execute the original DOS launch programs or their copy-protection path. The current preparation and smoke-check process supports the tested, unmodified original files and verifies that a fresh race continues beyond the original protection interval.</p></Answer>
    <Answer question="Why can a local copy look different from playstunts.com?"><p>The hosted site uses optional presentation artwork, including the masthead, box scans and reconstructed title images. These are not required for gameplay and are not distributed in the source repository. A local build uses its documented fallbacks unless you provide permitted copies yourself.</p></Answer>
    <Answer question="Where are the complete installation instructions?"><p>The maintained commands, supported checksums, optional artwork layout and troubleshooting steps are in the <a href="https://github.com/ACatWithEbola/playstunts#readme" target="_blank" rel="noreferrer">GitHub README ↗</a>. Follow the steps in order and do not merge newly generated assets into an older installation.</p></Answer>
   </Section>

   <Section id="project-support" kicker="05" title="Project &amp; support">
    <Answer question="Is the reconstruction finished?" open><p>Not yet. PlayStunts is a public beta. The main game, Setup, cars, tracks, replays, sound choices and enhanced renderer are available, but visual, audio or simulation differences may still be found.</p></Answer>
    <Answer question="How do I report a problem?"><p><a href="mailto:svenanders@lokaas.net?subject=PlayStunts%20bug%20report">Send a bug report</a> with your browser, selected car, track or replay, sound and display settings, and the steps needed to reproduce it. Do not attach game archives, ROMs or credentials.</p></Answer>
    <Answer question="Can I inspect or contribute to the source?"><p>Yes. The reconstruction is available on <a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer">GitHub ↗</a>. Original project source is licensed under GPL-3.0-only unless a file states otherwise; third-party components keep their own licences.</p></Answer>
    <Answer question="Does the source-code licence include the original Stunts material?"><p>No. The project licence does not cover original executables, artwork, game data, Roland ROMs or material extracted from those files. Those remain subject to their respective rights holders’ terms.</p></Answer>
   </Section>
  </div>
 </div>

 <footer className="faq-footer"><div><strong>PLAYSTUNTS.COM</strong><p>Unofficial browser reconstruction · Public beta</p></div><nav aria-label="Footer links"><a href="/">Home</a><a href="https://pigsgrame.de/downloads/stunts.pdf" target="_blank" rel="noreferrer">Manual</a><a href="https://github.com/ACatWithEbola/playstunts" target="_blank" rel="noreferrer">GitHub</a><a href="mailto:svenanders@lokaas.net?subject=PlayStunts%20bug%20report">Report a bug</a></nav></footer>
 </main>}
