/** Material values used by the 3D car study and the upgraded driving cars. */
export const CAR_STUDY_MATERIALS={
 // Fresh clear-coated paint: tight reflections over the saturated source
 // colour, without changing the authored panel geometry or base palette.
 body:{metalness:.42,roughness:.07},
 tire:{metalness:0,roughness:.95},
 hub:{metalness:.7,roughness:.3},
 glass:{metalness:.05,roughness:.18},
} as const;
