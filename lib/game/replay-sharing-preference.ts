export const AUTO_SHARE_REPLAYS_KEY='stunts-auto-share-qualifying-replays';
let override:boolean|undefined;
export function autoShareReplaysEnabled(){if(override!==undefined)return override;try{return typeof window!=='undefined'&&window.localStorage.getItem(AUTO_SHARE_REPLAYS_KEY)==='true';}catch{return false;}}
export function setAutoShareReplays(enabled:boolean){try{window.localStorage.setItem(AUTO_SHARE_REPLAYS_KEY,String(enabled));override=enabled;}catch(error){override=false;throw error;}}
