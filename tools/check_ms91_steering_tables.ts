/** Original table bytes are independently asserted by audit_ms91_simulation_rate.py.
 * This checks input response lookup only, not the complete steering routine. */
import assert from 'node:assert/strict';
import {stepSteering} from '../lib/physics/steering.ts';
const tables = {
  20: [8,7,6,5,4,4,3,3,2,2,2,1,1,1,1,1],
  10: [16,14,12,10,8,8,6,6,4,4,4,2,2,1,1,1],
};
for (const fps of [10,20] as const) {
  for (const [bin, rate] of tables[fps].entries()) {
    for (const speed of [bin*4096, bin*4096+4095]) {
      assert.equal(stepSteering(0,speed,1,fps),rate);
      assert.equal(stepSteering(0,speed,2,fps),-rate);
    }
  }
}
console.log('MS91 10/20 Hz steering input lookup matches all original table bins');
