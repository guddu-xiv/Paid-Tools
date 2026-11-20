/**
 * Vidyagram (vidyagram.online) Service
 * Direct integration with https://armathsapi.akamai.net.in/ via local server proxy.
 * Provides complete authentication (OTP, Password, Token), live Test Series catalog,
 * Subject/Folder browsing, URL folder-tree resolution, and Bilingual Clean .txt extraction.
 */

import {
  convertRbeAppxToCleanTxt,
  RbeConvertedAppxResult,
} from '../utils/rbeRevolutionConverter';

export interface VidyagramSeriesItem {
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

export interface VidyagramSubjectItem {
  id: string;
  name: string;
  logo?: string;
  is_paid: boolean;
}

export interface VidyagramTestItem {
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

export interface VidyagramAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
}

export interface VidyagramFolderNode {
  id: string;
  name: string;
  testCount: number;
  tests: VidyagramTestItem[];
}

export interface VidyagramFolderPackage {
  id: string;
  url: string;
  type: 'series' | 'course' | 'test';
  title: string;
  slug: string;
  description: string;
  totalTests: number;
  paid: boolean;
  folders: VidyagramFolderNode[];
}

const LOCAL_STORAGE_VIDYAGRAM_AUTH_KEY = 'vidyagram_user_auth_v1';

export function getStoredVidyagramAuth(): VidyagramAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_VIDYAGRAM_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredVidyagramAuth(auth: VidyagramAuthUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_VIDYAGRAM_AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save Vidyagram auth to localStorage', err);
  }
}

export function clearStoredVidyagramAuth(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_VIDYAGRAM_AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Send Mobile OTP via vidyagram.online AppX gateway
 */
export async function sendVidyagramOtp(phone: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/vidyagram/send-otp', {
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
export async function verifyVidyagramOtp(
  phoneOrEmail: string,
  otp: string
): Promise<{ success: boolean; auth?: VidyagramAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/vidyagram/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneOrEmail, otp }),
    });
    const data = await res.json();
    if (data.success && data.auth) {
      setStoredVidyagramAuth(data.auth);
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
export async function loginVidyagramWithPassword(
  emailOrPhone: string,
  password: string
): Promise<{ success: boolean; auth?: VidyagramAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/vidyagram/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password }),
    });
    const data = await res.json();
    if (data.success && data.auth) {
      setStoredVidyagramAuth(data.auth);
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
 * Fetch all available test series from Vidyagram (100% Live)
 */
export async function fetchAllVidyagramSeries(
  auth?: VidyagramAuthUser | null
): Promise<VidyagramSeriesItem[]> {
  const res = await fetch('/api/vidyagram/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: auth?.token,
      userId: auth?.userId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.series)) {
    throw new Error(data.error || `Failed to fetch Vidyagram series (HTTP ${res.status})`);
  }
  return data.series;
}

/**
 * Fetch subjects/folders for a selected Vidyagram Series (100% Live)
 */
export async function fetchVidyagramSubjects(
  seriesId: string,
  auth?: VidyagramAuthUser | null
): Promise<VidyagramSubjectItem[]> {
  const res = await fetch('/api/vidyagram/subjects', {
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
    throw new Error(data.error || `Failed to fetch Vidyagram subjects (HTTP ${res.status})`);
  }
  return data.subjects;
}

/**
 * Fetch test titles for a Series + Subject (100% Live)
 */
export async function fetchVidyagramTests(
  seriesId: string,
  subjectId: string,
  search = '',
  auth?: VidyagramAuthUser | null
): Promise<VidyagramTestItem[]> {
  const res = await fetch('/api/vidyagram/tests', {
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
    throw new Error(data.error || `Failed to fetch Vidyagram tests (HTTP ${res.status})`);
  }
  return data.tests;
}

/**
 * Fetch questions JSON for a test and convert into clean .txt (100% Live)
 */
export async function fetchAndConvertVidyagramTest(
  test: VidyagramTestItem,
  seriesTitle = 'Vidyagram (vidyagram.online)',
  subjectTitle = 'All Sections',
  auth?: VidyagramAuthUser | null
): Promise<RbeConvertedAppxResult> {
  const res = await fetch('/api/vidyagram/fetch-questions', {
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
        sourceLabel: 'vidyagram.online (Vidyagram)',
      });
    }
  }

  throw new Error(
    data?.error ||
      `No live questions payload found on vidyagram.online for "${test.title}". This test may be upcoming or not yet uploaded.`
  );
}

/**
 * Direct Unlock any Vidyagram test by URL (e.g. https://vidyagram.online/test-series/82/test/6560) or test ID
 */
export async function unlockVidyagramDirectTest(
  testUrlOrId: string,
  seriesTitle = 'Vidyagram (vidyagram.online)',
  seriesId?: string,
  auth?: VidyagramAuthUser | null
): Promise<RbeConvertedAppxResult> {
  const res = await fetch('/api/vidyagram/direct-unlock', {
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
 * Universal Vidyagram URL Resolver & Batch Folder Generator (100% Live)
 * Accepts single or multiple vidyagram.online URLs (series, courses, or direct tests)
 * and resolves real folders & tests directly from vidyagram.online.
 */
export async function resolveVidyagramUrls(
  urls: string[] | string,
  auth?: VidyagramAuthUser | null
): Promise<VidyagramFolderPackage[]> {
  const res = await fetch('/api/vidyagram/resolve-urls', {
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
    throw new Error(data.error || `Failed to resolve Vidyagram URLs (HTTP ${res.status})`);
  }
  return data.packages;
}
