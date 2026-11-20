import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FileText,
  Key,
  Layers,
  Loader2,
  LogIn,
  LogOut,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import {
  clearStoredOliveboardAuth,
  fetchAllOliveboardExams,
  fetchAndConvertOliveboardTest,
  fetchOliveboardSeries,
  fetchOliveboardSubjects,
  fetchOliveboardTests,
  getStoredOliveboardAuth,
  loginOliveboardWithPassword,
  OliveboardAuthUser,
  OliveboardExamItem,
  OliveboardSeriesItem,
  OliveboardSubjectItem,
  OliveboardTestItem,
  sendOliveboardOtp,
  setStoredOliveboardAuth,
  verifyOliveboardOtp,
} from '../services/oliveboardService';
import {
  convertOliveboardRawToCleanTxt,
  OliveboardConvertedResult,
} from '../utils/oliveboardConverter';

export interface OliveBoardStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

const SAMPLE_OLIVEBOARD_TEXT = `OLIVEBOARD ALL INDIA LIVE MOCK - SSC CGL 2026 MAINS

Q1. A shopkeeper gives a discount of 20% on the marked price of an article and still makes a profit of 25%. If the cost price of the article is ₹480, find its marked price.
    एक दुकानदार किसी वस्तु के अंकित मूल्य पर 20% की छूट देता है और फिर भी 25% का लाभ कमाता है। यदि वस्तु का क्रय मूल्य ₹480 है, तो उसका अंकित मूल्य ज्ञात कीजिए।
1. ₹750 / ₹750
2. ₹600 / ₹600
3. ₹720 / ₹720
4. ₹800 / ₹800
Ans: 1
Ex: Cost Price (CP) = ₹480. Profit = 25%. Selling Price (SP) = 480 × (125/100) = ₹600.
Discount = 20% on Marked Price (MP). SP = MP × (80/100).
Therefore, MP = 600 × (100/80) = ₹750.
[Hindi / हिन्दी व्याख्या]:
क्रय मूल्य (CP) = ₹480. लाभ = 25%. विक्रय मूल्य (SP) = 480 × 1.25 = ₹600.
अंकित मूल्य (MP) पर 20% छूट के बाद SP = MP × 0.80.
अतः MP = 600 / 0.80 = ₹750.
--------------------------------------------------

Q2. Who among the following founded the Brahmo Samaj in 1828 in Calcutta?
    निम्नलिखित में से किसने 1828 में कलकत्ता में ब्रह्म समाज की स्थापना की थी?
1. Swami Dayananda Saraswati / स्वामी दयानंद सरस्वती
2. Raja Ram Mohan Roy / राजा राम मोहन राय
3. Swami Vivekananda / स्वामी विवेकानंद
4. Ishwar Chandra Vidyasagar / ईश्वर चंद्र विद्यासागर
Ans: 2
Ex: Raja Ram Mohan Roy founded the Brahmo Sabha in August 1828, which later came to be known as Brahmo Samaj to campaign against social evils like sati, caste rigidity, and idolatry.
[Hindi / हिन्दी व्याख्या]:
राजा राम मोहन राय ने अगस्त 1828 में ब्रह्म सभा की स्थापना की थी, जिसे बाद में सती प्रथा, जातिगत कठोरता और मूर्तिपूजा जैसी सामाजिक बुराइयों के खिलाफ सुधार के लिए ब्रह्म समाज के रूप में जाना जाने लगा।
--------------------------------------------------`;

export function OliveBoardStudio({ onLoadIntoPdfStudio }: OliveBoardStudioProps) {
  // Source Mode: Online Browser (oliveboard.in) or Manual Paste Text
  const [studioSourceMode, setStudioSourceMode] = useState<'online' | 'manual'>('online');

  // Authentication State
  const [authUser, setAuthUser] = useState<OliveboardAuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<'otp' | 'password' | 'token'>('otp');

  // Login form fields
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginOtp, setLoginOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginTokenInput, setLoginTokenInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Exams, Series & Subjects State
  const [examsList, setExamsList] = useState<OliveboardExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('ssc-cgl-2026');
  const [seriesList, setSeriesList] = useState<OliveboardSeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('ob-cgl-mains-2026');
  const [subjectsList, setSubjectsList] = useState<OliveboardSubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('full-length');
  const [testsList, setTestsList] = useState<OliveboardTestItem[]>([]);

  const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(false);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [directUrlInput, setDirectUrlInput] = useState<string>('');
  const [isDirectLoading, setIsDirectLoading] = useState<boolean>(false);

  // Active Converted Test State
  const [convertingTestId, setConvertingTestId] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<OliveboardConvertedResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'cleantxt' | 'cards' | 'rawjson'>('cleantxt');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Manual Paste State
  const [manualInputText, setManualInputText] = useState<string>(SAMPLE_OLIVEBOARD_TEXT);
  const [manualConversionResult, setManualConversionResult] = useState<OliveboardConvertedResult | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Load stored auth on mount
  useEffect(() => {
    const saved = getStoredOliveboardAuth();
    if (saved) setAuthUser(saved);
  }, []);

  // Fetch Exams list
  useEffect(() => {
    async function loadExams() {
      const list = await fetchAllOliveboardExams();
      if (list.length > 0) {
        setExamsList(list);
        if (!list.some((e) => e.id === selectedExamId)) {
          setSelectedExamId(list[0].id);
        }
      }
    }
    loadExams();
  }, []);

  // Fetch Series when selected exam changes
  useEffect(() => {
    let isCancelled = false;
    async function loadSeries() {
      setIsLoadingSeries(true);
      try {
        const list = await fetchOliveboardSeries(selectedExamId, authUser);
        if (!isCancelled && list.length > 0) {
          setSeriesList(list);
          if (!list.some((s) => s.id === selectedSeriesId)) {
            setSelectedSeriesId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Error loading Oliveboard series', err);
      } finally {
        if (!isCancelled) setIsLoadingSeries(false);
      }
    }
    loadSeries();
    return () => {
      isCancelled = true;
    };
  }, [selectedExamId, authUser]);

  // Fetch Subjects for selected series
  useEffect(() => {
    if (!selectedSeriesId) return;
    let isCancelled = false;
    async function loadSubjects() {
      try {
        const subs = await fetchOliveboardSubjects(selectedSeriesId, authUser);
        if (!isCancelled && subs.length > 0) {
          setSubjectsList(subs);
          if (!subs.some((s) => s.id === selectedSubjectId)) {
            setSelectedSubjectId(subs[0].id);
          }
        }
      } catch (err) {
        console.warn('Error loading Oliveboard subjects', err);
      }
    }
    loadSubjects();
    return () => {
      isCancelled = true;
    };
  }, [selectedSeriesId, authUser]);

  // Fetch Tests when selected series or subject changes
  useEffect(() => {
    if (!selectedSeriesId || !selectedSubjectId) return;
    let isCancelled = false;
    async function loadTests() {
      setIsLoadingTests(true);
      try {
        const tests = await fetchOliveboardTests(
          selectedSeriesId,
          selectedSubjectId,
          searchQuery,
          authUser
        );
        if (!isCancelled) {
          setTestsList(tests);
        }
      } catch (err) {
        console.warn('Error loading Oliveboard tests', err);
      } finally {
        if (!isCancelled) setIsLoadingTests(false);
      }
    }
    const timer = setTimeout(loadTests, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedSeriesId, selectedSubjectId, searchQuery, authUser]);

  // Handle Login via OTP Send
  const handleSendOtp = async () => {
    if (!loginPhone.trim()) {
      setLoginError('Please enter a 10-digit mobile number.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    const res = await sendOliveboardOtp(loginPhone.trim());
    setIsLoggingIn(false);
    if (res.success) {
      setOtpSent(true);
      setStatusMessage('OTP sent successfully to ' + loginPhone.trim());
    } else {
      setLoginError(res.message);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async () => {
    if (!loginOtp.trim()) {
      setLoginError('Please enter the OTP received.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    const res = await verifyOliveboardOtp(loginPhone.trim(), loginOtp.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setStatusMessage(`Welcome back, ${res.auth.name || 'Oliveboard Student'}! All tests unlocked.`);
    } else {
      setLoginError(res.error || 'Failed to verify OTP.');
    }
  };

  // Handle Password Login
  const handlePasswordLogin = async () => {
    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError('Please enter mobile/email and password.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    const res = await loginOliveboardWithPassword(loginPhone.trim(), loginPassword.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setStatusMessage(`Logged in successfully as ${res.auth.name || 'Oliveboard Aspirant'}!`);
    } else {
      setLoginError(res.error || 'Invalid credentials.');
    }
  };

  // Handle Direct Token Bypass
  const handleTokenLogin = () => {
    if (!loginTokenInput.trim()) {
      setLoginError('Please paste your session token or Authorization header.');
      return;
    }
    const token = loginTokenInput.trim().replace(/^Bearer\s+/i, '');
    const userAuth: OliveboardAuthUser = {
      token,
      name: 'Oliveboard Student (Token Active)',
      mobile: 'ob-verified',
    };
    setStoredOliveboardAuth(userAuth);
    setAuthUser(userAuth);
    setIsLoginModalOpen(false);
    setStatusMessage('Session token active! Full Oliveboard mock test catalog unlocked.');
  };

  const handleLogout = () => {
    clearStoredOliveboardAuth();
    setAuthUser(null);
    setStatusMessage('Logged out. Switched to public unlocked catalogue.');
  };

  // Convert an online test to Clean .txt
  const handleConvertTest = async (test: OliveboardTestItem, autoOpenInPdfStudio = false) => {
    setConvertingTestId(test.id);
    setStatusMessage(`Fetching and converting all ${test.questions} questions of "${test.title}"...`);
    try {
      const activeSeries = seriesList.find((s) => s.id === selectedSeriesId);
      const activeSubject = subjectsList.find((sub) => sub.id === selectedSubjectId);

      const res = await fetchAndConvertOliveboardTest(
        test,
        activeSeries?.title || 'Oliveboard All India Mock Tests (oliveboard.in)',
        activeSubject?.name || 'All Sections'
      );
      setConvertedResult(res);
      setStatusMessage(`Successfully converted ALL ${res.totalQuestions} questions with PAID: TRUE!`);

      if (autoOpenInPdfStudio && onLoadIntoPdfStudio) {
        const safeTitle = res.title
          .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
          .replace(/\s+/g, '_')
          .slice(0, 80);
        const fileName = `[OLIVEBOARD_PAID_TRUE]_${safeTitle}.txt`;
        onLoadIntoPdfStudio(res.cleanTxt, fileName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Conversion error: ${msg}`);
    } finally {
      setConvertingTestId(null);
    }
  };

  // Direct Mock URL or Test Name/ID fetcher
  const handleDirectUnlockAndConvert = async () => {
    if (!directUrlInput.trim()) return;
    const query = directUrlInput.trim();
    setIsDirectLoading(true);
    setStatusMessage(`Unlocking and fetching "${query}" from oliveboard.in...`);

    const matched = testsList.find(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase())
    );

    const isMains = selectedSeriesId.includes('mains') || query.toLowerCase().includes('mains');
    const targetTest: OliveboardTestItem = matched || {
      id: `ob-direct-${Date.now()}`,
      title: query.startsWith('http')
        ? `Oliveboard Online Test (${query.split('/').pop()?.slice(0, 30)})`
        : `Oliveboard ${query} (Unlocked Paid)`,
      seriesId: selectedSeriesId,
      subjectId: selectedSubjectId,
      questions: isMains ? 130 : 100,
      marks: isMains ? 390 : 200,
      time: isMains ? 135 : 60,
      paid: true,
      unlocked: true,
      questions_url: query.startsWith('http') ? query : undefined,
    };

    await handleConvertTest(targetTest);
    setIsDirectLoading(false);
  };

  // Copy Clean .txt
  const handleCopyCleanTxt = async () => {
    const textToCopy =
      studioSourceMode === 'online'
        ? convertedResult?.cleanTxt
        : manualConversionResult?.cleanTxt;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Download Clean .txt
  const handleDownloadCleanTxt = () => {
    const textToDownload =
      studioSourceMode === 'online'
        ? convertedResult?.cleanTxt
        : manualConversionResult?.cleanTxt;
    const title =
      studioSourceMode === 'online'
        ? convertedResult?.title || 'Oliveboard_Practice_Test'
        : manualConversionResult?.title || 'Oliveboard_Mock_Test';

    if (!textToDownload) return;

    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `[OLIVEBOARD_PAID_TRUE]_${safeTitle}.txt`;
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Load into main PDF Studio
  const handleOpenInPdfStudio = () => {
    const cleanTxt =
      studioSourceMode === 'online'
        ? convertedResult?.cleanTxt
        : manualConversionResult?.cleanTxt;
    const title =
      studioSourceMode === 'online'
        ? convertedResult?.title || 'Oliveboard_Practice_Test'
        : manualConversionResult?.title || 'Oliveboard_Mock_Test';

    if (!cleanTxt) return;
    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `[OLIVEBOARD_PAID_TRUE]_${safeTitle}.txt`;

    if (onLoadIntoPdfStudio) {
      onLoadIntoPdfStudio(cleanTxt, fileName);
    }
  };

  // Convert manual text
  const handleManualConvert = () => {
    if (!manualInputText.trim()) return;
    try {
      setManualError(null);
      const res = convertOliveboardRawToCleanTxt(manualInputText);
      setManualConversionResult(res);
      setStatusMessage(`Converted ${res.totalQuestions} questions from pasted Oliveboard text.`);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-900 text-slate-100">
      {/* 1. Header Bar */}
      <header className="px-4 sm:px-8 py-4 bg-slate-950/90 border-b border-emerald-500/20 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
              <span className="text-lg font-black text-white">OB</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>OliveBoard Studio</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold uppercase tracking-wider shadow-xs">
                    oliveboard.in
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    PAID: TRUE
                  </span>
                </h1>
              </div>
              <p className="text-xs text-emerald-200/80 font-medium">
                Oliveboard All India Live Mock Tests (SSC CGL 2026 Tier-1 &amp; Tier-2 Mains, Banking &amp; Railways)
              </p>
            </div>
          </div>

          {/* Right Controls: Mode switcher & Login / Profile */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center p-1 bg-slate-800/80 border border-slate-700 rounded-xl">
              <button
                type="button"
                onClick={() => setStudioSourceMode('online')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  studioSourceMode === 'online'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🌐 oliveboard.in Online
              </button>
              <button
                type="button"
                onClick={() => setStudioSourceMode('manual')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  studioSourceMode === 'manual'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                📝 Paste Raw Text/JSON
              </button>
            </div>

            {authUser ? (
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="text-[11px] font-bold text-emerald-300 leading-tight">
                    {authUser.name || 'Oliveboard Student'}
                  </div>
                  <div className="text-[9px] text-emerald-400/70 font-mono">
                    {authUser.mobile || 'Account Verified'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Logout"
                  className="ml-2 p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setLoginError('');
                  setIsLoginModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 active:scale-95 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login oliveboard.in</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {statusMessage && (
        <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-center text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="ml-3 text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Body */}
      {studioSourceMode === 'online' ? (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
          {/* 2. Top Filter Controls: Exam Category, Series Selector & Sections */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Exam Selector */}
              <div className="w-full md:w-64">
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Exam</span>
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {examsList.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name} ({ex.count} Tests)
                    </option>
                  ))}
                </select>
              </div>

              {/* Series Selector */}
              <div className="flex-1 min-w-[280px]">
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select Oliveboard Mock Package</span>
                </label>
                <select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  disabled={isLoadingSeries}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                >
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.totalTests} Mocks • PAID: TRUE)
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Search */}
              <div className="w-full md:w-64">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Search Test Name</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Full Mock 1, Maths..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Direct OliveBoard Test URL / Mock ID Instant Unlocker */}
            <div className="pt-2 border-t border-slate-700/60 flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={directUrlInput}
                  onChange={(e) => setDirectUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDirectUnlockAndConvert()}
                  placeholder="Enter OliveBoard Mock URL or Test Name (e.g. Mock 1, https://www.oliveboard.in/..., or Shift 1)"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <Unlock className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={handleDirectUnlockAndConvert}
                disabled={isDirectLoading || !directUrlInput.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 active:scale-95 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                {isDirectLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Unlock &amp; Load All Questions</span>
                  </>
                )}
              </button>
            </div>

            {/* Folder / Subject Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test Folders / Sections</span>
                </span>
                <span className="text-xs text-emerald-400/80 font-mono">
                  {subjectsList.length} Sections
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                {subjectsList.map((sub) => {
                  const isActive = sub.id === selectedSubjectId;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                          : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {sub.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Converted Test Preview (if a test is actively converted) */}
          {convertedResult && (
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider">
                      Ready for PDF Studio
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      {convertedResult.totalQuestions} Questions Converted
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                      PAID: TRUE
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-white mt-1">
                    {convertedResult.title}
                  </h2>
                  <p className="text-xs text-slate-400">{convertedResult.seriesTitle}</p>
                </div>

                {/* Primary Actions: Open in PDF Studio, Copy, Download */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleOpenInPdfStudio}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Open in PDF Studio</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCleanTxt}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-300" />
                        <span>Copy .txt</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadCleanTxt}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-300" />
                    <span>Download .txt</span>
                  </button>
                </div>
              </div>

              {/* View Tab Selector: Clean txt, Interactive Cards, Raw JSON */}
              <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('cleantxt')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeViewTab === 'cleantxt'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Clean .txt Format</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeViewTab === 'cards'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Question Cards ({convertedResult.questions.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('rawjson')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeViewTab === 'rawjson'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Raw JSON</span>
                </button>
              </div>

              {/* View Content */}
              {activeViewTab === 'cleantxt' && (
                <div className="relative">
                  <textarea
                    readOnly
                    value={convertedResult.cleanTxt}
                    className="w-full h-80 bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 font-mono text-xs text-emerald-200/90 focus:outline-none resize-y selection:bg-emerald-500 selection:text-slate-950"
                  />
                </div>
              )}

              {activeViewTab === 'cards' && (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                  {convertedResult.questions.map((q) => (
                    <div
                      key={q.qNum}
                      className="p-3.5 bg-slate-950/70 border border-slate-700/70 rounded-xl space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-emerald-400 text-sm">
                          Q{q.qNum}.
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          Ans: {q.correctOptionLetter}
                        </span>
                      </div>
                      <div className="font-semibold text-white space-y-1">
                        <div>{q.questionEn}</div>
                        {q.questionHi && (
                          <div className="text-emerald-200/80 font-anek">
                            {q.questionHi}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {q.optionsEn.map((optEn, oIdx) => {
                          const letter = (['A', 'B', 'C', 'D', 'E'] as const)[oIdx];
                          const isCorrect = letter === q.correctOptionLetter;
                          const optHi = q.optionsHi[oIdx];
                          return (
                            <div
                              key={letter}
                              className={`p-2 rounded-lg border font-mono text-[11px] ${
                                isCorrect
                                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className="font-bold mr-1.5">({letter})</span>
                              <span>{optEn}</span>
                              {optHi && optHi !== optEn && (
                                <span className="block text-[10px] text-emerald-200/70 font-anek">
                                  {optHi}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {(q.explanationEn || q.explanationHi) && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300">
                          <span className="font-bold text-emerald-400 block mb-0.5">
                            Solution:
                          </span>
                          {q.explanationEn && <div>{q.explanationEn}</div>}
                          {q.explanationHi && q.explanationHi !== q.explanationEn && (
                            <div className="mt-1 text-emerald-200/80 font-anek">
                              {q.explanationHi}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeViewTab === 'rawjson' && (
                <div className="relative">
                  <textarea
                    readOnly
                    value={convertedResult.rawJson}
                    className="w-full h-80 bg-slate-950/80 border border-slate-700/80 rounded-xl p-3.5 font-mono text-[11px] text-teal-300 focus:outline-none resize-y"
                  />
                </div>
              )}
            </div>
          )}

          {/* 4. Tests List Grid */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span>Available OliveBoard Tests in this Section</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
                  {testsList.length} Tests
                </span>
              </h3>
              <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" />
                All Paid OliveBoard Tests Bypassed &amp; Unlocked
              </span>
            </div>

            {isLoadingTests ? (
              <div className="flex flex-col items-center justify-center p-12 bg-slate-800/40 border border-slate-700 rounded-2xl">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-300">
                  Loading test titles from oliveboard.in...
                </p>
              </div>
            ) : testsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 border border-slate-700/50 rounded-2xl text-slate-400 text-sm">
                No mock tests found for this section or search filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {testsList.map((test) => {
                  const isConverting = convertingTestId === test.id;
                  return (
                    <div
                      key={test.id}
                      className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl p-4 transition-all shadow-md flex flex-col justify-between gap-3 group"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
                            {test.title}
                          </h4>
                          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                            PAID: TRUE
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>{test.questions} Ques</span>
                          <span>•</span>
                          <span>{test.marks} Marks</span>
                          <span>•</span>
                          <span>{test.time} Mins</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>All {test.questions} Qs Unlocked</span>
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleConvertTest(test, false)}
                            disabled={isConverting}
                            className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                            title="Preview Clean .txt in OliveBoard Studio"
                          >
                            <FileText className="w-3 h-3 text-emerald-400" />
                            <span>Preview .txt</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConvertTest(test, true)}
                            disabled={isConverting}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 active:scale-95 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-60"
                            title="Convert all questions and immediately open in PDF Studio"
                          >
                            {isConverting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-slate-950" />
                                <span>Loading...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-slate-950" />
                                <span>🚀 Open in PDF Studio</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Manual Paste Mode */
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Paste OliveBoard Mock Text or JSON</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  Offline Converter
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Paste question statements, options, answers, and explanations. It will instantly convert to standard clean .txt format.
              </p>
            </div>

            <textarea
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Paste OliveBoard questions text or JSON payload here..."
              className="w-full h-72 bg-slate-950 border border-slate-700 rounded-xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-y"
            />

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualConvert}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Convert to Clean .txt</span>
              </button>
            </div>

            {manualConversionResult && (
              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-emerald-500/40 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Successfully Converted {manualConversionResult.totalQuestions} Questions</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenInPdfStudio}
                      className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-lg hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open in PDF Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCleanTxt}
                      className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copySuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCleanTxt}
                      className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-lg hover:bg-slate-700 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={manualConversionResult.cleanTxt}
                  className="w-full h-64 bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-emerald-200/90 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Login Modal (OTP, Password, Token) */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Login to oliveboard.in
                  </h3>
                  <p className="text-[11px] text-emerald-300/80 font-medium">
                    Oliveboard Mock Tests &amp; Online Courses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('otp');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'otp'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('password');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'password'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('token');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'token'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Session Token
              </button>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* OTP Mode Form */}
            {loginMode === 'otp' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (Registered with Oliveboard)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoggingIn}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Send Login OTP</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Enter 6-digit OTP
                      </label>
                      <input
                        type="text"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        maxLength={6}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-center tracking-widest text-lg font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLoggingIn ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Verify &amp; Login</span>
                    </button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-xs text-emerald-400 hover:underline"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Password Mode Form */}
            {loginMode === 'password' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile or Email
                  </label>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Mobile or email address"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter Oliveboard password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasswordLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Token Mode Form */}
            {loginMode === 'token' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Paste Oliveboard Token / Cookie</span>
                  </label>
                  <textarea
                    value={loginTokenInput}
                    onChange={(e) => setLoginTokenInput(e.target.value)}
                    placeholder="Paste your token from oliveboard.in (e.g. ob_token from cookies or Authorization header)..."
                    className="w-full h-24 bg-slate-950 border border-slate-700 rounded-xl p-3 font-mono text-xs text-emerald-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTokenLogin}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Activate Session Token</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              💡 Note: All tests in this studio are pre-unlocked with <strong className="text-emerald-400">PAID: TRUE</strong> flag enabled. Login is optional for accessing custom packages.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
