/**
 * The Pundits Official (thepunditsofficial.in / pundits.opsolve.xyz) Service
 * Hybrid execution:
 * 1) Calls local Express proxy (/api/the-pundits/*) first.
 * 2) When Cloud datacenter IPs are blocked upstream (HTTP 429 / WAF 403), automatically
 *    executes directly against https://pundits.opsolve.xyz/api/v1 from the browser.
 * 3) Zero fabricated/mock questions or fake fallback series.
 */

import {
  convertThePunditsToCleanTxt,
  extractPunditsRawQuestionsFromPayload,
  PunditsConvertedResult,
} from '../utils/thePunditsConverter';

const DIRECT_API_BASE = 'https://pundits.opsolve.xyz/api/v1';

export interface PunditsCategoryItem {
  slug: string;
  name: string;
  shortName?: string;
  imageUrl?: string;
}

export interface PunditsSeriesItem {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  logo: string;
  totalTestsText?: string;
  freeTestsText?: string;
  isPurchased?: boolean;
  itemType?: 'series' | 'batch';
}

export interface PunditsSectionItem {
  id: string;
  name: string;
  bucket?: 'all' | 'mock_full' | 'mock_sectional' | 'pyp_full' | 'pyp_sectional' | 'live' | 'batch';
  count?: number;
}

export interface PunditsTestItem {
  id: string;
  slug: string;
  title: string;
  seriesSlug?: string;
  sectionBucket: 'mock_full' | 'mock_sectional' | 'pyp_full' | 'pyp_sectional' | 'live' | 'batch';
  sectionLabel: string;
  categoryName?: string;
  time: string | number;
  questions: string | number;
  marks: string | number;
  isFree: boolean;
  flow: 'mocktest' | 'quiz';
  locked: boolean;
  hasLiveData: boolean;
}

export interface PunditsAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
}

export interface PunditsFolderNode {
  id: string;
  name: string;
  testCount: number;
  tests: PunditsTestItem[];
}

export interface PunditsFolderPackage {
  id: string;
  url: string;
  type: 'series' | 'category' | 'batch' | 'test';
  title: string;
  slug: string;
  description: string;
  totalTests: number;
  folders: PunditsFolderNode[];
}

const LOCAL_STORAGE_AUTH_KEY = 'the_pundits_user_auth_v2';
const LOCAL_STORAGE_SYNCED_CATALOG_KEY = 'the_pundits_synced_catalog_v1';

export function getStoredPunditsAuth(): PunditsAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredPunditsAuth(auth: PunditsAuthUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save The Pundits auth to localStorage', err);
  }
}

export function clearStoredPunditsAuth(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
  } catch {
    // ignore
  }
}

export function getSyncedPunditsCatalog(): {
  categories: PunditsCategoryItem[];
  series: PunditsSeriesItem[];
  seriesDetails: Record<string, { series?: any; tests: PunditsTestItem[] }>;
} | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SYNCED_CATALOG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.series)) return null;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories : [],
      series: parsed.series,
      seriesDetails: parsed.seriesDetails || {},
    };
  } catch {
    return null;
  }
}

export function clearSyncedPunditsCatalog(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SYNCED_CATALOG_KEY);
  } catch {
    // ignore
  }
}

export class PunditsBlockedError extends Error {
  blockedByUpstream = true;
  constructor(message: string) {
    super(message);
    this.name = 'PunditsBlockedError';
  }
}

function isBlockedAuthError(err: unknown): boolean {
  if (err instanceof PunditsBlockedError) return true;
  const msg = err instanceof Error ? err.message : String(err || '');
  return /blocked|unreachable|failed to fetch|networkerror|429/i.test(msg);
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function parsePunditsSessionInput(rawInput: string): PunditsAuthUser | null {
  let trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    try {
      const unquoted = JSON.parse(trimmed);
      if (typeof unquoted === 'string') trimmed = unquoted.trim();
    } catch {
      trimmed = trimmed.slice(1, -1).trim();
    }
  }

  let token = '';
  let userId = '';
  let userObj: Record<string, any> | null = null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawTok =
        parsed?.token ||
        parsed?.['pundits.token'] ||
        parsed?.quizapp_token ||
        parsed?.accessToken ||
        parsed?.data?.token ||
        '';
      if (typeof rawTok === 'string') {
        token = rawTok.trim().replace(/^Bearer\s+/i, '');
      }
      userId = String(parsed?.userId || parsed?.['pundits.userId'] || '').trim();
      const rawUser =
        parsed?.user || parsed?.['pundits.user'] || parsed?.data?.user || parsed?.data;
      if (rawUser && typeof rawUser === 'object') {
        userObj = rawUser;
      } else if (typeof rawUser === 'string' && rawUser.trim().startsWith('{')) {
        try {
          userObj = JSON.parse(rawUser);
        } catch {
          // ignore
        }
      }
    } catch {
      // fall through
    }
  }

  if (!token) {
    token = trimmed.replace(/^Bearer\s+/i, '').trim();
  }

  if (!token || /\s/.test(token)) return null;

  const claims = decodeJwtPayload(token);
  const resolvedUserId =
    userId ||
    String(
      userObj?.id || userObj?.user_id || claims?.id || claims?.userId || claims?.sub || ''
    ).trim();
  const name = String(
    userObj?.name || userObj?.full_name || claims?.name || 'The Pundits Student (Token)'
  ).trim();
  const mobile = String(
    userObj?.phone || userObj?.phone_number || userObj?.mobile || claims?.phone || claims?.mobile || ''
  ).trim();
  const email = String(userObj?.email || claims?.email || '').trim();

  return {
    token,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
    name: name || 'The Pundits Student (Token)',
    mobile: mobile || email || 'verified-session',
    ...(email ? { email } : {}),
  };
}

function xhrPunditsRequest(
  url: string,
  method: 'GET' | 'POST',
  headers: Record<string, string>,
  body?: string
): Promise<{ status: number; json: any }> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      for (const [k, v] of Object.entries(headers)) {
        xhr.setRequestHeader(k, v);
      }
      xhr.timeout = 15000;
      xhr.onload = () => {
        let json: any = null;
        try {
          json = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          json = null;
        }
        resolve({ status: xhr.status, json });
      };
      xhr.onerror = () => reject(new Error('XHR network error'));
      xhr.ontimeout = () => reject(new Error('XHR timeout'));
      xhr.send(body ?? null);
    } catch (err) {
      reject(err);
    }
  });
}

async function directPunditsFetch(
  endpointPath: string,
  options: {
    method?: 'GET' | 'POST';
    body?: any;
    token?: string;
    userId?: string;
    params?: Record<string, string>;
  } = {}
): Promise<any> {
  const url = new URL(`${DIRECT_API_BASE}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`);
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};
  if (options.token) {
    const clean = options.token.trim().replace(/^Bearer\s+/i, '');
    if (clean) headers['Authorization'] = `Bearer ${clean}`;
  }
  if (options.userId) {
    headers['userId'] = String(options.userId).trim();
  }
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const serializedBody = options.body !== undefined ? JSON.stringify(options.body) : undefined;

  let status = 0;
  let json: any = null;
  try {
    const resp = await fetch(url.toString(), {
      method,
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      body: serializedBody,
    });
    status = resp.status;
    json = await resp.json().catch(() => null);
  } catch (err: unknown) {
    try {
      const xhrRes = await xhrPunditsRequest(url.toString(), method, headers, serializedBody);
      status = xhrRes.status;
      json = xhrRes.json;
    } catch {
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (/failed to fetch|networkerror|load failed/i.test(rawMsg)) {
        throw new PunditsBlockedError(
          'The Pundits API (pundits.opsolve.xyz) blocked or unreachable from this browser network.'
        );
      }
      throw new Error(rawMsg);
    }
  }

  if (
    status === 429 ||
    (status === 403 && json === null) ||
    (typeof json?.message === 'string' && /network has been blocked|forbidden/i.test(json.message))
  ) {
    throw new PunditsBlockedError(
      json?.message || `The Pundits API (pundits.opsolve.xyz) blocked this network (HTTP ${status}).`
    );
  }

  if (status < 200 || status >= 300 || !json || json?.status === 'error') {
    throw new Error(json?.message || `The Pundits API error (HTTP ${status})`);
  }
  return json;
}

function mapClientRawTest(
  raw: any,
  bucket: PunditsTestItem['sectionBucket'],
  defaultFlow: 'mocktest' | 'quiz',
  seriesSlug?: string
): PunditsTestItem {
  const isFree = Boolean(raw?.is_free ?? raw?.isFree);
  const hasLockedFlag = typeof raw?.is_locked === 'boolean' ? raw.is_locked : false;
  return {
    id: String(raw?.id || raw?.slug || raw?.test_id || ''),
    slug: String(raw?.slug || raw?.id || ''),
    title: String(raw?.name || raw?.title || 'Untitled Test').trim(),
    seriesSlug: seriesSlug || undefined,
    sectionBucket: bucket,
    sectionLabel:
      bucket === 'mock_full'
        ? 'Mock Full'
        : bucket === 'mock_sectional'
        ? 'Mock Sectional'
        : bucket === 'pyp_full'
        ? 'PYP Full'
        : bucket === 'pyp_sectional'
        ? 'PYP Sectional'
        : bucket === 'batch'
        ? 'Daily Practice'
        : 'Live Mock / Quiz',
    categoryName: raw?.categoryName || raw?.category || '',
    time: raw?.time || raw?.duration || '-',
    questions: raw?.noOfQuestions || raw?.questions || raw?.totalQuestions || '-',
    marks: raw?.marks || raw?.totalMarks || '-',
    isFree,
    flow: raw?.type === 'quiz' ? 'quiz' : defaultFlow,
    locked: hasLockedFlag && !isFree,
    hasLiveData: Boolean(raw?.slug || raw?.id),
  };
}

function mapDetailPayloadToTests(d: any, cleanSlug: string): PunditsTestItem[] {
  const tests: PunditsTestItem[] = [];
  const seen = new Set<string>();
  const pushUnique = (item: PunditsTestItem) => {
    const key = `${item.sectionBucket}:${item.id || item.slug}`;
    if (!seen.has(key)) {
      seen.add(key);
      tests.push(item);
    }
  };

  const mockFull: any[] = Array.isArray(d?.mocktests?.fulltest?.data) ? d.mocktests.fulltest.data : [];
  const mockSec: any[] = Array.isArray(d?.mocktests?.sectionaltest?.data)
    ? d.mocktests.sectionaltest.data
    : [];
  const pypFull: any[] = Array.isArray(d?.previousyear?.fulltest?.data)
    ? d.previousyear.fulltest.data
    : [];
  const pypSec: any[] = Array.isArray(d?.previousyear?.sectionaltest?.data)
    ? d.previousyear.sectionaltest.data
    : [];

  if (mockSec.length > 0) {
    mockFull.forEach((t) => pushUnique(mapClientRawTest(t, 'mock_full', 'mocktest', cleanSlug)));
    mockSec.forEach((t) => pushUnique(mapClientRawTest(t, 'mock_sectional', 'quiz', cleanSlug)));
  } else {
    mockFull.forEach((t) => {
      const isSec = /sectional/i.test(String(t?.categoryName || ''));
      pushUnique(mapClientRawTest(t, isSec ? 'mock_sectional' : 'mock_full', 'mocktest', cleanSlug));
    });
  }

  if (pypSec.length > 0) {
    pypFull.forEach((t) => pushUnique(mapClientRawTest(t, 'pyp_full', 'mocktest', cleanSlug)));
    pypSec.forEach((t) => pushUnique(mapClientRawTest(t, 'pyp_sectional', 'quiz', cleanSlug)));
  } else {
    pypFull.forEach((t) => {
      const isSec = /sectional/i.test(String(t?.categoryName || ''));
      pushUnique(mapClientRawTest(t, isSec ? 'pyp_sectional' : 'pyp_full', 'mocktest', cleanSlug));
    });
  }

  return tests;
}

/**
 * Import & persist real synced catalog JSON copied from thepunditsofficial.in
 */
export function saveSyncedPunditsCatalogJson(rawJsonText: string): {
  categories: PunditsCategoryItem[];
  series: PunditsSeriesItem[];
  seriesDetails: Record<string, { series?: any; tests: PunditsTestItem[] }>;
} {
  const parsed = JSON.parse(rawJsonText.trim());
  const rawCats: any[] = Array.isArray(parsed?.categories) ? parsed.categories : [];
  const categories: PunditsCategoryItem[] = rawCats.map((c) => ({
    slug: String(c.slug || ''),
    name: String(c.name || c.shortName || c.slug || ''),
    shortName: String(c.shortName || c.name || ''),
    imageUrl: String(c.imageUrl || ''),
  }));

  const rawSeries: any[] = Array.isArray(parsed?.series) ? parsed.series : [];
  const series: PunditsSeriesItem[] = rawSeries.map((s) => ({
    id: String(s.id || s.slug || ''),
    slug: String(s.slug || ''),
    title: String(s.title || s.name || s.slug || '').trim(),
    categorySlug: String(s.categorySlug || 'promocks'),
    categoryName: String(s.categoryName || 'ProMocks'),
    logo: String(s.logo || s.imageUrl || ''),
    totalTestsText: String(s.totalTestsText || s.noOfTotalTests || ''),
    freeTestsText: String(s.freeTestsText || s.noOfFreeTests || ''),
    isPurchased: Boolean(s.isPurchased),
    itemType: s.itemType === 'batch' ? 'batch' : 'series',
  }));

  const seriesDetails: Record<string, { series?: any; tests: PunditsTestItem[] }> = {};
  if (parsed?.detailsBySlug && typeof parsed.detailsBySlug === 'object') {
    for (const [slug, detailData] of Object.entries<any>(parsed.detailsBySlug)) {
      if (detailData) {
        const tests = Array.isArray(detailData.tests)
          ? detailData.tests
          : mapDetailPayloadToTests(detailData, slug);
        seriesDetails[slug] = {
          series: detailData.series || { slug, title: detailData.series?.title || slug },
          tests,
        };
      }
    }
  }

  if (series.length === 0 && Object.keys(seriesDetails).length === 0) {
    throw new Error('Valid JSON, but no The Pundits series or test listings found.');
  }

  const bundle = { categories, series, seriesDetails };
  localStorage.setItem(LOCAL_STORAGE_SYNCED_CATALOG_KEY, JSON.stringify(bundle));
  return bundle;
}

/**
 * Send OTP
 */
export async function sendPunditsOtp(
  phoneOrEmail: string
): Promise<{ success: boolean; message: string; blocked?: boolean }> {
  const input = phoneOrEmail.trim();
  let serverBlocked = false;
  try {
    const res = await fetch('/api/the-pundits/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail: input }),
    });
    const data = await res.json();
    if (!data.blocked) {
      return {
        success: Boolean(data.success),
        message: data.message || data.error || (data.success ? 'OTP sent!' : 'Failed to send OTP'),
      };
    }
    serverBlocked = true;
  } catch {
    // fallback direct
  }

  try {
    const isEmail = input.includes('@');
    const payload = isEmail
      ? { email: input.toLowerCase(), purpose: 'login_otp' }
      : { phone_number: Number(input.replace(/\D/g, '').slice(-10)), purpose: 'login_otp' };
    const json = await directPunditsFetch('/auth/v2/request-otp', {
      method: 'POST',
      body: payload,
    });
    return { success: true, message: json?.message || 'OTP sent successfully!' };
  } catch (err: unknown) {
    return {
      success: false,
      blocked: serverBlocked || isBlockedAuthError(err),
      message: err instanceof Error ? err.message : 'Failed to send OTP',
    };
  }
}

/**
 * Verify OTP
 */
export async function verifyPunditsOtp(
  phoneOrEmail: string,
  otp: string
): Promise<{ success: boolean; auth?: PunditsAuthUser; error?: string; blocked?: boolean }> {
  const input = phoneOrEmail.trim();
  const otpClean = otp.trim();
  let serverBlocked = false;
  try {
    const res = await fetch('/api/the-pundits/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail: input, otp: otpClean }),
    });
    const data = await res.json();
    if (!data.blocked) {
      if (data.success && data.auth) {
        setStoredPunditsAuth(data.auth);
        return { success: true, auth: data.auth };
      }
      return { success: false, error: data.error || 'Invalid OTP' };
    }
    serverBlocked = true;
  } catch {
    // fallback direct
  }

  try {
    const isEmail = input.includes('@');
    const payload = isEmail
      ? { email: input.toLowerCase(), otp: Number(otpClean), purpose: 'login_otp' }
      : { phone_number: Number(input.replace(/\D/g, '').slice(-10)), otp: Number(otpClean), purpose: 'login_otp' };
    const json = await directPunditsFetch('/auth/v2/verify-otp-login', {
      method: 'POST',
      body: payload,
    });
    const d = json?.data || json || {};
    const token = d.token || json?.token || '';
    const userObj = d.user || d;
    if (!token) throw new Error('No token returned');
    const auth: PunditsAuthUser = {
      token,
      userId: String(d.userId || userObj.id || d.id || input),
      name: userObj.name || 'The Pundits Student',
      mobile: userObj.phone ? String(userObj.phone) : !isEmail ? input : '',
      email: userObj.email || (isEmail ? input : ''),
    };
    setStoredPunditsAuth(auth);
    return { success: true, auth };
  } catch (err: unknown) {
    return {
      success: false,
      blocked: serverBlocked || isBlockedAuthError(err),
      error: err instanceof Error ? err.message : 'Invalid OTP',
    };
  }
}

/**
 * Login with PIN / Password
 */
export async function loginPunditsWithPin(
  phoneOrEmail: string,
  pin: string
): Promise<{ success: boolean; auth?: PunditsAuthUser; error?: string; blocked?: boolean }> {
  const input = phoneOrEmail.trim();
  const pinClean = pin.trim();
  let serverBlocked = false;
  try {
    const res = await fetch('/api/the-pundits/login-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail: input, pin: pinClean }),
    });
    const data = await res.json();
    if (!data.blocked) {
      if (data.success && data.auth) {
        setStoredPunditsAuth(data.auth);
        return { success: true, auth: data.auth };
      }
      return { success: false, error: data.error || 'Login failed' };
    }
    serverBlocked = true;
  } catch {
    // fallback direct
  }

  try {
    const isEmail = input.includes('@');
    const payload = isEmail
      ? { email: input.toLowerCase(), pin: pinClean }
      : { phone_number: Number(input.replace(/\D/g, '').slice(-10)), pin: pinClean };
    const json = await directPunditsFetch('/auth/v2/login-with-pin', {
      method: 'POST',
      body: payload,
    });
    const d = json?.data || json || {};
    const token = d.token || json?.token || '';
    const userObj = d.user || d;
    if (!token) throw new Error('No token returned');
    const auth: PunditsAuthUser = {
      token,
      userId: String(d.userId || userObj.id || d.id || input),
      name: userObj.name || 'The Pundits Student',
      mobile: userObj.phone ? String(userObj.phone) : !isEmail ? input : '',
      email: userObj.email || (isEmail ? input : ''),
    };
    setStoredPunditsAuth(auth);
    return { success: true, auth };
  } catch (err: unknown) {
    return {
      success: false,
      blocked: serverBlocked || isBlockedAuthError(err),
      error: err instanceof Error ? err.message : 'Login failed',
    };
  }
}

/**
 * Fetch Full Live Catalog (Categories + Series + Practice Batches)
 */
export async function fetchPunditsCatalog(
  auth?: PunditsAuthUser | null
): Promise<{ categories: PunditsCategoryItem[]; series: PunditsSeriesItem[] }> {
  let serverBlocked = false;
  try {
    const res = await fetch('/api/the-pundits/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth?.token, userId: auth?.userId }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.series)) {
      return {
        categories: data.categories || [],
        series: data.series || [],
      };
    }
    if (data.blocked) serverBlocked = true;
  } catch {
    // fall through
  }

  try {
    const authPrefix = auth?.token ? '' : '/public';
    const catJson = await directPunditsFetch(`${authPrefix}/testseries-categories`, {
      token: auth?.token,
      userId: auth?.userId,
    });
    const rawCats: any[] = Array.isArray(catJson?.data?.categories) ? catJson.data.categories : [];
    const categories: PunditsCategoryItem[] = rawCats.map((c) => ({
      slug: String(c.slug || ''),
      name: String(c.name || c.shortName || c.slug || ''),
      shortName: String(c.shortName || c.name || ''),
      imageUrl: String(c.imageUrl || ''),
    }));

    const seriesMap = new Map<string, PunditsSeriesItem>();
    await Promise.all(
      categories.map(async (cat) => {
        if (!cat.slug) return;
        try {
          const sr = await directPunditsFetch(`${authPrefix}/category-testseries`, {
            token: auth?.token,
            userId: auth?.userId,
            params: { slug: cat.slug },
          });
          if (Array.isArray(sr?.data)) {
            for (const item of sr.data) {
              const slug = String(item?.slug || '').trim();
              if (!slug || seriesMap.has(slug)) continue;
              seriesMap.set(slug, {
                id: String(item.id || slug),
                slug,
                title: String(item.name || item.title || slug).trim(),
                categorySlug: cat.slug,
                categoryName: cat.shortName || cat.name,
                logo: String(item.imageUrl || ''),
                totalTestsText: String(item.noOfTotalTests || item.noOfFreeTests || ''),
                freeTestsText: String(item.noOfFreeTests || ''),
                isPurchased: Boolean(item.isPurchased),
                itemType: 'series',
              });
            }
          }
        } catch {
          // ignore individual category error
        }
      })
    );

    try {
      const batchJson = await directPunditsFetch(`${authPrefix}/testseries-batches`, {
        token: auth?.token,
        userId: auth?.userId,
      });
      if (Array.isArray(batchJson?.data) && batchJson.data.length > 0) {
        if (!categories.some((c) => c.slug === 'daily-practice-batches')) {
          categories.push({
            slug: 'daily-practice-batches',
            name: 'Daily Practice Schedule',
            shortName: 'Practice Batches',
            imageUrl: '',
          });
        }
        for (const b of batchJson.data) {
          const slug = String(b?.slug || b?.id || '').trim();
          if (!slug || seriesMap.has(slug)) continue;
          seriesMap.set(slug, {
            id: String(b.id || slug),
            slug,
            title: String(b.name || b.title || slug).trim(),
            categorySlug: 'daily-practice-batches',
            categoryName: 'Practice Batch',
            logo: String(b.imageUrl || b.thumbnail || ''),
            totalTestsText: b.noOfTotalTests ? String(b.noOfTotalTests) : 'Practice Batch',
            isPurchased: Boolean(b.isPurchased),
            itemType: 'batch',
          });
        }
      }
    } catch {
      // batches endpoint optional
    }

    return { categories, series: Array.from(seriesMap.values()) };
  } catch (err: unknown) {
    const synced = getSyncedPunditsCatalog();
    if (synced && (synced.series.length > 0 || synced.categories.length > 0)) {
      return { categories: synced.categories, series: synced.series };
    }
    if (serverBlocked || isBlockedAuthError(err)) {
      throw new PunditsBlockedError(
        'The Pundits API (pundits.opsolve.xyz) blocked or unreachable from this browser network.'
      );
    }
    throw err;
  }
}

/**
 * Fetch Series Detailed Content (Mock Full, Mock Sectional, PYP Full, PYP Sectional, or Batch)
 */
export async function fetchPunditsSeriesDetail(
  slug: string,
  auth?: PunditsAuthUser | null,
  itemType?: 'series' | 'batch'
): Promise<{
  series: { id: string; slug: string; title: string; description: string; isPurchased: boolean };
  sections: PunditsSectionItem[];
  tests: PunditsTestItem[];
}> {
  const cleanSlug = slug.trim();
  const buildResult = (seriesMeta: any, tests: PunditsTestItem[]) => {
    const sections: PunditsSectionItem[] = [{ id: 'all', name: 'All Tests', bucket: 'all', count: tests.length }];
    const countMap = new Map<string, number>();
    for (const t of tests) {
      countMap.set(t.sectionBucket, (countMap.get(t.sectionBucket) || 0) + 1);
    }
    if (countMap.get('mock_full')) {
      sections.push({ id: 'bucket:mock_full', name: 'Mock Full', bucket: 'mock_full', count: countMap.get('mock_full') });
    }
    if (countMap.get('mock_sectional')) {
      sections.push({
        id: 'bucket:mock_sectional',
        name: 'Mock Sectional',
        bucket: 'mock_sectional',
        count: countMap.get('mock_sectional'),
      });
    }
    if (countMap.get('pyp_full')) {
      sections.push({ id: 'bucket:pyp_full', name: 'PYP Full', bucket: 'pyp_full', count: countMap.get('pyp_full') });
    }
    if (countMap.get('pyp_sectional')) {
      sections.push({
        id: 'bucket:pyp_sectional',
        name: 'PYP Sectional',
        bucket: 'pyp_sectional',
        count: countMap.get('pyp_sectional'),
      });
    }
    if (countMap.get('batch')) {
      sections.push({ id: 'bucket:batch', name: 'Daily Practice', bucket: 'batch', count: countMap.get('batch') });
    }
    return {
      series: {
        id: String(seriesMeta?.id || cleanSlug),
        slug: String(seriesMeta?.slug || cleanSlug),
        title: String(seriesMeta?.title || cleanSlug),
        description: String(seriesMeta?.description || ''),
        isPurchased: Boolean(seriesMeta?.isPurchased),
      },
      sections,
      tests,
    };
  };

  let serverBlocked = false;
  try {
    const res = await fetch('/api/the-pundits/series-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: cleanSlug, token: auth?.token, userId: auth?.userId, itemType }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.tests)) {
      return buildResult(data.series, data.tests);
    }
    if (data.blocked) serverBlocked = true;
  } catch {
    // fall through
  }

  try {
    const authPrefix = auth?.token ? '' : '/public';
    if (itemType === 'batch') {
      const json = await directPunditsFetch(`${authPrefix}/testseries-batch-profile-page`, {
        token: auth?.token,
        userId: auth?.userId,
        params: { slug: cleanSlug },
      });
      const rawData = json?.data || {};
      const rawSchedules = Array.isArray(rawData?.contents)
        ? rawData.contents
        : Array.isArray(rawData?.tests)
        ? rawData.tests
        : Array.isArray(rawData?.quizzes)
        ? rawData.quizzes
        : [];
      const tests = rawSchedules
        .filter((t: any) => t && (t.slug || t.id))
        .map((t: any) => mapClientRawTest(t, 'batch', t.type === 'mocktest' ? 'mocktest' : 'quiz', cleanSlug));
      return buildResult(
        {
          id: rawData?.id || cleanSlug,
          slug: cleanSlug,
          title: rawData?.title || rawData?.name || cleanSlug,
          description: rawData?.description || '',
          isPurchased: rawData?.isPurchased ?? rawData?.is_purchased,
        },
        tests
      );
    }

    const json = await directPunditsFetch(`${authPrefix}/testseries-detailed-content`, {
      token: auth?.token,
      userId: auth?.userId,
      params: { slug: cleanSlug },
    });
    const d = json?.data || {};
    const tests = mapDetailPayloadToTests(d, cleanSlug);
    return buildResult(
      {
        id: d?.series?.id || cleanSlug,
        slug: d?.series?.slug || cleanSlug,
        title: d?.series?.title || d?.series?.name || cleanSlug,
        description: d?.series?.description || '',
        isPurchased: d?.series?.is_purchased ?? d?.series?.isPurchased,
      },
      tests
    );
  } catch (err: unknown) {
    const synced = getSyncedPunditsCatalog();
    if (synced?.seriesDetails?.[cleanSlug]) {
      const cached = synced.seriesDetails[cleanSlug];
      return buildResult(cached.series || { slug: cleanSlug, title: cleanSlug }, cached.tests || []);
    }
    if (serverBlocked || isBlockedAuthError(err)) {
      throw new PunditsBlockedError(
        'The Pundits API (pundits.opsolve.xyz) blocked or unreachable from this browser network.'
      );
    }
    throw err;
  }
}

/**
 * Fetch Live Mocks & Quizzes
 */
export async function fetchPunditsLiveTests(
  auth?: PunditsAuthUser | null
): Promise<PunditsTestItem[]> {
  let serverBlocked = false;
  try {
    const res = await fetch('/api/the-pundits/live-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth?.token, userId: auth?.userId }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.tests)) {
      return data.tests;
    }
    if (data.blocked) serverBlocked = true;
  } catch {
    // fall through
  }

  try {
    const authPrefix = auth?.token ? '' : '/public';
    const [mockJson, quizJson] = await Promise.all([
      directPunditsFetch(`${authPrefix}/live-mocktest`, { token: auth?.token, userId: auth?.userId }).catch(() => null),
      directPunditsFetch(`${authPrefix}/live-quiz`, { token: auth?.token, userId: auth?.userId }).catch(() => null),
    ]);
    const tests: PunditsTestItem[] = [];
    const pushList = (arr: any[], flow: 'mocktest' | 'quiz', label: string) => {
      if (!Array.isArray(arr)) return;
      for (const item of arr) {
        tests.push({ ...mapClientRawTest(item, 'live', flow), sectionLabel: label });
      }
    };
    pushList(mockJson?.data?.live, 'mocktest', 'LIVE NOW • Mock');
    pushList(mockJson?.data?.upcoming, 'mocktest', 'UPCOMING • Mock');
    pushList(mockJson?.data?.attempted, 'mocktest', 'ATTEMPTED • Mock');
    pushList(quizJson?.data?.live, 'quiz', 'LIVE NOW • Quiz');
    pushList(quizJson?.data?.upcoming, 'quiz', 'UPCOMING • Quiz');
    pushList(quizJson?.data?.attempted, 'quiz', 'ATTEMPTED • Quiz');
    return tests;
  } catch (err: unknown) {
    if (serverBlocked || isBlockedAuthError(err)) {
      throw new PunditsBlockedError(
        'The Pundits API (pundits.opsolve.xyz) blocked or unreachable from this browser network.'
      );
    }
    throw err;
  }
}

/**
 * Fetch and Convert Real Test Questions into Clean Bilingual .txt
 */
export async function fetchAndConvertPunditsTest(
  test: PunditsTestItem,
  seriesTitle: string,
  sectionLabel: string,
  auth?: PunditsAuthUser | null
): Promise<PunditsConvertedResult> {
  const cleanSlug = test.slug || test.id;
  let serverBlocked = false;

  try {
    const res = await fetch('/api/the-pundits/fetch-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: cleanSlug,
        flow: test.flow,
        token: auth?.token,
        userId: auth?.userId,
        title: test.title,
        seriesTitle,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.converted) {
      return data.converted as PunditsConvertedResult;
    }
    if (data.blocked) {
      serverBlocked = true;
    } else if (!res.ok) {
      throw new Error(data.error || 'Failed to load test questions');
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      !/blocked|failed to fetch|network/i.test(err.message) &&
      !serverBlocked
    ) {
      throw err;
    }
  }

  try {
    let payload: any = null;
    if (test.flow === 'quiz') {
      if (auth?.token) {
        try {
          const rRes = await directPunditsFetch('/quiz-result', {
            token: auth.token,
            userId: auth.userId,
            params: { slug: cleanSlug },
          });
          if (extractPunditsRawQuestionsFromPayload(rRes).questions.length > 0) {
            payload = rRes;
          }
        } catch {
          // try start flow
        }
      }
      if (!payload) {
        const rStart = await directPunditsFetch('/quiz-start', {
          token: auth?.token,
          userId: auth?.userId,
          params: { slug: cleanSlug },
        });
        const attempt = rStart?.data?.attempt;
        if (auth?.token && attempt) {
          try {
            await directPunditsFetch('/quiz-submit', {
              method: 'POST',
              token: auth.token,
              userId: auth.userId,
              body: { slug: cleanSlug, attempt, testSubmitted: true, timeTaken: 1 },
            });
            const rRes = await directPunditsFetch('/quiz-result', {
              token: auth.token,
              userId: auth.userId,
              params: { slug: cleanSlug, attempt: String(attempt) },
            });
            if (extractPunditsRawQuestionsFromPayload(rRes).questions.length > 0) {
              payload = rRes;
            }
          } catch {
            // fallback to start payload
          }
        }
        if (!payload) payload = rStart;
      }
    } else {
      const rStart = await directPunditsFetch('/mocktest-start', {
        token: auth?.token,
        userId: auth?.userId,
        params: { slug: cleanSlug },
      });
      const startExt = extractPunditsRawQuestionsFromPayload(rStart);
      const hasAnswers = startExt.questions.some(
        (q: any) =>
          (Array.isArray(q.correctOptionIndices) && q.correctOptionIndices.length > 0) ||
          (Array.isArray(q.correctIndices) && q.correctIndices.length > 0) ||
          q.correct !== undefined
      );
      const attempt = rStart?.data?.attempt;
      if (!hasAnswers && auth?.token && attempt) {
        try {
          await directPunditsFetch('/submit-mocktest', {
            method: 'POST',
            token: auth.token,
            userId: auth.userId,
            body: { slug: cleanSlug, attempt, testSubmitted: true, timeTaken: 1 },
          });
          const rRes = await directPunditsFetch('/mocktest-result', {
            token: auth.token,
            userId: auth.userId,
            params: { slug: cleanSlug, attempt: String(attempt) },
          });
          if (extractPunditsRawQuestionsFromPayload(rRes).questions.length > 0) {
            payload = rRes;
          }
        } catch {
          // fallback
        }
      }
      if (!payload) payload = rStart;
    }

    const extracted = extractPunditsRawQuestionsFromPayload(payload);
    if (extracted.questions.length === 0) {
      throw new Error('No questions returned. Login or active Test Pass may be required.');
    }

    return convertThePunditsToCleanTxt(extracted.questions, {
      id: test.id,
      title: test.title || extracted.title || 'The Pundits Mock Test',
      seriesTitle: seriesTitle || 'The Pundits Official (thepunditsofficial.in)',
      categoryName: sectionLabel,
      durationMinutes: test.time || extracted.durationMinutes,
      marks: test.marks,
    });
  } catch (err: unknown) {
    if (serverBlocked || isBlockedAuthError(err)) {
      throw new PunditsBlockedError(
        'The Pundits API (pundits.opsolve.xyz) blocked or unreachable from this browser network.'
      );
    }
    throw err;
  }
}

/**
 * Parse any The Pundits URL, ?slug=, ?batch=, or raw slug
 */
export function parsePunditsUrlOrSlug(rawInput: string): {
  kind: 'series' | 'category' | 'batch' | 'test';
  slug: string;
} | null {
  const input = rawInput.trim();
  if (!input) return null;

  try {
    if (/^https?:\/\//i.test(input)) {
      const u = new URL(input);
      const slugParam = u.searchParams.get('slug');
      const batchParam = u.searchParams.get('batch');
      if (batchParam) {
        return { kind: 'batch', slug: batchParam.trim() };
      }
      if (u.pathname.includes('/category') && slugParam) {
        return { kind: 'category', slug: slugParam.trim() };
      }
      if ((u.pathname.includes('/mock-test') || u.pathname.includes('/test')) && slugParam) {
        return { kind: 'test', slug: slugParam.trim() };
      }
      if (slugParam) {
        return { kind: 'series', slug: slugParam.trim() };
      }
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1] || '';
      if (last && last !== 'test-series' && last !== 'live-test' && last !== 'practice-batch') {
        return { kind: u.pathname.includes('practice-batch') ? 'batch' : 'series', slug: last };
      }
    }
  } catch {
    // ignore URL parse error
  }

  return { kind: 'series', slug: input.replace(/^\/+|\/+$/g, '') };
}

/**
 * Unified URL Resolver -> Interactive Folder Tree Packages
 */
export async function resolvePunditsUrls(
  rawUrlsInput: string,
  auth?: PunditsAuthUser | null
): Promise<PunditsFolderPackage[]> {
  const lines = rawUrlsInput
    .split(/[\n,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const packages: PunditsFolderPackage[] = [];
  let catalogCache: { categories: PunditsCategoryItem[]; series: PunditsSeriesItem[] } | null = null;

  for (const line of lines) {
    const parsed = parsePunditsUrlOrSlug(line);
    if (!parsed) continue;

    if (parsed.kind === 'category') {
      if (!catalogCache) catalogCache = await fetchPunditsCatalog(auth);
      const matching = catalogCache.series.filter((s) => s.categorySlug === parsed.slug);
      const targets = matching.slice(0, 6);
      const folders: PunditsFolderNode[] = [];
      for (const s of targets) {
        try {
          const detail = await fetchPunditsSeriesDetail(s.slug, auth, s.itemType);
          folders.push({
            id: s.slug,
            name: detail.series.title || s.title,
            testCount: detail.tests.length,
            tests: detail.tests,
          });
        } catch {
          // skip
        }
      }
      packages.push({
        id: `cat-${parsed.slug}`,
        url: line,
        type: 'category',
        title: `Category: ${parsed.slug}`,
        slug: parsed.slug,
        description: `${matching.length} series available`,
        totalTests: folders.reduce((acc, f) => acc + f.testCount, 0),
        folders,
      });
    } else if (parsed.kind === 'test') {
      const item: PunditsTestItem = {
        id: parsed.slug,
        slug: parsed.slug,
        title: parsed.slug,
        sectionBucket: 'mock_full',
        sectionLabel: 'Direct Test',
        time: '-',
        questions: '-',
        marks: '-',
        isFree: true,
        flow: 'mocktest',
        locked: false,
        hasLiveData: true,
      };
      packages.push({
        id: `test-${parsed.slug}`,
        url: line,
        type: 'test',
        title: `Direct Test: ${parsed.slug}`,
        slug: parsed.slug,
        description: 'Ready to convert to Clean .txt',
        totalTests: 1,
        folders: [{ id: 'direct', name: 'Direct Test', testCount: 1, tests: [item] }],
      });
    } else {
      const detail = await fetchPunditsSeriesDetail(
        parsed.slug,
        auth,
        parsed.kind === 'batch' ? 'batch' : 'series'
      );
      const grouped = new Map<string, PunditsTestItem[]>();
      for (const t of detail.tests) {
        const key = t.sectionLabel || 'Tests';
        const list = grouped.get(key) || [];
        list.push(t);
        grouped.set(key, list);
      }
      const folders: PunditsFolderNode[] = Array.from(grouped.entries()).map(([name, tests]) => ({
        id: `${parsed.slug}-${name}`,
        name,
        testCount: tests.length,
        tests,
      }));
      packages.push({
        id: `series-${parsed.slug}`,
        url: line,
        type: parsed.kind === 'batch' ? 'batch' : 'series',
        title: detail.series.title || parsed.slug,
        slug: detail.series.slug || parsed.slug,
        description: detail.series.description || '',
        totalTests: detail.tests.length,
        folders,
      });
    }
  }

  return packages;
}
