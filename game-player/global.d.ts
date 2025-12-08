declare module 'drizzle-kit';

declare global {
  var __playerDbPool: import('pg').Pool | undefined;
  var __playerDb: ReturnType<typeof import('drizzle-orm/node-postgres').drizzle> | undefined;
  var __playerDbMigrationsApplied: boolean | undefined;
}

export {};
