// Key-naming functions — all Redis keys go through these to stay consistent.
// Format: namespace:workspaceId[:subkey]

const pad2 = (n: number) => String(n).padStart(2, '0');

function hourSuffix(date = new Date()): string {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}`;
}

/** Hourly billing-cap rate-limit counter  rl:wsId:YYYYMMDDHH */
export const rlKey = (workspaceId: string, date?: Date) =>
  `rl:${workspaceId}:${hourSuffix(date)}`;

/** Per-minute token-bucket (worker)  tb:wsId */
export const tbKey = (workspaceId: string) => `tb:${workspaceId}`;

/** Unsubscribe / suppression set  supp:wsId */
export const suppKey = (workspaceId: string) => `supp:${workspaceId}`;

/** Suppression loaded flag  supp:wsId:loaded */
export const suppLoadedKey = (workspaceId: string) => `${suppKey(workspaceId)}:loaded`;

/** Campaign progress hash  campaign:campaignId:stats */
export const campaignStatsKey = (campaignId: string) => `campaign:${campaignId}:stats`;

/** Campaign remaining counter  campaign:campaignId:remaining */
export const campaignRemainingKey = (campaignId: string) => `campaign:${campaignId}:remaining`;

/** Session hash  sess:sessionId */
export const sessKey = (sessionId: string) => `sess:${sessionId}`;

/** User session index  user:userId:sessions */
export const userSessionsKey = (userId: string) => `user:${userId}:sessions`;

/** JWT blocklist  auth:bl:jti */
export const jwtBlocklistKey = (jti: string) => `auth:bl:${jti}`;
