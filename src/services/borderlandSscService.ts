/**
 * SSC Borderland (borderlandssc.in) Service
 * 100% Real live connection to borderlandssc.in / Cloudflare D1 APIs.
 * Zero demo or fake fallback data.
 */

import { BorderlandConvertedResult } from '../utils/borderlandConverter';

export interface BorderlandFolderNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'package' | 'series';
  testCount: number;
  isPaid: boolean;
  isUnlocked: boolean;
  iconTag?: string;
  children?: BorderlandFolderNode[];
}

export interface BorderlandTestItem {
  id: string;
  title: string;
  folderId: string;
  folderName: string;
  folderPath: string;
  seriesId: string;
  seriesName: string;
  time: string;
  questionsCount: string;
  marks: string;
  paid: boolean;
  unlocked: boolean;
  examDate?: string;
  shift?: string;
  examName?: string;
  tags?: string[];
}

export interface BorderlandAuthUser {
  token: string;
  userId?: string;
  name?: string;
  mobile?: string;
  email?: string;
  enrolledBatches?: string[];
}

export interface BorderlandUrlResolveResponse {
  resolvedType: 'folder' | 'test';
  folders?: BorderlandFolderNode[];
  activeFolderId?: string;
  tests?: BorderlandTestItem[];
  test?: BorderlandConvertedResult;
  params?: Record<string, string>;
}

const STORAGE_KEY_AUTH = 'borderland_ssc_auth_user';
const STORAGE_KEY_PAID = 'borderland_ssc_paid_status';

export function getStoredBorderlandAuth(): BorderlandAuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredBorderlandAuth(auth: BorderlandAuthUser | null): void {
  if (!auth) {
    localStorage.removeItem(STORAGE_KEY_AUTH);
  } else {
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(auth));
  }
}

export function clearStoredBorderlandAuth(): void {
  localStorage.removeItem(STORAGE_KEY_AUTH);
}

export function isBorderlandPaidActive(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PAID);
    return raw !== null ? raw === 'true' : true;
  } catch {
    return true;
  }
}

export function setBorderlandPaidActive(active: boolean): void {
  localStorage.setItem(STORAGE_KEY_PAID, String(active));
}

/**
 * Fetch real live Borderland SSC Folder Tree Structure from backend
 */
export async function fetchBorderlandFolders(
  authUser?: BorderlandAuthUser | null
): Promise<BorderlandFolderNode[]> {
  const resp = await fetch('/api/borderland-ssc/folders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authUser?.token ? { Authorization: `Bearer ${authUser.token}` } : {}),
    },
    body: JSON.stringify({ userId: authUser?.userId }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.success || !Array.isArray(data.folders)) {
    throw new Error(data?.error || 'Failed to fetch live folder tree from borderlandssc.in');
  }
  return data.folders;
}

/**
 * Fetch real tests inside a folder from live backend
 */
export async function fetchBorderlandTests(
  folderId: string,
  search: string = '',
  authUser?: BorderlandAuthUser | null
): Promise<BorderlandTestItem[]> {
  const resp = await fetch('/api/borderland-ssc/tests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authUser?.token ? { Authorization: `Bearer ${authUser.token}` } : {}),
    },
    body: JSON.stringify({ folderId, search }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.success || !Array.isArray(data.tests)) {
    throw new Error(data?.error || 'Failed to fetch live tests for folder');
  }
  return data.tests;
}

/**
 * Fetch a single live test (with automatic section stitching) and convert to clean .txt
 */
export async function fetchAndConvertBorderlandTest(
  test: BorderlandTestItem,
  authUser?: BorderlandAuthUser | null
): Promise<BorderlandConvertedResult> {
  const resp = await fetch('/api/borderland-ssc/fetch-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authUser?.token ? { Authorization: `Bearer ${authUser.token}` } : {}),
    },
    body: JSON.stringify({
      testId: test.id,
      title: test.title,
      folderId: test.folderId,
      folderName: test.folderName,
      folderPath: test.folderPath,
      seriesName: test.seriesName,
      examDate: test.examDate,
      shift: test.shift,
      time: test.time,
      questionsCount: test.questionsCount,
      marks: test.marks,
      uid: authUser?.userId || '',
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.success) {
    throw new Error(data?.error || 'Failed to fetch live test questions');
  }

  return data;
}

/**
 * Universal URL resolver: handles ANY Borderland folder URL, test URL, API URL, Test ID, or external URL
 */
export async function resolveBorderlandFolderUrl(
  url: string,
  authUser?: BorderlandAuthUser | null
): Promise<BorderlandUrlResolveResponse> {
  const resp = await fetch('/api/borderland-ssc/resolve-folder-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authUser?.token ? { Authorization: `Bearer ${authUser.token}` } : {}),
    },
    body: JSON.stringify({
      url,
      userId: authUser?.userId || '',
      token: authUser?.token || '',
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.success) {
    throw new Error(data?.error || 'Failed to resolve URL');
  }

  if (data.resolvedType === 'test' && data.test) {
    return {
      resolvedType: 'test',
      test: data.test,
    };
  }

  return {
    resolvedType: 'folder',
    folders: data.folders || [],
    activeFolderId: data.activeFolderId || 'exam::cgl::t1::pyq::2025',
    tests: Array.isArray(data.tests) ? data.tests : undefined,
    params: data.params || {},
  };
}

/**
 * Trigger reliable browser Blob download (safe inside iframes & mobile WebViews)
 */
export function triggerReliableFileDownload(
  content: string | Blob,
  fileName: string,
  mimeType: string = 'text/plain;charset=utf-8'
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Download standalone offline mock test using Borderland SSC's exact test2.html HTML/CSS/JS
 */
export async function downloadBorderlandExactHtml(
  opts: {
    testId?: string;
    title: string;
    time?: string | number;
    rawMeta?: Record<string, any>;
    rawQuestions?: any[];
    convertedQuestions?: BorderlandConvertedResult['questions'];
  },
  authUser?: BorderlandAuthUser | null
): Promise<string> {
  const resp = await fetch('/api/borderland-ssc/download-html', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authUser?.token ? { Authorization: `Bearer ${authUser.token}` } : {}),
    },
    body: JSON.stringify({
      testId: opts.testId || '',
      title: opts.title,
      time: opts.time ?? '60',
      rawMeta: opts.rawMeta || null,
      rawQuestions: opts.rawQuestions || null,
      convertedQuestions: opts.convertedQuestions || null,
      uid: authUser?.userId || '',
    }),
  });

  const data = await resp.json();
  if (!resp.ok || !data.success || !data.html) {
    throw new Error(data?.error || 'Failed to generate Borderland HTML mock');
  }

  const fileName = data.fileName || `${opts.title.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'Borderland_Mock'}.html`;
  triggerReliableFileDownload(data.html, fileName, 'text/html;charset=utf-8');
  return fileName;
}

/**
 * Resolve direct test URL or Test ID
 */
export async function resolveBorderlandDirectUrl(
  input: string,
  authUser?: BorderlandAuthUser | null
): Promise<BorderlandConvertedResult> {
  const res = await resolveBorderlandFolderUrl(input, authUser);
  if (res.resolvedType === 'test' && res.test) {
    return res.test;
  }
  throw new Error('URL resolved to a folder rather than a direct test.');
}
