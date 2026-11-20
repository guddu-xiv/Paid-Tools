import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FileText,
  Folder,
  FolderArchive,
  FolderOpen,
  Key,
  Layers,
  Link2,
  ListTree,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Phone,
  Radio,
  Sparkles,
  X,
} from 'lucide-react';
import {
  clearStoredTestrankingAuth,
  fetchAndConvertTestrankingTest,
  fetchTestrankingCatalog,
  fetchTestrankingLiveTests,
  fetchTestrankingSeriesDetail,
  getStoredTestrankingAuth,
  loginTestrankingWithPin,
  parseTestrankingSessionInput,
  parseTestrankingUrlOrSlug,
  resolveTestrankingUrls,
  sendTestrankingOtp,
  setStoredTestrankingAuth,
  TestrankingAuthUser,
  TestrankingBlockedError,
  TestrankingCategoryItem,
  TestrankingFolderNode,
  TestrankingFolderPackage,
  TestrankingSectionItem,
  TestrankingSeriesItem,
  TestrankingTestItem,
  verifyTestrankingOtp,
} from '../services/testrankingService';
import { RbeConvertedAppxResult } from '../utils/rbeRevolutionConverter';
import {
  convertTestrankingQuestionsToCleanTxt,
  convertTestrankingRawInputToCleanTxt,
  extractRawQuestionsFromPayload,
} from '../utils/testrankingConverter';

export interface TestrankingStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

export function TestrankingStudio({ onLoadIntoPdfStudio }: TestrankingStudioProps) {
  const [studioSourceMode, setStudioSourceMode] = useState<'online' | 'manual'>('online');

  // Authentication State
  const [authUser, setAuthUser] = useState<TestrankingAuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<'otp' | 'pin' | 'token'>('otp');

  // Login Form Fields
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginOtp, setLoginOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [loginPin, setLoginPin] = useState<string>('');
  const [loginTokenInput, setLoginTokenInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [loginBlockedHint, setLoginBlockedHint] = useState<boolean>(false);
  const [tokenScriptCopied, setTokenScriptCopied] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Catalog State (auto-loads all live categories + series on mount)
  const [categoriesList, setCategoriesList] = useState<TestrankingCategoryItem[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [seriesList, setSeriesList] = useState<TestrankingSeriesItem[]>([]);
  const [selectedSeriesSlug, setSelectedSeriesSlug] = useState<string>('');
  const [selectedSeriesTitle, setSelectedSeriesTitle] = useState<string>('');
  const [sectionsList, setSectionsList] = useState<TestrankingSectionItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [testsList, setTestsList] = useState<TestrankingTestItem[]>([]);
  const [showingLiveFeed, setShowingLiveFeed] = useState<boolean>(false);

  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);
  const [onlyFreeTests, setOnlyFreeTests] = useState<boolean>(false);

  // Unified URL Input & Folder Tree State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isResolvingUrls, setIsResolvingUrls] = useState<boolean>(false);
  const [resolvedPackages, setResolvedPackages] = useState<TestrankingFolderPackage[]>([]);
  const [expandedPackageIds, setExpandedPackageIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Converted Output State
  const [convertingTestId, setConvertingTestId] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<RbeConvertedAppxResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'cleantxt' | 'cards' | 'rawjson'>('cleantxt');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorBanner, setErrorBanner] = useState<string>('');

  // Bulk Bilingual .txt ZIP Export
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{
    done: number;
    total: number;
    failed: number;
    currentTitle: string;
  } | null>(null);
  const zipCancelRef = useRef<boolean>(false);

  // Manual Paste State
  const [manualInputText, setManualInputText] = useState<string>('');
  const [manualConversionResult, setManualConversionResult] = useState<{
    cleanTxt: string;
    totalQuestions: number;
    title: string;
  } | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Blocked upstream extraction helper state
  const [blockedTestContext, setBlockedTestContext] = useState<{
    test: TestrankingTestItem;
    seriesSeoSlug?: string;
    seriesTitle?: string;
  } | null>(null);
  const [helperPasteInput, setHelperPasteInput] = useState<string>('');
  const [helperScriptCopied, setHelperScriptCopied] = useState<boolean>(false);

  useEffect(() => {
    const saved = getStoredTestrankingAuth();
    if (saved) setAuthUser(saved);
  }, []);

  useEffect(() => {
    if (!convertedResult) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConvertedResult(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [convertedResult]);

  // Automatically load all live categories & test series on mount
  useEffect(() => {
    let isCancelled = false;
    async function loadCatalog() {
      setIsLoadingCatalog(true);
      setErrorBanner('');
      try {
        const res = await fetchTestrankingCatalog(authUser);
        if (!isCancelled) {
          setCategoriesList(res.categories);
          setSeriesList(res.series);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorBanner(
            err instanceof Error
              ? err.message
              : 'Failed to load live TestRanking catalog from testranking.in'
          );
        }
      } finally {
        if (!isCancelled) setIsLoadingCatalog(false);
      }
    }
    loadCatalog();
    return () => {
      isCancelled = true;
    };
  }, [authUser]);

  // Automatically load detailed sections & tests whenever a series banner is selected
  useEffect(() => {
    if (!selectedSeriesSlug || showingLiveFeed) {
      if (!showingLiveFeed) {
        setSectionsList([]);
        setTestsList([]);
      }
      return;
    }
    let isCancelled = false;
    async function loadDetail() {
      setIsLoadingTests(true);
      setErrorBanner('');
      try {
        const matchedSeries = seriesList.find((s) => s.slug === selectedSeriesSlug);
        const detail = await fetchTestrankingSeriesDetail(
          selectedSeriesSlug,
          authUser,
          matchedSeries?.seoSlug
        );
        if (!isCancelled) {
          setSelectedSeriesTitle(detail.seriesTitle);
          setSectionsList(detail.sections);
          setSelectedSectionId('all');
          setTestsList(detail.tests);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setSectionsList([]);
          setTestsList([]);
          setErrorBanner(
            err instanceof Error ? err.message : 'Failed to load TestRanking series tests'
          );
        }
      } finally {
        if (!isCancelled) setIsLoadingTests(false);
      }
    }
    loadDetail();
    return () => {
      isCancelled = true;
    };
  }, [selectedSeriesSlug, showingLiveFeed, authUser, seriesList]);

  const handleLoadLiveMocksAndQuizzes = async () => {
    setShowingLiveFeed(true);
    setSelectedSeriesSlug('__live__');
    setSelectedSeriesTitle('TestRanking Live Mock Tests & Daily Quizzes');
    setIsLoadingTests(true);
    setErrorBanner('');
    setStatusMessage('Fetching live mock tests & quizzes from testranking.in...');
    try {
      const items = await fetchTestrankingLiveTests(authUser);
      const mockCnt = items.filter((i) => i.flow === 'mocktest').length;
      const quizCnt = items.filter((i) => i.flow === 'quiz').length;
      setSectionsList([
        { id: 'all', name: `All Live (${items.length})`, bucket: 'all', count: items.length },
        ...(mockCnt > 0
          ? [{ id: 'flow:mocktest', name: `Live Mock Tests (${mockCnt})`, count: mockCnt }]
          : []),
        ...(quizCnt > 0
          ? [{ id: 'flow:quiz', name: `Live / Daily Quizzes (${quizCnt})`, count: quizCnt }]
          : []),
      ]);
      setSelectedSectionId('all');
      setTestsList(items);
      setStatusMessage(`Loaded ${items.length} live mocks & quizzes from testranking.in.`);
      setTimeout(() => {
        document
          .getElementById('testranking-tests-grid-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to load live tests');
      setStatusMessage('');
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Unified URL / Slug Resolver
  const handleEnterUrlSubmit = async (overrideUrl?: string) => {
    const raw = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    if (!raw) return;

    const tokens = raw
      .split(/[\r\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const firstParsed = parseTestrankingUrlOrSlug(tokens[0]);

    // If user pasted a direct test URL (/mock-test/... or /daily-quiz/...), extract immediately
    if (tokens.length === 1 && firstParsed.kind === 'test') {
      setConvertingTestId(firstParsed.slug);
      setConvertedResult(null);
      setActiveViewTab('cleantxt');
      setErrorBanner('');
      setStatusMessage(`Fetching live questions for "${firstParsed.slug}"...`);
      try {
        const res = await fetchAndConvertTestrankingTest(
          {
            id: firstParsed.slug,
            slug: firstParsed.slug,
            title: firstParsed.slug,
            sectionBucket: 'live',
            sectionLabel: firstParsed.flow === 'quiz' ? 'Quiz' : 'Mock Test',
            time: '—',
            questions: '—',
            marks: '—',
            isFree: true,
            flow: firstParsed.flow,
            locked: false,
            hasLiveData: true,
          },
          'TestRanking (testranking.in)',
          'Direct Lookup',
          authUser
        );
        setConvertedResult(res);
        setStatusMessage(`✓ Loaded ${res.totalQuestions} live questions for "${res.title}"!`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to extract test';
        if (err instanceof TestrankingBlockedError || /blocked|unreachable/i.test(msg)) {
          setBlockedTestContext({
            test: {
              id: firstParsed.slug,
              slug: firstParsed.slug,
              title: firstParsed.slug,
              sectionBucket: 'live',
              sectionLabel: firstParsed.flow === 'quiz' ? 'Quiz' : 'Mock Test',
              time: '—',
              questions: '—',
              marks: '—',
              isFree: true,
              flow: firstParsed.flow,
              locked: false,
              hasLiveData: true,
            },
          });
        }
        setErrorBanner(msg);
        setStatusMessage('');
      } finally {
        setConvertingTestId(null);
      }
      return;
    }

    // If user pasted category URL
    if (tokens.length === 1 && firstParsed.kind === 'category') {
      setSelectedCategorySlug(firstParsed.slug);
      setStatusMessage(`Filtered exam category to "${firstParsed.slug}".`);
      return;
    }

    // Otherwise resolve series URL(s) / slug(s) into Folder Tree
    setIsResolvingUrls(true);
    setErrorBanner('');
    setStatusMessage('Fetching live folders & tests from testranking.in...');
    try {
      const pkgs = await resolveTestrankingUrls(tokens.join('\n'), authUser);
      if (pkgs.length > 0) {
        setResolvedPackages(pkgs);
        setExpandedPackageIds(new Set(pkgs.map((p) => p.id)));
        setShowingLiveFeed(false);
        setSelectedSeriesSlug(pkgs[0].slug);

        const totalFolders = pkgs.reduce((acc, p) => acc + p.folders.length, 0);
        const totalTests = pkgs.reduce((acc, p) => acc + p.totalTests, 0);
        setStatusMessage(
          `Resolved ${pkgs.length} live package(s), ${totalFolders} folders, and ${totalTests} tests from testranking.in.`
        );
      } else {
        setStatusMessage('No series found for that URL/slug. Showing catalog instead.');
      }
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to resolve URL');
      setStatusMessage('');
    } finally {
      setIsResolvingUrls(false);
    }
  };

  const togglePackageAccordion = (pkgId: string) => {
    setExpandedPackageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pkgId)) next.delete(pkgId);
      else next.add(pkgId);
      return next;
    });
  };

  const toggleFolderAccordion = (folderKey: string) => {
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderKey)) next.delete(folderKey);
      else next.add(folderKey);
      return next;
    });
  };

  const handleSelectFolderForBrowsing = (
    pkg: TestrankingFolderPackage,
    folder: TestrankingFolderNode
  ) => {
    setShowingLiveFeed(false);
    setSelectedSeriesSlug(pkg.slug);
    setSelectedSectionId(folder.id);
    setStatusMessage(`Switched active section to "${folder.name}"`);
    const el = document.getElementById('testranking-tests-grid-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Auth Handlers
  const handleSendOtp = async () => {
    if (!loginIdentifier.trim()) {
      setLoginError('Please enter a 10-digit mobile number or email.');
      return;
    }
    setLoginError('');
    setLoginBlockedHint(false);
    setIsLoggingIn(true);
    const res = await sendTestrankingOtp(loginIdentifier.trim());
    setIsLoggingIn(false);
    if (res.success) {
      setOtpSent(true);
      setStatusMessage('OTP sent successfully to ' + loginIdentifier.trim());
    } else {
      setLoginError(res.message);
      if (res.blocked || /blocked|unreachable|failed to fetch|429/i.test(res.message)) {
        setLoginBlockedHint(true);
      }
    }
  };

  const handleVerifyOtp = async () => {
    if (!loginOtp.trim()) {
      setLoginError('Please enter the OTP received.');
      return;
    }
    setLoginError('');
    setLoginBlockedHint(false);
    setIsLoggingIn(true);
    const res = await verifyTestrankingOtp(loginIdentifier.trim(), loginOtp.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setLoginBlockedHint(false);
      setStatusMessage(`Welcome back, ${res.auth.name || 'TestRanking Student'}! Full access unlocked.`);
    } else {
      const errMsg = res.error || 'Failed to verify OTP.';
      setLoginError(errMsg);
      if (res.blocked || /blocked|unreachable|failed to fetch|429/i.test(errMsg)) {
        setLoginBlockedHint(true);
      }
    }
  };

  const handlePinLogin = async () => {
    if (!loginIdentifier.trim() || !loginPin.trim()) {
      setLoginError('Please enter mobile/email and PIN/password.');
      return;
    }
    setLoginError('');
    setLoginBlockedHint(false);
    setIsLoggingIn(true);
    const res = await loginTestrankingWithPin(loginIdentifier.trim(), loginPin.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setLoginBlockedHint(false);
      setStatusMessage(`Logged in successfully as ${res.auth.name || 'TestRanking Student'}!`);
    } else {
      const errMsg = res.error || 'Invalid credentials.';
      setLoginError(errMsg);
      if (res.blocked || /blocked|unreachable|failed to fetch|429/i.test(errMsg)) {
        setLoginBlockedHint(true);
      }
    }
  };

  const handleTokenLogin = () => {
    const parsedAuth = parseTestrankingSessionInput(loginTokenInput);
    if (!parsedAuth) {
      setLoginError('Please paste a valid TestRanking Bearer token (quizapp_token) or session JSON.');
      return;
    }
    setStoredTestrankingAuth(parsedAuth);
    setAuthUser(parsedAuth);
    setIsLoginModalOpen(false);
    setLoginBlockedHint(false);
    setLoginError('');
    setStatusMessage(
      `Session connected for ${parsedAuth.name || 'TestRanking Student'}! Paid tests & solutions unlocked.`
    );
  };

  const getTokenExtractorScript = () =>
    `(()=>{const t=localStorage.getItem('quizapp_token')||'';if(!t){prompt('Pehle testranking.in par OTP/PIN se login karein.','');return;}let u=null;try{u=JSON.parse(localStorage.getItem('quizapp_user')||'null');}catch{}const out=JSON.stringify(u?{token:t,user:u}:{token:t});try{copy(out);console.log('Copied TestRanking token! Paste in Session Token box.');}catch{prompt('Ye Session Token copy karein (Ctrl+C):',out);}})()`;

  const handleLogout = () => {
    clearStoredTestrankingAuth();
    setAuthUser(null);
    setStatusMessage('Logged out. Switched to public TestRanking catalog.');
  };

  // Convert single test to Clean .txt
  const handleConvertTest = async (test: TestrankingTestItem) => {
    setConvertingTestId(test.id);
    setConvertedResult(null);
    setBlockedTestContext(null);
    setActiveViewTab('cleantxt');
    setErrorBanner('');
    setStatusMessage(`Fetching live questions for "${test.title}"...`);
    try {
      const res = await fetchAndConvertTestrankingTest(
        test,
        selectedSeriesTitle || 'TestRanking (testranking.in)',
        test.sectionLabel || 'All Sections',
        authUser
      );
      setConvertedResult(res);
      setStatusMessage(
        `✓ "${test.title}" converted successfully (${res.totalQuestions} questions)!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof TestrankingBlockedError || /blocked|unreachable/i.test(msg)) {
        const matchedSeries = seriesList.find((s) => s.slug === (test.seriesSlug || selectedSeriesSlug));
        setBlockedTestContext({
          test,
          seriesSeoSlug: matchedSeries?.seoSlug,
          seriesTitle: matchedSeries?.title || selectedSeriesTitle,
        });
      }
      setErrorBanner(msg);
      setStatusMessage('');
    } finally {
      setConvertingTestId(null);
    }
  };

  const handleConvertHelperPaste = () => {
    if (!helperPasteInput.trim() || !blockedTestContext) return;
    try {
      const trimmed = helperPasteInput.trim();
      let converted: RbeConvertedAppxResult | null = null;
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          const extracted = extractRawQuestionsFromPayload(parsed);
          if (extracted.questions.length > 0) {
            converted = convertTestrankingQuestionsToCleanTxt(extracted.questions, {
              slug: blockedTestContext.test.slug,
              title: blockedTestContext.test.title || extracted.title || 'TestRanking Mock Test',
              seriesTitle: blockedTestContext.seriesTitle || 'TestRanking (testranking.in)',
              subjectTitle: blockedTestContext.test.sectionLabel || 'All Sections',
              sourceLabel: 'testranking.in (TestRanking)',
            });
          }
        } catch {
          // fall back to generic raw converter
        }
      }
      if (!converted) {
        const rawRes = convertTestrankingRawInputToCleanTxt(trimmed);
        converted = {
          title: blockedTestContext.test.title || rawRes.title,
          seriesTitle: blockedTestContext.seriesTitle || 'TestRanking (testranking.in)',
          totalQuestions: rawRes.totalQuestions,
          cleanTxt: rawRes.cleanTxt,
          questions: [],
          rawJson: '',
        };
      }
      setConvertedResult(converted);
      setBlockedTestContext(null);
      setHelperPasteInput('');
      setErrorBanner('');
      setStatusMessage(
        `✓ "${converted.title}" converted cleanly (${converted.totalQuestions} questions)!`
      );
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : String(err));
    }
  };

  const getConsoleExtractorScript = (ctx: {
    test: TestrankingTestItem;
    seriesSeoSlug?: string;
  }) => {
    const tSlugOrId = JSON.stringify(ctx.test.slug);
    const tTitle = JSON.stringify(ctx.test.title);
    const sSlug = JSON.stringify(ctx.test.seriesSlug || selectedSeriesSlug || '');
    return `(async()=>{const t=localStorage.getItem('quizapp_token')||'';const h=t?{Authorization:'Bearer '+t}:{};let slug=${tSlugOrId};if(/^[0-9a-f-]{20,}$/i.test(slug)&&${sSlug}){const d=await fetch('https://backend.opsolve.xyz/api/v1/public/testseries-detailed-content?slug='+encodeURIComponent(${sSlug}),{headers:h}).then(r=>r.json());const all=[...(d?.data?.mocktests?.fulltest?.data||[]),...(d?.data?.mocktests?.sectionaltest?.data||[]),...(d?.data?.previousyear?.fulltest?.data||[]),...(d?.data?.previousyear?.sectionaltest?.data||[])];const m=all.find(x=>String(x.id)===slug||(x.name||x.title||'').trim()===${tTitle}.trim());if(m?.slug)slug=m.slug;}const s=await fetch('https://backend.opsolve.xyz/api/v1/mocktest-start?slug='+encodeURIComponent(slug),{headers:h}).then(r=>r.json());let out=s;const att=s?.data?.attempt;if(t&&att){await fetch('https://backend.opsolve.xyz/api/v1/submit-mocktest',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({slug,attempt:att,testSubmitted:true,timeTaken:1})});out=await fetch('https://backend.opsolve.xyz/api/v1/mocktest-result?slug='+encodeURIComponent(slug)+'&attempt='+att,{headers:h}).then(r=>r.json());}copy(JSON.stringify(out));console.log('Copied TestRanking JSON to clipboard! Questions ready.');})()`;
  };

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
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadCleanTxt = () => {
    const textToDownload =
      studioSourceMode === 'online'
        ? convertedResult?.cleanTxt
        : manualConversionResult?.cleanTxt;
    const title =
      studioSourceMode === 'online'
        ? convertedResult?.title || 'TestRanking_Mock_Test'
        : manualConversionResult?.title || 'TestRanking_Mock_Test';
    if (!textToDownload) return;

    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `TestRanking_${safeTitle}.txt`;
    const blob = new Blob(['\uFEFF' + textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    setStatusMessage(`✓ Downloaded ${fileName}`);
  };

  const sanitizeZipName = (name: string): string =>
    (name || 'Untitled').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 100);

  // Bulk Bilingual .txt ZIP Export
  const handleDownloadAllTxtZip = async () => {
    const readyTests = displayedTests.filter((t) => !t.locked && t.hasLiveData);
    if (readyTests.length === 0 || isDownloadingZip) return;

    zipCancelRef.current = false;
    setIsDownloadingZip(true);
    setErrorBanner('');
    const total = readyTests.length;
    setZipProgress({ done: 0, total, failed: 0, currentTitle: 'Preparing Bilingual ZIP...' });

    const seriesFolderName = sanitizeZipName(
      selectedSeriesTitle || `TestRanking_${selectedSeriesSlug}`
    );
    const activeSection = sectionsList.find((s) => s.id === selectedSectionId);
    const sectionFolderName = sanitizeZipName(activeSection?.name || 'All_Tests');

    const zip = new JSZip();
    const seriesFolder = zip.folder(seriesFolderName) || zip;
    const targetFolder = seriesFolder.folder(sectionFolderName) || seriesFolder;

    let done = 0;
    let failed = 0;
    const failedTitles: string[] = [];
    const savedIndex: string[] = [];
    const usedNames = new Set<string>();
    const CONCURRENCY = 4;

    try {
      for (let i = 0; i < total; i += CONCURRENCY) {
        if (zipCancelRef.current) break;
        const batch = readyTests.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(async (test, batchOffset) => {
            if (zipCancelRef.current) return;
            const seqIdx = i + batchOffset + 1;
            const prefix = String(seqIdx).padStart(3, '0');
            const cleanBase = sanitizeZipName(test.title || `Test_${test.id}`);
            let fileName = `${prefix}_${cleanBase}.txt`;
            while (usedNames.has(fileName.toLowerCase())) {
              fileName = `${prefix}_${cleanBase}_${test.id}.txt`;
            }
            usedNames.add(fileName.toLowerCase());

            let res: RbeConvertedAppxResult | null = null;
            let lastErr: unknown = null;
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                res = await fetchAndConvertTestrankingTest(
                  test,
                  selectedSeriesTitle || 'TestRanking (testranking.in)',
                  test.sectionLabel || 'All Sections',
                  authUser
                );
                if (res?.cleanTxt) break;
              } catch (err) {
                lastErr = err;
              }
            }

            if (res?.cleanTxt) {
              targetFolder.file(fileName, '\uFEFF' + res.cleanTxt);
              savedIndex.push(`${prefix}. ${test.title} (${res.totalQuestions} Qs) -> ${fileName}`);
            } else {
              failed += 1;
              const errMsg = lastErr instanceof Error ? lastErr.message : 'Failed to load';
              failedTitles.push(`${fileName} (${errMsg})`);
            }

            done += 1;
            setZipProgress({ done, total, failed, currentTitle: test.title });
          })
        );
      }

      if (zipCancelRef.current) {
        setStatusMessage(`ZIP export cancelled (${done}/${total} processed).`);
        return;
      }

      if (savedIndex.length > 0) {
        targetFolder.file(
          '_INDEX_BILINGUAL.txt',
          '\uFEFF' +
            [
              '==================================================',
              seriesFolderName,
              `Folder: ${sectionFolderName}`,
              `Total Exported: ${savedIndex.length}/${total}`,
              '==================================================',
              '',
              ...savedIndex,
            ].join('\n')
        );
      }

      if (failedTitles.length > 0) {
        targetFolder.file('_failed_tests_log.txt', '\uFEFF' + failedTitles.join('\n'));
      }

      setZipProgress({ done, total, failed, currentTitle: 'Compressing .zip archive...' });
      const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });
      const safeZipBase = `${seriesFolderName}_${sectionFolderName}_Bilingual_${total}_Tests`.replace(
        /\s+/g,
        '_'
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeZipBase}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      setStatusMessage(
        `✓ Bilingual ZIP Downloaded: "${seriesFolderName}/${sectionFolderName}/" (${done - failed}/${total} files)`
      );
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to generate ZIP');
    } finally {
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  const handleOpenInPdfStudio = () => {
    const cleanTxt =
      studioSourceMode === 'online'
        ? convertedResult?.cleanTxt
        : manualConversionResult?.cleanTxt;
    const title =
      studioSourceMode === 'online'
        ? convertedResult?.title || 'TestRanking_Mock'
        : manualConversionResult?.title || 'TestRanking_Mock';
    if (!cleanTxt) return;

    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `[TESTRANKING]_${safeTitle}.txt`;

    if (onLoadIntoPdfStudio) {
      onLoadIntoPdfStudio(cleanTxt, fileName);
    }
  };

  const handleManualConvert = () => {
    if (!manualInputText.trim()) return;
    try {
      setManualError(null);
      const res = convertTestrankingRawInputToCleanTxt(manualInputText);
      setManualConversionResult(res);
      setStatusMessage(`Converted ${res.totalQuestions} questions from pasted input.`);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : String(err));
    }
  };

  const filteredSeries = useMemo(() => {
    if (selectedCategorySlug === 'all') return seriesList;
    return seriesList.filter((s) => s.categorySlug === selectedCategorySlug);
  }, [seriesList, selectedCategorySlug]);

  const displayedTests = useMemo(() => {
    let list = testsList;
    if (selectedSectionId.startsWith('bucket:')) {
      const targetBucket = selectedSectionId.replace('bucket:', '');
      list = list.filter((t) => t.sectionBucket === targetBucket);
    } else if (selectedSectionId.startsWith('cat:')) {
      const targetCat = selectedSectionId.replace('cat:', '');
      list = list.filter((t) => t.categoryName === targetCat);
    } else if (selectedSectionId.startsWith('flow:')) {
      const targetFlow = selectedSectionId.replace('flow:', '');
      list = list.filter((t) => t.flow === targetFlow);
    }
    if (onlyFreeTests) {
      list = list.filter((t) => t.isFree || !t.locked);
    }
    return list;
  }, [testsList, selectedSectionId, onlyFreeTests]);

  const readyCount = useMemo(
    () => displayedTests.filter((t) => !t.locked && t.hasLiveData).length,
    [displayedTests]
  );

  return (
    <div className="space-y-4 sm:space-y-5 text-slate-900">
      {/* Compact Day-Mode Utility Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center p-1 bg-slate-100 border border-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setStudioSourceMode('online')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              studioSourceMode === 'online'
                ? 'bg-indigo-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Online Catalogue
          </button>
          <button
            type="button"
            onClick={() => setStudioSourceMode('manual')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              studioSourceMode === 'manual'
                ? 'bg-indigo-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paste Raw Text/JSON
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleLoadLiveMocksAndQuizzes}
            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-purple-700" />
            <span>Live Mocks &amp; Quizzes</span>
          </button>

          {authUser ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-left">
                <div className="text-[11px] font-bold text-emerald-900 leading-tight">
                  {authUser.name || 'Student Account'}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono">
                  {authUser.mobile || authUser.email || 'Verified'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="ml-1.5 p-1 text-slate-500 hover:text-rose-600 rounded transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginError('');
                setLoginBlockedHint(false);
                setOtpSent(false);
                setIsLoginModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Account Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Status / Error Banners */}
      {statusMessage && (
        <div className="text-xs bg-indigo-50 border border-indigo-200 rounded-xl px-3.5 py-2 text-indigo-900 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>{statusMessage}</span>
          </span>
          <button
            type="button"
            onClick={() => setStatusMessage('')}
            className="text-indigo-500 hover:text-indigo-900 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorBanner && (
        <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setErrorBanner('');
              setBlockedTestContext(null);
            }}
            className="text-rose-500 hover:text-rose-800 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {blockedTestContext && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 text-xs text-slate-900 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">
                Direct Extract Helper: {blockedTestContext.test.title}
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5">
                <code>backend.opsolve.xyz</code> blocked external server/iframe requests. Open{' '}
                <code>testranking.in</code> in a normal tab, copy the test JSON (via DevTools Console script or Network response), and paste below to convert immediately:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBlockedTestContext(null)}
              className="p-1 text-amber-700 hover:text-amber-950 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={
                blockedTestContext.seriesSeoSlug
                  ? `https://testranking.in/${blockedTestContext.seriesSeoSlug}/`
                  : /^[0-9a-f-]{20,}$/i.test(blockedTestContext.test.slug)
                  ? 'https://testranking.in/test-series/'
                  : `https://testranking.in/mock-test/instructions/?slug=${encodeURIComponent(
                      blockedTestContext.test.slug
                    )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>1. Open on TestRanking.in</span>
            </a>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(getConsoleExtractorScript(blockedTestContext));
                  setHelperScriptCopied(true);
                  setTimeout(() => setHelperScriptCopied(false), 2500);
                } catch {
                  // ignore clipboard error
                }
              }}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-400 text-amber-950 font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              {helperScriptCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Console Script Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>2. Copy 1-Click Console Script</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              value={helperPasteInput}
              onChange={(e) => setHelperPasteInput(e.target.value)}
              placeholder="3. Paste copied JSON (from mocktest-start / mocktest-result) or raw text here..."
              className="w-full h-24 bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:border-indigo-600"
            />
            <button
              type="button"
              onClick={handleConvertHelperPaste}
              disabled={!helperPasteInput.trim()}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Convert to Clean .txt</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      {studioSourceMode === 'online' ? (
        <div className="space-y-4 sm:space-y-5">
          {/* 1. Centered Curved Dashed-Line Enter URL Bar */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEnterUrlSubmit();
                  }}
                  placeholder="Enter testranking.in URL, Series Slug, or Test Slug"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 rounded-xl pl-10 pr-8 py-2 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                />
                {urlInput && (
                  <button
                    type="button"
                    onClick={() => setUrlInput('')}
                    title="Clear URL"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={isResolvingUrls || !urlInput.trim()}
                onClick={() => handleEnterUrlSubmit()}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all shrink-0"
              >
                {isResolvingUrls ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Load URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Interactive Folder Tree Explorer */}
          {resolvedPackages.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <ListTree className="w-5 h-5 text-indigo-700" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <span>Generated Folder Tree Hierarchy</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-mono">
                      {resolvedPackages.length} Packages / Series
                    </span>
                  </h3>
                </div>
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Live Folders Ready</span>
                </span>
              </div>

              <div className="space-y-3">
                {resolvedPackages.map((pkg) => {
                  const isPkgExpanded = expandedPackageIds.has(pkg.id);
                  const isSelected = selectedSeriesSlug === pkg.slug;

                  return (
                    <div
                      key={pkg.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      <div
                        onClick={() => togglePackageAccordion(pkg.id)}
                        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/70 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="p-1 rounded text-indigo-700 hover:text-indigo-900"
                          >
                            {isPkgExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center shrink-0">
                            {isPkgExpanded ? (
                              <FolderOpen className="w-4 h-4 text-indigo-700" />
                            ) : (
                              <Folder className="w-4 h-4 text-indigo-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-extrabold text-slate-900 truncate">
                                {pkg.title}
                              </h4>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold">
                                {pkg.slug}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {pkg.description || pkg.url}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono font-bold">
                            {pkg.folders.length} Folders • {pkg.totalTests} Mocks
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowingLiveFeed(false);
                              setSelectedSeriesSlug(pkg.slug);
                              const el = document.getElementById('testranking-tests-grid-section');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-900 text-white shadow-xs'
                                : 'bg-white border border-slate-300 hover:bg-slate-100 text-slate-800'
                            }`}
                          >
                            {isSelected ? 'Active Package' : 'Select'}
                          </button>
                        </div>
                      </div>

                      {isPkgExpanded && (
                        <div className="border-t border-slate-200 p-3 bg-white space-y-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {pkg.folders.map((f) => {
                              const folderKey = `${pkg.id}__${f.id}`;
                              const isFolderExpanded = expandedFolderIds.has(folderKey);

                              return (
                                <div
                                  key={f.id}
                                  className="rounded-xl border p-3 bg-slate-50 border-slate-200 hover:border-slate-300 transition-all"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Folder className="w-4 h-4 text-indigo-700 shrink-0" />
                                      <span className="font-bold text-xs text-slate-900 truncate">
                                        {f.name}
                                      </span>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-indigo-800 font-mono font-bold shrink-0">
                                      {f.testCount} Tests
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() => toggleFolderAccordion(folderKey)}
                                      className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      {isFolderExpanded ? (
                                        <>
                                          <ChevronDown className="w-3.5 h-3.5" />
                                          <span>Hide Tests</span>
                                        </>
                                      ) : (
                                        <>
                                          <ChevronRight className="w-3.5 h-3.5" />
                                          <span>Preview Tests ({f.tests.length})</span>
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleSelectFolderForBrowsing(pkg, f)}
                                      className="px-2.5 py-1 rounded-md bg-indigo-100 hover:bg-indigo-200 text-indigo-900 font-bold text-[10px] cursor-pointer"
                                    >
                                      Open Folder Grid →
                                    </button>
                                  </div>

                                  {isFolderExpanded && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5 max-h-56 overflow-y-auto pr-1">
                                      {f.tests.slice(0, 10).map((t) => (
                                        <div
                                          key={t.id}
                                          className="p-2 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2"
                                        >
                                          <div className="min-w-0">
                                            <p className="text-xs font-semibold text-slate-900 truncate">
                                              {t.title}
                                            </p>
                                            <span className="text-[10px] text-slate-500 font-mono">
                                              {t.questions} Qs • {t.marks} Marks • {t.time} Mins
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleConvertTest(t)}
                                            className="px-2 py-1 bg-indigo-900 hover:bg-indigo-800 text-white text-[10px] font-bold rounded shrink-0 flex items-center gap-1 cursor-pointer"
                                          >
                                            <Sparkles className="w-3 h-3 text-amber-300" />
                                            <span>Convert</span>
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. All Exam Categories & Live Test Series Banners */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
            {categoriesList.length > 0 && (
              <div className="space-y-2 pb-3 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Exam Categories ({categoriesList.length})</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategorySlug('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                      selectedCategorySlug === 'all'
                        ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    All Categories ({seriesList.length})
                  </button>
                  {categoriesList.map((cat) => {
                    const isActive = selectedCategorySlug === cat.slug;
                    const count = seriesList.filter((s) => s.categorySlug === cat.slug).length;
                    return (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setSelectedCategorySlug(cat.slug)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {cat.imageUrl && (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="w-4 h-4 rounded-sm object-contain shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span>
                          {cat.shortName || cat.name}
                          {count > 0 ? ` (${count})` : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-dashed border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>All Test Series ({filteredSeries.length})</span>
                  {isLoadingCatalog && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Tap any series to load Mock + PYP tests
                </span>
              </div>

              {isLoadingCatalog && seriesList.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold">
                    Loading all exam categories &amp; test series from testranking.in...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[430px] overflow-y-auto pr-1">
                  {filteredSeries.map((s) => {
                    const isSelected = !showingLiveFeed && s.slug === selectedSeriesSlug;
                    return (
                      <button
                        key={s.slug}
                        type="button"
                        onClick={() => {
                          setShowingLiveFeed(false);
                          setSelectedSeriesSlug(s.slug);
                          setTimeout(() => {
                            document
                              .getElementById('testranking-tests-grid-section')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 80);
                        }}
                        className={`group text-left rounded-xl border overflow-hidden transition-all cursor-pointer flex flex-col ${
                          isSelected
                            ? 'border-indigo-700 ring-2 ring-indigo-600/25 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden border-b border-slate-200 flex items-center justify-center">
                          <BookOpen className="w-7 h-7 text-slate-300" />
                          {s.logo && (
                            <img
                              src={s.logo}
                              alt={s.title}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          {isSelected && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              <span>Active</span>
                            </span>
                          )}
                          {s.totalTestsText && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                              {s.totalTestsText}
                            </span>
                          )}
                        </div>

                        <div className="p-2.5 flex-1 flex flex-col justify-between gap-1">
                          <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                            {s.title}
                          </h4>
                          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-semibold pt-1">
                            <span className="truncate">{s.categoryName || 'Test Series'}</span>
                            <span className="font-mono text-slate-400 shrink-0 truncate max-w-[90px]">
                              {s.slug}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Converted Test Clean .txt Modal Overlay */}
          {convertedResult && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
              onClick={() => setConvertedResult(null)}
            >
              <div
                id="testranking-converted-preview"
                className="w-full max-w-4xl max-h-[90vh] bg-white border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3.5 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 shrink-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                        <Check className="w-3 h-3" />
                        <span>Ready for PDF Studio</span>
                      </span>
                      <span className="text-xs text-slate-600 font-mono font-bold">
                        {convertedResult.totalQuestions} Questions Converted
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                      {convertedResult.title}
                    </h2>
                    <p className="text-xs text-slate-500 truncate">{convertedResult.seriesTitle}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConvertedResult(null)}
                    title="Close Clean .txt Preview"
                    className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Primary Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveViewTab('cleantxt')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeViewTab === 'cleantxt'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Clean .txt Format</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewTab('cards')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeViewTab === 'cards'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Question Cards ({convertedResult.questions.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewTab('rawjson')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeViewTab === 'rawjson'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      <FileCode2 className="w-3.5 h-3.5" />
                      <span>Raw JSON</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleOpenInPdfStudio}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Load into PDF Studio</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadCleanTxt}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .txt</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyCleanTxt}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {copySuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy .txt</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {activeViewTab === 'cleantxt' && (
                    <textarea
                      readOnly
                      value={convertedResult.cleanTxt}
                      className="w-full h-[52vh] min-h-[300px] bg-slate-50 border border-slate-300 rounded-xl p-3.5 font-mono text-xs text-slate-900 focus:outline-none resize-none selection:bg-indigo-200"
                    />
                  )}

                  {activeViewTab === 'cards' && (
                    <div className="space-y-3 pr-1">
                      {convertedResult.questions.map((q) => (
                        <div
                          key={q.qNum}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                              Q{q.qNum}.
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                              Ans: {q.correctOptionLetter}
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 space-y-1">
                            <div>{q.questionEn}</div>
                            {q.questionHi && q.questionHi !== q.questionEn && (
                              <div className="text-slate-700 font-medium font-anek">
                                {q.questionHi}
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.optionsEn.map((optEn, oIdx) => {
                              const letter = (['A', 'B', 'C', 'D'] as const)[oIdx];
                              const isCorrect = letter === q.correctOptionLetter;
                              const optHi = q.optionsHi[oIdx];
                              return (
                                <div
                                  key={letter}
                                  className={`p-2 rounded-lg border font-mono text-[11px] ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className="font-bold mr-1.5">({letter})</span>
                                  <span>{optEn}</span>
                                  {optHi && optHi !== optEn && (
                                    <span className="block text-[10px] text-slate-600 font-anek">
                                      {optHi}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {(q.explanationEn || q.explanationHi) && (
                            <div className="mt-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-slate-800">
                              <span className="font-bold text-amber-900 block mb-0.5">
                                Solution:
                              </span>
                              {q.explanationEn && <div>{q.explanationEn}</div>}
                              {q.explanationHi && q.explanationHi !== q.explanationEn && (
                                <div className="mt-1 text-slate-700 font-anek">
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
                    <textarea
                      readOnly
                      value={convertedResult.rawJson}
                      className="w-full h-[52vh] min-h-[300px] bg-slate-50 border border-slate-300 rounded-xl p-3.5 font-mono text-[11px] text-slate-800 focus:outline-none resize-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. Sections & Tests List Grid (revealed when a banner or Live Feed is tapped) */}
          {selectedSeriesSlug && (
            <div
              id="testranking-tests-grid-section"
              className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-sm space-y-3.5 scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{selectedSeriesTitle || selectedSeriesSlug}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-mono font-bold">
                      {displayedTests.length} Tests
                    </span>
                  </h3>
                  <button
                    type="button"
                    disabled={isDownloadingZip || isLoadingTests || readyCount === 0}
                    onClick={handleDownloadAllTxtZip}
                    className="px-2.5 py-1 text-[11px] font-extrabold bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {isDownloadingZip ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    ) : (
                      <FolderArchive className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>
                      {isDownloadingZip && zipProgress
                        ? `ZIP ${zipProgress.done}/${zipProgress.total}`
                        : `Bilingual .txt ZIP (${readyCount})`}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyFreeTests}
                      onChange={(e) => setOnlyFreeTests(e.target.checked)}
                      className="rounded accent-indigo-700 cursor-pointer"
                    />
                    <span>Unlocked / Free Only</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeriesSlug('');
                      setShowingLiveFeed(false);
                    }}
                    title="Close series panel"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sections / Buckets (Mock Full, Mock Sectional, PYP Full, PYP Sectional + Sub-sections) */}
              {sectionsList.length > 0 && (
                <div className="pt-2.5 border-t border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Sections &amp; Folders ({sectionsList.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Includes Mock Full, Mock Sectional &amp; PYP
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {sectionsList.map((sec) => {
                      const isActive = sec.id === selectedSectionId;
                      return (
                        <button
                          key={sec.id}
                          type="button"
                          onClick={() => setSelectedSectionId(sec.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border border-dashed cursor-pointer ${
                            isActive
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {sec.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {isDownloadingZip && zipProgress && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2 font-bold text-indigo-950">
                    <span className="truncate">Packing ZIP: {zipProgress.currentTitle}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="tabular-nums font-mono">
                        {zipProgress.done}/{zipProgress.total}
                        {zipProgress.failed > 0 ? ` (${zipProgress.failed} failed)` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          zipCancelRef.current = true;
                        }}
                        className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-100 hover:bg-rose-200 text-rose-800 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-700 transition-all duration-200"
                      style={{
                        width: `${Math.round((zipProgress.done / Math.max(1, zipProgress.total)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {isLoadingTests ? (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border border-slate-200 rounded-2xl">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin mb-2.5" />
                  <p className="text-xs font-bold text-slate-600">Loading live test titles...</p>
                </div>
              ) : displayedTests.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 text-xs font-semibold">
                  No tests found for this section or filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[520px] overflow-y-auto pr-1">
                  {displayedTests.map((test) => {
                    const isConverting = convertingTestId === test.id;
                    const isCurrentActive = convertedResult?.title === test.title;
                    return (
                      <div
                        key={`${test.id}-${test.slug}`}
                        className={`rounded-xl p-3.5 border transition-all flex flex-col justify-between gap-3 ${
                          isCurrentActive
                            ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-extrabold text-slate-900 text-xs line-clamp-2 leading-snug">
                              {test.title}
                            </h4>
                            <span
                              className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${
                                test.isFree
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : test.locked
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              }`}
                            >
                              {test.isFree ? 'FREE ✦' : test.locked ? 'LOCKED' : 'LIVE ✦'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                              {test.sectionLabel}
                            </span>
                            {test.categoryName && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 font-bold">
                                {test.categoryName}
                              </span>
                            )}
                            <span>•</span>
                            <span>{test.questions} Qs</span>
                            <span>•</span>
                            <span>{test.marks} Marks</span>
                            <span>•</span>
                            <span>{test.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          {test.locked ? (
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Login / Pass Required</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live Ready</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleConvertTest(test)}
                            disabled={isConverting}
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 ${
                              isCurrentActive
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : 'bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white'
                            }`}
                          >
                            {isConverting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Fetching...</span>
                              </>
                            ) : (
                              <>
                                <FileText className="w-3.5 h-3.5" />
                                <span>Get Clean .txt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Manual Paste Mode */
        <div className="max-w-5xl w-full mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Paste TestRanking Text or JSON</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-mono">
                  Offline Parser
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Paste TestRanking mocktest-start / mocktest-result JSON or raw mock test text to
                convert into clean bilingual .txt format.
              </p>
            </div>

            <textarea
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Paste questions text or TestRanking JSON payload here..."
              className="w-full h-72 bg-slate-50 border border-slate-300 rounded-xl p-3.5 font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 resize-y"
            />

            {manualError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{manualError}</span>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManualConvert}
                className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Convert to Clean .txt</span>
              </button>
            </div>

            {manualConversionResult && (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-emerald-500/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Successfully Converted {manualConversionResult.totalQuestions} Questions
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenInPdfStudio}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Load into PDF Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCleanTxt}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {copySuccess ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadCleanTxt}
                      className="px-3 py-1.5 bg-slate-900 text-white font-bold text-xs rounded-lg hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={manualConversionResult.cleanTxt}
                  className="w-full h-64 bg-white border border-slate-300 rounded-lg p-3 font-mono text-xs text-slate-900 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Login Modal (OTP, PIN/Password, Token) */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    TestRanking Student Login
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Connect account for Test Pass mocks &amp; full solutions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('otp');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'otp'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mobile OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('pin');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'pin'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PIN / Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('token');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'token'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Session Token
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {loginBlockedHint && loginMode !== 'token' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
                <p className="font-bold leading-snug">
                  Direct OTP/PIN blocked on this network — sign in on <code>testranking.in</code> &amp; connect Session Token in 10 seconds:
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  TestRanking&apos;s server (<code>backend.opsolve.xyz</code>) blocks Cloud/preview iframe login requests, while normal browser tabs on <code>testranking.in</code> work fine.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('token');
                    setLoginError('');
                  }}
                  className="w-full py-2 px-3 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-300" />
                  <span>Switch to Guided Session Token Login</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {loginMode === 'otp' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number or Email
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="10-digit mobile or email"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isLoggingIn}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    <span>Send Login OTP</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enter 4-digit OTP
                      </label>
                      <input
                        type="text"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        placeholder="e.g. 1234"
                        maxLength={6}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-center tracking-widest text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                        className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loginMode === 'pin' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile or Email
                  </label>
                  <input
                    type="text"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="10-digit mobile or email"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    PIN / Password
                  </label>
                  <input
                    type="password"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    placeholder="Enter account PIN / password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePinLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

            {loginMode === 'token' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5 text-xs">
                  <div className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Connect from testranking.in (Works even when OTP API is blocked)</span>
                  </div>
                  <ol className="text-[11px] text-slate-700 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Open <code>testranking.in/login</code> in a new tab &amp; sign in with OTP or PIN.</li>
                    <li>Press <code>F12</code> → <b>Console</b> tab, paste &amp; run the 1-click script below (copies your <code>quizapp_token</code>).</li>
                    <li>Paste the copied token or JSON below and activate.</li>
                  </ol>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <a
                      href="https://testranking.in/login/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>1. Open testranking.in/login</span>
                    </a>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(getTokenExtractorScript());
                          setTokenScriptCopied(true);
                          setTimeout(() => setTokenScriptCopied(false), 2500);
                        } catch {
                          // ignore clipboard error
                        }
                      }}
                      className="px-2.5 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-300 text-indigo-950 font-bold text-[11px] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {tokenScriptCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Token Script Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>2. Copy 1-Click Token Script</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-700" />
                    <span>3. Paste Session Token or JSON (quizapp_token)</span>
                  </label>
                  <textarea
                    value={loginTokenInput}
                    onChange={(e) => setLoginTokenInput(e.target.value)}
                    placeholder="Paste copied output {token, user} or raw quizapp_token..."
                    className="w-full h-20 bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTokenLogin}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Activate Session Token</span>
                </button>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Tip: If your preview network still blocks <code>backend.opsolve.xyz</code> when clicking &quot;Get Clean .txt&quot;, the built-in Direct Extract Helper lets you pull any paid or locked test straight from your logged-in <code>testranking.in</code> tab.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
