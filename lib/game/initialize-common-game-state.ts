import {initializeOriginalTrackCoordinates} from './initialize-track-coordinates.ts';
import {TRACK_DISPLAY_LAYOUTS} from './track-display-layout.ts';
import {loadNativeCommonGameResources} from './load-common-game-resources.ts';
import {allocateOriginalGameBuffers} from './allocate-game-buffers.ts';
import type {NativeResourceFileHost} from './load-native-resource.ts';

/** Original main entry 281B..2A62, after display/heap initialization and before
 * opening/menu presentation. Resources are loaded through the native file host;
 * the caller supplies original data tables and owns the allocator and stack. */
export async function initializeNativeCommonGameState(host:NativeResourceFileHost,d:number,stackPointer:number,framePointer:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 initializeOriginalTrackCoordinates(host.memory(),d,framePointer,TRACK_DISPLAY_LAYOUTS[mode]);
 await loadNativeCommonGameResources(host,d,stackPointer,mode);
 const buffers=allocateOriginalGameBuffers(host.memory(),d,framePointer,mode);
 host.writeMemory(buffers.memory);
 if(buffers.error)throw Error('Original persistent game buffer allocation failed: '+buffers.error);
}
