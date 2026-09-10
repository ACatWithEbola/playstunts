import type {OriginalPrimitiveQueueLayout} from './drain-primitive-queue.ts';
/** Driver-specific data locations and far raster targets in the supplied builds. */
export const DISPLAY_PRIMITIVE_QUEUES:Record<'cga'|'tandy'|'ega',OriginalPrimitiveQueueLayout>={
 cga:{count:0x8f18,used:0x64e4,flag:0x5b62,sentinel:0x5e8a,last:0x9024,links:0x5b6a,records:0x5e8c,colours:0xa224,patterns:0xa90e,masks:0xa982,baseColours:0xa5c8,circle:0x2531e,wheel:0x2a286,point:0x288ea},
 tandy:{count:0x8f58,used:0x6520,flag:0x5b9e,sentinel:0x5ec6,last:0x9064,links:0x5ba6,records:0x5ec8,colours:0xa264,patterns:0xa94e,masks:0xa9c2,baseColours:0xa608,circle:0x25210,wheel:0x298fe,point:0x282f8},
 ega:{count:0x8d94,used:0x636c,flag:0x59ea,sentinel:0x5d12,last:0x8ea0,links:0x59f2,records:0x5d14,colours:0xa0a0,patterns:0xa78a,masks:0xa7fe,baseColours:0xa444,circle:0x256e0,wheel:0x2d69e,point:0x2b272},
};
