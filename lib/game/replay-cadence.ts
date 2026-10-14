/** Missing metadata belongs to the existing 20 Hz recording format. */
export type ReplayCadence = 10 | 20;
export function resolveReplayCadence(value: unknown): ReplayCadence {
 if(value === undefined) return 20;
 if(value === 10 || value === 20) return value;
 throw Error('Unsupported replay cadence');
}
