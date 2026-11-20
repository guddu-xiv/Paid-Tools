import React, { useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  FileArchive,
  FileCode2,
  FileText,
  FolderOpen,
  Globe,
  HelpCircle,
  Loader2,
  LogIn,
  LogOut,
  Pause,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Unlock,
  X,
  Zap,
} from 'lucide-react';
import {
  BorderlandAuthUser,
  BorderlandFolderNode,
  BorderlandTestItem,
  clearStoredBorderlandAuth,
  downloadBorderlandExactHtml,
  fetchAndConvertBorderlandTest,
  fetchBorderlandFolders,
  fetchBorderlandTests,
  getStoredBorderlandAuth,
  resolveBorderlandFolderUrl,
  setStoredBorderlandAuth,
  triggerReliableFileDownload,
} from '../services/borderlandSscService';
import { BorderlandConvertedResult } from '../utils/borderlandConverter';

export interface BorderlandSscStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

function findFolderInTree(nodes: BorderlandFolderNode[], targetId: string): BorderlandFolderNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children && node.children.length > 0) {
      const found = findFolderInTree(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

export function BorderlandSscStudio({ onLoadIntoPdfStudio }: BorderlandSscStudioProps) {
  // Authentication
  const [authUser, setAuthUser] = useState<BorderlandAuthUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginTokenInput, setLoginTokenInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Folder Tree Structure
  const [folderTree, setFolderTree] = useState<BorderlandFolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderName, setSelectedFolderName] = useState<string>('Loading live folders...');
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>('borderlandssc.in');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Tests List for Active Folder
  const [testsList, setTestsList] = useState<BorderlandTestItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState<boolean>(false);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string>('');

  // Search & Direct URL
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyPublicTests, setOnlyPublicTests] = useState<boolean>(false);
  const [directUrlInput, setDirectUrlInput] = useState<string>(
    'https://borderlandssc.in/tests?folder=exams&examCat=ssc&exam=cgl&tier=t1&type=pyq&year=2025'
  );
  const [isResolvingUrl, setIsResolvingUrl] = useState<boolean>(false);

  // Single Converted Test & Viewing
  const [convertingTestId, setConvertingTestId] = useState<string | null>(null);
  const [downloadingHtmlTestId, setDownloadingHtmlTestId] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<BorderlandConvertedResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'cleantxt' | 'cards' | 'rawjson'>('cleantxt');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Connecting to live borderlandssc.in APIs...');
  const [mobileActiveTab, setMobileActiveTab] = useState<'folders' | 'tests' | 'preview'>('folders');

  // Continuous Progressive Real Fetching State
  const [isContinuousFetching, setIsContinuousFetching] = useState<boolean>(false);
  const stopFetchRef = useRef<boolean>(false);
  const skipNextTestsFetchRef = useRef<string | null>(null);
  const previewSectionRef = useRef<HTMLDivElement | null>(null);
  const [continuousProgress, setContinuousProgress] = useState<{
    current: number;
    total: number;
    currentTestTitle: string;
    successCount: number;
    errorCount: number;
  }>({
    current: 0,
    total: 0,
    currentTestTitle: '',
    successCount: 0,
    errorCount: 0,
  });
  const [fetchedTestsStore, setFetchedTestsStore] = useState<Record<string, BorderlandConvertedResult>>({});
  const [isZipping, setIsZipping] = useState<boolean>(false);

  // Load Initial Auth & Live Folders
  useEffect(() => {
    const savedAuth = getStoredBorderlandAuth();
    if (savedAuth) setAuthUser(savedAuth);
    loadFolders(
      'https://borderlandssc.in/tests?folder=exams&examCat=ssc&exam=cgl&tier=t1&type=pyq&year=2025',
      savedAuth
    );
  }, []);

  // Load Folders or Direct Test from ANY URL
  const loadFolders = async (
    targetUrl: string = 'https://borderlandssc.in/tests?folder=exams&examCat=ssc',
    overrideAuth?: BorderlandAuthUser | null
  ) => {
    const activeAuth = overrideAuth !== undefined ? overrideAuth : authUser;
    setIsLoadingFolders(true);
    setErrorBanner('');
    try {
      const res = await resolveBorderlandFolderUrl(targetUrl, activeAuth);

      if (res.resolvedType === 'test' && res.test) {
        setConvertedResult(res.test);
        setMobileActiveTab('preview');
        setStatusMessage(`✓ Live test loaded (${res.test.totalQuestions} real questions): ${res.test.title}`);
        return;
      }

      const folders = res.folders || [];
      setFolderTree(folders);

      const exp: Record<string, boolean> = {};
      for (const p of folders) {
        if (p.id === 'pkg::cgl' || p.id === 'pkg::special' || p.id === 'pkg::books' || !p.id.startsWith('pkg::')) {
          exp[p.id] = true;
        }
      }
      const targetFolderId = res.activeFolderId || 'exam::cgl::t1::pyq::2025';
      // Auto-expand ancestors of active folder
      const parts = targetFolderId.split('::');
      if (parts[0] === 'exam' && parts[1]) {
        exp[`pkg::${parts[1]}`] = true;
        if (parts[2]) exp[`tier::${parts[1]}::${parts[2]}`] = true;
      } else if (parts[0] === 'merit') {
        exp['pkg::special'] = true;
      } else if (parts[0] === 'lastmile' || parts[0] === 'warbook') {
        exp['pkg::books'] = true;
      }
      setExpandedFolders(exp);

      const foundNode = findFolderInTree(folders, targetFolderId);
      setSelectedFolderName(foundNode?.name || targetFolderId);
      setSelectedFolderPath(foundNode?.path || 'borderlandssc.in');

      if (Array.isArray(res.tests)) {
        skipNextTestsFetchRef.current = targetFolderId;
        setTestsList(res.tests);
        setStatusMessage(
          `✓ Live data loaded for "${targetUrl}" (${res.tests.length} real tests found)`
        );
      } else {
        setStatusMessage(`✓ Loaded live folder tree (${folders.length} categories)`);
      }
      setSelectedFolderId(targetFolderId);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load live Borderland data';
      setErrorBanner(msg);
      setStatusMessage(`Error: ${msg}`);
      try {
        const fallbackLive = await fetchBorderlandFolders(activeAuth);
        setFolderTree(fallbackLive);
      } catch {
        // Keep real error visible
      }
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Load Tests whenever selectedFolderId or searchQuery changes
  useEffect(() => {
    if (!selectedFolderId) return;
    if (skipNextTestsFetchRef.current === selectedFolderId && !searchQuery) {
      skipNextTestsFetchRef.current = null;
      return;
    }
    skipNextTestsFetchRef.current = null;
    loadTestsForFolder(selectedFolderId, searchQuery);
  }, [selectedFolderId, searchQuery]);

  const loadTestsForFolder = async (folderId: string, search: string = '') => {
    setIsLoadingTests(true);
    setErrorBanner('');
    try {
      const tests = await fetchBorderlandTests(folderId, search, authUser);
      setTestsList(tests);
    } catch (err: any) {
      const msg = err?.message || 'Network error loading live tests';
      setErrorBanner(msg);
      setStatusMessage(`Error loading tests: ${msg}`);
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Toggle Folder expansion in tree
  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Select Folder
  const handleSelectFolder = (folder: BorderlandFolderNode) => {
    setSelectedFolderId(folder.id);
    setSelectedFolderName(folder.name);
    setSelectedFolderPath(folder.path);
    setStatusMessage(`Loading live tests for "${folder.name}"...`);
    setMobileActiveTab('tests');
  };

  // Handle Real Login (Email+Password OR Firebase Bearer Token)
  const handleLogin = async () => {
    if ((!loginEmail.trim() || !loginPassword.trim()) && !loginTokenInput.trim()) {
      setLoginError('Enter Email & Password or paste a Firebase Bearer Token');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const resp = await fetch('/api/borderland-ssc/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
          token: loginTokenInput.trim(),
        }),
      });
      const data = await resp.json();
      if (data.success && data.auth) {
        setAuthUser(data.auth);
        setStoredBorderlandAuth(data.auth);
        setIsLoginModalOpen(false);
        setErrorBanner('');
        setStatusMessage(`✓ Logged in as ${data.auth.name || data.auth.email || 'Borderland User'}`);
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login request failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    clearStoredBorderlandAuth();
    setAuthUser(null);
    setStatusMessage('Logged out from Borderland SSC.');
  };

  // Universal URL / Test ID Resolver ("url du kaisa v data aa jaye")
  const handleResolveDirectUrl = async (overrideUrl?: string) => {
    const rawInput = (overrideUrl !== undefined ? overrideUrl : directUrlInput).trim();
    if (!rawInput) {
      setStatusMessage('Please paste any borderlandssc.in URL, test ID, or API/quiz URL');
      return;
    }

    setIsResolvingUrl(true);
    setErrorBanner('');
    setStatusMessage(`Resolving live data from "${rawInput}"...`);

    try {
      const res = await resolveBorderlandFolderUrl(rawInput, authUser);
      if (res.resolvedType === 'test' && res.test) {
        setConvertedResult(res.test);
        setMobileActiveTab('preview');
        setStatusMessage(`✓ Live test unlocked (${res.test.totalQuestions} real questions): ${res.test.title}`);
      } else {
        const folders = res.folders || [];
        if (folders.length > 0) setFolderTree(folders);
        const targetId = res.activeFolderId || selectedFolderId;
        const exp: Record<string, boolean> = { ...expandedFolders };
        const parts = targetId.split('::');
        if (parts[0] === 'exam' && parts[1]) {
          exp[`pkg::${parts[1]}`] = true;
          if (parts[2]) exp[`tier::${parts[1]}::${parts[2]}`] = true;
        } else if (parts[0] === 'merit') {
          exp['pkg::special'] = true;
        } else if (parts[0] === 'lastmile' || parts[0] === 'warbook') {
          exp['pkg::books'] = true;
        }
        setExpandedFolders(exp);

        const foundNode = findFolderInTree(folders, targetId);
        setSelectedFolderName(foundNode?.name || targetId);
        setSelectedFolderPath(foundNode?.path || rawInput);

        if (Array.isArray(res.tests)) {
          skipNextTestsFetchRef.current = targetId;
          setTestsList(res.tests);
          setStatusMessage(`✓ Resolved URL: ${res.tests.length} real tests loaded!`);
        } else {
          setStatusMessage(`✓ Resolved folder tree for "${rawInput}"!`);
        }
        setSelectedFolderId(targetId);
        setMobileActiveTab('tests');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to resolve URL';
      setErrorBanner(msg);
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsResolvingUrl(false);
    }
  };

  // Handle Single Test Fetch & Convert
  const handleConvertTest = async (test: BorderlandTestItem) => {
    setConvertingTestId(test.id);
    setErrorBanner('');
    setStatusMessage(`Fetching real questions for "${test.title}"...`);
    try {
      const res = await fetchAndConvertBorderlandTest(test, authUser);
      setConvertedResult(res);
      setFetchedTestsStore((prev) => ({ ...prev, [test.id]: res }));
      setMobileActiveTab('preview');
      setStatusMessage(`✓ "${test.title}" fetched live! (${res.totalQuestions} real questions)`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch test';
      setErrorBanner(msg);
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setConvertingTestId(null);
    }
  };

  // Handle Download Clean .txt for a test directly (shows Clean .txt preview + triggers reliable download)
  const handleDirectDownloadTxt = async (test: BorderlandTestItem) => {
    setErrorBanner('');
    setStatusMessage(`Fetching Clean .txt for "${test.title}"...`);
    try {
      let result = fetchedTestsStore[test.id];
      if (!result) {
        setConvertingTestId(test.id);
        result = await fetchAndConvertBorderlandTest(test, authUser);
        setFetchedTestsStore((prev) => ({ ...prev, [test.id]: result }));
      }
      setConvertedResult(result);
      setActiveViewTab('cleantxt');
      setMobileActiveTab('preview');
      triggerTxtDownload(result.cleanTxt, `${sanitizeFileName(result.title)}_Clean_PaidTrue.txt`);
      setStatusMessage(`✓ Ready & downloaded "${test.title}.txt" (${result.totalQuestions} questions)!`);
      setTimeout(() => {
        previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } catch (err: any) {
      const msg = err?.message || 'Failed to get clean .txt';
      setErrorBanner(msg);
      setStatusMessage(`Error getting .txt: ${msg}`);
    } finally {
      setConvertingTestId(null);
    }
  };

  // Handle Download Standalone Interactive .html Test (Exact borderlandssc.in HTML + CSS + JS)
  const handleDownloadHtmlTest = async (test: BorderlandTestItem) => {
    setErrorBanner('');
    setDownloadingHtmlTestId(test.id);
    setStatusMessage(`Building exact Borderland HTML/CSS/JS mock for "${test.title}"...`);
    try {
      let result = fetchedTestsStore[test.id];
      if (!result) {
        result = await fetchAndConvertBorderlandTest(test, authUser);
        setFetchedTestsStore((prev) => ({ ...prev, [test.id]: result }));
      }
      setConvertedResult(result);

      const downloadedName = await downloadBorderlandExactHtml(
        {
          testId: result.id || test.id,
          title: result.title || test.title,
          time: test.time,
          rawMeta: result.rawMeta,
          rawQuestions: result.rawQuestions,
          convertedQuestions: result.questions,
        },
        authUser
      );
      setStatusMessage(`✓ Downloaded "${downloadedName}" in exact Borderland SSC HTML/CSS/JS format!`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to build Borderland HTML mock';
      setErrorBanner(msg);
      setStatusMessage(`Error generating .html test: ${msg}`);
    } finally {
      setDownloadingHtmlTestId(null);
    }
  };

  // Continuous Progressive Real Fetching
  const startContinuousFetching = async () => {
    if (testsList.length === 0) {
      setStatusMessage('No tests available in this folder to fetch.');
      return;
    }

    stopFetchRef.current = false;
    setIsContinuousFetching(true);
    setContinuousProgress({
      current: 0,
      total: testsList.length,
      currentTestTitle: testsList[0]?.title || '',
      successCount: 0,
      errorCount: 0,
    });

    let success = 0;
    let errors = 0;

    for (let i = 0; i < testsList.length; i++) {
      const test = testsList[i];

      if (stopFetchRef.current) {
        setStatusMessage(`Fetching stopped at ${i}/${testsList.length}. (${success} ready, ${errors} skipped)`);
        break;
      }

      setContinuousProgress({
        current: i + 1,
        total: testsList.length,
        currentTestTitle: test.title,
        successCount: success,
        errorCount: errors,
      });
      setStatusMessage(`[Live Fetch] (${i + 1}/${testsList.length}) Fetching "${test.title}"...`);

      try {
        let converted = fetchedTestsStore[test.id];
        if (!converted) {
          converted = await fetchAndConvertBorderlandTest(test, authUser);
          setFetchedTestsStore((prev) => ({ ...prev, [test.id]: converted }));
        }
        success++;
      } catch (err) {
        errors++;
        console.warn(`Live fetch skipped test ${test.id}:`, err);
      }

      await new Promise((r) => setTimeout(r, 120));
    }

    setIsContinuousFetching(false);
    if (!stopFetchRef.current) {
      setStatusMessage(`✓ Live fetch complete! ${success} real tests fetched (${errors} unavailable/protected).`);
    }
  };

  // Stop / Cancel Continuous Fetching
  const stopContinuousFetching = () => {
    stopFetchRef.current = true;
    setIsContinuousFetching(false);
    setStatusMessage('Continuous fetching stopped.');
  };

  // Batch Zip Download of all tests in folder
  const handleDownloadFolderZip = async () => {
    if (testsList.length === 0) return;
    setIsZipping(true);
    setStatusMessage(`Creating ZIP archive for folder "${selectedFolderName}"...`);

    try {
      const zip = new JSZip();
      const folderZip = zip.folder(sanitizeFileName(selectedFolderName)) || zip;
      let countAdded = 0;

      for (const test of testsList) {
        let converted = fetchedTestsStore[test.id];
        if (!converted) {
          try {
            converted = await fetchAndConvertBorderlandTest(test, authUser);
            setFetchedTestsStore((prev) => ({ ...prev, [test.id]: converted }));
          } catch (e) {
            console.warn(`Skipping failed test in zip: ${test.title}`);
            continue;
          }
        }
        const fileName = `${sanitizeFileName(test.title)}_Clean_PaidTrue.txt`;
        folderZip.file(fileName, converted.cleanTxt);
        countAdded++;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      triggerReliableFileDownload(
        content,
        `${sanitizeFileName(selectedFolderName)}_Borderland_AllTests.zip`,
        'application/zip'
      );

      setStatusMessage(`✓ Downloaded ZIP containing ${countAdded} clean .txt test papers!`);
    } catch (err: any) {
      setStatusMessage(`ZIP generation error: ${err?.message}`);
    } finally {
      setIsZipping(false);
    }
  };

  // Batch Combined .txt Download
  const handleDownloadCombinedTxt = async () => {
    if (testsList.length === 0) return;
    setStatusMessage(`Building combined .txt file for all tests in "${selectedFolderName}"...`);

    try {
      const combinedParts: string[] = [];
      combinedParts.push('==================================================');
      combinedParts.push(`EXAM: SSC BORDERLAND (borderlandssc.in)`);
      combinedParts.push(`FOLDER: ${selectedFolderName}`);
      combinedParts.push(`PATH: ${selectedFolderPath}`);
      combinedParts.push(`TOTAL TESTS: ${testsList.length}`);
      combinedParts.push(`PAID STATUS: TRUE (ALL UNLOCKED ✦)`);
      combinedParts.push('==================================================\n\n');

      for (let i = 0; i < testsList.length; i++) {
        const test = testsList[i];
        let converted = fetchedTestsStore[test.id];
        if (!converted) {
          try {
            converted = await fetchAndConvertBorderlandTest(test, authUser);
            setFetchedTestsStore((prev) => ({ ...prev, [test.id]: converted }));
          } catch (e) {
            continue;
          }
        }
        combinedParts.push(`\n>>> TEST [${i + 1}/${testsList.length}]: ${converted.title} <<<\n`);
        combinedParts.push(converted.cleanTxt);
        combinedParts.push('\n\n==================================================\n');
      }

      triggerTxtDownload(
        combinedParts.join('\n'),
        `${sanitizeFileName(selectedFolderName)}_All_Tests_Combined.txt`
      );
      setStatusMessage(`✓ Downloaded combined master .txt for "${selectedFolderName}"!`);
    } catch (err: any) {
      setStatusMessage(`Error combining tests: ${err?.message}`);
    }
  };

  // Copy Clean .txt
  const handleCopyCleanTxt = () => {
    if (!convertedResult?.cleanTxt) return;
    navigator.clipboard.writeText(convertedResult.cleanTxt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Download Clean .txt for active converted test
  const handleDownloadActiveCleanTxt = () => {
    if (!convertedResult?.cleanTxt) return;
    triggerTxtDownload(
      convertedResult.cleanTxt,
      `${sanitizeFileName(convertedResult.title)}_Clean_PaidTrue.txt`
    );
  };

  // Download Active Converted Test as Exact Borderland SSC .html
  const handleDownloadActiveConvertedHtml = async () => {
    if (!convertedResult) return;
    setErrorBanner('');
    const activeId = convertedResult.id || sanitizeFileName(convertedResult.title);
    setDownloadingHtmlTestId(activeId);
    setStatusMessage(`Building exact Borderland HTML/CSS/JS mock for "${convertedResult.title}"...`);
    try {
      const downloadedName = await downloadBorderlandExactHtml(
        {
          testId: convertedResult.id,
          title: convertedResult.title,
          rawMeta: convertedResult.rawMeta,
          rawQuestions: convertedResult.rawQuestions,
          convertedQuestions: convertedResult.questions,
        },
        authUser
      );
      setStatusMessage(`✓ Downloaded "${downloadedName}" in exact Borderland SSC HTML/CSS/JS format!`);
    } catch (err: any) {
      const msg = err?.message || 'Failed to build Borderland HTML mock';
      setErrorBanner(msg);
      setStatusMessage(`Error generating .html test: ${msg}`);
    } finally {
      setDownloadingHtmlTestId(null);
    }
  };

  // Load into PDF Studio
  const handleLoadIntoPdfStudio = () => {
    if (!convertedResult?.cleanTxt || !onLoadIntoPdfStudio) return;
    const safeTitle = sanitizeFileName(convertedResult.title);
    onLoadIntoPdfStudio(convertedResult.cleanTxt, `${safeTitle}_Borderland_PaidTrue.txt`);
  };

  const sanitizeFileName = (name: string) => {
    return (name || 'Borderland_SSC').replace(/[^a-zA-Z0-9_-]/g, '_');
  };

  const triggerTxtDownload = (content: string, fileName: string) => {
    triggerReliableFileDownload(content, fileName, 'text/plain;charset=utf-8');
  };

  // Recursive renderer for arbitrary depth folder trees (Package > Tier > Subject > Chapter > Topic)
  const renderFolderNode = (node: BorderlandFolderNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedFolders[node.id] ?? (depth < 2);
    const isSelected = selectedFolderId === node.id;

    if (!hasChildren) {
      return (
        <button
          key={node.id}
          type="button"
          onClick={() => handleSelectFolder(node)}
          style={{ paddingLeft: `${Math.max(8, depth * 12)}px` }}
          className={`w-full pr-2.5 py-1.5 text-left rounded-lg text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
            isSelected
              ? 'bg-indigo-600 text-white shadow-xs font-black'
              : 'text-slate-700 hover:bg-white hover:text-slate-950 border border-transparent hover:border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="shrink-0 text-xs">{node.iconTag || '🎯'}</span>
            <span className="truncate">{node.name}</span>
          </div>
          <span
            className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
              isSelected
                ? 'bg-indigo-700 text-indigo-100 font-bold'
                : 'bg-slate-200/80 text-slate-600'
            }`}
          >
            {node.testCount}
          </span>
        </button>
      );
    }

    return (
      <div
        key={node.id}
        className={`rounded-xl overflow-hidden border transition-all ${
          depth === 0
            ? 'border-slate-200/90 bg-slate-50/60 shadow-2xs'
            : 'border-slate-200/60 bg-white/70'
        }`}
      >
        <button
          type="button"
          onClick={() => toggleFolderExpand(node.id)}
          style={{ paddingLeft: `${Math.max(10, depth * 12)}px` }}
          className={`w-full pr-2.5 py-2 text-left flex items-center justify-between transition-all cursor-pointer ${
            depth === 0
              ? 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-900 border-b border-slate-200/70 font-black text-xs'
              : depth === 1
              ? 'bg-slate-50 hover:bg-slate-100/90 text-slate-800 font-extrabold text-[11.5px]'
              : 'bg-white hover:bg-slate-50 text-slate-800 font-bold text-[11px]'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-slate-400 shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
            <span className="shrink-0 text-sm">{node.iconTag || '📁'}</span>
            <span className="truncate">{node.name}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/90 border border-slate-200 rounded text-slate-700 shrink-0 font-bold">
            {node.testCount}
          </span>
        </button>

        {isExpanded && node.children && node.children.length > 0 && (
          <div className="p-1 space-y-1 bg-slate-50/50 border-t border-slate-100">
            {node.children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-4 sm:p-6 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-indigo-500 text-white rounded-full flex items-center gap-1 shadow-xs">
                <Award className="w-3.5 h-3.5" />
                SSC Borderland Official
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-white/10 text-indigo-200 border border-white/15 rounded-full">
                borderlandssc.in
              </span>
              <span
                className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full flex items-center gap-1 border ${
                  authUser
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-sky-500/20 text-sky-200 border-sky-400/30'
                }`}
              >
                <Unlock className="w-3 h-3" />
                {authUser ? 'Signed In (borderlandssc.in)' : 'Public Tests Ready • Auth Optional'}
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                CCT System &amp; Mission Merit
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>SSC Borderland Studio (borderlandssc.in)</span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl">
              Folder-wise hierarchical test portal for SSC Borderland: Continuous Cumulative Tests (CCT),
              Mission Merit 60-Day blueprints, and Chapterwise PYQs with continuous real fetching &amp; clean .txt downloads.
            </p>
          </div>

          {/* Account Login / User Profile Pill */}
          <div className="shrink-0 flex items-center gap-2">
            {authUser ? (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3.5 py-2">
                <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-black flex items-center justify-center text-xs">
                  {authUser.name ? authUser.name.charAt(0).toUpperCase() : 'B'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{authUser.name || 'Borderland Student'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-[10px] text-indigo-200">{authUser.mobile || 'Connected'}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Log out"
                  className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login to borderlandssc.in</span>
                </button>
              )}
            </div>
          </div>

          {/* Live Status Bar */}
          <div className="mt-3.5 pt-3 border-t border-indigo-900/40 flex flex-wrap items-center justify-between text-xs text-indigo-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{statusMessage}</span>
            </div>
            <div className="text-[11px] text-indigo-300/80 font-mono">
              100% Live API • Real Data Only • Zero Fake Fallback
            </div>
          </div>
        </div>

        {/* Real Error Banner */}
        {errorBanner && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-rose-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorBanner}</span>
            </div>
            {errorBanner.toLowerCase().includes('auth') && (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shrink-0 cursor-pointer"
              >
                Login / Paste Token
              </button>
            )}
          </div>
        )}

        {/* 2. Universal URL / Test ID Input Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={directUrlInput}
                onChange={(e) => setDirectUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResolveDirectUrl()}
                placeholder="Paste ANY borderlandssc.in folder URL, test2.html?id=..., test ID, API URL, or external quiz URL..."
                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => handleResolveDirectUrl()}
              disabled={isResolvingUrl || !directUrlInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
            >
              {isResolvingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Fetch Live Data</span>
            </button>
          </div>

          {/* Quick URL Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Quick Live URLs:
            </span>
            <button
              type="button"
              onClick={() => {
                const url = 'https://borderlandssc.in/tests?folder=exams&examCat=ssc&exam=cgl&tier=t1&type=pyq&year=2025';
                setDirectUrlInput(url);
                handleResolveDirectUrl(url);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>🏛️</span>
              <span>SSC CGL PYQ 2025</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = 'https://borderlandssc.in/tests?folder=exams&examCat=railway&exam=ntpc_ug_2025';
                setDirectUrlInput(url);
                handleResolveDirectUrl(url);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>🚆</span>
              <span>Railway NTPC Live</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = 'https://borderlandssc.in/tests?folder=special&special=merit';
                setDirectUrlInput(url);
                handleResolveDirectUrl(url);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>⚡</span>
              <span>Mission Merit</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = 'https://borderlandssc.in/tests?folder=books&book=lastmile';
                setDirectUrlInput(url);
                handleResolveDirectUrl(url);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>📖</span>
              <span>Last Mile English</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = 'https://borderlandssc.in/tests?folder=books&book=warbook';
                setDirectUrlInput(url);
                handleResolveDirectUrl(url);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>🛡️</span>
              <span>Warbook GS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const url = 'https://borderlandssc.in/tests?folder=books&genSub=warbook_maths';
                setDirectUrlInput(url);
                handleResolveDirectUrl(url);
              }}
              className="px-2.5 py-1 text-[11px] font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>📐</span>
              <span>Warbook Maths</span>
            </button>
          </div>
        </div>

      {/* Mobile App View Selector (Toggle between Folders, Tests & Preview on Phones) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/90 rounded-2xl gap-1 text-xs font-bold shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileActiveTab('folders')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'folders'
              ? 'bg-indigo-600 text-white shadow-xs font-black'
              : 'text-slate-700 hover:text-slate-900 bg-transparent'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Folders & Chapters</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('tests')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'tests'
              ? 'bg-indigo-600 text-white shadow-xs font-black'
              : 'text-slate-700 hover:text-slate-900 bg-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tests ({testsList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileActiveTab('preview')}
          className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mobileActiveTab === 'preview'
              ? 'bg-indigo-600 text-white shadow-xs font-black'
              : 'text-slate-700 hover:text-slate-900 bg-transparent'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{convertedResult ? 'Result / Preview' : 'Preview'}</span>
          {convertedResult && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* 3. Main Workspace: Two Columns (Folder Tree Sidebar + Tests Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Folder-Wise Tree Navigation ("folder Wise Structure") */}
        <div className={`lg:col-span-4 space-y-3 ${mobileActiveTab === 'folders' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Folder &amp; Topic Structure
                </h2>
              </div>
              <button
                type="button"
                onClick={() => loadFolders(directUrlInput)}
                className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                title="Reload Folder Tree"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hierarchical Folder Tree: Exam > Tier > Subject > Chapter > Topic */}
            <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
              {isLoadingFolders ? (
                <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading live chapter &amp; topic hierarchy...</span>
                </div>
              ) : folderTree.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">No folders found</div>
              ) : (
                folderTree.map((pkg) => renderFolderNode(pkg, 0))
              )}
            </div>
          </div>
        </div>

        {/* Right: Tests List, Continuous Real Fetch Engine & Batch Controls */}
        <div className={`lg:col-span-8 space-y-3 ${mobileActiveTab === 'tests' ? 'block' : 'hidden lg:block'}`}>
          {/* Active Folder Header & Batch Actions Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                  <span>{selectedFolderPath}</span>
                </div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>{selectedFolderName}</span>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                    {testsList.length} Tests Available
                  </span>
                </h2>
              </div>

              {/* Batch Fetch & Download Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                {!isContinuousFetching ? (
                  <button
                    type="button"
                    onClick={startContinuousFetching}
                    disabled={testsList.length === 0}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Real continuous fetching through all tests in folder ('Real Fatch Karte rahe')"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Real Fetch All in Folder</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopContinuousFetching}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Fetch</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownloadFolderZip}
                  disabled={isZipping || testsList.length === 0}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:bg-slate-300"
                  title="Download all clean .txt tests in folder as a ZIP file"
                >
                  {isZipping ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5 text-amber-300" />}
                  <span>Download Folder ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCombinedTxt}
                  disabled={testsList.length === 0}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Combine all tests into one clean master .txt"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Combined .txt</span>
                </button>
              </div>
            </div>

            {/* Continuous Fetching Live Progress Bar ("Real Fatch Karte rahe") */}
            {isContinuousFetching && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-indigo-950">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>
                      Continuous Real Fetching Active: ({continuousProgress.current} / {continuousProgress.total})
                    </span>
                  </span>
                  <span className="font-mono text-indigo-700">
                    {Math.round((continuousProgress.current / Math.max(1, continuousProgress.total)) * 100)}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-indigo-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{
                      width: `${(continuousProgress.current / Math.max(1, continuousProgress.total)) * 100}%`,
                    }}
                  />
                </div>

                <div className="text-[11px] text-indigo-800 font-medium truncate">
                  Now Fetching: <strong>{continuousProgress.currentTestTitle}</strong>
                </div>
              </div>
            )}

            {/* Filter Search + Public/Free Toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter tests in this folder by title or topic..."
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setOnlyPublicTests((v) => !v)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
                  onlyPublicTests
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Show only tests that fetch live without needing a borderlandssc.in account"
              >
                {onlyPublicTests
                  ? `Showing Free/Public (${testsList.filter((t) => t.unlocked).length})`
                  : `Free/Public Only (${testsList.filter((t) => t.unlocked).length}/${testsList.length})`}
              </button>
            </div>

            {/* Tests Cards List */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {isLoadingTests ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Loading tests in folder...</span>
                </div>
              ) : (onlyPublicTests ? testsList.filter((t) => t.unlocked) : testsList).length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <div>
                    {onlyPublicTests
                      ? 'No Public/Free tests in this folder — all items here are marked Premium by borderlandssc.in (requires account login). Try SSC PYQ, Mission Merit, Last Mile, Warbook GS, or Warbook Maths!'
                      : 'No tests found in this folder.'}
                  </div>
                </div>
              ) : (
                (onlyPublicTests ? testsList.filter((t) => t.unlocked) : testsList).map((test) => {
                  const isConverting = convertingTestId === test.id;
                  const isDownloadingHtml = downloadingHtmlTestId === test.id;
                  const isFetched = !!fetchedTestsStore[test.id];

                  return (
                    <div
                      key={test.id}
                      className="border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 hover:shadow-xs transition-all bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {test.unlocked ? (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 rounded-md">
                                FREE / PUBLIC ✦
                              </span>
                            ) : authUser ? (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-700 border border-indigo-500/30 rounded-md">
                                PREMIUM (AUTH)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-800 border border-amber-500/30 rounded-md">
                                🔒 LOGIN REQUIRED
                              </span>
                            )}
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {test.time} Min
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md flex items-center gap-1">
                              <HelpCircle className="w-3 h-3" />
                              {test.questionsCount} Qs
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                              {test.marks} Marks
                            </span>
                            {isFetched && (
                              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Fetched
                              </span>
                            )}
                          </div>

                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                            {test.title}
                          </h3>

                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span>{test.folderName}</span>
                            <span>•</span>
                            <span>{test.shift || 'Shift 1'}</span>
                            <span>•</span>
                            <span>{test.examDate || '2026'}</span>
                          </div>
                        </div>

                        {/* Action Buttons: Get Clean .txt & Download .html Side-by-Side */}
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDirectDownloadTxt(test)}
                            disabled={isConverting}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Directly download clean bilingual .txt file"
                          >
                            {isConverting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                            <span>Get Clean .txt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadHtmlTest(test)}
                            disabled={isDownloadingHtml}
                            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Download complete standalone test as <Test Name>.html with timer, LaTeX math & full analysis dashboard"
                          >
                            {isDownloadingHtml ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Globe className="w-3.5 h-3.5" />
                            )}
                            <span>Download .html</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConvertTest(test)}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200"
                            title="Inspect Questions & Solutions Cards"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Empty Preview State */}
      {!convertedResult && mobileActiveTab === 'preview' && (
        <div className="lg:hidden bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Eye className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Test Converted Yet</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Select a test from the Tests tab and click &quot;Fetch &amp; Convert&quot; to inspect questions and clean text.
          </p>
          <button
            type="button"
            onClick={() => setMobileActiveTab('tests')}
            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl"
          >
            Go to Tests Tab
          </button>
        </div>
      )}

      {/* 4. Converted Test View (Clean .txt / Question Cards / Raw JSON) */}
      {convertedResult && (
        <div
          ref={previewSectionRef}
          className={`bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 ${
            mobileActiveTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Mobile Back to Tests button */}
          <div className="lg:hidden flex items-center justify-between pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setMobileActiveTab('tests')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tests</span>
            </button>
            <span className="text-[11px] font-mono text-slate-500">
              {convertedResult.totalQuestions} Questions
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 border border-emerald-500/30 rounded-md">
                  PAID STATUS: TRUE ✦
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {convertedResult.totalQuestions} Questions Parsed
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                {convertedResult.title}
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleLoadIntoPdfStudio}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-emerald-700/20 flex items-center gap-2 transition-all cursor-pointer"
                title="Open directly in A4 PDF Studio to print or download PDF"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Load into PDF Studio</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadActiveCleanTxt}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadActiveConvertedHtml}
                disabled={downloadingHtmlTestId !== null}
                className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                title="Download standalone mock test in exact borderlandssc.in HTML/CSS/JS format"
              >
                {downloadingHtmlTestId !== null ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                <span>Download .html (Borderland UI)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyCleanTxt}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copySuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Subtabs: Clean .txt / Cards / Raw JSON */}
          <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveViewTab('cleantxt')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'cleantxt'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Clean .txt File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('cards')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'cards'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Questions &amp; Solutions Cards ({convertedResult.questions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveViewTab('rawjson')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeViewTab === 'rawjson'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>Raw JSON</span>
            </button>
          </div>

          {/* Tab 1: Clean .txt Preview */}
          {activeViewTab === 'cleantxt' && (
            <div className="space-y-2">
              <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
                {convertedResult.cleanTxt}
              </pre>
            </div>
          )}

          {/* Tab 2: Question Cards */}
          {activeViewTab === 'cards' && (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {convertedResult.questions.map((q) => (
                <div
                  key={q.qNum}
                  className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-600 text-white text-xs font-black rounded-lg">
                      Q{q.qNum}
                    </span>
                    {q.section && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {q.section}
                      </span>
                    )}
                  </div>

                  {/* Question Stem (English & Hindi) */}
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {q.questionEn}
                    </div>
                    {q.questionHi && q.questionHi !== q.questionEn && (
                      <div className="text-xs sm:text-sm font-medium text-slate-700">
                        {q.questionHi}
                      </div>
                    )}
                  </div>

                  {/* Diagram / Image if present */}
                  {q.imageUrl && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block">
                      <img
                        src={q.imageUrl}
                        alt={`Figure for Question ${q.qNum}`}
                        className="max-h-48 object-contain rounded"
                      />
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.optionsEn.map((optEn, oIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][oIdx] as 'A' | 'B' | 'C' | 'D';
                      const isCorrect = q.correctOptionLetter === letter;
                      const optHi = q.optionsHi[oIdx];

                      return (
                        <div
                          key={letter}
                          className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                              : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {letter}
                          </span>
                          <div className="min-w-0">
                            <div>{optEn}</div>
                            {optHi && optHi !== optEn && (
                              <div className="text-[11px] text-slate-600 mt-0.5">{optHi}</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Answer & Explanation */}
                  <div className="pt-2 border-t border-slate-200/80 space-y-1">
                    <div className="text-xs font-black text-emerald-700">
                      Ans: ({q.correctOptionLetter}) {q.answerClean}
                    </div>
                    {q.explanationEn && (
                      <div className="text-xs text-slate-700">
                        <strong>Explanation:</strong> {q.explanationEn}
                      </div>
                    )}
                    {q.explanationHi && q.explanationHi !== q.explanationEn && (
                      <div className="text-xs text-slate-600">
                        <strong>व्याख्या:</strong> {q.explanationHi}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Raw JSON */}
          {activeViewTab === 'rawjson' && (
            <pre className="p-4 bg-slate-950 text-indigo-300 rounded-xl font-mono text-xs max-h-[500px] overflow-y-auto whitespace-pre-wrap select-all border border-slate-800">
              {convertedResult.rawJson}
            </pre>
          )}
        </div>
      )}

      {/* 5. Login Modal */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsLoginModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-extrabold text-slate-900">
                  Login to borderlandssc.in
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with your borderlandssc.in Email &amp; Password or paste your Firebase Bearer Token
              to unlock protected/premium tests on borderlandssc.in.
            </p>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your borderlandssc.in password"
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="relative flex items-center justify-center my-2">
                <hr className="w-full border-slate-200" />
                <span className="bg-white px-2 text-[10px] font-bold text-slate-400 uppercase absolute">
                  OR BEARER TOKEN
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Firebase ID Token (Optional)
                </label>
                <input
                  type="text"
                  value={loginTokenInput}
                  onChange={(e) => setLoginTokenInput(e.target.value)}
                  placeholder="Paste Firebase Bearer Token from browser DevTools"
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                {isLoggingIn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>Login</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
