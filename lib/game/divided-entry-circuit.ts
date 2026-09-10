import {dividedCircuit} from './divided-circuit.ts';
/** Original entry, divided section and reversed exit used by the crash comparison. */
export function dividedEntryCircuit():number[]{
 const raw=dividedCircuit();raw[7*30+7]=111;raw[9*30+7]=113;return raw;
}
