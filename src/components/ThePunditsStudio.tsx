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
  RefreshCw,
  Search,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  clearStoredPunditsAuth,
  clearSyncedPunditsCatalog,
  fetchAndConvertPunditsTest,
  fetchPunditsCatalog,
  fetchPunditsLiveTests,
  fetchPunditsSeriesDetail,
  getStoredPunditsAuth,
  getSyncedPunditsCatalog,
  loginPunditsWithPin,
  parsePunditsSessionInput,
  parsePunditsUrlOrSlug,
  PunditsAuthUser,
  PunditsBlockedError,
  PunditsCategoryItem,
  PunditsFolderNode,
  PunditsFolderPackage,
  PunditsSectionItem,
  PunditsSeriesItem,
  PunditsTestItem,
  resolvePunditsUrls,
  saveSyncedPunditsCatalogJson,
  sendPunditsOtp,
  setStoredPunditsAuth,
  verifyPunditsOtp,
} from '../services/thePunditsService';
import {
  convertPunditsRawInputToCleanTxt,
  extractPunditsRawQuestionsFromPayload,
  convertThePunditsToCleanTxt,
  PunditsConvertedResult,
} from '../utils/thePunditsConverter';
import { downloadPunditsInteractiveHtml } from '../utils/thePunditsHtmlGenerator';

export interface ThePunditsStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

export function ThePunditsStudio({ onLoadIntoPdfStudio }: ThePunditsStudioProps) {
  const [studioSourceMode, setStudioSourceMode] = useState<'online' | 'manual'>('online');

  // Authentication State
  const [authUser, setAuthUser] = useState<PunditsAuthUser | null>(null);
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

  // Catalog State (auto-loads all live categories, ProMocks series & Practice Batches on mount)
  const [categoriesList, setCategoriesList] = useState<PunditsCategoryItem[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [seriesList, setSeriesList] = useState<PunditsSeriesItem[]>([]);
  const [selectedSeriesSlug, setSelectedSeriesSlug] = useState<string>('');
  const [selectedSeriesTitle, setSelectedSeriesTitle] = useState<string>('');
  const [selectedSeriesType, setSelectedSeriesType] = useState<'series' | 'batch' | undefined>(undefined);
  const [sectionsList, setSectionsList] = useState<PunditsSectionItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [testsList, setTestsList] = useState<PunditsTestItem[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState<string>('');
  const [showingLiveFeed, setShowingLiveFeed] = useState<boolean>(false);
  const [hasSyncedLocalCatalog, setHasSyncedLocalCatalog] = useState<boolean>(false);

  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);
  const [onlyFreeTests, setOnlyFreeTests] = useState<boolean>(false);

  // Unified URL Input & Folder Tree State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isResolvingUrls, setIsResolvingUrls] = useState<boolean>(false);
  const [resolvedPackages, setResolvedPackages] = useState<PunditsFolderPackage[]>([]);
  const [expandedPackageIds, setExpandedPackageIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Converted Output State
  const [convertingTestId, setConvertingTestId] = useState<string | null>(null);
  const [downloadingHtmlId, setDownloadingHtmlId] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<PunditsConvertedResult | null>(null);
  const [convertedMeta, setConvertedMeta] = useState<{ duration?: string | number; marks?: string | number } | null>(null);
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
  const [manualConversionResult, setManualConversionResult] = useState<PunditsConvertedResult | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Blocked upstream helpers (Catalog Sync & Test Direct Extract)
  const [blockedCatalog, setBlockedCatalog] = useState<boolean>(false);
  const [catalogSyncPaste, setCatalogSyncPaste] = useState<string>('');
  const [catalogScriptCopied, setCatalogScriptCopied] = useState<boolean>(false);
  const [blockedTestContext, setBlockedTestContext] = useState<{
    test: PunditsTestItem;
    seriesTitle?: string;
  } | null>(null);
  const [helperPasteInput, setHelperPasteInput] = useState<string>('');
  const [helperScriptCopied, setHelperScriptCopied] = useState<boolean>(false);

  useEffect(() => {
    const saved = getStoredPunditsAuth();
    if (saved) setAuthUser(saved);
    const synced = getSyncedPunditsCatalog();
    if (synced && synced.series.length > 0) setHasSyncedLocalCatalog(true);
  }, []);

  useEffect(() => {
    if (!convertedResult) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConvertedResult(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [convertedResult]);

  const loadCatalog = async (activeAuth: PunditsAuthUser | null) => {
    setIsLoadingCatalog(true);
    setErrorBanner('');
    setBlockedCatalog(false);
    try {
      const cat = await fetchPunditsCatalog(activeAuth);
      setCategoriesList(cat.categories);
      setSeriesList(cat.series);
      setBlockedCatalog(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load The Pundits catalog';
      if (err instanceof PunditsBlockedError || /blocked|unreachable|429|403/i.test(msg)) {
        setBlockedCatalog(true);
      }
      setErrorBanner(msg);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Automatically load all live categories & test series on mount
  useEffect(() => {
    loadCatalog(authUser);
  }, [authUser]);

  // Fetch series detail when user selects a series card
  useEffect(() => {
    if (!selectedSeriesSlug || showingLiveFeed) return;
    let isCancelled = false;
    async function loadSeriesDetail() {
      setIsLoadingTests(true);
      setErrorBanner('');
      setTestsList([]);
      setSectionsList([]);
      try {
        const res = await fetchPunditsSeriesDetail(
          selectedSeriesSlug,
          authUser,
          selectedSeriesType
        );
        if (!isCancelled) {
          setSelectedSeriesTitle(res.series.title || selectedSeriesSlug);
          setSectionsList(res.sections);
          setTestsList(res.tests);
          setSelectedSectionId('all');
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setTestsList([]);
          const msg = err instanceof Error ? err.message : 'Failed to load series tests';
          if (err instanceof PunditsBlockedError || /blocked|unreachable|429|403/i.test(msg)) {
            setBlockedCatalog(true);
          }
          setErrorBanner(msg);
        }
      } finally {
        if (!isCancelled) setIsLoadingTests(false);
      }
    }
    loadSeriesDetail();
    return () => {
      isCancelled = true;
    };
  }, [selectedSeriesSlug, selectedSeriesType, authUser, showingLiveFeed]);

  // Load Live Mocks & Quizzes Feed
  const handleLoadLiveMocksAndQuizzes = async () => {
    setStudioSourceMode('online');
    setShowingLiveFeed(true);
    setSelectedSeriesSlug('live-mocks-and-quizzes');
    setSelectedSeriesTitle('The Pundits Live Mocks & Quizzes');
    setSelectedSeriesType(undefined);
    setIsLoadingTests(true);
    setErrorBanner('');
    setSectionsList([]);
    setTestsList([]);
    setStatusMessage('Fetching Weekly Live Mocks & Quizzes from thepunditsofficial.in...');
    try {
      const liveTests = await fetchPunditsLiveTests(authUser);
      setTestsList(liveTests);
      const flows = new Set(liveTests.map((t) => t.flow));
      const nextSections: PunditsSectionItem[] = [{ id: 'all', name: 'All Live Items' }];
      if (flows.has('mocktest')) nextSections.push({ id: 'flow:mocktest', name: 'Live Mocks' });
      if (flows.has('quiz')) nextSections.push({ id: 'flow:quiz', name: 'Live Quizzes' });
      setSectionsList(nextSections);
      setSelectedSectionId('all');
      setStatusMessage(`Loaded ${liveTests.length} Live Mocks & Quizzes.`);
      setTimeout(() => {
        document
          .getElementById('thepundits-tests-grid-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to load live mocks');
      setStatusMessage('');
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Unified URL Bar Handler
  const handleEnterUrlSubmit = async (customInput?: string) => {
    const raw = (customInput !== undefined ? customInput : urlInput).trim();
    if (!raw) {
      setStatusMessage('Please enter a thepunditsofficial.in URL or series/test slug.');
      return;
    }

    setIsResolvingUrls(true);
    setErrorBanner('');
    setStatusMessage('Resolving live The Pundits folders & tests...');

    try {
      const parsed = parsePunditsUrlOrSlug(raw);
      if (parsed?.kind === 'test') {
        const directTest: PunditsTestItem = {
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
        setIsResolvingUrls(false);
        await handleConvertTest(directTest);
        return;
      }

      const pkgs = await resolvePunditsUrls(raw, authUser);
      if (pkgs.length > 0) {
        setResolvedPackages(pkgs);
        setExpandedPackageIds(new Set(pkgs.map((p) => p.id)));
        setShowingLiveFeed(false);
        setSelectedSeriesType(pkgs[0].type === 'batch' ? 'batch' : 'series');
        setSelectedSeriesSlug(pkgs[0].slug);

        const totalFolders = pkgs.reduce((acc, p) => acc + p.folders.length, 0);
        const totalTests = pkgs.reduce((acc, p) => acc + p.totalTests, 0);
        setStatusMessage(
          `Resolved ${pkgs.length} live package(s), ${totalFolders} folders, and ${totalTests} tests from thepunditsofficial.in.`
        );
      } else {
        setStatusMessage('No series found for that URL/slug. Browse categories below.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve URL';
      if (err instanceof PunditsBlockedError || /blocked|unreachable|429|403/i.test(msg)) {
        setBlockedCatalog(true);
      }
      setErrorBanner(msg);
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
    pkg: PunditsFolderPackage,
    folder: PunditsFolderNode
  ) => {
    setShowingLiveFeed(false);
    setSelectedSeriesType(pkg.type === 'batch' ? 'batch' : 'series');
    setSelectedSeriesSlug(pkg.slug);
    setSelectedSectionId(folder.id);
    setStatusMessage(`Switched active section to "${folder.name}"`);
    const el = document.getElementById('thepundits-tests-grid-section');
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
    const res = await sendPunditsOtp(loginIdentifier.trim());
    setIsLoggingIn(false);
    if (res.success) {
      setOtpSent(true);
      setStatusMessage('OTP sent successfully to ' + loginIdentifier.trim());
    } else {
      setLoginError(res.message);
      if (res.blocked || /blocked|unreachable|failed to fetch|429|403/i.test(res.message)) {
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
    const res = await verifyPunditsOtp(loginIdentifier.trim(), loginOtp.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setLoginBlockedHint(false);
      setStatusMessage(`Welcome back, ${res.auth.name || 'The Pundits Student'}! Account connected.`);
    } else {
      const errMsg = res.error || 'Failed to verify OTP.';
      setLoginError(errMsg);
      if (res.blocked || /blocked|unreachable|failed to fetch|429|403/i.test(errMsg)) {
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
    const res = await loginPunditsWithPin(loginIdentifier.trim(), loginPin.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setLoginBlockedHint(false);
      setStatusMessage(`Logged in successfully as ${res.auth.name || 'The Pundits Student'}!`);
    } else {
      const errMsg = res.error || 'Invalid credentials.';
      setLoginError(errMsg);
      if (res.blocked || /blocked|unreachable|failed to fetch|429|403/i.test(errMsg)) {
        setLoginBlockedHint(true);
      }
    }
  };

  const handleTokenLogin = () => {
    const parsedAuth = parsePunditsSessionInput(loginTokenInput);
    if (!parsedAuth) {
      setLoginError('Please paste a valid The Pundits token (pundits.token) or session JSON.');
      return;
    }
    setStoredPunditsAuth(parsedAuth);
    setAuthUser(parsedAuth);
    setIsLoginModalOpen(false);
    setLoginBlockedHint(false);
    setLoginError('');
    setStatusMessage(
      `Session connected for ${parsedAuth.name || 'The Pundits Student'}! Paid tests & solutions unlocked.`
    );
  };

  const handleLogout = () => {
    clearStoredPunditsAuth();
    setAuthUser(null);
    setStatusMessage('Logged out. Switched to public The Pundits catalog.');
  };

  const getTokenExtractorScript = () =>
    `(()=>{const t=localStorage.getItem('pundits.token')||'';const uid=localStorage.getItem('pundits.userId')||'';if(!t){prompt('Pehle thepunditsofficial.in par OTP/PIN se login karein.','');return;}let u=null;try{u=JSON.parse(localStorage.getItem('pundits.user')||'null');}catch{}const out=JSON.stringify({token:t,userId:uid,user:u});try{copy(out);console.log('Copied The Pundits session! Paste in Session Token box.');}catch{prompt('Ye Session Token copy karein (Ctrl+C):',out);}})()`;

  const getCatalogSyncScript = () =>
    `(async()=>{const t=localStorage.getItem('pundits.token')||'';const uid=localStorage.getItem('pundits.userId')||'';const h={};if(t)h.Authorization='Bearer '+t;if(uid)h.userId=uid;const p=t?'':'/public';const B='https://pundits.opsolve.xyz/api/v1';const cr=await fetch(B+p+'/testseries-categories',{headers:h}).then(r=>r.json());const cats=(cr?.data?.categories||[]).map(c=>({slug:c.slug,name:c.name,shortName:c.shortName,imageUrl:c.imageUrl||''}));const series=[];const detailsBySlug={};for(const c of cats){const sr=await fetch(B+p+'/category-testseries?slug='+encodeURIComponent(c.slug),{headers:h}).then(r=>r.json()).catch(()=>null);for(const s of(sr?.data||[])){if(series.some(x=>x.slug===s.slug))continue;series.push({id:String(s.id||s.slug),slug:s.slug,title:s.name,categorySlug:c.slug,categoryName:c.shortName||c.name,logo:s.imageUrl||'',totalTestsText:s.noOfTotalTests||'',freeTestsText:s.noOfFreeTests||'',isPurchased:!!s.isPurchased,itemType:'series'});const dt=await fetch(B+p+'/testseries-detailed-content?slug='+encodeURIComponent(s.slug),{headers:h}).then(r=>r.json()).catch(()=>null);if(dt?.data)detailsBySlug[s.slug]=dt.data;}}const br=await fetch(B+p+'/testseries-batches',{headers:h}).then(r=>r.json()).catch(()=>null);if(Array.isArray(br?.data)&&br.data.length){cats.push({slug:'daily-practice-batches',name:'Daily Practice Schedule',shortName:'Practice Batches',imageUrl:''});for(const b of br.data){const bSlug=String(b.slug||b.id);series.push({id:String(b.id||bSlug),slug:bSlug,title:b.name||b.title||bSlug,categorySlug:'daily-practice-batches',categoryName:'Practice Batch',logo:b.imageUrl||'',totalTestsText:'Practice Batch',isPurchased:!!b.isPurchased,itemType:'batch'});}}const out=JSON.stringify({categories:cats,series,detailsBySlug});try{copy(out);console.log('Copied The Pundits Catalog JSON! Paste it inside the Studio.');}catch{prompt('Catalog JSON copy karein:',out);}})()`;

  const getConsoleTestExtractorScript = (ctx: { test: PunditsTestItem }) => {
    const tSlug = JSON.stringify(ctx.test.slug || ctx.test.id);
    const isQuiz = ctx.test.flow === 'quiz';
    const startEp = isQuiz ? '/quiz-start' : '/mocktest-start';
    const submitEp = isQuiz ? '/quiz-submit' : '/submit-mocktest';
    const resultEp = isQuiz ? '/quiz-result' : '/mocktest-result';
    return `(async()=>{const t=localStorage.getItem('pundits.token')||'';const uid=localStorage.getItem('pundits.userId')||'';const h={};if(t)h.Authorization='Bearer '+t;if(uid)h.userId=uid;const slug=${tSlug};const B='https://pundits.opsolve.xyz/api/v1';let out=null;if(t){try{const r=await fetch(B+'${resultEp}?slug='+encodeURIComponent(slug),{headers:h}).then(x=>x.json());if(r?.data)out=r;}catch{}}if(!out){const s=await fetch(B+'${startEp}?slug='+encodeURIComponent(slug),{headers:h}).then(x=>x.json());out=s;const att=s?.data?.attempt;if(t&&att){await fetch(B+'${submitEp}',{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({slug,attempt:att,testSubmitted:true,timeTaken:1})});const res=await fetch(B+'${resultEp}?slug='+encodeURIComponent(slug)+'&attempt='+att,{headers:h}).then(x=>x.json());if(res?.data)out=res;}}const jsonStr=JSON.stringify(out);try{copy(jsonStr);console.log('Copied The Pundits test JSON!');}catch{prompt('Test JSON copy karein:',jsonStr);}})()`;
  };

  const handleImportCatalogSync = () => {
    if (!catalogSyncPaste.trim()) return;
    try {
      const synced = saveSyncedPunditsCatalogJson(catalogSyncPaste);
      setCategoriesList(synced.categories);
      setSeriesList(synced.series);
      setHasSyncedLocalCatalog(true);
      setBlockedCatalog(false);
      setCatalogSyncPaste('');
      setErrorBanner('');
      setStatusMessage(
        `✓ Synced ${synced.series.length} series & ${Object.keys(synced.seriesDetails).length} test packages from your browser!`
      );
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Invalid catalog JSON pasted.');
    }
  };

  // Convert Single Test to Clean .txt
  const handleConvertTest = async (test: PunditsTestItem) => {
    setConvertingTestId(test.id);
    setConvertedResult(null);
    setConvertedMeta(null);
    setBlockedTestContext(null);
    setActiveViewTab('cleantxt');
    setErrorBanner('');
    setStatusMessage(`Fetching live questions for "${test.title}"...`);
    try {
      const res = await fetchAndConvertPunditsTest(
        test,
        selectedSeriesTitle || 'The Pundits Official (thepunditsofficial.in)',
        test.sectionLabel || 'All Sections',
        authUser
      );
      setConvertedResult(res);
      setConvertedMeta({ duration: test.time, marks: test.marks });
      setStatusMessage(
        `✓ "${test.title}" converted successfully (${res.totalQuestions} questions)!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof PunditsBlockedError || /blocked|unreachable|429|403/i.test(msg)) {
        setBlockedTestContext({
          test,
          seriesTitle: selectedSeriesTitle,
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
      let converted: PunditsConvertedResult | null = null;
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        const extracted = extractPunditsRawQuestionsFromPayload(parsed);
        if (extracted.questions.length > 0) {
          converted = convertThePunditsToCleanTxt(extracted.questions, {
            id: blockedTestContext.test.id,
            title: blockedTestContext.test.title || extracted.title || 'The Pundits Test',
            seriesTitle:
              blockedTestContext.seriesTitle || 'The Pundits Official (thepunditsofficial.in)',
            categoryName: blockedTestContext.test.sectionLabel,
            durationMinutes: blockedTestContext.test.time || extracted.durationMinutes,
            marks: blockedTestContext.test.marks,
          });
        }
      }
      if (!converted) {
        converted = convertPunditsRawInputToCleanTxt(trimmed);
      }
      setConvertedResult(converted);
      setConvertedMeta({
        duration: blockedTestContext.test.time,
        marks: blockedTestContext.test.marks,
      });
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

  const handleDownloadInteractiveHtml = async (test: PunditsTestItem) => {
    setDownloadingHtmlId(test.id);
    setErrorBanner('');
    setStatusMessage(`Building Interactive CBT HTML for "${test.title}"...`);
    try {
      const res = await fetchAndConvertPunditsTest(
        test,
        selectedSeriesTitle || 'The Pundits Official (thepunditsofficial.in)',
        test.sectionLabel || 'All Sections',
        authUser
      );
      downloadPunditsInteractiveHtml(res, test.title, {
        durationMinutes: test.time,
        totalMarks: test.marks,
        categoryName: test.sectionLabel,
      });
      setStatusMessage(`✓ Interactive HTML downloaded for "${test.title}"!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof PunditsBlockedError || /blocked|unreachable|429|403/i.test(msg)) {
        setBlockedTestContext({ test, seriesTitle: selectedSeriesTitle });
      }
      setErrorBanner(msg);
      setStatusMessage('');
    } finally {
      setDownloadingHtmlId(null);
    }
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
        ? convertedResult?.title || 'ThePundits_Mock_Test'
        : manualConversionResult?.title || 'ThePundits_Mock_Test';
    if (!textToDownload) return;

    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `ThePundits_${safeTitle}.txt`;
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

    const seriesFolderName = sanitizeZipName(
      selectedSeriesTitle || selectedSeriesSlug || 'ThePundits_Series'
    );
    const activeSecObj = sectionsList.find((s) => s.id === selectedSectionId);
    const sectionFolderName = sanitizeZipName(activeSecObj?.name || 'All_Tests');

    const total = readyTests.length;
    let done = 0;
    let failed = 0;
    const failedNames: string[] = [];

    const zip = new JSZip();
    const rootFolder = zip.folder(seriesFolderName)?.folder(sectionFolderName);

    setZipProgress({ done: 0, total, failed: 0, currentTitle: readyTests[0]?.title || '' });

    try {
      for (let i = 0; i < readyTests.length; i++) {
        if (zipCancelRef.current) break;
        const test = readyTests[i];
        setZipProgress({ done, total, failed, currentTitle: test.title });

        try {
          const res = await fetchAndConvertPunditsTest(
            test,
            selectedSeriesTitle || 'The Pundits Official',
            test.sectionLabel || sectionFolderName,
            authUser
          );
          if (res?.cleanTxt && res.totalQuestions > 0) {
            const safeTestName = sanitizeZipName(test.title);
            const fileName = `${String(i + 1).padStart(2, '0')}_${safeTestName}.txt`;
            rootFolder?.file(fileName, '\uFEFF' + res.cleanTxt);
          } else {
            failed++;
            failedNames.push(test.title);
          }
        } catch {
          failed++;
          failedNames.push(test.title);
        }

        done++;
        setZipProgress({ done, total, failed, currentTitle: test.title });
        await new Promise((r) => setTimeout(r, 150));
      }

      if (zipCancelRef.current) {
        setStatusMessage(`ZIP download cancelled at ${done}/${total} tests.`);
        return;
      }

      if (done - failed === 0) {
        setErrorBanner(
          'Could not extract live questions from pundits.opsolve.xyz for any test in this batch. Login or run Direct Extract Helper from a normal tab.'
        );
        return;
      }

      const contentLines = [
        `The Pundits Official Bilingual Question Bank Export`,
        `Series: ${seriesFolderName}`,
        `Section: ${sectionFolderName}`,
        `Downloaded Tests: ${done - failed} / ${total}`,
      ];
      if (failedNames.length > 0) {
        contentLines.push(``, `Skipped (${failedNames.length}):`, ...failedNames.map((n) => `- ${n}`));
      }
      zip.folder(seriesFolderName)?.file('00_README.txt', '\uFEFF' + contentLines.join('\n'));

      const blob = await zip.generateAsync({ type: 'blob' });
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
        ? convertedResult?.title || 'ThePundits_Mock'
        : manualConversionResult?.title || 'ThePundits_Mock';
    if (!cleanTxt) return;

    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `[THE_PUNDITS]_${safeTitle}.txt`;

    if (onLoadIntoPdfStudio) {
      onLoadIntoPdfStudio(cleanTxt, fileName);
    }
  };

  const handleManualConvert = () => {
    if (!manualInputText.trim()) return;
    try {
      setManualError(null);
      const res = convertPunditsRawInputToCleanTxt(manualInputText);
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
    } else if (selectedSectionId.startsWith('flow:')) {
      const targetFlow = selectedSectionId.replace('flow:', '');
      list = list.filter((t) => t.flow === targetFlow);
    }
    if (onlyFreeTests) {
      list = list.filter((t) => t.isFree || !t.locked);
    }
    if (testSearchQuery.trim()) {
      const q = testSearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.categoryName && t.categoryName.toLowerCase().includes(q)) ||
          t.sectionLabel.toLowerCase().includes(q)
      );
    }
    return list;
  }, [testsList, selectedSectionId, onlyFreeTests, testSearchQuery]);

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
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-amber-700" />
            <span>Live Mocks &amp; Quizzes</span>
          </button>

          {hasSyncedLocalCatalog && (
            <button
              type="button"
              onClick={() => {
                clearSyncedPunditsCatalog();
                setHasSyncedLocalCatalog(false);
                loadCatalog(authUser);
              }}
              title="Refresh live catalog from API"
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resync Live</span>
            </button>
          )}

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

      {/* Blocked Catalog Sync Helper (only if both Cloud Run and preview browser block pundits.opsolve.xyz) */}
      {blockedCatalog && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 text-xs text-slate-900 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">
                Direct Catalog Sync: The Pundits Official (thepunditsofficial.in)
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5 leading-relaxed">
                <code>pundits.opsolve.xyz</code> is blocking automated datacenter/iframe requests on this network. Run this 1-click sync once on a normal <code>thepunditsofficial.in</code> tab to load all live Categories, ProMocks, Daily Practice Batches &amp; Test lists:
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBlockedCatalog(false)}
              className="p-1 text-amber-700 hover:text-amber-950 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://thepunditsofficial.in/test-series/category/?slug=promocks"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>1. Open thepunditsofficial.in</span>
            </a>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(getCatalogSyncScript());
                  setCatalogScriptCopied(true);
                  setTimeout(() => setCatalogScriptCopied(false), 2500);
                } catch {
                  // ignore clipboard error
                }
              }}
              className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-400 text-amber-950 font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              {catalogScriptCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Catalog Script Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>2. Copy 1-Click Catalog Sync Script</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => loadCatalog(authUser)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Live Fetch</span>
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              value={catalogSyncPaste}
              onChange={(e) => setCatalogSyncPaste(e.target.value)}
              placeholder="3. Paste copied Catalog JSON from thepunditsofficial.in Console here..."
              className="w-full h-20 bg-white border border-amber-300 rounded-xl p-2.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:border-indigo-600"
            />
            <button
              type="button"
              onClick={handleImportCatalogSync}
              disabled={!catalogSyncPaste.trim()}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Import Synced Catalogue</span>
            </button>
          </div>
        </div>
      )}

      {/* Blocked Test Direct Extract Helper */}
      {blockedTestContext && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 text-xs text-slate-900 shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-amber-950 text-sm">
                Direct Extract Helper: {blockedTestContext.test.title}
              </h4>
              <p className="text-[11px] text-amber-900 mt-0.5">
                <code>pundits.opsolve.xyz</code> blocked external server/iframe requests. Open{' '}
                <code>thepunditsofficial.in</code> in a normal tab, run the 1-click Console script, and paste below to convert immediately:
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
              href="https://thepunditsofficial.in/test-series/category/?slug=promocks"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold rounded-xl inline-flex items-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>1. Open on thepunditsofficial.in</span>
            </a>

            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    getConsoleTestExtractorScript(blockedTestContext)
                  );
                  setHelperScriptCopied(true);
                  setTimeout(() => setHelperScriptCopied(false), 2500);
                } catch {
                  // ignore
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
              placeholder="3. Paste copied JSON (mocktest-start / mocktest-result / quiz-result) or raw text here..."
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

      {/* Main Workspace */}
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
                  placeholder="Enter thepunditsofficial.in URL, Series Slug, Batch Slug, or Test Slug"
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
                              setSelectedSeriesType(pkg.type === 'batch' ? 'batch' : 'series');
                              setSelectedSeriesSlug(pkg.slug);
                              const el = document.getElementById('thepundits-tests-grid-section');
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
                                              {t.questions} Qs • {t.marks} Marks • {t.time}
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

          {/* 3. All Exam Categories & Live Test Series / Practice Batches Grid */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
            {categoriesList.length > 0 && (
              <div className="space-y-2 pb-3 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Exam Categories &amp; Batches ({categoriesList.length})</span>
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cat.shortName || cat.name}</span>
                        <span
                          className={`text-[10px] font-mono ${
                            isActive ? 'text-amber-300' : 'text-slate-400'
                          }`}
                        >
                          ({count})
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
                  <span>All Test Series &amp; Practice Batches ({filteredSeries.length})</span>
                  {isLoadingCatalog && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Tap any series to load Full, Sectional &amp; PYP tests
                </span>
              </div>

              {isLoadingCatalog && seriesList.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold">
                    Loading live ProMocks, Categories &amp; Batches from thepunditsofficial.in...
                  </span>
                </div>
              ) : filteredSeries.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-xl border border-slate-200">
                  No series loaded yet. {blockedCatalog ? 'Use the Direct Catalog Sync box above or retry live fetch.' : 'Try refreshing or selecting another category.'}
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
                          setSelectedSeriesType(s.itemType || 'series');
                          setSelectedSeriesSlug(s.slug);
                          setTimeout(() => {
                            document
                              .getElementById('thepundits-tests-grid-section')
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
                id="thepundits-converted-preview"
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
                      onClick={() =>
                        downloadPunditsInteractiveHtml(convertedResult, convertedResult.title, {
                          durationMinutes: convertedMeta?.duration,
                          totalMarks: convertedMeta?.marks,
                        })
                      }
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>CBT HTML</span>
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
                            {q.correctOptionLetter && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                                Ans: {q.correctOptionLetter}
                              </span>
                            )}
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

          {/* 5. Sections & Tests List Grid */}
          {selectedSeriesSlug && (
            <div
              id="thepundits-tests-grid-section"
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

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={testSearchQuery}
                      onChange={(e) => setTestSearchQuery(e.target.value)}
                      placeholder="Filter tests..."
                      className="pl-7 pr-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
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

              {sectionsList.length > 0 && (
                <div className="pt-2.5 border-t border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Sections &amp; Folders ({sectionsList.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Includes Mock Full, Mock Sectional, PYP &amp; Daily Practice
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
                          {typeof sec.count === 'number' ? ` (${sec.count})` : ''}
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
                        {zipProgress.done} / {zipProgress.total}
                        {zipProgress.failed > 0 ? ` (${zipProgress.failed} failed)` : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          zipCancelRef.current = true;
                        }}
                        className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-700 transition-all"
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
                    const isHtmlLoading = downloadingHtmlId === test.id;
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
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 font-bold">
                                {test.categoryName}
                              </span>
                            )}
                            <span>•</span>
                            <span>{test.questions}</span>
                            <span>•</span>
                            <span>{test.marks}</span>
                            <span>•</span>
                            <span>{test.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          {test.locked ? (
                            <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Login / ProMocks Pass</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Live Ready</span>
                            </span>
                          )}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDownloadInteractiveHtml(test)}
                              disabled={isHtmlLoading || isConverting}
                              title="Download Interactive CBT HTML Mock"
                              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1 cursor-pointer disabled:opacity-60"
                            >
                              {isHtmlLoading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Zap className="w-3.5 h-3.5" />
                              )}
                              <span>HTML</span>
                            </button>
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
                <span>Paste The Pundits Text or JSON</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-mono">
                  Offline Parser
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Paste mocktest-start / mocktest-result / quiz-result JSON from thepunditsofficial.in or raw numbered questions to convert into clean bilingual .txt format.
              </p>
            </div>

            <textarea
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Paste questions text or The Pundits JSON payload here..."
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

      {/* 6. Login Modal (OTP, PIN/Password, Guided Session Token) */}
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
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    The Pundits Student Login
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Connect account for ProMocks Pass &amp; full solutions
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
                  Direct OTP/PIN blocked on this network — sign in on <code>thepunditsofficial.in</code> &amp; connect Session Token in 10 seconds:
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  The Pundits backend (<code>pundits.opsolve.xyz</code>) blocks Cloud/preview iframe login requests, while normal browser tabs on <code>thepunditsofficial.in</code> work directly.
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
                    <span>Connect from thepunditsofficial.in</span>
                  </div>
                  <ol className="text-[11px] text-slate-700 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Open <code>thepunditsofficial.in/login</code> in a new tab &amp; sign in with OTP or PIN.</li>
                    <li>Press <code>F12</code> → <b>Console</b> tab, paste &amp; run the 1-click script below (reads <code>pundits.token</code> &amp; <code>pundits.userId</code>).</li>
                    <li>Paste the copied token or JSON below and activate.</li>
                  </ol>
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <a
                      href="https://thepunditsofficial.in/login/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-[11px] rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>1. Open thepunditsofficial.in/login</span>
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
                    <span>3. Paste Session Token or JSON (pundits.token)</span>
                  </label>
                  <textarea
                    value={loginTokenInput}
                    onChange={(e) => setLoginTokenInput(e.target.value)}
                    placeholder="Paste copied output {token, userId, user} or raw pundits.token..."
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
