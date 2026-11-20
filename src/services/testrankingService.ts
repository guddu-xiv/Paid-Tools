/**
 * TestRanking (testranking.in / backend.opsolve.xyz) Service
 * Supports hybrid execution:
 * 1) Tries local Express proxy (/api/testranking/*) first.
 * 2) If backend.opsolve.xyz blocks Cloud datacenter egress IPs (429), automatically
 *    executes directly against https://backend.opsolve.xyz/api/v1 from the user's browser
 *    (Access-Control-Allow-Origin: * is enabled upstream).
 */

import { RbeConvertedAppxResult } from '../utils/rbeRevolutionConverter';
import {
  convertTestrankingQuestionsToCleanTxt,
  extractRawQuestionsFromPayload,
} from '../utils/testrankingConverter';

const DIRECT_API_BASE = 'https://backend.opsolve.xyz/api/v1';

export interface TestrankingCategoryItem {
  slug: string;
  name: string;
  shortName?: string;
  imageUrl?: string;
}

export interface TestrankingSeriesItem {
  id: string;
  slug: string;
  seoSlug?: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  logo: string;
  totalTestsText?: string;
  isPurchased?: boolean;
}

export interface TestrankingSectionItem {
  id: string;
  name: string;
  bucket?: 'all' | 'mock_full' | 'mock_sectional' | 'pyp_full' | 'pyp_sectional' | 'live';
  count?: number;
}

export interface TestrankingTestItem {
  id: string;
  slug: string;
  title: string;
  seriesSlug?: string;
  sectionBucket: 'mock_full' | 'mock_sectional' | 'pyp_full' | 'pyp_sectional' | 'live';
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

export interface TestrankingAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
}

export interface TestrankingFolderNode {
  id: string;
  name: string;
  testCount: number;
  tests: TestrankingTestItem[];
}

export interface TestrankingFolderPackage {
  id: string;
  url: string;
  type: 'series' | 'category' | 'test';
  title: string;
  slug: string;
  description: string;
  totalTests: number;
  folders: TestrankingFolderNode[];
}

const LOCAL_STORAGE_TESTRANKING_AUTH_KEY = 'testranking_user_auth_v1';

export function getStoredTestrankingAuth(): TestrankingAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TESTRANKING_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredTestrankingAuth(auth: TestrankingAuthUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TESTRANKING_AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save TestRanking auth to localStorage', err);
  }
}

export function clearStoredTestrankingAuth(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_TESTRANKING_AUTH_KEY);
  } catch {
    // ignore
  }
}

export class TestrankingBlockedError extends Error {
  blockedByUpstream = true;
  constructor(message: string) {
    super(message);
    this.name = 'TestrankingBlockedError';
  }
}

function isBlockedAuthError(err: unknown): boolean {
  if (err instanceof TestrankingBlockedError) return true;
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

export function parseTestrankingSessionInput(rawInput: string): TestrankingAuthUser | null {
  let trimmed = rawInput.trim();
  if (!trimmed) return null;

  // Strip accidental surrounding quotes from console copy
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
  let userObj: Record<string, any> | null = null;

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const rawTok =
        parsed?.token ||
        parsed?.quizapp_token ||
        parsed?.accessToken ||
        parsed?.data?.token ||
        '';
      if (typeof rawTok === 'string') {
        token = rawTok.trim().replace(/^Bearer\s+/i, '');
      }
      const rawUser = parsed?.user || parsed?.quizapp_user || parsed?.data?.user || parsed?.data;
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
      // fall through to raw token handling
    }
  }

  if (!token) {
    token = trimmed.replace(/^Bearer\s+/i, '').trim();
  }

  if (!token || /\s/.test(token)) return null;

  const claims = decodeJwtPayload(token);
  const userId = String(
    userObj?.id || userObj?.user_id || claims?.id || claims?.userId || claims?.sub || ''
  ).trim();
  const name = String(
    userObj?.name || userObj?.full_name || claims?.name || 'TestRanking Student (Token)'
  ).trim();
  const mobile = String(
    userObj?.phone || userObj?.phone_number || userObj?.mobile || claims?.phone || claims?.mobile || ''
  ).trim();
  const email = String(userObj?.email || claims?.email || '').trim();

  return {
    token,
    ...(userId ? { userId } : {}),
    name: name || 'TestRanking Student (Token)',
    mobile: mobile || email || 'verified-session',
    ...(email ? { email } : {}),
  };
}

function xhrOpsolveRequest(
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

async function directOpsolveFetch(
  endpointPath: string,
  options: { method?: 'GET' | 'POST'; body?: any; token?: string; params?: Record<string, string> } = {}
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
    // Retry via XMLHttpRequest before giving up
    try {
      const xhrRes = await xhrOpsolveRequest(url.toString(), method, headers, serializedBody);
      status = xhrRes.status;
      json = xhrRes.json;
    } catch {
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (/failed to fetch|networkerror|load failed/i.test(rawMsg)) {
        throw new TestrankingBlockedError(
          'TestRanking API (backend.opsolve.xyz) blocked or unreachable from this browser network.'
        );
      }
      throw new Error(rawMsg);
    }
  }

  if (status === 429 || (typeof json?.message === 'string' && /network has been blocked/i.test(json.message))) {
    throw new TestrankingBlockedError(
      json?.message || 'TestRanking API (backend.opsolve.xyz) rate-limited/blocked this IP (HTTP 429).'
    );
  }

  if (status < 200 || status >= 300 || !json || json?.status === 'error') {
    throw new Error(json?.message || `TestRanking API error (HTTP ${status})`);
  }
  return json;
}

/**
 * Send OTP via Phone Number or Email
 */
export async function sendTestrankingOtp(
  phoneOrEmail: string
): Promise<{ success: boolean; message: string; blocked?: boolean }> {
  const input = phoneOrEmail.trim();
  let serverBlocked = false;
  try {
    const res = await fetch('/api/testranking/send-otp', {
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
      ? { email: input.toLowerCase(), purpose: 'login' }
      : { phone_number: Number(input.replace(/\D/g, '').slice(-10)), purpose: 'login' };
    const json = await directOpsolveFetch('/auth/v2/request-otp', {
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
export async function verifyTestrankingOtp(
  phoneOrEmail: string,
  otp: string
): Promise<{ success: boolean; auth?: TestrankingAuthUser; error?: string; blocked?: boolean }> {
  const input = phoneOrEmail.trim();
  const otpClean = otp.trim();
  let serverBlocked = false;
  try {
    const res = await fetch('/api/testranking/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail: input, otp: otpClean }),
    });
    const data = await res.json();
    if (!data.blocked) {
      if (data.success && data.auth) {
        setStoredTestrankingAuth(data.auth);
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
      ? { email: input.toLowerCase(), otp: Number(otpClean), purpose: 'login' }
      : { phone_number: Number(input.replace(/\D/g, '').slice(-10)), otp: Number(otpClean), purpose: 'login' };
    const json = await directOpsolveFetch('/auth/v2/verify-otp-login', {
      method: 'POST',
      body: payload,
    });
    const d = json?.data || json || {};
    const token = d.token || json?.token || '';
    if (!token) throw new Error('No token returned');
    const auth: TestrankingAuthUser = {
      token,
      userId: String(d.id || d.user_id || input),
      name: d.name || 'TestRanking Student',
      mobile: d.phone ? String(d.phone) : input,
      email: d.email || (isEmail ? input : ''),
    };
    setStoredTestrankingAuth(auth);
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
export async function loginTestrankingWithPin(
  phoneOrEmail: string,
  pin: string
): Promise<{ success: boolean; auth?: TestrankingAuthUser; error?: string; blocked?: boolean }> {
  const input = phoneOrEmail.trim();
  const pinClean = pin.trim();
  let serverBlocked = false;
  try {
    const res = await fetch('/api/testranking/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail: input, pin: pinClean }),
    });
    const data = await res.json();
    if (!data.blocked) {
      if (data.success && data.auth) {
        setStoredTestrankingAuth(data.auth);
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
    const json = await directOpsolveFetch('/auth/v2/login-with-pin', {
      method: 'POST',
      body: payload,
    });
    const d = json?.data || json || {};
    const token = d.token || json?.token || '';
    if (!token) throw new Error('No token returned');
    const auth: TestrankingAuthUser = {
      token,
      userId: String(d.id || d.user_id || input),
      name: d.name || 'TestRanking Student',
      mobile: d.phone ? String(d.phone) : input,
      email: d.email || (isEmail ? input : ''),
    };
    setStoredTestrankingAuth(auth);
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
 * Fetch full TestRanking live catalog (all exam categories + all test series)
 */
export async function fetchTestrankingCatalog(
  auth?: TestrankingAuthUser | null
): Promise<{ categories: TestrankingCategoryItem[]; series: TestrankingSeriesItem[] }> {
  try {
    const res = await fetch('/api/testranking/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth?.token }),
    });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.series)) {
      return {
        categories: data.categories || [],
        series: data.series || [],
      };
    }
    if (!data?.blocked) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
  } catch {
    // Fallback to direct browser call
  }

  // Direct browser fetch against backend.opsolve.xyz/api/v1 (CORS *)
  const catJson = await directOpsolveFetch('/public/testseries-categories', { token: auth?.token });
  const rawCats = Array.isArray(catJson)
    ? catJson
    : Array.isArray(catJson?.categories)
    ? catJson.categories
    : Array.isArray(catJson?.data)
    ? catJson.data
    : [];

  const categories: TestrankingCategoryItem[] = rawCats
    .map((c: any) => ({
      slug: String(c.slug || ''),
      name: String(c.name || c.shortName || c.slug || ''),
      shortName: String(c.shortName || c.name || ''),
      imageUrl: String(c.imageUrl || c.iconUrl || c.logo || ''),
    }))
    .filter((c: TestrankingCategoryItem) => Boolean(c.slug));

  const seriesMap = new Map<string, TestrankingSeriesItem>();
  await Promise.all(
    categories.map(async (cat) => {
      try {
        const sJson = await directOpsolveFetch('/public/category-testseries', {
          token: auth?.token,
          params: { slug: cat.slug },
        });
        const items = Array.isArray(sJson)
          ? sJson
          : Array.isArray(sJson?.data)
          ? sJson.data
          : [];
        for (const item of items) {
          const slug = String(item.slug || item.id || '').trim();
          if (!slug || seriesMap.has(slug)) continue;
          seriesMap.set(slug, {
            id: String(item.id || slug),
            slug,
            title: String(item.title || item.name || slug),
            categorySlug: cat.slug,
            categoryName: cat.name,
            logo: String(item.imageUrl || item.banner || item.logo || cat.imageUrl || ''),
            totalTestsText: String(item.totalTests || item.total_tests || item.testCount || ''),
            isPurchased: Boolean(item.isPurchased || item.is_purchased),
          });
        }
      } catch {
        // skip single category failure
      }
    })
  );

  return {
    categories,
    series: Array.from(seriesMap.values()),
  };
}

function mapRawTestList(
  list: any[],
  bucket: TestrankingTestItem['sectionBucket'],
  sectionLabel: string,
  seriesSlug: string,
  seriesPurchased: boolean
): TestrankingTestItem[] {
  return (Array.isArray(list) ? list : []).map((t: any, idx: number) => {
    const slug = String(t.slug || t.id || `test-${idx}`);
    const isFree = Boolean(t.is_free);
    const hasCta = Array.isArray(t.ctas) && t.ctas.length > 0;
    const locked = Boolean(!isFree && !seriesPurchased && !hasCta && String(t.access || '').toLowerCase() === 'locked');
    return {
      id: String(t.id || slug),
      slug,
      title: String(t.name || t.title || slug),
      seriesSlug,
      sectionBucket: bucket,
      sectionLabel,
      categoryName: String(t.categoryName || '').trim() || undefined,
      time: t.time || '—',
      questions: t.noOfQuestions ?? t.questionsCount ?? '—',
      marks: t.marks ?? '—',
      isFree,
      flow: 'mocktest',
      locked,
      hasLiveData: Boolean(slug),
    };
  });
}

export function parseSeriesDetailPayload(raw: any, seriesSlug: string): {
  seriesTitle: string;
  isPurchased: boolean;
  sections: TestrankingSectionItem[];
  tests: TestrankingTestItem[];
} {
  const s = raw?.series || {};
  const seriesTitle = String(s.title || seriesSlug);
  const isPurchased = Boolean(s.is_purchased || s.isPurchased);

  const mockFull = mapRawTestList(
    raw?.mocktests?.fulltest?.data || [],
    'mock_full',
    'Mock Full Tests',
    seriesSlug,
    isPurchased
  );
  const mockSec = mapRawTestList(
    raw?.mocktests?.sectionaltest?.data || [],
    'mock_sectional',
    'Mock Sectional Tests',
    seriesSlug,
    isPurchased
  );
  const pypFull = mapRawTestList(
    raw?.previousyear?.fulltest?.data || [],
    'pyp_full',
    'PYP Full Tests',
    seriesSlug,
    isPurchased
  );
  const pypSec = mapRawTestList(
    raw?.previousyear?.sectionaltest?.data || [],
    'pyp_sectional',
    'PYP Sectional Tests',
    seriesSlug,
    isPurchased
  );

  const allTests = [...mockFull, ...mockSec, ...pypFull, ...pypSec];
  const sections: TestrankingSectionItem[] = [
    { id: 'all', name: `All Tests (${allTests.length})`, bucket: 'all', count: allTests.length },
  ];
  if (mockFull.length > 0) {
    sections.push({
      id: 'bucket:mock_full',
      name: `Mock Full (${mockFull.length})`,
      bucket: 'mock_full',
      count: mockFull.length,
    });
  }
  if (mockSec.length > 0) {
    sections.push({
      id: 'bucket:mock_sectional',
      name: `Mock Sectional (${mockSec.length})`,
      bucket: 'mock_sectional',
      count: mockSec.length,
    });
  }
  if (pypFull.length > 0) {
    sections.push({
      id: 'bucket:pyp_full',
      name: `PYP Full (${pypFull.length})`,
      bucket: 'pyp_full',
      count: pypFull.length,
    });
  }
  if (pypSec.length > 0) {
    sections.push({
      id: 'bucket:pyp_sectional',
      name: `PYP Sectional (${pypSec.length})`,
      bucket: 'pyp_sectional',
      count: pypSec.length,
    });
  }

  // Also add sub-category tags (e.g. Tier-I, Tier-II, Chapter-wise, etc.)
  const subCatCounts = new Map<string, number>();
  for (const t of allTests) {
    if (t.categoryName && !/^free$/i.test(t.categoryName)) {
      subCatCounts.set(t.categoryName, (subCatCounts.get(t.categoryName) || 0) + 1);
    }
  }
  for (const [catName, count] of subCatCounts.entries()) {
    if (subCatCounts.size > 1) {
      sections.push({
        id: `cat:${catName}`,
        name: `${catName} (${count})`,
        count,
      });
    }
  }

  return {
    seriesTitle,
    isPurchased,
    sections,
    tests: allTests,
  };
}

/**
 * Fetch series sections & all tests (Mock Full, Mock Sectional, PYP Full, PYP Sectional)
 */
export async function fetchTestrankingSeriesDetail(
  seriesSlug: string,
  auth?: TestrankingAuthUser | null,
  seoSlug?: string
): Promise<{
  seriesTitle: string;
  isPurchased: boolean;
  sections: TestrankingSectionItem[];
  tests: TestrankingTestItem[];
}> {
  try {
    const res = await fetch('/api/testranking/series-detail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: seriesSlug, seoSlug, token: auth?.token }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.detail) {
      return parseSeriesDetailPayload(data.detail, seriesSlug);
    }
    if (!data?.blocked) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
  } catch {
    // fallback direct
  }

  const json = await directOpsolveFetch('/public/testseries-detailed-content', {
    token: auth?.token,
    params: { slug: seriesSlug },
  });
  const raw = json?.data || json || {};
  return parseSeriesDetailPayload(raw, seriesSlug);
}

/**
 * Fetch Live Mocks & Quizzes
 */
export async function fetchTestrankingLiveTests(
  auth?: TestrankingAuthUser | null
): Promise<TestrankingTestItem[]> {
  let liveMocks: any[] = [];
  let liveQuizzes: any[] = [];

  let usedDirect = false;
  try {
    const res = await fetch('/api/testranking/live-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: auth?.token }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      liveMocks = data.liveMocks || [];
      liveQuizzes = data.liveQuizzes || [];
    } else {
      usedDirect = true;
    }
  } catch {
    usedDirect = true;
  }

  if (usedDirect) {
    const [mRes, qRes] = await Promise.allSettled([
      directOpsolveFetch(auth?.token ? '/live-mocktest' : '/public/live-mocktest', {
        token: auth?.token,
      }),
      directOpsolveFetch(auth?.token ? '/live-quiz' : '/public/live-quiz', {
        token: auth?.token,
      }),
    ]);
    const extract = (r: PromiseSettledResult<any>) => {
      if (r.status !== 'fulfilled') return [];
      const d = r.value;
      return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
    };
    liveMocks = extract(mRes);
    liveQuizzes = extract(qRes);
  }

  const mapItem = (t: any, flow: 'mocktest' | 'quiz'): TestrankingTestItem => ({
    id: String(t.id || t.slug),
    slug: String(t.slug || t.id),
    title: String(t.name || t.title || t.slug),
    sectionBucket: 'live',
    sectionLabel: flow === 'quiz' ? 'Live / Daily Quiz' : 'Live Mock Test',
    time: t.time || '—',
    questions: t.noOfQuestions ?? t.questionsCount ?? '—',
    marks: t.marks ?? '—',
    isFree: true,
    flow,
    locked: false,
    hasLiveData: Boolean(t.slug),
  });

  return [
    ...liveMocks.map((m) => mapItem(m, 'mocktest')),
    ...liveQuizzes.map((q) => mapItem(q, 'quiz')),
  ];
}

/**
 * Fetch questions & convert into Bilingual Clean .txt
 */
export async function fetchAndConvertTestrankingTest(
  test: TestrankingTestItem,
  seriesTitle = 'TestRanking (testranking.in)',
  subjectTitle = 'All Sections',
  auth?: TestrankingAuthUser | null
): Promise<RbeConvertedAppxResult> {
  try {
    const res = await fetch('/api/testranking/fetch-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: test.slug,
        title: test.title,
        seriesTitle,
        subjectTitle,
        flow: test.flow,
        token: auth?.token,
      }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.cleanTxt) {
      return {
        title: data.title,
        seriesTitle: data.seriesTitle,
        totalQuestions: data.totalQuestions,
        cleanTxt: data.cleanTxt,
        questions: data.questions || [],
        rawJson: data.rawJson || '',
      };
    }
    if (!data?.blocked) {
      throw new Error(data?.error || `HTTP ${res.status}`);
    }
  } catch (err: any) {
    if (err?.message && !/429|blocked|Upstream/i.test(err.message)) {
      throw err;
    }
  }

  // Direct browser execution fallback when server IP is blocked by upstream
  const isQuiz = test.flow === 'quiz';
  let resolvedSlug = test.slug;

  // If slug came from SSR UUID and we have seriesSlug, try resolving exact API slug first
  if (/^[0-9a-f-]{20,}$/i.test(resolvedSlug) && test.seriesSlug) {
    try {
      const detailJson = await directOpsolveFetch('/public/testseries-detailed-content', {
        token: auth?.token,
        params: { slug: test.seriesSlug },
      });
      const raw = detailJson?.data || detailJson || {};
      const pool = [
        ...(raw?.mocktests?.fulltest?.data || []),
        ...(raw?.mocktests?.sectionaltest?.data || []),
        ...(raw?.previousyear?.fulltest?.data || []),
        ...(raw?.previousyear?.sectionaltest?.data || []),
      ];
      const match = pool.find(
        (x: any) =>
          String(x.id || '') === test.id ||
          String(x.name || x.title || '').trim().toLowerCase() === test.title.trim().toLowerCase()
      );
      if (match?.slug) {
        resolvedSlug = String(match.slug);
      }
    } catch {
      // proceed with existing slug
    }
  }

  let resultPayload: any = null;
  let startPayload: any = null;

  if (auth?.token) {
    try {
      const cntJson = await directOpsolveFetch(
        isQuiz ? '/quiz-attempt-count' : '/mocktest-attempt-count',
        { token: auth.token, params: { slug: resolvedSlug } }
      );
      const attempts = Array.isArray(cntJson?.data?.attempts)
        ? cntJson.data.attempts
        : Array.isArray(cntJson?.attempts)
        ? cntJson.attempts
        : [];
      const inProg = cntJson?.data?.inProgressAttempt ?? cntJson?.inProgressAttempt;
      const submitted = attempts
        .map((a: any) => (typeof a === 'number' ? a : Number(a?.attempt)))
        .filter((n: number) => Number.isFinite(n) && n > 0 && n !== inProg);
      if (submitted.length > 0) {
        const bestAttempt = Math.max(...submitted);
        resultPayload = await directOpsolveFetch(
          isQuiz ? '/quiz-result' : '/mocktest-result',
          { token: auth.token, params: { slug: resolvedSlug, attempt: String(bestAttempt) } }
        );
      }
    } catch {
      // proceed to start
    }
  }

  if (!resultPayload) {
    startPayload = await directOpsolveFetch(
      isQuiz ? '/quiz-start' : '/mocktest-start',
      { token: auth?.token, params: { slug: resolvedSlug } }
    );
    const { attempt: liveAttempt } = extractRawQuestionsFromPayload(startPayload);
    if (auth?.token && liveAttempt && liveAttempt > 0) {
      try {
        await directOpsolveFetch(isQuiz ? '/quiz-submit' : '/submit-mocktest', {
          method: 'POST',
          token: auth.token,
          body: isQuiz
            ? { slug: resolvedSlug, attempt: liveAttempt, timeTaken: 1 }
            : { slug: resolvedSlug, attempt: liveAttempt, testSubmitted: true, timeTaken: 1 },
        });
        resultPayload = await directOpsolveFetch(
          isQuiz ? '/quiz-result' : '/mocktest-result',
          { token: auth.token, params: { slug: resolvedSlug, attempt: String(liveAttempt) } }
        );
      } catch {
        // fall back to startPayload questions
      }
    }
  }

  const activePayload = resultPayload || startPayload;
  const extracted = extractRawQuestionsFromPayload(activePayload);
  if (extracted.questions.length === 0) {
    throw new Error(`No live questions returned for "${test.title}".`);
  }

  return convertTestrankingQuestionsToCleanTxt(extracted.questions, {
    slug: test.slug,
    title: test.title || extracted.title || test.slug,
    seriesTitle,
    subjectTitle,
    sourceLabel: 'testranking.in (TestRanking)',
  });
}

/**
 * Direct lookup or URL resolution for TestRanking URLs & slugs
 */
export function parseTestrankingUrlOrSlug(rawInput: string): {
  kind: 'series' | 'category' | 'test';
  slug: string;
  flow: 'mocktest' | 'quiz';
} {
  const input = rawInput.trim();
  try {
    if (/^https?:\/\//i.test(input)) {
      const u = new URL(input);
      const qSlug = u.searchParams.get('slug');
      const path = u.pathname.toLowerCase();
      if (path.includes('daily-quiz')) {
        return { kind: 'test', slug: qSlug || input, flow: 'quiz' };
      }
      if (path.includes('mock-test')) {
        return { kind: 'test', slug: qSlug || input, flow: 'mocktest' };
      }
      if (path.includes('test-series/category')) {
        return { kind: 'category', slug: qSlug || 'ssc', flow: 'mocktest' };
      }
      if (path.includes('test-series')) {
        const seriesParam = u.searchParams.get('series');
        const seg = u.pathname.split('/').filter(Boolean).pop() || '';
        return { kind: 'series', slug: qSlug || seriesParam || seg, flow: 'mocktest' };
      }
      if (qSlug) {
        return { kind: 'series', slug: qSlug, flow: 'mocktest' };
      }
    }
  } catch {
    // plain slug
  }

  return { kind: 'series', slug: input, flow: 'mocktest' };
}

export async function resolveTestrankingUrls(
  urlsText: string,
  auth?: TestrankingAuthUser | null
): Promise<TestrankingFolderPackage[]> {
  const tokens = urlsText
    .split(/[\r\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const packages: TestrankingFolderPackage[] = [];
  for (const tok of tokens) {
    const parsed = parseTestrankingUrlOrSlug(tok);
    if (parsed.kind === 'series' && parsed.slug) {
      const detail = await fetchTestrankingSeriesDetail(parsed.slug, auth);
      const byBucket = new Map<string, TestrankingTestItem[]>();
      for (const t of detail.tests) {
        const arr = byBucket.get(t.sectionLabel) || [];
        arr.push(t);
        byBucket.set(t.sectionLabel, arr);
      }
      const folders: TestrankingFolderNode[] = Array.from(byBucket.entries()).map(
        ([name, list], i) => ({
          id: detail.sections.find((s) => s.name.startsWith(name.split(' ')[0]))?.id || `f-${i}`,
          name,
          testCount: list.length,
          tests: list,
        })
      );
      packages.push({
        id: parsed.slug,
        url: tok,
        type: 'series',
        title: detail.seriesTitle,
        slug: parsed.slug,
        description: `Live TestRanking Series (${detail.tests.length} Tests)`,
        totalTests: detail.tests.length,
        folders,
      });
    } else if (parsed.kind === 'test' && parsed.slug) {
      const singleTest: TestrankingTestItem = {
        id: parsed.slug,
        slug: parsed.slug,
        title: parsed.slug,
        sectionBucket: 'live',
        sectionLabel: parsed.flow === 'quiz' ? 'Live / Daily Quiz' : 'Direct Mock Test',
        time: '—',
        questions: '—',
        marks: '—',
        isFree: true,
        flow: parsed.flow,
        locked: false,
        hasLiveData: true,
      };
      packages.push({
        id: parsed.slug,
        url: tok,
        type: 'test',
        title: parsed.slug,
        slug: parsed.slug,
        description: `Direct TestRanking ${parsed.flow === 'quiz' ? 'Quiz' : 'Mock Test'}`,
        totalTests: 1,
        folders: [
          {
            id: 'all',
            name: singleTest.sectionLabel,
            testCount: 1,
            tests: [singleTest],
          },
        ],
      });
    }
  }
  return packages;
}
