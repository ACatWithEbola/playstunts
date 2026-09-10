/** Original 0x1384e..0x1396c; unmatched tiles become empty on straight slopes. */
const roads:Record<number,Record<number,number>>={
 7:{4:182,14:186,24:190,39:194,59:194,98:194},
 8:{5:183,15:187,25:191,36:195,56:195,95:195},
 9:{4:184,14:188,24:192,38:196,58:196,97:196},
 10:{5:185,15:189,25:193,37:197,57:197,96:197},
};
export function slopeRoadMap(terrain:number,tile:number){return roads[terrain&255]?.[tile&255]??0;}
