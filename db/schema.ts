import {integer,sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
// Private reset archive, never exposed through public score/replay APIs.
export const leaderboardResetBackups=sqliteTable('leaderboard_reset_backups',{
 id:text('id').primaryKey(),payload:text('payload').notNull(),createdAt:integer('created_at').notNull(),purgedAt:integer('purged_at').notNull().default(0),purgeToken:text('purge_token').notNull().default(''),
});
// Compact acceptance receipts survive leaderboard displacement. No replay bytes.
export const acceptedScores=sqliteTable('accepted_scores',{
 id:text('id').primaryKey(),rules:text('rules').notNull(),createdAt:integer('created_at').notNull(),
});
export const globalScores=sqliteTable('global_scores',{
 id:text('id').primaryKey(),rules:text('rules').notNull(),trackHash:text('track_hash').notNull(),carCode:text('car_code').notNull(),
 ticks:integer('ticks').notNull(),record:text('record').notNull(),createdAt:integer('created_at').notNull(),driverKey:text('driver_key').notNull().default(''),routeAssessment:text('route_assessment').notNull().default('not_assessed'),
},table=>[index('global_scores_track_time').on(table.rules,table.trackHash,table.ticks,table.createdAt,table.id),index('global_scores_driver_car').on(table.rules,table.trackHash,table.carCode,table.driverKey,table.ticks)]);
export const runHistory=sqliteTable('run_history',{
 id:text('id').primaryKey(),rules:text('rules').notNull(),trackHash:text('track_hash').notNull(),carCode:text('car_code').notNull(),
 ticks:integer('ticks').notNull(),record:text('record').notNull(),createdAt:integer('created_at').notNull(),driverKey:text('driver_key').notNull(),routeAssessment:text('route_assessment').notNull().default('not_assessed'),
},table=>[index('run_history_driver_track').on(table.rules,table.trackHash,table.driverKey,table.createdAt,table.id)]);
export const scoreRequests=sqliteTable('score_requests',{
 bucket:text('bucket').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull(),
});
export const scoreTracks=sqliteTable('score_tracks',{
 hash:text('hash').primaryKey(),name:text('name').notNull(),
});
export const sharedReplays=sqliteTable('shared_replays',{
 id:text('id').primaryKey(),replay:text('replay').notNull(),trackName:text('track_name').notNull(),createdAt:integer('created_at').notNull(),
 assessmentVersion:text('assessment_version').notNull().default(''),assessedAt:integer('assessed_at').notNull().default(0),assessmentRetryAt:integer('assessment_retry_at').notNull().default(0),
});
export const replayAssessmentLock=sqliteTable('replay_assessment_lock',{
 key:text('key').primaryKey(),token:text('token').notNull(),leaseUntil:integer('lease_until').notNull(),
});
export const sharedTracks=sqliteTable('shared_tracks',{
 hash:text('hash').primaryKey(),name:text('name').notNull(),bytes:text('bytes').notNull(),createdAt:integer('created_at').notNull(),
},table=>[index('shared_tracks_created').on(table.createdAt,table.hash)]);
