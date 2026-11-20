/**
 * RWA - Rojgar with Ankit (rojgarwithankit.co.in) Service
 * Direct integration with https://rozgarapinew.teachx.in/ via local server proxy.
 * Provides complete authentication (OTP, Password, Token), live Test Series catalog,
 * Subject/Folder browsing (including Combo packs), URL folder-tree resolution,
 * and Bilingual Clean .txt extraction.
 */

import {
  convertRbeAppxToCleanTxt,
  RbeConvertedAppxResult,
} from '../utils/rbeRevolutionConverter';

export interface RwaSeriesItem {
  id: string;
  title: string;
  slug: string;
  exam: string;
  examname: string;
  logo: string;
  price: number;
  offer_price: number;
  description: string;
  totaltesttitle?: string | number;
  freetest?: string | number;
  paidtest?: string | number;
  paid: boolean;
}

export interface RwaSubjectItem {
  id: string;
  name: string;
  logo?: string;
  is_paid: boolean;
}

export interface RwaTestItem {
  id: string;
  title: string;
  test_series_id: string;
  time: string | number;
  questions: string | number;
  marks: string | number;
  test_questions_url: string;
  test_questions_url_2?: string;
  free_flag: string | number;
  is_completed?: boolean;
  is_test_attempted?: boolean;
  test_languages?: string[];
  paid: boolean;
  unlocked: boolean;
  hasQuestionsUrl?: boolean;
}

export interface RwaAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
}

export interface RwaFolderNode {
  id: string;
  name: string;
  testCount: number;
  tests: RwaTestItem[];
}

export interface RwaFolderPackage {
  id: string;
  url: string;
  type: 'series' | 'course' | 'test';
  title: string;
  slug: string;
  description: string;
  totalTests: number;
  paid: boolean;
  folders: RwaFolderNode[];
}

const LOCAL_STORAGE_RWA_AUTH_KEY = 'rwa_user_auth_v1';

export function getStoredRwaAuth(): RwaAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RWA_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredRwaAuth(auth: RwaAuthUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_RWA_AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save RWA auth to localStorage', err);
  }
}

export function clearStoredRwaAuth(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_RWA_AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Send Mobile OTP via rojgarwithankit.co.in AppX gateway
 */
export async function sendRwaOtp(phone: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/rwa/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'OTP sent successfully!' : 'Failed to send OTP'),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error sending OTP';
    return { success: false, message };
  }
}

/**
 * Verify Mobile OTP and get session token
 */
export async function verifyRwaOtp(
  phoneOrEmail: string,
  otp: string
): Promise<{ success: boolean; auth?: RwaAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/rwa/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail, otp }),
    });
    const data = await res.json();
    if (data.success && data.auth) {
      setStoredRwaAuth(data.auth);
      return { success: true, auth: data.auth };
    }
    return { success: false, error: data.error || 'Invalid OTP. Please try again.' };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error verifying OTP',
    };
  }
}

/**
 * Login via Mobile / Email & Password
 */
export async function loginRwaWithPassword(
  emailOrPhone: string,
  password: string
): Promise<{ success: boolean; auth?: RwaAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/rwa/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password }),
    });
    const data = await res.json();
    if (data.success && data.auth) {
      setStoredRwaAuth(data.auth);
      return { success: true, auth: data.auth };
    }
    return { success: false, error: data.error || 'Login failed. Please check credentials.' };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error logging in',
    };
  }
}

/**
 * Fetch all available test series from RWA (100% Live)
 */
export async function fetchAllRwaSeries(
  auth?: RwaAuthUser | null
): Promise<RwaSeriesItem[]> {
  const res = await fetch('/api/rwa/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: auth?.token,
      userId: auth?.userId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.series)) {
    throw new Error(data.error || `Failed to fetch RWA series (HTTP ${res.status})`);
  }
  return data.series;
}

/**
 * Fetch subjects/folders for a selected RWA Series (100% Live)
 */
export async function fetchRwaSubjects(
  seriesId: string,
  auth?: RwaAuthUser | null
): Promise<RwaSubjectItem[]> {
  const res = await fetch('/api/rwa/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesId,
      token: auth?.token,
      userId: auth?.userId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.subjects)) {
    throw new Error(data.error || `Failed to fetch RWA subjects (HTTP ${res.status})`);
  }
  return data.subjects;
}

/**
 * Fetch test titles for a Series + Subject (100% Live)
 */
export async function fetchRwaTests(
  seriesId: string,
  subjectId: string,
  search = '',
  auth?: RwaAuthUser | null
): Promise<RwaTestItem[]> {
  const res = await fetch('/api/rwa/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesId,
      subjectId,
      search,
      token: auth?.token,
      userId: auth?.userId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.tests)) {
    throw new Error(data.error || `Failed to fetch RWA tests (HTTP ${res.status})`);
  }
  return data.tests;
}

/**
 * Fetch questions JSON for a test and convert into clean .txt (100% Live)
 */
export async function fetchAndConvertRwaTest(
  test: RwaTestItem,
  seriesTitle = 'RWA (rojgarwithankit.co.in)',
  subjectTitle = 'All Sections',
  auth?: RwaAuthUser | null
): Promise<RbeConvertedAppxResult> {
  const res = await fetch('/api/rwa/fetch-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: test.id,
      testTitle: test.title,
      seriesTitle,
      subjectTitle,
      url1: test.test_questions_url,
      url2: test.test_questions_url_2,
      token: auth?.token,
      userId: auth?.userId,
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

  // Fallback direct client fetch ONLY if real CDN URLs exist and server proxy hit a transient error
  if (test.test_questions_url || test.test_questions_url_2) {
    let qEnList: any[] = [];
    let qHiList: any[] = [];

    if (test.test_questions_url) {
      const r1 = await fetch(test.test_questions_url);
      if (r1.ok) {
        const d1 = await r1.json();
        qEnList = Array.isArray(d1) ? d1 : Object.values(d1 || {});
      }
    }
    if (test.test_questions_url_2) {
      const r2 = await fetch(test.test_questions_url_2);
      if (r2.ok) {
        const d2 = await r2.json();
        qHiList = Array.isArray(d2) ? d2 : Object.values(d2 || {});
      }
    }

    if (qEnList.length > 0 || qHiList.length > 0) {
      const primary = qEnList.length > 0 ? qEnList : qHiList;
      const secondary = qEnList.length > 0 ? qHiList : [];
      return convertRbeAppxToCleanTxt(primary, secondary, {
        id: test.id,
        title: test.title,
        seriesTitle,
        subjectTitle,
        totalQuestions: primary.length,
        isPaid: true,
        sourceLabel: 'rojgarwithankit.co.in (RWA)',
      });
    }
  }

  throw new Error(
    data?.error ||
      `No live questions payload found on rojgarwithankit.co.in for "${test.title}". This test may be upcoming or not yet uploaded.`
  );
}

/**
 * Direct Unlock any RWA test by URL (e.g. https://rojgarwithankit.co.in/test-series/803/test/47954) or test ID
 */
export async function unlockRwaDirectTest(
  testUrlOrId: string,
  seriesTitle = 'RWA (rojgarwithankit.co.in)',
  seriesId?: string,
  auth?: RwaAuthUser | null
): Promise<RbeConvertedAppxResult> {
  const res = await fetch('/api/rwa/direct-unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testUrlOrId,
      seriesId,
      seriesTitle,
      token: auth?.token,
      userId: auth?.userId,
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
  throw new Error(data.error || 'Failed to resolve live test by URL/ID');
}

/**
 * Universal RWA URL Resolver & Batch Folder Generator (100% Live)
 * Accepts single or multiple rojgarwithankit.co.in URLs (series, courses, or direct tests)
 * and resolves real folders & tests directly from rojgarwithankit.co.in.
 */
export async function resolveRwaUrls(
  urls: string[] | string,
  auth?: RwaAuthUser | null
): Promise<RwaFolderPackage[]> {
  const res = await fetch('/api/rwa/resolve-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls,
      token: auth?.token,
      userId: auth?.userId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.packages)) {
    throw new Error(data.error || `Failed to resolve RWA URLs (HTTP ${res.status})`);
  }
  return data.packages;
}
