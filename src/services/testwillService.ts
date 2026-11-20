/**
 * Testwill (testwill.in) Service
 * Direct integration with https://www.testwill.in/api/* via local server proxy.
 * Provides live SSC & Railways test series catalog, section filtering, test listing,
 * URL folder-tree resolution, OTP / Bearer Token login, and Bilingual Clean .txt extraction.
 */

import { RbeConvertedAppxResult } from '../utils/rbeRevolutionConverter';

export type TestwillCategoryTag = 'mock' | 'pyp' | 'sectional' | 'topic';

export interface TestwillSeriesItem {
  id: string;
  title: string;
  slug: string;
  subUrl?: string;
  exam: string;
  examname: string;
  logo: string;
  price: number;
  offer_price: number;
  description: string;
  totaltesttitle?: string | number;
  freetest?: string | number;
  paidtest?: string | number;
  mockCount?: number;
  pypCount?: number;
  sectionalCount?: number;
  topicCount?: number;
  paid: boolean;
}

export interface TestwillSubjectItem {
  id: string;
  name: string;
  logo?: string;
  is_paid: boolean;
  tags?: TestwillCategoryTag[];
  groupLabel?: string;
  count?: number;
}

export interface TestwillTestItem {
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
  utSrNo?: string | null;
  testLevel?: string;
  testType?: string;
  testSourceType?: string;
  sectionLabel?: string;
  bucket?: string;
  englishPdfUrl?: string;
  hindiPdfUrl?: string;
  paid: boolean;
  unlocked: boolean;
  hasQuestionsUrl?: boolean;
}

export interface TestwillAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  deviceId?: string;
}

export interface TestwillFolderNode {
  id: string;
  name: string;
  testCount: number;
  tests: TestwillTestItem[];
}

export interface TestwillFolderPackage {
  id: string;
  url: string;
  type: 'series' | 'course' | 'test';
  title: string;
  slug: string;
  description: string;
  totalTests: number;
  paid: boolean;
  folders: TestwillFolderNode[];
}

const LOCAL_STORAGE_TESTWILL_AUTH_KEY = 'testwill_user_auth_v1';

export function getStoredTestwillAuth(): TestwillAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TESTWILL_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredTestwillAuth(auth: TestwillAuthUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TESTWILL_AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save Testwill auth to localStorage', err);
  }
}

export function clearStoredTestwillAuth(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_TESTWILL_AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Send Mobile OTP via testwill.in/api/Account/GenerateOtp
 */
export async function sendTestwillOtp(phone: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/testwill/send-otp', {
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
 * Verify Mobile OTP via testwill.in/api/Account/VerifyOtp
 */
export async function verifyTestwillOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; auth?: TestwillAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/testwill/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (data.success && data.auth) {
      setStoredTestwillAuth(data.auth);
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
 * Verify a pasted Bearer session token against testwill.in/api/Account/GetUserProfile
 */
export async function verifyTestwillToken(
  token: string
): Promise<{ success: boolean; auth?: TestwillAuthUser; error?: string }> {
  try {
    const res = await fetch('/api/testwill/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (data.success && data.auth) {
      setStoredTestwillAuth(data.auth);
      return { success: true, auth: data.auth };
    }
    return { success: false, error: data.error || 'Failed to verify token.' };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error verifying token',
    };
  }
}

/**
 * Fetch all available test series from Testwill (100% Live)
 */
export async function fetchAllTestwillSeries(
  auth?: TestwillAuthUser | null
): Promise<TestwillSeriesItem[]> {
  const res = await fetch('/api/testwill/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: auth?.token,
      userId: auth?.userId,
      deviceId: auth?.deviceId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.series)) {
    throw new Error(data.error || `Failed to fetch Testwill series (HTTP ${res.status})`);
  }
  return data.series;
}

/**
 * Fetch sections/folders for a selected Testwill Series (100% Live)
 */
export async function fetchTestwillSubjects(
  seriesId: string,
  auth?: TestwillAuthUser | null
): Promise<TestwillSubjectItem[]> {
  const res = await fetch('/api/testwill/subjects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesId,
      token: auth?.token,
      userId: auth?.userId,
      deviceId: auth?.deviceId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.subjects)) {
    throw new Error(data.error || `Failed to fetch Testwill sections (HTTP ${res.status})`);
  }
  return data.subjects;
}

/**
 * Fetch test titles for a Series + Section (100% Live)
 */
export async function fetchTestwillTests(
  seriesId: string,
  subjectId: string,
  search = '',
  auth?: TestwillAuthUser | null
): Promise<TestwillTestItem[]> {
  const res = await fetch('/api/testwill/tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seriesId,
      subjectId,
      search,
      token: auth?.token,
      userId: auth?.userId,
      deviceId: auth?.deviceId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.tests)) {
    throw new Error(data.error || `Failed to fetch Testwill tests (HTTP ${res.status})`);
  }
  return data.tests;
}

/**
 * Fetch live questions & solutions for a Testwill test and convert into Bilingual Clean .txt
 */
export async function fetchAndConvertTestwillTest(
  test: TestwillTestItem,
  seriesTitle = 'Testwill (testwill.in)',
  subjectTitle = 'All Sections',
  auth?: TestwillAuthUser | null
): Promise<RbeConvertedAppxResult> {
  const res = await fetch('/api/testwill/fetch-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: test.id,
      examId: test.test_series_id,
      testTitle: test.title,
      seriesTitle,
      subjectTitle,
      utSrNo: test.utSrNo || '',
      token: auth?.token,
      userId: auth?.userId,
      deviceId: auth?.deviceId,
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
  const err = new Error(
    data?.error ||
      `Could not fetch questions for "${test.title}". Please sign in with your Testwill account (Mobile OTP or Session Token).`
  ) as Error & { authRequired?: boolean };
  if (data?.authRequired) err.authRequired = true;
  throw err;
}

/**
 * Direct Unlock any Testwill test by URL or test ID
 */
export async function unlockTestwillDirectTest(
  testUrlOrId: string,
  seriesTitle = 'Testwill (testwill.in)',
  seriesId?: string,
  auth?: TestwillAuthUser | null
): Promise<RbeConvertedAppxResult> {
  const res = await fetch('/api/testwill/direct-unlock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testUrlOrId,
      seriesId,
      seriesTitle,
      token: auth?.token,
      userId: auth?.userId,
      deviceId: auth?.deviceId,
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
  const err = new Error(data.error || 'Failed to resolve Testwill test by URL/ID') as Error & {
    authRequired?: boolean;
  };
  if (data?.authRequired) err.authRequired = true;
  throw err;
}

/**
 * Universal Testwill URL Resolver & Live Folder Generator
 * Resolves testwill.in/mock-test/*, /previous-year-paper/*, or exam IDs into Folder Trees.
 */
export async function resolveTestwillUrls(
  urls: string[] | string,
  auth?: TestwillAuthUser | null
): Promise<TestwillFolderPackage[]> {
  const res = await fetch('/api/testwill/resolve-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      urls,
      token: auth?.token,
      userId: auth?.userId,
      deviceId: auth?.deviceId,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !Array.isArray(data.packages)) {
    throw new Error(data.error || `Failed to resolve Testwill URLs (HTTP ${res.status})`);
  }
  return data.packages;
}
