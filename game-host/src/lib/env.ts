import { z, type ZodIssue } from 'zod';

const envSchema = z.object({
  PGHOST: z.string(),
  PGUSER: z.string(),
  PGPORT: z.string().regex(/^\d+$/),
  PGDATABASE: z.string(),
  PGPASSWORD: z.string().optional(),
  PGSSLMODE: z.string().optional(),
  AZURE_ISSUER: z.string(),
  AZURE_AUDIENCE: z.string(),
  AZURE_TENANT_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const messages = parsed.error.errors.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`);
    throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
  }
  return parsed.data;
}
