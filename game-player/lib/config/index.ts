import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  PGHOST: z.string().min(1, 'Database host is required'),
  PGPORT: z.coerce.number().int().positive().default(5432),
  PGDATABASE: z.string().min(1, 'Database name is required'),
  PGUSER: z.string().min(1, 'Database user is required'),
  PGPASSWORD: z.string().min(1, 'Database password is required'),
  PGSSLMODE: z.enum(['disable', 'require', 'prefer', 'verify-ca', 'verify-full']).default('disable'),
  GAME_HOST: z.string().min(1, 'Game host is required'),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  try {
    if (process.env.CI) {
      // skip validation in CI
      return {} as Config;
    }

    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });

      const errorMessage = `Configuration validation failed:\n\n${errorMessages.join('\n')}`;
      throw new Error(errorMessage);
    }

    throw error;
  }
}
export const config = loadConfig();

export function isDevelopment(): boolean {
  return config.NODE_ENV === 'development';
}

/**
 * Helper function to check if running in test mode
 */
export function isTest(): boolean {
  return config.NODE_ENV === 'test';
}

/**
 * Helper function to check if running in production mode
 */
export function isProduction(): boolean {
  return config.NODE_ENV === 'production';
}

export const databaseConfig = {
  host: config.PGHOST,
  port: config.PGPORT,
  database: config.PGDATABASE,
  user: config.PGUSER,
  password: config.PGPASSWORD,
  ssl: config.PGSSLMODE !== 'disable',
} as const;

export const gameHostConfig = {
  baseUrl: config.GAME_HOST,
  timeout: 10000, // 10 seconds
} as const;
