export const STORAGE_KEY = 'blockedCompanies';
export const ENABLED_STORAGE_KEY = 'filterEnabled';

export function normalizeCompanyName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeCompanyList(values: string[]): string[] {
  const seen = new Set<string>();
  const cleaned: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const normalized = normalizeCompanyName(trimmed);

    if (!trimmed || !normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    cleaned.push(trimmed);
  }

  return cleaned;
}

export function parseCompanyList(value: string): string[] {
  return sanitizeCompanyList(value.split(/[\n,;]+/));
}

export async function loadBlockedCompanies(): Promise<string[]> {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);
  const companies = stored[STORAGE_KEY];

  if (!Array.isArray(companies)) {
    return [];
  }

  return sanitizeCompanyList(companies.filter((value): value is string => typeof value === 'string'));
}

export async function saveBlockedCompanies(companies: string[]): Promise<void> {
  await chrome.storage.sync.set({
    [STORAGE_KEY]: sanitizeCompanyList(companies),
  });
}

export async function loadFilterEnabled(): Promise<boolean> {
  const stored = await chrome.storage.sync.get(ENABLED_STORAGE_KEY);
  const enabled = stored[ENABLED_STORAGE_KEY];

  if (typeof enabled !== 'boolean') {
    return true;
  }

  return enabled;
}

export async function saveFilterEnabled(enabled: boolean): Promise<void> {
  await chrome.storage.sync.set({
    [ENABLED_STORAGE_KEY]: enabled,
  });
}
