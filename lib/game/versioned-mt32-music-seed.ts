import type {OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import {versionedMt15Resource} from './versioned-mt15-resource.ts';
/** Build an independently owned startup from the bundled legacy score seed.
 * Driver selection is sound identity only; no physics/replay metadata changes.
 * Modern callers still require timed initialization and MIDI delivery. */
export function versionedMt32MusicSeed(seed:OriginalMt32MusicSeed,generation:'ms-1990'|'ms-1991'):OriginalMt32MusicSeed{
 if(generation!=='ms-1990'&&generation!=='ms-1991')throw Error('Unsupported Roland sound generation');
 if(seed.driverGeneration&&seed.driverGeneration!=='ms-1990')throw Error('Roland conversion requires the original legacy startup seed');
 if(seed.hardware.length!==16||seed.hardware.some(record=>record.length!==46||record[1]!==0))throw Error('Roland conversion requires sixteen inactive voice records');
 const result=structuredClone(seed);
 result.driverGeneration=generation;
 const driver=versionedMt15Resource(generation);if(driver)result.driver=Array.from(driver);
 return result;
}
