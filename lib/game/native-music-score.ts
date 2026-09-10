export const nativeMusicScores=['titl','slct','vict','over'] as const;
export type NativeMusicScore=typeof nativeMusicScores[number];
/** Supplied5C38..5C58: only outcome byte0 selects VICT; all others select OVER. */
export function originalResultMusic(outcome:number):'vict'|'over'{return (outcome&255)===0?'vict':'over';}
