'use client';
import {useState} from 'react';
import {FrontControls,type Device} from './front-controls';
import {mt32LcdPath,mt32LcdText,MT32_LCD_WIDTH,MT32_LCD_ROWS,MT32_LCD_MATRIX_PATH} from '@/lib/game/mt32-lcd-glyph';
/** Same physical panel for the standalone sound check and the game device. */
export function Mt32Panel({device,lcd,midiLight,powered}:{device:Device|undefined;lcd:string;midiLight:boolean;powered:boolean}){
 const [cursor,setCursor]=useState<number|null>(null);
 const [panelDisplay,setPanelDisplay]=useState<string|null>(null);
 const text=mt32LcdText(powered?(panelDisplay??lcd):'');
 return <div className="mt32-panel-viewport"><section className="mt32-panel" aria-label="Roland MT-32 device display"><span className="mt32-screw mt32-screw-left" aria-hidden="true"/><div className="mt32-face"><div className="mt32-brand"><strong>Roland</strong><span>MT-32</span><small>MULTI TIMBRE<br/>SOUND MODULE</small></div><div className="mt32-screen-group"><div className={'mt32-lcd '+(powered?'mt32-lcd-on':'')} role="img" aria-label={powered?'Device display: '+text:'Device display off'}><svg className="mt32-dot-matrix" viewBox={`0 0 ${MT32_LCD_WIDTH} ${MT32_LCD_ROWS}`} preserveAspectRatio="none" aria-hidden="true"><path className="mt32-lcd-electrodes" d={MT32_LCD_MATRIX_PATH}/><path className="mt32-lcd-pixels" d={mt32LcdPath(text,powered?cursor:null)}/></svg></div><div className="mt32-screen-caption"><span className="mt32-midi"><i className={midiLight?'lit':''} aria-hidden="true"/> MIDI MESSAGE</span></div></div></div><FrontControls device={device} onDisplay={setPanelDisplay} onCursor={setCursor}/><span className="mt32-screw mt32-screw-right" aria-hidden="true"/></section></div>;
}
