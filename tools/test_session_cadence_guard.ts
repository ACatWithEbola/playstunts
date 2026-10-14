import assert from 'node:assert/strict';
import {createNativeRaceSession,type NativeRaceData} from '../lib/game/native-race-session.ts';
// Missing resource fields are intentional: incomplete/unsupported cadence must
// reject before any allocation, initialization or recording can happen.
assert.throws(()=>createNativeRaceSession({framesPerSecond:10} as NativeRaceData),/cadence-aware initialization and replay storage/);
assert.throws(()=>createNativeRaceSession({framesPerSecond:30} as unknown as NativeRaceData),/Unsupported session cadence/);
console.log('Incomplete10 and unsupported session rates fail before initialization/recording');
