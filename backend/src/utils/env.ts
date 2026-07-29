const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'CORS_ORIGIN',
] as const;

const OPTIONAL_ENV_VARS: Record<string, string> = {
  PORT: '3000',
  NODE_ENV: 'development',
  JWT_EXPIRES_IN: '604800',
  SENTRY_DSN: '',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: '',
  S3_BUCKET_NAME: '',
};

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\n` +
      'Create a .env file in the backend directory with these values.'
    );
  }

  for (const [key, defaultValue] of Object.entries(OPTIONAL_ENV_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  if (process.env.NODE_ENV === 'production' && !process.env.SENTRY_DSN) {
    console.warn('[WARN] SENTRY_DSN not set in production mode. Errors will not be tracked.');
  }
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}
