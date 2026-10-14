import {resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Original MS91 MAIN.RES/MISC.PRE/GAME.PRE text through the first NUL.
 * Native game text is deliberately not website-localized. Resource overlay
 * does not alter shared asset files or select a simulation rate. */
export const MS91_DIALOG_TEXT={
 edos:'Exit to Dos]}[ No [ Yes ]',
 efex:'File Exists!]}[Rename File[Save File]',
 emer:'Out Of Memory.]Please race alone or return]to DOS and select a different]graphics mode or free up memory.]',
 ejox:"Joystick Disabled. Indicator]wasn't moved to all squares.]",
 emid:'Driving input device]}[Keyboard][Joystick][Mouse]',
 emrl:'Graphic levels]}[  FULL][  FULL, no clds/scnry.][  MEDIUM, no clds/scnry.][  FAST, no clds/scnry.][  FAST, no clds/scnry/horiz.]}[  Slow video mgmt. OFF][  Slow video mgmt. ON]}[  Slow Simulation Speed][  Fast Simulation Speed]}[  Done]',
 emrs:'Simulation speed will change]at the start of the next race.]',
 emop:'Options]}[Driving input device][Music on/off][Sound effects on/off][Load replay][Set graphic level][Exit to DOS][Done]',
 emdo:'Display Options]}[Dashboard On/OFF][Replay Bar On/OFF (when playing)][Change Camera][Change Graphic Level][Toggle Camera View]',
 emen:'Replay Menu]}[Return to REPLAY][Return to Evaluation][Re-Start Driving][Continue Driving][Load REPLAY][Save REPLAY][Display Options][Main Menu]',
 erbf:'Replay buffer is full. Do you]want to watch some of the replay]and then continue racing or]continue now.]}[Continue Now[See Replay]',
} as const;
export const MS91_EDITOR_DIALOG_TEXT={
 echl:'Track has been changed]}[Save First[Load New Track]',
 echx:'Track has been changed]}[Save First[Exit Editor]',
 emen:'Select Terrain]}[Terrain 1][Terrain 2][Terrain 3][Terrain 4][Terrain 5][Cancel]',
 emss:'Select Horizon]}[Desert][Tropical][Alpine][City][Country][Cancel]',
} as const;
export function ms91EditorDialogResources(legacy:Record<string,ReadonlyArray<number>>,engine?:PhysicsEngineVersion){
 if(resolvePhysicsEngine(engine)!=='ms-1991')return legacy;
 // The editor save flow also owns MAIN.RES efex. Do not merge GAME emen,
 // which has the same ID as the editor's terrain selector.
 return {...legacy,efex:Array.from(MS91_DIALOG_TEXT.efex+'\0',character=>character.charCodeAt(0)),...Object.fromEntries(Object.entries(MS91_EDITOR_DIALOG_TEXT).map(([key,text])=>[key,Array.from(text+'\0',character=>character.charCodeAt(0))]))};
}
export function ms91DialogResources(legacy:Record<string,ReadonlyArray<number>>,engine?:PhysicsEngineVersion){
 if(resolvePhysicsEngine(engine)!=='ms-1991')return legacy;
 return {...legacy,...Object.fromEntries(Object.entries(MS91_DIALOG_TEXT).map(([key,text])=>[key,Array.from(text+'\0',character=>character.charCodeAt(0))]))};
}
