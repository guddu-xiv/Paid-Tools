export interface VnCodeCategoryItem {
  id: number;
  name: string;
  slug: string;
  count: number;
  link: string;
}

export interface VnCodeTemplateItem {
  id: number;
  title: string;
  slug: string;
  link: string;
  date: string;
  modified: string;
  year: string;
  isNew: boolean;
  categoryIds: number[];
  categoryNames: string[];
  tags: string[];
  thumbnailUrl: string;
  videoUrl: string;
  price: number;
  mrp: number;
  isFree: boolean;
  usedCountText: string;
  paid: boolean;
}

export interface VnCodeTemplateDetail extends VnCodeTemplateItem {
  sku: string;
  description: string;
  currency: string;
  publicQrUrl: string | null;
  publicMediaFiles: Array<{ id: number; url: string; mimeType: string; title: string }>;
  libraryDownloadUrl: string | null;
}

export interface VnCodeAuthUser {
  email: string;
  name?: string;
  cookieHeader: string;
  raw?: any;
}

export interface VnCodeLibraryItem {
  id?: number;
  template_id?: number;
  title?: string;
  slug?: string;
  link?: string;
  qr_url?: string;
  download_url?: string;
  file?: string;
  image?: string;
}

const PAID_KEY = 'vncodes_paid_active_v1';
const AUTH_KEY = 'vncodes_auth_user_v1';
const CACHE_KEY = 'vncodes_catalog_cache_v1';

export function isVnCodesPaidActive(): boolean {
  try {
    const val = localStorage.getItem(PAID_KEY);
    if (val === null) return true; // Direct PAID: TRUE enabled by default
    return val === 'true';
  } catch {
    return true;
  }
}

export function setVnCodesPaidActive(active: boolean): void {
  try {
    localStorage.setItem(PAID_KEY, active ? 'true' : 'false');
  } catch {
    // ignore storage quota errors
  }
}

export function getStoredVnCodesAuth(): VnCodeAuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VnCodeAuthUser;
    if (!parsed?.cookieHeader) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setStoredVnCodesAuth(auth: VnCodeAuthUser): void {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    // ignore
  }
}

export function clearStoredVnCodesAuth(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // ignore
  }
}

export function getCachedVnCodesCatalog(): {
  templates: VnCodeTemplateItem[];
  total: number;
  syncedAt: string;
} | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.templates)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedVnCodesCatalog(data: {
  templates: VnCodeTemplateItem[];
  total: number;
  syncedAt: string;
}): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage quota if 540+ items exceed 5MB
  }
}

export async function fetchVnCodeCategories(force = false): Promise<VnCodeCategoryItem[]> {
  const res = await fetch(`/api/vncodes/categories${force ? '?force=true' : ''}`);
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to fetch categories from vncodes.in');
  }
  return data.categories || [];
}

export async function fetchVnCodeTemplatesPage(params: {
  page?: number;
  perPage?: number;
  order?: 'desc' | 'asc';
  category?: number | null;
  search?: string;
}): Promise<{
  total: number;
  totalPages: number;
  page: number;
  templates: VnCodeTemplateItem[];
}> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.perPage) qs.set('perPage', String(params.perPage));
  if (params.order) qs.set('order', params.order);
  if (params.category) qs.set('category', String(params.category));
  if (params.search?.trim()) qs.set('search', params.search.trim());

  const res = await fetch(`/api/vncodes/templates?${qs.toString()}`);
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to fetch templates from vncodes.in');
  }
  return {
    total: data.total || 0,
    totalPages: data.totalPages || 1,
    page: data.page || 1,
    templates: data.templates || [],
  };
}

export async function syncAllVnCodes(force = false): Promise<{
  templates: VnCodeTemplateItem[];
  total: number;
  syncedAt: string;
  fromCache: boolean;
}> {
  const res = await fetch(`/api/vncodes/sync-all${force ? '?force=true' : ''}`);
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to sync all templates from vncodes.in');
  }
  const result = {
    templates: (data.templates || []) as VnCodeTemplateItem[],
    total: Number(data.total || 0),
    syncedAt: String(data.syncedAt || new Date().toISOString()),
    fromCache: Boolean(data.fromCache),
  };
  setCachedVnCodesCatalog({
    templates: result.templates,
    total: result.total,
    syncedAt: result.syncedAt,
  });
  return result;
}

export async function fetchVnCodeDetail(
  id: number,
  cookieHeader?: string
): Promise<VnCodeTemplateDetail> {
  const res = await fetch(`/api/vncodes/template-detail?id=${id}`, {
    headers: cookieHeader ? { 'x-vncodes-cookie': cookieHeader } : undefined,
  });
  const data = await res.json();
  if (!res.ok || !data?.ok || !data?.detail) {
    throw new Error(data?.error || `Failed to load details for template #${id}`);
  }
  return data.detail as VnCodeTemplateDetail;
}

export async function loginVnCodesWithPassword(
  email: string,
  password: string
): Promise<VnCodeAuthUser> {
  const res = await fetch('/api/vncodes/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'vncodes.in login failed');
  }
  const auth: VnCodeAuthUser = {
    email,
    name: data.user?.name || data.user?.display_name || email,
    cookieHeader: data.cookieHeader || '',
    raw: data.user,
  };
  setStoredVnCodesAuth(auth);
  return auth;
}

export async function requestVnCodesEmailOtp(email: string): Promise<string> {
  const res = await fetch('/api/vncodes/otp-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Failed to request OTP from vncodes.in');
  }
  return data.message || 'OTP sent to your email.';
}

export async function verifyVnCodesEmailOtp(
  email: string,
  code: string
): Promise<VnCodeAuthUser> {
  const res = await fetch('/api/vncodes/otp-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Invalid or expired OTP');
  }
  const auth: VnCodeAuthUser = {
    email,
    name: data.user?.name || data.user?.display_name || email,
    cookieHeader: data.cookieHeader || '',
    raw: data.user,
  };
  setStoredVnCodesAuth(auth);
  return auth;
}

export async function fetchVnCodesUserLibrary(cookieHeader: string): Promise<{
  items: VnCodeLibraryItem[];
  user?: any;
}> {
  const res = await fetch('/api/vncodes/library', {
    headers: { 'x-vncodes-cookie': cookieHeader },
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Could not load purchased library');
  }
  return {
    items: (data.items || []) as VnCodeLibraryItem[],
    user: data.user,
  };
}

export interface VnCodeOrderQrItem {
  id: number;
  title: string;
  slug: string;
  qrUrl: string;
  thumbnailUrl: string;
  orderKey: string;
  orderId: string;
}

export interface SavedEmailQrRecord {
  templateId: number;
  title: string;
  slug: string;
  qrUrl: string;
  sourceLabel: string;
  orderKey?: string;
  savedAt: string;
}

const EMAIL_QR_VAULT_KEY = 'vncodes_email_qr_vault_v1';

export function getSavedEmailQrVault(): SavedEmailQrRecord[] {
  try {
    const raw = localStorage.getItem(EMAIL_QR_VAULT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEmailQrRecords(records: SavedEmailQrRecord[]): SavedEmailQrRecord[] {
  const existing = getSavedEmailQrVault();
  const map = new Map<string, SavedEmailQrRecord>();

  for (const r of existing) {
    const key = r.templateId ? `id:${r.templateId}` : `url:${r.qrUrl}`;
    map.set(key, r);
  }
  for (const r of records) {
    const key = r.templateId ? `id:${r.templateId}` : `url:${r.qrUrl}`;
    map.set(key, r);
  }

  const merged = Array.from(map.values());
  try {
    localStorage.setItem(EMAIL_QR_VAULT_KEY, JSON.stringify(merged));
  } catch {
    // ignore storage quota
  }
  return merged;
}

export function removeSavedEmailQrRecord(templateId: number, qrUrl?: string): SavedEmailQrRecord[] {
  const filtered = getSavedEmailQrVault().filter((r) => {
    if (templateId && r.templateId === templateId) return false;
    if (qrUrl && r.qrUrl === qrUrl) return false;
    return true;
  });
  try {
    localStorage.setItem(EMAIL_QR_VAULT_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
  return filtered;
}

export function findSavedEmailQrForTemplate(
  vault: SavedEmailQrRecord[],
  template: { id: number; slug?: string; title?: string }
): SavedEmailQrRecord | undefined {
  return vault.find(
    (r) =>
      (template.id && r.templateId === template.id) ||
      (template.slug && r.slug && r.slug === template.slug)
  );
}

export async function lookupVnCodesOrder(
  orderKeyOrUrl: string,
  cookieHeader?: string
): Promise<{
  orderKey: string;
  orderId?: string;
  items: VnCodeOrderQrItem[];
}> {
  const res = await fetch('/api/vncodes/order-lookup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { 'x-vncodes-cookie': cookieHeader } : {}),
    },
    body: JSON.stringify({ orderKeyOrUrl }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Could not find order QR codes on vncodes.in');
  }
  return {
    orderKey: data.orderKey,
    orderId: data.orderId,
    items: (data.items || []) as VnCodeOrderQrItem[],
  };
}

export async function importVnCodesFromEmailContent(
  content: string,
  cookieHeader?: string
): Promise<{
  items: VnCodeOrderQrItem[];
  extractedUrls: string[];
  orderKeyFound: string | null;
}> {
  const res = await fetch('/api/vncodes/import-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { 'x-vncodes-cookie': cookieHeader } : {}),
    },
    body: JSON.stringify({ content }),
  });
  const data = await res.json();
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'No QR code or Order Key detected in email content');
  }
  return {
    items: (data.items || []) as VnCodeOrderQrItem[],
    extractedUrls: (data.extractedUrls || []) as string[],
    orderKeyFound: data.orderKeyFound || null,
  };
}

