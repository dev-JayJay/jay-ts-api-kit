import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default('app_db'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  CORS_ORIGIN: z.string().optional(),
  COOKIE_SECRET: z.string().optional(),
  JWT_SECRET: z.string().default('change-me-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  API_CONTRACT_V2_ENABLED: z.string().optional(),
  RATE_LIMITING_ENABLED: z.string().optional(),
  REDIS_URL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let parsed: Env | null = null;

export const env: Env & { validate: () => Env } = new Proxy({} as Env & { validate: () => Env }, {
  get(_target, prop: string | symbol) {
    if (prop === 'validate') {
      return () => {
        const result = envSchema.safeParse(process.env);
        if (!result.success) {
          const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
          throw new Error(`Environment validation failed:\n${issues.join('\n')}`);
        }
        parsed = result.data;
        return parsed;
      };
    }
    if (!parsed) {
      const result = envSchema.safeParse(process.env);
      if (result.success) parsed = result.data;
      else return undefined;
    }
    return parsed?.[prop as keyof Env];
  },
}) as Env & { validate: () => Env };
