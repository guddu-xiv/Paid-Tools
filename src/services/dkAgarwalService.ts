/**
 * Agrawal Academy (agrawalacademy.com / DK Agarwal Sir) Integration Service
 * Communicates with https://agrawalacademyapi.akamai.net.in/ and local proxy endpoints.
 * Handles Authentication, Test Series listing, Subject folders, Tests list with paid: true,
 * and fetching clean questions JSON.
 */

import {
  convertDkAgarwalToCleanTxt,
  DkAgarwalConvertedResult,
  DkAgarwalQuestionItem,
} from '../utils/dkAgarwalConverter';

export interface DkSeriesItem {
  id: string;
  title: string;
  slug: string;
  exam: string;
  examname: string;
  logo: string;
  price: number;
  offer_price: number;
  description: string;
  is_purchased?: boolean;
  paid: boolean;
}

export interface DkSubjectItem {
  id: string;
  name: string;
  testsCount?: number;
  is_paid: boolean;
}

export interface DkTestItem {
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
  paid: boolean;
  unlocked: boolean;
}

export interface DkAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  avatar?: string;
}

const LOCAL_STORAGE_AUTH_KEY = 'dk_agarwal_user_auth_v1';

export function getStoredDkAuth(): DkAuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredDkAuth(auth: DkAuthUser): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_AUTH_KEY, JSON.stringify(auth));
  } catch (err) {
    console.warn('Failed to save DK Agarwal auth to localStorage', err);
  }
}

export function clearStoredDkAuth(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_AUTH_KEY);
  } catch {
    // ignore
  }
}

/**
 * Fetch all available test series from Agrawal Academy API (or backend proxy)
 */
export async function fetchAllDkSeries(auth?: DkAuthUser | null): Promise<DkSeriesItem[]> {
  try {
    const res = await fetch('/api/dk-agarwal/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: auth?.token,
        userId: auth?.userId,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.series) && json.series.length > 0) {
        return json.series.map((s: any) => ({
          ...s,
          paid: true,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend proxy fetch series error, falling back to direct API', err);
  }

  // Direct client fallback
  try {
    const headers: Record<string, string> = {
      'Client-Service': 'Appx',
      'Auth-Key': 'appxapi',
      source: 'website',
    };
    if (auth?.token) {
      headers['Authorization'] = auth.token;
      if (auth.userId) headers['User-ID'] = auth.userId;
    }

    const r = await fetch('https://agrawalacademyapi.akamai.net.in/get/test_series?start=-1', {
      headers,
    });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data?.data)) {
        return data.data.map((d: any) => ({
          id: String(d.id),
          title: d.title || 'Agrawal Academy Test Series',
          slug: d.testseries_slug || `series-${d.id}`,
          exam: d.exam || '1',
          examname: d.examname || 'Test Series',
          logo: d.logo || '',
          price: Number(d.price) || 0,
          offer_price: Number(d.offer_price) || 0,
          description: d.description || '',
          paid: true,
        }));
      }
    }
  } catch (err) {
    console.warn('Direct fetch series error', err);
  }

  // High-fidelity fallback list if completely offline
  return [
    {
      id: '2',
      title: 'SSC MTS 2026 Test Series (185+ PYP, 100+ Sectional, 50 Full Mocks)',
      slug: 'ssc-mts-2026-test-series',
      exam: '1',
      examname: 'SSC Exam',
      logo: 'https://appx-content-v2.classx.co.in/subject/2026-09-19-0_639322045985677.png',
      price: 349,
      offer_price: 249,
      description: 'Complete SSC MTS 2022-2025 Previous Year Papers, Sectional Tests, and Full Mocks.',
      paid: true,
    },
    {
      id: '3',
      title: 'SSC MTS 2026 Vocabulary Test Series',
      slug: 'ssc-mts-2026-vocabulary-test-series',
      exam: '1',
      examname: 'English Vocabulary',
      logo: 'https://appx-content-v2.classx.co.in/subject/2026-09-19-0_639322045985677.png',
      price: 149,
      offer_price: 99,
      description: 'Dedicated topic-wise English vocabulary and idioms test series.',
      paid: true,
    },
  ];
}

/**
 * Fetch subjects/folders inside a specific test series
 */
export async function fetchDkSubjects(seriesId: string, auth?: DkAuthUser | null): Promise<DkSubjectItem[]> {
  try {
    const res = await fetch('/api/dk-agarwal/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesId,
        token: auth?.token,
        userId: auth?.userId,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.subjects) && json.subjects.length > 0) {
        return json.subjects;
      }
    }
  } catch (err) {
    console.warn('Backend proxy fetch subjects error', err);
  }

  // Preloaded comprehensive subjects for series 2 (SSC MTS)
  return [
    { id: '2', name: 'Previous Year Papers (185 Papers)', is_paid: true },
    { id: '3', name: 'Sectional Tests (100 Tests)', is_paid: true },
    { id: '6', name: 'Full Mock Tests (50 Tests)', is_paid: true },
    { id: '7', name: 'Previous Year Sectional Tests - English (508 Tests)', is_paid: true },
    { id: '8', name: 'Previous Year Sectional Tests - GK/GS (508 Tests)', is_paid: true },
    { id: '11', name: 'Reading Comprehension', is_paid: true },
    { id: '12', name: 'ENGLISH - CHAPTERWISE TEST', is_paid: true },
    { id: '14', name: 'SSC PHASE XIV 2026 (LATEST EXAM)', is_paid: true },
    { id: '15', name: 'GK - CHAPTERWISE TEST', is_paid: true },
    { id: '-1', name: 'All Tests / Uncategorized', is_paid: true },
  ];
}

/**
 * Fetch test titles for a series and subject (with paid: true explicitly set on all)
 */
export async function fetchDkTests(
  seriesId: string,
  subjectId: string,
  search?: string,
  auth?: DkAuthUser | null
): Promise<DkTestItem[]> {
  try {
    const res = await fetch('/api/dk-agarwal/tests', {
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

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json?.tests)) {
        return json.tests.map((t: any) => ({
          ...t,
          paid: true,
          unlocked: true,
        }));
      }
    }
  } catch (err) {
    console.warn('Backend proxy fetch tests error, falling back to direct API', err);
  }

  // Direct client fallback
  try {
    const headers: Record<string, string> = {
      'Client-Service': 'Appx',
      'Auth-Key': 'appxapi',
      source: 'website',
    };
    if (auth?.token) {
      headers['Authorization'] = auth.token;
      if (auth.userId) headers['User-ID'] = auth.userId;
    }

    const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
    const r = await fetch(
      `https://agrawalacademyapi.akamai.net.in/get/test_titlev2?testseriesid=${seriesId}&subject_id=${subjectId}&chapter_id=-1&start=-1${searchParam}`,
      { headers }
    );
    if (r.ok) {
      const data = await r.json();
      const list = data?.test_titles || [];
      return list.map((item: any) => ({
        id: String(item.id),
        title: item.title || `Test ${item.id}`,
        test_series_id: String(item.test_series_id || seriesId),
        time: item.time || '45',
        questions: item.questions || '50',
        marks: item.marks || '150',
        test_questions_url: item.test_questions_url || '',
        test_questions_url_2: item.test_questions_url_2 || '',
        free_flag: item.free_flag || '0',
        is_completed: Boolean(item.is_completed),
        is_test_attempted: Boolean(item.is_test_attempted),
        paid: true,
        unlocked: true,
      }));
    }
  } catch (err) {
    console.warn('Direct fetch tests error', err);
  }

  return [];
}

/**
 * Fetch and convert test questions from Agrawal Academy into clean .txt
 */
export async function fetchAndConvertDkTest(
  test: DkTestItem,
  seriesTitle?: string,
  subjectTitle?: string,
  auth?: DkAuthUser | null
): Promise<DkAgarwalConvertedResult> {
  // 1. Try server proxy endpoint
  try {
    const res = await fetch('/api/dk-agarwal/fetch-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: test.id,
        testTitle: test.title,
        seriesTitle: seriesTitle || 'Agrawal Academy Test Series',
        subjectTitle: subjectTitle || 'All Sections',
        durationMinutes: test.time || 45,
        marks: test.marks || 150,
        url1: test.test_questions_url,
        url2: test.test_questions_url_2,
        token: auth?.token,
        userId: auth?.userId,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.cleanTxt && json.totalQuestions > 0) {
        return json;
      }
    }
  } catch (err) {
    console.warn('Backend proxy fetch questions error, trying direct JSON fetch', err);
  }

  // 2. Direct client fetch of url1 + url2 in parallel
  const fetchJsonList = async (url?: string): Promise<DkAgarwalQuestionItem[]> => {
    if (!url) return [];
    try {
      const r = await fetch(url);
      if (r.ok) {
        const d = await r.json();
        return Array.isArray(d) ? d : Object.values(d || {});
      }
    } catch (e) {
      console.warn('Direct url fetch failed', e);
    }
    return [];
  };

  const [qEnList, qHiList] = await Promise.all([
    fetchJsonList(test.test_questions_url),
    fetchJsonList(test.test_questions_url_2),
  ]);

  if (qEnList.length > 0 || qHiList.length > 0) {
    const primary = qEnList.length > 0 ? qEnList : qHiList;
    const secondary = qEnList.length > 0 ? qHiList : [];
    return convertDkAgarwalToCleanTxt(primary, secondary, {
      id: test.id,
      title: test.title,
      seriesTitle: seriesTitle || 'Agrawal Academy Test Series',
      subjectTitle: subjectTitle || 'All Sections',
      totalQuestions: primary.length,
      durationMinutes: test.time || 45,
      marks: test.marks || 150,
      isPaid: true,
    });
  }

  throw new Error(`Unable to load questions for test "${test.title}". Please verify connection or token.`);
}

/**
 * Mobile OTP send
 */
export async function sendDkOtp(phone: string): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/dk-agarwal/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

/**
 * Mobile OTP verify
 */
export async function verifyDkOtp(phoneOrEmail: string, otp: string): Promise<{ success: boolean; auth?: DkAuthUser; error?: string }> {
  const res = await fetch('/api/dk-agarwal/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneOrEmail, otp }),
  });
  return res.json();
}

/**
 * Password login
 */
export async function loginDkWithPassword(
  emailOrPhone: string,
  password: string
): Promise<{ success: boolean; auth?: DkAuthUser; error?: string }> {
  const res = await fetch('/api/dk-agarwal/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrPhone, password }),
  });
  return res.json();
}
