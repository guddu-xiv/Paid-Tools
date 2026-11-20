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
  Sparkles,
  X,
} from 'lucide-react';
import {
  clearStoredVidyagramAuth,
  fetchAllVidyagramSeries,
  fetchAndConvertVidyagramTest,
  fetchVidyagramSubjects,
  fetchVidyagramTests,
  getStoredVidyagramAuth,
  loginVidyagramWithPassword,
  resolveVidyagramUrls,
  sendVidyagramOtp,
  setStoredVidyagramAuth,
  unlockVidyagramDirectTest,
  verifyVidyagramOtp,
  VidyagramAuthUser,
  VidyagramFolderNode,
  VidyagramFolderPackage,
  VidyagramSeriesItem,
  VidyagramSubjectItem,
  VidyagramTestItem,
} from '../services/vidyagramService';
import {
  convertRbeRevolutionToCleanTxt,
  RbeConvertedAppxResult,
} from '../utils/rbeRevolutionConverter';

export interface VidyagramStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

export function VidyagramStudio({ onLoadIntoPdfStudio }: VidyagramStudioProps) {
  // Studio operational mode: Online Browser (vidyagram.online) or Manual Paste Text
  const [studioSourceMode, setStudioSourceMode] = useState<'online' | 'manual'>('online');

  // Authentication State
  const [authUser, setAuthUser] = useState<VidyagramAuthUser | null>(null);
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

  // Series & Subjects State (auto-loads all live Vidyagram test series on mount)
  const [seriesList, setSeriesList] = useState<VidyagramSeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [subjectsList, setSubjectsList] = useState<VidyagramSubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [testsList, setTestsList] = useState<VidyagramTestItem[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);
  const [onlyLiveReady, setOnlyLiveReady] = useState<boolean>(false);

  // Unified URL Input State (Course, Test Series, Multi-URL, or Direct Test URL/ID)
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDirectUnlocking, setIsDirectUnlocking] = useState<boolean>(false);
  const [resolvedPackages, setResolvedPackages] = useState<VidyagramFolderPackage[]>([]);
  const [isResolvingUrls, setIsResolvingUrls] = useState<boolean>(false);
  const [expandedPackageIds, setExpandedPackageIds] = useState<Set<string>>(new Set());
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Active Converted Test State
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

  // Load stored auth on mount
  useEffect(() => {
    const saved = getStoredVidyagramAuth();
    if (saved) setAuthUser(saved);
  }, []);

  // Close Clean .txt preview modal on Escape key
  useEffect(() => {
    if (!convertedResult) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConvertedResult(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [convertedResult]);

  // Fetch Series on mount or auth change (100% Live from vidyagram.online)
  useEffect(() => {
    let isCancelled = false;
    async function loadSeries() {
      setIsLoadingSeries(true);
      setErrorBanner('');
      try {
        const list = await fetchAllVidyagramSeries(authUser);
        if (!isCancelled && list.length > 0) {
          setSeriesList(list);
          if (selectedSeriesId && !list.some((s) => s.id === selectedSeriesId)) {
            setSelectedSeriesId('');
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setErrorBanner(
            err instanceof Error ? err.message : 'Failed to load live Vidyagram test series'
          );
        }
      } finally {
        if (!isCancelled) setIsLoadingSeries(false);
      }
    }
    loadSeries();
    return () => {
      isCancelled = true;
    };
  }, [authUser]);

  // Fetch Subjects when user taps a series banner (100% Live)
  useEffect(() => {
    if (!selectedSeriesId) {
      setSubjectsList([]);
      setTestsList([]);
      return;
    }
    let isCancelled = false;
    async function loadSubjects() {
      setIsLoadingSubjects(true);
      setErrorBanner('');
      try {
        const subs = await fetchVidyagramSubjects(selectedSeriesId, authUser);
        if (!isCancelled && subs.length > 0) {
          setSubjectsList(subs);
          if (!subs.some((s) => s.id === selectedSubjectId)) {
            setSelectedSubjectId(subs[0].id);
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setSubjectsList([]);
          setErrorBanner(err instanceof Error ? err.message : 'Failed to load Vidyagram subjects');
        }
      } finally {
        if (!isCancelled) setIsLoadingSubjects(false);
      }
    }
    loadSubjects();
    return () => {
      isCancelled = true;
    };
  }, [selectedSeriesId, authUser]);

  // Fetch Tests when selected series or subject changes (100% Live)
  useEffect(() => {
    if (!selectedSeriesId || !selectedSubjectId) return;
    let isCancelled = false;
    async function loadTests() {
      setIsLoadingTests(true);
      try {
        const tests = await fetchVidyagramTests(
          selectedSeriesId,
          selectedSubjectId,
          '',
          authUser
        );
        if (!isCancelled) {
          setTestsList(tests);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setTestsList([]);
          setErrorBanner(err instanceof Error ? err.message : 'Failed to load Vidyagram tests');
        }
      } finally {
        if (!isCancelled) setIsLoadingTests(false);
      }
    }
    const timer = setTimeout(loadTests, 150);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedSeriesId, selectedSubjectId, authUser]);

  const handleResolveUrls = async (customUrls?: string) => {
    const urlsText = customUrls !== undefined ? customUrls : urlInput;
    if (!urlsText.trim()) {
      setStatusMessage('Please enter at least one Vidyagram URL or ID.');
      return;
    }
    setIsResolvingUrls(true);
    setErrorBanner('');
    setStatusMessage('Fetching live folders & tests from vidyagram.online...');
    try {
      const pkgs = await resolveVidyagramUrls(urlsText, authUser);
      if (pkgs.length > 0) {
        setResolvedPackages(pkgs);
        setExpandedPackageIds(new Set(pkgs.map((p) => p.id)));

        const seriesPkgs = pkgs.filter((p) => p.type === 'series');
        if (seriesPkgs.length > 0) {
          setSeriesList((prev) => {
            const updated = [...prev];
            for (const pkg of seriesPkgs) {
              if (!updated.some((s) => s.id === pkg.id)) {
                updated.push({
                  id: pkg.id,
                  title: pkg.title,
                  slug: pkg.slug,
                  exam: '1',
                  examname: 'Vidyagram',
                  logo: '',
                  price: 0,
                  offer_price: 0,
                  description: pkg.description,
                  paid: true,
                  paidtest: String(pkg.totalTests),
                });
              }
            }
            return updated;
          });
          setSelectedSeriesId(seriesPkgs[0].id);
        }

        const totalFolders = pkgs.reduce((acc, p) => acc + p.folders.length, 0);
        const totalTests = pkgs.reduce((acc, p) => acc + p.totalTests, 0);
        setStatusMessage(
          `Resolved ${pkgs.length} live package(s), ${totalFolders} folders, and ${totalTests} tests from vidyagram.online.`
        );
      } else {
        setStatusMessage('No packages found for the provided URL(s).');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
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
    pkg: VidyagramFolderPackage,
    folder: VidyagramFolderNode
  ) => {
    if (pkg.type === 'course') {
      setSelectedSeriesId(folder.id);
      setSelectedSubjectId('all');
      setStatusMessage(`Loaded included series "${folder.name}"`);
    } else {
      setSelectedSeriesId(pkg.id);
      setSelectedSubjectId(folder.id);
      setStatusMessage(`Switched active section to "${folder.name}"`);
    }
    const el = document.getElementById('vidyagram-tests-grid-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Login via OTP Send
  const handleSendOtp = async () => {
    if (!loginPhone.trim()) {
      setLoginError('Please enter a 10-digit mobile number.');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    const res = await sendVidyagramOtp(loginPhone.trim());
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
    const res = await verifyVidyagramOtp(loginPhone.trim(), loginOtp.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setStatusMessage(`Welcome back, ${res.auth.name || 'Vidyagram Student'}! All tests unlocked.`);
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
    const res = await loginVidyagramWithPassword(loginPhone.trim(), loginPassword.trim());
    setIsLoggingIn(false);
    if (res.success && res.auth) {
      setAuthUser(res.auth);
      setIsLoginModalOpen(false);
      setStatusMessage(`Logged in successfully as ${res.auth.name || 'Vidyagram Student'}!`);
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
    const userAuth: VidyagramAuthUser = {
      token,
      name: 'Vidyagram Student (Direct Token)',
      mobile: 'vidyagram-verified',
    };
    setStoredVidyagramAuth(userAuth);
    setAuthUser(userAuth);
    setIsLoginModalOpen(false);
    setStatusMessage('Session token active! Full paid catalogue unlocked.');
  };

  const handleLogout = () => {
    clearStoredVidyagramAuth();
    setAuthUser(null);
    setStatusMessage('Logged out. Switched to public unlocked catalogue.');
  };

  // Convert an online test to Clean .txt (100% Live)
  const handleConvertTest = async (test: VidyagramTestItem) => {
    setConvertingTestId(test.id);
    setConvertedResult(null);
    setActiveViewTab('cleantxt');
    setErrorBanner('');
    setStatusMessage(`Fetching live questions for "${test.title}"...`);
    try {
      const activeSeries = seriesList.find(
        (s) => s.id === (test.test_series_id || selectedSeriesId)
      );
      const activeSubject = subjectsList.find((sub) => sub.id === selectedSubjectId);

      const res = await fetchAndConvertVidyagramTest(
        test,
        activeSeries?.title || 'Vidyagram (vidyagram.online)',
        activeSubject?.name || 'All Sections',
        authUser
      );
      setConvertedResult(res);
      setStatusMessage(
        `✓ "${test.title}" converted successfully (${res.totalQuestions} questions)!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(msg);
      setStatusMessage('');
    } finally {
      setConvertingTestId(null);
    }
  };

  // Direct Lookup / Unlock by Test URL or ID
  const handleDirectUnlock = async (customUrl?: string) => {
    const targetUrl = (customUrl !== undefined ? customUrl : urlInput).trim();
    if (!targetUrl) return;
    setIsDirectUnlocking(true);
    setConvertedResult(null);
    setActiveViewTab('cleantxt');
    setErrorBanner('');
    setStatusMessage(`Fetching live test from "${targetUrl}"...`);
    try {
      const activeSeries = seriesList.find((s) => s.id === selectedSeriesId);
      const res = await unlockVidyagramDirectTest(
        targetUrl,
        activeSeries?.title || 'Vidyagram (vidyagram.online)',
        selectedSeriesId,
        authUser
      );
      setConvertedResult(res);
      setStatusMessage(`✓ Loaded ${res.totalQuestions} live questions for "${res.title}"!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorBanner(msg);
      setStatusMessage('');
    } finally {
      setIsDirectUnlocking(false);
    }
  };

  // Unified Smart URL Submit (routes courses/test-series/multi-URLs to folder tree, direct tests/IDs to instant unlock)
  const handleEnterUrlSubmit = async (overrideUrl?: string) => {
    const raw = (overrideUrl !== undefined ? overrideUrl : urlInput).trim();
    if (!raw) return;

    const tokens = raw
      .split(/[\r\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const hasSeriesOrCourse = tokens.some(
      (tok) =>
        /new-courses/i.test(tok) ||
        (/test-series/i.test(tok) && !/\/test\//i.test(tok))
    );

    if (tokens.length > 1 || hasSeriesOrCourse) {
      await handleResolveUrls(tokens.join('\n'));
    } else {
      await handleDirectUnlock(raw);
    }
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
        ? convertedResult?.title || 'Vidyagram_Practice_Test'
        : manualConversionResult?.title || 'Vidyagram_Mock_Test';

    if (!textToDownload) return;

    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `Vidyagram_${safeTitle}.txt`;
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
    const readyTests = displayedTests.filter(
      (t) => t.hasQuestionsUrl || t.test_questions_url || t.test_questions_url_2
    );
    if (readyTests.length === 0 || isDownloadingZip) return;

    zipCancelRef.current = false;
    setIsDownloadingZip(true);
    setErrorBanner('');
    const total = readyTests.length;
    setZipProgress({ done: 0, total, failed: 0, currentTitle: 'Preparing Bilingual ZIP...' });

    const activeSeries = seriesList.find((s) => s.id === selectedSeriesId);
    const activeSubject = subjectsList.find((sub) => sub.id === selectedSubjectId);
    const seriesFolderName = sanitizeZipName(
      activeSeries?.title || `Vidyagram_Series_${selectedSeriesId}`
    );
    const subjectFolderName = sanitizeZipName(activeSubject?.name || 'All_Tests');

    const zip = new JSZip();
    const seriesFolder = zip.folder(seriesFolderName) || zip;
    const targetFolder = seriesFolder.folder(subjectFolderName) || seriesFolder;

    let done = 0;
    let failed = 0;
    const failedTitles: string[] = [];
    const savedIndex: string[] = [];
    const usedNames = new Set<string>();
    const CONCURRENCY = 5;

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
                res = await fetchAndConvertVidyagramTest(
                  test,
                  activeSeries?.title || 'Vidyagram (vidyagram.online)',
                  activeSubject?.name || 'All Sections',
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
              const errMsg = lastErr instanceof Error ? lastErr.message : 'Empty response';
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
              `Folder: ${subjectFolderName}`,
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
      const safeZipBase = `${seriesFolderName}_${subjectFolderName}_Bilingual_${total}_Tests`.replace(
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
        `✓ Bilingual ZIP Downloaded: "${seriesFolderName}/${subjectFolderName}/" (${done - failed}/${total} files)`
      );
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to generate ZIP');
    } finally {
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  // Load into main PDF Studio
  const handleOpenInPdfStudio = () => {
    const cleanTxt =
      studioSourceMode === 'online'
        ? convertedResult?.cleanTxt
        : manualConversionResult?.cleanTxt;
    const title =
      studioSourceMode === 'online'
        ? convertedResult?.title || 'Vidyagram_Practice_Test'
        : manualConversionResult?.title || 'Vidyagram_Mock_Test';

    if (!cleanTxt) return;
    const safeTitle = title
      .replace(/[^\w\s\u0900-\u097F-]/gi, '_')
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const fileName = `[VIDYAGRAM]_${safeTitle}.txt`;

    if (onLoadIntoPdfStudio) {
      onLoadIntoPdfStudio(cleanTxt, fileName);
    }
  };

  // Convert manual text
  const handleManualConvert = () => {
    if (!manualInputText.trim()) return;
    try {
      setManualError(null);
      const res = convertRbeRevolutionToCleanTxt(manualInputText);
      setManualConversionResult({
        cleanTxt: res.cleanTxt,
        totalQuestions: res.totalQuestions,
        title: res.title,
      });
      setStatusMessage(`Converted ${res.totalQuestions} questions from pasted text.`);
    } catch (err: unknown) {
      setManualError(err instanceof Error ? err.message : String(err));
    }
  };

  const selectedSeries = useMemo(
    () => seriesList.find((s) => s.id === selectedSeriesId),
    [seriesList, selectedSeriesId]
  );

  const displayedTests = useMemo(() => {
    return onlyLiveReady
      ? testsList.filter(
          (t) => t.hasQuestionsUrl || t.test_questions_url || t.test_questions_url_2
        )
      : testsList;
  }, [testsList, onlyLiveReady]);

  const liveReadyCount = useMemo(
    () =>
      testsList.filter(
        (t) => t.hasQuestionsUrl || t.test_questions_url || t.test_questions_url_2
      ).length,
    [testsList]
  );

  return (
    <div className="space-y-4 sm:space-y-5 text-slate-900">
      {/* Compact Day-Mode Utility Controls (Source Mode Switcher & Account Login) */}
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

        <div className="flex items-center gap-2">
          {authUser ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-left">
                <div className="text-[11px] font-bold text-emerald-900 leading-tight">
                  {authUser.name || 'Student Account'}
                </div>
                <div className="text-[10px] text-emerald-700 font-mono">
                  {authUser.mobile || 'Verified'}
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
            onClick={() => setErrorBanner('')}
            className="text-rose-500 hover:text-rose-800 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
                  placeholder="Enter vidyagram.online URL or Test ID"
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
                disabled={isResolvingUrls || isDirectUnlocking || !urlInput.trim()}
                onClick={() => handleEnterUrlSubmit()}
                className="px-4 py-2 bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 transition-all shrink-0"
              >
                {isResolvingUrls || isDirectUnlocking ? (
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
                  const isSelected = selectedSeriesId === pkg.id;

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
                                ID: {pkg.id}
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
                              if (pkg.type === 'course') {
                                if (pkg.folders.length > 0) {
                                  setSelectedSeriesId(pkg.folders[0].id);
                                  setSelectedSubjectId('all');
                                  setStatusMessage(
                                    `Loaded included series "${pkg.folders[0].name}".`
                                  );
                                }
                              } else {
                                setSelectedSeriesId(pkg.id);
                                if (pkg.folders.length > 0) {
                                  setSelectedSubjectId(pkg.folders[0].id);
                                }
                                setStatusMessage(`Selected "${pkg.title}" as active package.`);
                              }
                              const el = document.getElementById('vidyagram-tests-grid-section');
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
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Folders / Sub-sections in this package:</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {pkg.folders.map((f) => {
                              const folderKey = `${pkg.id}__${f.id}`;
                              const isFolderExpanded = expandedFolderIds.has(folderKey);
                              const isFolderActive =
                                selectedSeriesId === pkg.id && selectedSubjectId === f.id;

                              return (
                                <div
                                  key={f.id}
                                  className={`rounded-xl border p-3 transition-all ${
                                    isFolderActive
                                      ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-1 ring-indigo-400/20'
                                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                  }`}
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
                                      {f.tests.length > 10 && (
                                        <p className="text-[10px] text-center text-slate-500 italic">
                                          + {f.tests.length - 10} more mock tests in this folder
                                        </p>
                                      )}
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

          {/* 3. All Fetched Test Series with Banner Images & Section Folders */}
          <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-dashed border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-700" />
                  <span>All Test Series ({seriesList.length})</span>
                  {isLoadingSeries && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  Tap any banner to load tests
                </span>
              </div>

              {isLoadingSeries && seriesList.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold">
                    Loading all test series from vidyagram.online...
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[430px] overflow-y-auto pr-1">
                  {seriesList.map((s) => {
                    const isSelected = s.id === selectedSeriesId;
                    const badgeCount = Number(s.paidtest || s.totaltesttitle || 0);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedSeriesId(s.id);
                          setSelectedSubjectId('all');
                          setTimeout(() => {
                            document
                              .getElementById('vidyagram-tests-grid-section')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }, 80);
                        }}
                        className={`group text-left rounded-xl border overflow-hidden transition-all cursor-pointer flex flex-col ${
                          isSelected
                            ? 'border-indigo-700 ring-2 ring-indigo-600/25 bg-indigo-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Banner Image */}
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
                          {badgeCount > 0 && (
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 text-white text-[10px] font-mono font-bold backdrop-blur-xs">
                              {badgeCount} Tests
                            </span>
                          )}
                        </div>

                        {/* Series Title & Category */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between gap-1">
                          <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                            {s.title}
                          </h4>
                          <div className="flex items-center justify-between gap-1 text-[10px] text-slate-500 font-semibold pt-1">
                            <span className="truncate">{s.examname || 'Mock Series'}</span>
                            <span className="font-mono text-slate-400 shrink-0">#{s.id}</span>
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
                id="vidyagram-converted-preview"
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

                {/* View Content */}
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

          {/* 5. Sections & Tests List Grid (revealed when a banner is tapped) */}
          {selectedSeriesId && (
            <div
              id="vidyagram-tests-grid-section"
              className="bg-white border-2 border-indigo-200 rounded-2xl p-4 shadow-sm space-y-3.5 scroll-mt-24"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{selectedSeries?.title || 'Available Tests'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 font-mono font-bold">
                      {displayedTests.length} Tests
                    </span>
                  </h3>
                  <button
                    type="button"
                    disabled={isDownloadingZip || isLoadingTests || liveReadyCount === 0}
                    onClick={handleDownloadAllTxtZip}
                    className="px-2.5 py-1 text-[11px] font-extrabold bg-indigo-900 hover:bg-indigo-800 text-white rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                    title="Download all live-ready tests in this section as Bilingual .txt files inside a structured .zip"
                  >
                    {isDownloadingZip ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                    ) : (
                      <FolderArchive className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>
                      {isDownloadingZip && zipProgress
                        ? `ZIP ${zipProgress.done}/${zipProgress.total}`
                        : `Bilingual .txt ZIP (${liveReadyCount})`}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyLiveReady}
                      onChange={(e) => setOnlyLiveReady(e.target.checked)}
                      className="rounded accent-indigo-700 cursor-pointer"
                    />
                    <span>
                      Live JSON Ready Only ({liveReadyCount}/{testsList.length})
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedSeriesId('')}
                    title="Close series panel"
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sections & Folders for tapped series */}
              {subjectsList.length > 0 && (
                <div className="pt-2.5 border-t border-dashed border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Sections &amp; Folders ({subjectsList.length})</span>
                      {isLoadingSubjects && (
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                      )}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      Tap any category to filter tests
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {subjectsList.map((sub) => {
                      const isActive = sub.id === selectedSubjectId;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedSubjectId(sub.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border border-dashed cursor-pointer ${
                            isActive
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {sub.name}
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
                    const isLiveReady = Boolean(
                      test.hasQuestionsUrl || test.test_questions_url || test.test_questions_url_2
                    );
                    const isCurrentActive = convertedResult?.title === test.title;
                    return (
                      <div
                        key={test.id}
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
                                isLiveReady
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {isLiveReady ? 'LIVE ✦' : 'UPCOMING'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <span className="font-mono">ID: {test.id}</span>
                            <span>•</span>
                            <span>{test.questions} Qs</span>
                            <span>•</span>
                            <span>{test.marks} Marks</span>
                            <span>•</span>
                            <span>{test.time} Mins</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          {isLiveReady ? (
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>JSON Ready</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Not Uploaded Yet</span>
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleConvertTest(test)}
                            disabled={isConverting}
                            className={`px-3 py-1.5 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60 ${
                              isCurrentActive
                                ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                                : isLiveReady
                                ? 'bg-indigo-900 hover:bg-indigo-800 active:scale-95 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
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
                <span>Paste Mock Text or JSON</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 font-mono">
                  Offline Parser
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Paste question statements, options, answers, and explanations to convert into clean
                bilingual .txt format.
              </p>
            </div>

            <textarea
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Paste questions text or JSON payload here..."
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

      {/* 6. Login Modal (OTP, Password, Token) — Day Mode */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Vidyagram Student Login
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Connect account for purchased courses &amp; mock tests
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

            {/* Mode Tabs */}
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
                  setLoginMode('password');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'password'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
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
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* OTP Mode Form */}
            {loginMode === 'otp' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
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
                        Enter 4 or 6-digit OTP
                      </label>
                      <input
                        type="text"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        placeholder="e.g. 123456"
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

            {/* Password Mode Form */}
            {loginMode === 'password' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile or Email
                  </label>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Mobile or email address"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter account password"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePasswordLogin}
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

            {/* Token Mode Form */}
            {loginMode === 'token' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Session Auth Token</span>
                  </label>
                  <textarea
                    value={loginTokenInput}
                    onChange={(e) => setLoginTokenInput(e.target.value)}
                    placeholder="Paste your AppX session auth token here..."
                    className="w-full h-24 bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-mono text-[11px] text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleTokenLogin}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Save &amp; Connect Token</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Login is optional for public mock tests, or sign in for account-specific purchased
              series.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
