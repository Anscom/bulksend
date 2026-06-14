#!/usr/bin/env tsx
/**
 * Keep-alive pinger — run locally to prevent Render free services from spinning down.
 * Usage:  npx tsx infra/scripts/keep-alive.ts
 * Env:    API_URL     (default: https://bulksend-api.onrender.com)
 *         WORKER_URL  (default: https://bulksend-worker.onrender.com)
 *         INTERVAL_MS (default: 300000 = 5 minutes)
 */

const API_URL    = process.env['API_URL']     ?? 'https://bulksend-api.onrender.com';
const WORKER_URL = process.env['WORKER_URL']  ?? 'https://bulksend-worker.onrender.com';
const INTERVAL   = Number(process.env['INTERVAL_MS'] ?? 300_000);

const endpoints = [
  { name: 'API',    url: `${API_URL}/health` },
  { name: 'Worker', url: `${WORKER_URL}/` },
];

async function ping(name: string, url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    const ms  = Date.now() - start;
    const icon = res.ok ? '✓' : '✗';
    console.log(`${icon} [${new Date().toISOString()}] ${name} → ${res.status} (${ms}ms)`);
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`✗ [${new Date().toISOString()}] ${name} → ERROR (${ms}ms): ${(err as Error).message}`);
  }
}

async function pingAll() {
  await Promise.all(endpoints.map(({ name, url }) => ping(name, url)));
}

console.log(`Keep-alive pinging every ${INTERVAL / 1000}s`);
console.log(`  API:    ${API_URL}/health`);
console.log(`  Worker: ${WORKER_URL}/`);
console.log('');

pingAll();
setInterval(pingAll, INTERVAL);
