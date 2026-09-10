import type {createNativeDisplayCommonState} from './native-display-common-state.ts';
import type {NativeOptionsHost,NativeOptionsPresentation} from './native-options-runtime.ts';
import {drawOriginalOptionsDisplayBackground} from './options-screen-display.ts';
import {captureNativeDisplayRegion} from './native-display-region.ts';
import {restoreOriginalDisplayWindow} from './select-display-window.ts';
export function createNativeDisplayOptionsPresentation(owner:Awaited<ReturnType<typeof createNativeDisplayCommonState>>,host:Pick<NativeOptionsHost,'resources'>,dialogs:NativeOptionsPresentation['dialogs']):NativeOptionsPresentation{
 return {dialogs,background(){restoreOriginalDisplayWindow(owner.memory(),owner.d,owner.mode);drawOriginalOptionsDisplayBackground(owner.memory(),owner.d,owner.drawing,host.resources,0xe800);},capture:()=>captureNativeDisplayRegion(owner,{x:0,y:0,width:320,height:200})};
}
