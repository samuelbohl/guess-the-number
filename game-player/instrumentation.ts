import { ensureMigrationsApplied } from '@/lib/db/startup';

export async function register() {
  // Run DB migrations on server startup (not during build)
  await ensureMigrationsApplied();
}
