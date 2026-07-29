import { execSync } from 'child_process';

const url = process.env.DATABASE_URL || '';
// Transform pooler URL to direct connection
// Pooler: postgresql://postgres.REF:PASS@aws-0-us-east-2.pooler.supabase.com:6543/postgres
// Direct: postgresql://postgres.REF:PASS@db.REF.supabase.co:5432/postgres
const match = url.match(/postgresql:\/\/postgres\.([^:]+):([^@]+)@([^:]+):\d+\/(.+)/);
if (match) {
  const [, ref, pass, , db] = match;
  const directUrl = `postgresql://postgres:${pass}@db.${ref}.supabase.co:5432/${db}`;
  process.env.DATABASE_URL = directUrl;
  console.log('[MIGRATE] Using direct connection for schema push');
} else {
  console.log('[MIGRATE] Using DATABASE_URL as-is (not a pooler URL?)');
}

try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
  console.log('[MIGRATE] Schema push complete');
} catch (e: any) {
  console.error('[MIGRATE] Schema push failed (non-fatal):', e?.message || e);
}
