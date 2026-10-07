/** Fixed tables only. Track data is archived but never deleted. */
export const RESET_ARCHIVE_ID='leaderboard-reset-20261007';
export const RESET_TABLES={
 accepted_scores:['id','rules','created_at'],
 global_scores:['id','rules','track_hash','car_code','ticks','record','created_at','driver_key','route_assessment'],
 replay_assessment_lock:['key','token','lease_until'],
 run_history:['id','rules','track_hash','car_code','ticks','record','created_at','driver_key','route_assessment'],
 score_requests:['bucket','count','expires_at'],
 score_tracks:['hash','name'],
 shared_replays:['id','replay','track_name','created_at','assessment_version','assessed_at','assessment_retry_at'],
 shared_tracks:['hash','name','bytes','created_at'],
} as const;
export const PURGE_TABLES=['shared_replays','run_history','accepted_scores','global_scores','score_requests','replay_assessment_lock'] as const;
export const RESET_SNAPSHOT_SQL="SELECT json_object('format','playstunts-d1-backup-v1','tables',json_object("+Object.entries(RESET_TABLES).map(([table,columns])=>`'${table}',json((SELECT json_group_array(json_object(${columns.map(c=>`'${c}',\"${c}\"`).join(',')})) FROM (SELECT * FROM \"${table}\" ORDER BY \"${columns[0]}\")))`).join(',')+')) AS payload';
export async function backupLeaderboard(db:D1Database,now:number){
 await db.prepare(`INSERT OR IGNORE INTO leaderboard_reset_backups(id,payload,created_at) SELECT ?,payload,? FROM (${RESET_SNAPSHOT_SQL})`).bind(RESET_ARCHIVE_ID,now).run();
 return db.prepare('SELECT payload,created_at,purged_at FROM leaderboard_reset_backups WHERE id=?').bind(RESET_ARCHIVE_ID).first<{payload:string;created_at:number;purged_at:number}>();
}
export async function purgeLeaderboard(db:D1Database,now:number,token:string){
 const existing=await db.prepare('SELECT purged_at FROM leaderboard_reset_backups WHERE id=?').bind(RESET_ARCHIVE_ID).first<{purged_at:number}>();
 if(!existing)throw Error('Backup required');
 if(existing.purged_at)return {alreadyPurged:true};
 // The comparison and deletes are in one transaction. Any change since the
 // archive was made aborts deletion, rather than losing unarchived data.
 const result=await db.batch([
  db.prepare(`UPDATE leaderboard_reset_backups SET purged_at=?,purge_token=? WHERE id=? AND purged_at=0 AND payload=(${RESET_SNAPSHOT_SQL.replace(' AS payload','')})`).bind(now,token,RESET_ARCHIVE_ID),
  ...PURGE_TABLES.map(table=>db.prepare(`DELETE FROM ${table} WHERE EXISTS (SELECT 1 FROM leaderboard_reset_backups WHERE id=? AND purge_token=? AND purged_at=?)`).bind(RESET_ARCHIVE_ID,token,now)),
 ]);
 if(!result[0].meta.changes)throw Error('Database changed since backup; nothing was purged');
 return {purged:true};
}
