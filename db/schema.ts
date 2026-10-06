import {integer,sqliteTable,text,index} from 'drizzle-orm/sqlite-core';
export const globalScores=sqliteTable('global_scores',{
 id:text('id').primaryKey(),rules:text('rules').notNull(),trackHash:text('track_hash').notNull(),carCode:text('car_code').notNull(),
 ticks:integer('ticks').notNull(),record:text('record').notNull(),createdAt:integer('created_at').notNull(),driverKey:text('driver_key').notNull().default(''),routeAssessment:text('route_assessment').notNull().default('not_assessed'),
},table=>[index('global_scores_track_time').on(table.rules,table.trackHash,table.ticks,table.createdAt,table.id),index('global_scores_driver_car').on(table.rules,table.trackHash,table.carCode,table.driverKey,table.ticks)]);
export const scoreRequests=sqliteTable('score_requests',{
 bucket:text('bucket').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull(),
});
export const scoreTracks=sqliteTable('score_tracks',{
 hash:text('hash').primaryKey(),name:text('name').notNull(),
});
export const sharedReplays=sqliteTable('shared_replays',{
 id:text('id').primaryKey(),replay:text('replay').notNull(),trackName:text('track_name').notNull(),createdAt:integer('created_at').notNull(),
});
export const sharedTracks=sqliteTable('shared_tracks',{
 hash:text('hash').primaryKey(),name:text('name').notNull(),bytes:text('bytes').notNull(),createdAt:integer('created_at').notNull(),
},table=>[index('shared_tracks_created').on(table.createdAt,table.hash)]);
