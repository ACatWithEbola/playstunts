/** Owner-requested community withdrawals. Keep server bytes recoverable;
 * never touch browser saves, score history or other tracks. */
export const withdrawnCommunityTracks=['81acd3928350ad3449dce4e81aa8b9f5c233b1c9d2db3ea333f6026efdb175ed'] as const;
export const communityTrackWithdrawn=(hash:string)=>withdrawnCommunityTracks.some(id=>id===hash);
