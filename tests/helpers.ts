import { type Page } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface Credentials {
  email: string;
  password: string;
}

export function loadCredentials(): Credentials | null {
  const credsPath = resolve(__dirname, '..', 'creds.txt');
  if (!existsSync(credsPath)) return null;

  const content = readFileSync(credsPath, 'utf-8');
  const lines = content.split('\n');
  let email = '';
  let password = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('EMAIL=') && !email) {
      email = trimmed.slice(6).trim();
    } else if (trimmed.startsWith('PASSWORD=') && !password) {
      password = trimmed.slice(9).trim();
    }
  }

  if (!email || !password) return null;
  return { email, password };
}

export async function login(page: Page): Promise<boolean> {
  const creds = loadCredentials();
  if (!creds) return false;

  await page.goto('/login');
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 }).catch(() => {});
  return true;
}
