import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  RotateCcw,
  Search,
  Square,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react';
import {
  convertMockMatrixJsonToCleanTxt,
  ConvertedResult,
} from '../utils/mockMatrixConverter';
import {
  MockMatrixChapterItem,
  ResolvedMockMatrixResult,
  FALLBACK_SSC_2026_MATH_CHAPTERS,
} from '../utils/mockMatrixUrlResolver';

export interface MockMatrixUserSession {
  userName: string;
  userEmailOrPhone: string;
  passType: string;
  token: string;
  loginTime: string;
}

export interface MockMatrixHubStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

const DEFAULT_CATEGORY_URL =
  'https://mockmatrixhub.in/exams/chapters-wise?ssc-sub&b=ssc&filter=year%3D2026%2Csubject%3DMath';

export const MockMatrixHubStudio: React.FC<MockMatrixHubStudioProps> = ({
  onLoadIntoPdfStudio,
}) => {
  // Navigation Mode: 'fetch-url' | 'paste-json'
  const [activeTab, setActiveTab] = useState<'fetch-url' | 'paste-json'>('fetch-url');

  // Session state (Persisted in localStorage; ignore legacy synthetic MM-SESSION/MM-AUTH tokens)
  const [session, setSession] = useState<MockMatrixUserSession | null>(() => {
    try {
      const saved = localStorage.getItem('mockmatrix_user_session');
      if (!saved) return null;
      const parsed = JSON.parse(saved) as MockMatrixUserSession;
      if (
        !parsed?.token ||
        parsed.token.startsWith('MM-SESSION-') ||
        parsed.token.startsWith('MM-AUTH-')
      ) {
        localStorage.removeItem('mockmatrix_user_session');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Real Login Modal & Auth form state
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'token'>('password');
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [pastedToken, setPastedToken] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMsg, setLoginSuccessMsg] = useState<string | null>(null);

  // URL & Category Scanner state
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_CATEGORY_URL);
  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(false);
  const [resolvedExam, setResolvedExam] = useState<ResolvedMockMatrixResult | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // Fetch / Auth status for live test questions
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState<boolean>(false);

  // Multi-select chapters state
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>('');
  const [isBatchFetching, setIsBatchFetching] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; title: string } | null>(null);
  const [loadingSingleChapterId, setLoadingSingleChapterId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Raw JSON Input & Clean Result
  const [jsonInput, setJsonInput] = useState<string>('');
  const [activeLoadedTitle, setActiveLoadedTitle] = useState<string>('No test loaded');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Persist session
  useEffect(() => {
    if (session) {
      localStorage.setItem('mockmatrix_user_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('mockmatrix_user_session');
    }
  }, [session]);

  // Conversion computation
  const conversionState = useMemo<{
    result: ConvertedResult | null;
    error: string | null;
  }>(() => {
    if (!jsonInput.trim()) {
      return { result: null, error: null };
    }
    try {
      const res = convertMockMatrixJsonToCleanTxt(jsonInput);
      return { result: res, error: null };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [jsonInput]);

  const { result, error } = conversionState;

  // Auto-resolve initial default URL on mount so user immediately sees all chapters + preview
  useEffect(() => {
    handleResolveUrl(DEFAULT_CATEGORY_URL, true);
  }, []);

  // Resolve Category / Chapter-Wise URL & automatically populate Preview
  const handleResolveUrl = async (urlToFetch?: string, isInitial = false, overrideToken?: string) => {
    const targetUrl = (urlToFetch || inputUrl).trim();
    if (!targetUrl) return;

    setIsResolvingUrl(true);
    setResolveError(null);
    setFetchError(null);
    setRequiresAuth(false);
    setChapterSearchQuery('');

    try {
      const res = await fetch('/api/mockmatrix/resolve-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.chapters)) {
        setResolvedExam(data);
        const allIds = new Set<string>(data.chapters.map((c: MockMatrixChapterItem) => c.id));
        setSelectedChapterIds(allIds);

        // Auto-load first chapter/part into Preview
        if (data.chapters.length > 0) {
          await handleLoadSingleChapter(data.chapters[0], overrideToken);
        } else {
          setJsonInput('');
          setActiveLoadedTitle(data.examTitle || 'No chapters found');
        }
      } else {
        throw new Error(data.error || 'Failed to resolve chapters from URL');
      }
    } catch (err: any) {
      console.warn('URL resolve notice:', err?.message || err);
      if (!isInitial) {
        setResolveError(err?.message || 'Failed to resolve chapters from URL');
      } else {
        const fallbackChapters = FALLBACK_SSC_2026_MATH_CHAPTERS;
        setResolvedExam({
          success: true,
          url: targetUrl,
          examId: 'ssc-sub',
          examTitle: 'SSC 2026 Chapter-Wise PYQ (Math)',
          board: 'ssc',
          year: '2026',
          subject: 'Math',
          totalChapters: fallbackChapters.length,
          totalQuestions: fallbackChapters.reduce((acc, c) => acc + c.totalQs, 0),
          chapters: fallbackChapters,
          availableSubjects: ['Math', 'Reasoning', 'English', 'General Awareness'],
          availableYears: ['2026', '2025'],
        });
        setSelectedChapterIds(new Set(fallbackChapters.map((c) => c.id)));
      }
    } finally {
      setIsResolvingUrl(false);
    }
  };

  // Toggle selection for a single chapter
  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Select all / Deselect all
  const handleSelectAllChapters = () => {
    if (!resolvedExam) return;
    const allIds = new Set(resolvedExam.chapters.map((c) => c.id));
    setSelectedChapterIds(allIds);
  };

  const handleDeselectAllChapters = () => {
    setSelectedChapterIds(new Set());
  };

  // Drill into all parts for a topic (e.g. SPELLING CHECK -> PART-1 .. PART-21)
  const handleDrillIntoTopicParts = (chap: MockMatrixChapterItem) => {
    const topicVal = chap.topic || chap.chapterName;
    try {
      const u = new URL(inputUrl.trim());
      const filterRaw = u.searchParams.get('filter') || '';
      const pairs = filterRaw
        ? filterRaw
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
            .filter((p) => !p.startsWith('topic=') && !p.startsWith('subtopic='))
        : [
            `year=${chap.year}`,
            `subject=${chap.subject}`,
          ];
      pairs.push(`topic=${topicVal}`);
      u.searchParams.set('filter', pairs.join(','));
      const nextUrl = u.toString();
      setInputUrl(nextUrl);
      handleResolveUrl(nextUrl);
    } catch {
      const nextUrl = `https://mockmatrixhub.in/exams/chapters-wise?ssc-sub&b=ssc&filter=${encodeURIComponent(
        `year=${chap.year},subject=${chap.subject},topic=${topicVal}`
      )}`;
      setInputUrl(nextUrl);
      handleResolveUrl(nextUrl);
    }
  };

  // Go back from single topic parts view to full subject overview
  const handleBackToAllTopics = () => {
    if (!resolvedExam) return;
    try {
      const u = new URL(inputUrl.trim());
      const filterRaw = u.searchParams.get('filter') || '';
      const pairs = filterRaw
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .filter((p) => !p.startsWith('topic=') && !p.startsWith('subtopic='));
      if (pairs.length > 0) {
        u.searchParams.set('filter', pairs.join(','));
      } else {
        u.searchParams.delete('filter');
      }
      const nextUrl = u.toString();
      setInputUrl(nextUrl);
      handleResolveUrl(nextUrl);
    } catch {
      // ignore
    }
  };

  // 1-Click Load Single Chapter / Part directly from Mock Matrix Gatekeeper
  const handleLoadSingleChapter = async (chap: MockMatrixChapterItem, overrideToken?: string) => {
    setLoadingSingleChapterId(chap.id);
    setActiveChapterId(chap.id);
    setFetchError(null);
    setRequiresAuth(false);
    try {
      const res = await fetch('/api/mockmatrix/fetch-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testUrlOrId: chap.testUrl || chap.id,
          quizId: chap.quizId || chap.id,
          section: chap.section || '',
          token: overrideToken ?? session?.token ?? '',
          chapterName: chap.chapterName,
          subject: chap.subject,
          year: chap.year,
          totalQs: chap.totalQs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.rawJson) {
        setJsonInput(data.rawJson);
        setActiveLoadedTitle(data.title || chap.title || chap.chapterName);
        setFetchError(null);
        setRequiresAuth(false);
      } else {
        setJsonInput('');
        setActiveLoadedTitle(chap.title || chap.chapterName);
        setFetchError(data.error || 'Failed to fetch live questions from Mock Matrix Hub.');
        setRequiresAuth(Boolean(data.requiresAuth));
      }
    } catch (err: any) {
      setJsonInput('');
      setActiveLoadedTitle(chap.title || chap.chapterName);
      setFetchError(err?.message || 'Network error while fetching questions.');
    } finally {
      setLoadingSingleChapterId(null);
    }
  };

  // Batch Fetch All or Selected Chapters/Parts directly from Mock Matrix Gatekeeper
  const handleBatchFetchChapters = async (chaptersToFetch: MockMatrixChapterItem[]) => {
    if (chaptersToFetch.length === 0) return;
    setIsBatchFetching(true);
    setFetchError(null);
    setRequiresAuth(false);
    setBatchProgress({
      current: 0,
      total: chaptersToFetch.length,
      title: `Fetching ${chaptersToFetch.length} live test sections from Mock Matrix Hub...`,
    });

    try {
      const res = await fetch('/api/mockmatrix/batch-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapters: chaptersToFetch,
          token: session?.token || '',
          examTitle: resolvedExam?.examTitle || `SSC Combined (${chaptersToFetch.length} Parts)`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.rawJson) {
        setJsonInput(data.rawJson);
        setActiveLoadedTitle(data.title);
        setFetchError(null);
        setRequiresAuth(false);
      } else {
        setFetchError(data.error || 'Failed to batch fetch chapters from Mock Matrix Hub.');
        setRequiresAuth(Boolean(data.requiresAuth));
        if (data.requiresAuth) {
          setShowLoginModal(true);
        }
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Network error during batch fetch.');
    } finally {
      setIsBatchFetching(false);
      setBatchProgress(null);
    }
  };

  // Real Mock Matrix Hub Email + Password Login (via auth.mockmatrixhub.in)
  const handleRealLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Please enter your Mock Matrix Hub email and password.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/mockmatrix/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.token) {
        setLoginError(data.error || 'Login failed. Check your email/password.');
        return;
      }
      const newSession: MockMatrixUserSession = {
        userName: data.user?.name || loginEmail.split('@')[0],
        userEmailOrPhone: data.user?.email || loginEmail.trim(),
        passType: 'Mock Matrix Hub Verified',
        token: data.token,
        loginTime: new Date().toLocaleTimeString(),
      };
      setSession(newSession);
      setShowLoginModal(false);
      setLoginSuccessMsg(`Signed in as ${newSession.userEmailOrPhone}. Fetching live questions...`);
      setTimeout(() => setLoginSuccessMsg(null), 4000);

      // Re-fetch currently selected chapter automatically with new real token
      if (resolvedExam?.chapters?.length) {
        const target =
          resolvedExam.chapters.find((c) => c.id === activeChapterId) || resolvedExam.chapters[0];
        if (target) {
          await handleLoadSingleChapter(target, data.token);
        }
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Unable to connect to Mock Matrix Hub auth.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Verify pasted Mock Matrix Hub JWT token
  const handleVerifyToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = pastedToken.replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
    if (!cleaned) {
      setLoginError('Please paste your Mock Matrix Hub access token.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/mockmatrix/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleaned }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.token) {
        setLoginError(data.error || 'Invalid or expired access token.');
        return;
      }
      const newSession: MockMatrixUserSession = {
        userName: data.user?.name || 'Mock Matrix User',
        userEmailOrPhone: data.user?.email || 'Verified Session',
        passType: 'Mock Matrix Hub Session Token',
        token: data.token,
        loginTime: new Date().toLocaleTimeString(),
      };
      setSession(newSession);
      setShowLoginModal(false);
      setPastedToken('');
      setLoginSuccessMsg(`Session verified for ${newSession.userEmailOrPhone}. Fetching live questions...`);
      setTimeout(() => setLoginSuccessMsg(null), 4000);

      if (resolvedExam?.chapters?.length) {
        const target =
          resolvedExam.chapters.find((c) => c.id === activeChapterId) || resolvedExam.chapters[0];
        if (target) {
          await handleLoadSingleChapter(target, data.token);
        }
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Token verification failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setSession(null);
  };

  // Filter resolved chapters by search query
  const filteredDiscoveredChapters = useMemo(() => {
    if (!resolvedExam?.chapters) return [];
    const q = chapterSearchQuery.trim().toLowerCase();
    if (!q) return resolvedExam.chapters;
    return resolvedExam.chapters.filter(
      (c) =>
        c.chapterName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q)
    );
  }, [resolvedExam, chapterSearchQuery]);

  const handleCopyCleanTxt = async () => {
    if (!result?.cleanTxt) return;
    try {
      await navigator.clipboard.writeText(result.cleanTxt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownloadCleanTxt = () => {
    if (!result?.cleanTxt) return;
    const safeTitle = (result.title || activeLoadedTitle || 'MOCK_MATRIX_TEST')
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `[CLEAN]_${safeTitle}.txt`;
    const blob = new Blob([result.cleanTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        setFetchError(null);
        setRequiresAuth(false);
        setJsonInput(text);
        setActiveLoadedTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setFetchError(null);
        setRequiresAuth(false);
        setJsonInput(text);
        setActiveLoadedTitle('Pasted Mock Matrix JSON');
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-3 sm:space-y-4">
      {loginSuccessMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="min-w-0 break-words">{loginSuccessMsg}</span>
        </div>
      )}

      {/* Real Mock Matrix Hub Sign-In / Token Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-xl overflow-hidden max-h-[92vh] overflow-y-auto">
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-violet-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-extrabold">Sign In to Mock Matrix Hub</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 space-y-4">
              <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('password');
                    setLoginError(null);
                  }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    loginMethod === 'password'
                      ? 'bg-white text-violet-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Email &amp; Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod('token');
                    setLoginError(null);
                  }}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                    loginMethod === 'token'
                      ? 'bg-white text-violet-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Paste Session Token
                </button>
              </div>

              {loginError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {loginMethod === 'password' ? (
                <form onSubmit={handleRealLogin} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Mock Matrix Hub Email
                    </label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="your-account@gmail.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-violet-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your mockmatrixhub.in password"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-violet-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2 text-xs font-extrabold text-white bg-violet-700 hover:bg-violet-800 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Sign In &amp; Fetch Live Questions</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyToken} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
                    <p className="font-bold text-slate-800">
                      Google Login users on mockmatrixhub.in:
                    </p>
                    <p>
                      Open DevTools Console on <code className="text-violet-700">mockmatrixhub.in</code> and run:
                    </p>
                    <code className="block p-1.5 rounded bg-slate-900 text-amber-300 text-[10px] break-all select-all">
                      JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=&gt;k.includes(&apos;auth-token&apos;))))?.access_token
                    </code>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Supabase Access Token (JWT)
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={pastedToken}
                      onChange={(e) => setPastedToken(e.target.value)}
                      placeholder="eyJhbGciOi..."
                      className="w-full px-3 py-2 text-[11px] font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-violet-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2 text-xs font-extrabold text-white bg-violet-700 hover:bg-violet-800 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying Token...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify Token &amp; Unlock Live Fetch</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mode Navigation Tabs + Session Auth */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-2.5">
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('fetch-url')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fetch-url'
                ? 'bg-violet-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">URL Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste-json')}
            className={`px-3 sm:px-4 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'paste-json'
                ? 'bg-violet-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Paste JSON / Upload</span>
          </button>
        </div>

        <div className="flex items-center justify-end w-full sm:w-auto shrink-0">
          {session ? (
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-emerald-950 truncate">{session.userName}</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1 hover:bg-emerald-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginError(null);
                setShowLoginModal(true);
              }}
              className="w-full sm:w-auto px-3.5 py-2 sm:py-1.5 text-xs font-extrabold text-slate-900 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-900 shrink-0" />
              <span>Sign In (Mock Matrix Hub)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column (Controls & Chapters) | Right Column (Clean .txt Output) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Column */}
        <div className="lg:col-span-6 min-w-0 flex flex-col space-y-3 sm:space-y-4">
          {/* TAB 1: Category & Chapter-Wise URL Fetcher */}
          {activeTab === 'fetch-url' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3 sm:space-y-4">
              {/* URL Input Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-900 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-violet-700 shrink-0" />
                    <span>Mock Matrix Chapter-Wise / Test URL:</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                    Enter Category / Filter URL
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    type="text"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleResolveUrl();
                    }}
                    placeholder="https://mockmatrixhub.in/exams/chapters-wise?ssc-sub&b=ssc&filter=year%3D2026%2Csubject%3DMath"
                    className="w-full min-w-0 flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-violet-600 selection:bg-violet-100"
                  />

                  <button
                    type="button"
                    onClick={() => handleResolveUrl()}
                    disabled={isResolvingUrl || !inputUrl.trim()}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 active:scale-[0.98] rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isResolvingUrl ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Resolving...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Fetch Chapters</span>
                      </>
                    )}
                  </button>
                </div>

                {resolveError && (
                  <p className="text-xs text-rose-600 font-medium">
                    ⚠️ {resolveError}
                  </p>
                )}
              </div>

              {/* Resolved Exam & Chapters Hub */}
              {resolvedExam && (
                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  {/* Summary Header */}
                  <div className="bg-violet-50/70 border border-violet-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs font-bold text-violet-950">
                          {resolvedExam.examTitle}
                        </h3>
                        {resolvedExam.topic && (
                          <button
                            type="button"
                            onClick={handleBackToAllTopics}
                            className="px-2 py-0.5 text-[10px] font-bold text-violet-800 bg-white hover:bg-violet-100 border border-violet-300 rounded-md flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowLeft className="w-2.5 h-2.5" />
                            <span>All {resolvedExam.subject} Topics</span>
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-violet-800 font-medium mt-0.5">
                        <span className="font-bold text-violet-900">
                          {resolvedExam.totalChapters}{' '}
                          {resolvedExam.topic ? 'Parts' : 'Chapters'}
                        </span>
                        <span>·</span>
                        <span>{resolvedExam.totalQuestions} Questions</span>
                        <span>·</span>
                        <span>Year: {resolvedExam.year}</span>
                        <span>·</span>
                        <span>Subject: {resolvedExam.subject}</span>
                        {resolvedExam.topic && (
                          <>
                            <span>·</span>
                            <span className="px-1.5 py-0.5 rounded bg-violet-200 text-violet-950 font-bold">
                              Topic: {resolvedExam.topic}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Batch Actions: "all v kar saku" */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isBatchFetching || resolvedExam.chapters.length === 0}
                        onClick={() => {
                          const toFetch =
                            selectedChapterIds.size > 0
                              ? resolvedExam.chapters.filter((c) => selectedChapterIds.has(c.id))
                              : resolvedExam.chapters;
                          handleBatchFetchChapters(toFetch);
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-black active:scale-[0.98] rounded-xl shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                        title="Fetch all selected chapters and combine into one clean document"
                      >
                        {isBatchFetching ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Fetching All...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            <span>
                              {selectedChapterIds.size === resolvedExam.chapters.length
                                ? `Fetch All (${resolvedExam.chapters.length})`
                                : `Fetch Selected (${selectedChapterIds.size})`}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Batch Progress Bar */}
                  {batchProgress && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                      <div className="flex items-center justify-between font-bold">
                        <span>{batchProgress.title}</span>
                        <span className="tabular-nums">
                          {batchProgress.current} / {batchProgress.total}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-600 transition-all duration-300"
                          style={{
                            width: `${Math.round(
                              (batchProgress.current / Math.max(1, batchProgress.total)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Search and Selection Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="relative flex-1 min-w-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={chapterSearchQuery}
                        onChange={(e) => setChapterSearchQuery(e.target.value)}
                        placeholder="Search chapter name (e.g. Profit, Spelling)..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-violet-600"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={handleSelectAllChapters}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllChapters}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Chapters List Cards */}
                  <div className="space-y-2 max-h-[320px] sm:max-h-[400px] lg:max-h-[460px] overflow-y-auto pr-1">
                    {filteredDiscoveredChapters.map((chap, idx) => {
                      const isSelected = selectedChapterIds.has(chap.id);
                      const isLoadingThis = loadingSingleChapterId === chap.id;
                      const isActivePreview = activeChapterId === chap.id;

                      return (
                        <div
                          key={chap.id}
                          className={`p-2.5 sm:p-3 rounded-xl border text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isActivePreview
                              ? 'bg-violet-50/90 border-violet-500 ring-1 ring-violet-400 shadow-xs'
                              : isSelected
                              ? 'bg-white border-slate-300 shadow-2xs'
                              : 'bg-slate-50/80 border-slate-200 opacity-80'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                            {/* Checkbox */}
                            <button
                              type="button"
                              onClick={() => toggleChapterSelection(chap.id)}
                              className="text-slate-600 hover:text-violet-700 cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-violet-700" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium flex-wrap">
                                <span className="font-bold text-slate-700">#{idx + 1}</span>
                                <span>·</span>
                                <span className="font-bold text-violet-700">{chap.subject}</span>
                                <span>·</span>
                                <span>{chap.year}</span>
                                <span>·</span>
                                <span className="text-emerald-700 font-bold">{chap.totalQs} Qs</span>
                                {chap.section && (
                                  <>
                                    <span>·</span>
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-extrabold">
                                      {chap.section}
                                    </span>
                                  </>
                                )}
                                {chap.type && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded font-extrabold uppercase ${
                                      chap.type === 'free'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {chap.type}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">
                                {chap.chapterName}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-1.5 w-full sm:w-auto shrink-0">
                            {!resolvedExam.topic && (chap.partsCount || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDrillIntoTopicParts(chap)}
                                className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all cursor-pointer"
                                title={`Expand all ${chap.partsCount} parts for ${chap.chapterName}`}
                              >
                                Parts ({chap.partsCount})
                              </button>
                            )}

                            {/* 1-Click Load Single Chapter / Part */}
                            <button
                              type="button"
                              disabled={isLoadingThis}
                              onClick={() => handleLoadSingleChapter(chap)}
                              className="px-3 py-1.5 text-[11px] font-bold text-violet-800 bg-violet-50 hover:bg-violet-100 active:scale-[0.97] border border-violet-200 rounded-lg flex items-center gap-1 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                              title="Fetch live questions for this chapter/part"
                            >
                              {isLoadingThis ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>
                                    {chap.isFullMock
                                      ? 'Load Mock'
                                      : chap.section
                                      ? `Load ${chap.section}`
                                      : 'Load Chapter'}
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct JSON / Upload */}
          {activeTab === 'paste-json' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col">
              <div className="p-3 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-violet-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Paste Mock Matrix JSON
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>Paste</span>
                  </button>

                  <label className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept=".json,.txt,application/json,text/plain"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {jsonInput && (
                    <button
                      type="button"
                      onClick={() => setJsonInput('')}
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                      title="Clear"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3 sm:p-4 flex-1 flex flex-col space-y-2">
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setFetchError(null);
                    setRequiresAuth(false);
                    setJsonInput(e.target.value);
                  }}
                  placeholder="Paste your Mock Matrix / test JSON here..."
                  className="w-full min-h-[260px] sm:min-h-[340px] lg:min-h-[540px] p-3 text-[11px] font-mono leading-relaxed bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none focus:border-violet-500 resize-none selection:bg-violet-600/40"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Clean Standard .txt Output */}
        <div className="lg:col-span-6 min-w-0 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-3 sm:p-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Clean .txt Output
              </h2>
              {result && (
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 rounded-md shrink-0">
                  {result.totalQuestions} Questions
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                disabled={!result?.cleanTxt}
                onClick={handleCopyCleanTxt}
                className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 active:scale-[0.98] border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy .txt</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!result?.cleanTxt}
                onClick={handleDownloadCleanTxt}
                className="px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white bg-slate-900 hover:bg-black active:scale-[0.98] rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40 shadow-xs cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-slate-200" />
                    <span>Download .txt</span>
                  </>
                )}
              </button>

              {onLoadIntoPdfStudio && result?.cleanTxt && (
                <button
                  type="button"
                  onClick={() => {
                    const safeTitle = (result.title || activeLoadedTitle || 'MOCK_MATRIX_TEST')
                      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
                      .replace(/\s+/g, '_')
                      .slice(0, 60);
                    onLoadIntoPdfStudio(result.cleanTxt, `${safeTitle}.txt`);
                  }}
                  className="px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 active:scale-[0.98] rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Load clean questions directly into PDF Studio preview"
                >
                  <span>Open in PDF Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Clean .txt Body */}
          <div className="p-3 sm:p-4 flex-1 flex flex-col space-y-2.5 min-w-0">
            <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between gap-2 min-w-0">
              <span className="truncate min-w-0">
                Active File:{' '}
                <strong className="text-slate-900">{activeLoadedTitle}</strong>
              </span>
              {loadingSingleChapterId || isResolvingUrl ? (
                <span className="text-violet-700 font-bold flex items-center gap-1 shrink-0">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Fetching...
                </span>
              ) : (
                result && (
                  <span className="text-emerald-700 font-bold shrink-0">
                    ✓ Synced
                  </span>
                )
              )}
            </div>

            {fetchError ? (
              <div className="flex-1 min-h-[260px] sm:min-h-[360px] lg:min-h-[560px] rounded-xl border border-amber-200 bg-amber-50/70 p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                  {requiresAuth ? (
                    <KeyRound className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="space-y-1 max-w-md">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {requiresAuth
                      ? 'Mock Matrix Hub Login Required for Live Questions'
                      : 'Unable to Fetch Live Questions'}
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{fetchError}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginError(null);
                      setShowLoginModal(true);
                    }}
                    className="px-4 py-2 text-xs font-extrabold text-white bg-violet-700 hover:bg-violet-800 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>
                      {session ? 'Switch / Re-verify Account' : 'Sign In / Paste Session Token'}
                    </span>
                  </button>
                  {activeChapterId && resolvedExam?.chapters && (
                    <button
                      type="button"
                      onClick={() => {
                        const target = resolvedExam.chapters.find(
                          (c) => c.id === activeChapterId
                        );
                        if (target) handleLoadSingleChapter(target);
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl cursor-pointer"
                    >
                      Retry Fetch
                    </button>
                  )}
                </div>
              </div>
            ) : result ? (
              <pre className="w-full flex-1 min-h-[300px] sm:min-h-[420px] lg:h-[600px] p-3 sm:p-3.5 text-[11px] font-mono leading-relaxed bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-y-auto whitespace-pre-wrap break-words select-all cursor-text shadow-inner">
                {result.cleanTxt}
              </pre>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium space-y-1">
                <span className="font-bold">⚠️ JSON Format Error:</span>
                <p className="font-mono text-[11px]">{error}</p>
              </div>
            ) : (
              <div className="flex-1 min-h-[260px] sm:min-h-[360px] lg:min-h-[560px] rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mb-1" />
                <p className="text-xs font-medium text-slate-600">
                  Click <b>&quot;Fetch All&quot;</b> or <b>&quot;Load Chapter&quot;</b> on any item to view clean .txt output here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
