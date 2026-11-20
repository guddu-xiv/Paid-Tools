import React, { useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
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
  FolderArchive,
  Key,
  Layers,
  Loader2,
  LogIn,
  Phone,
  Search,
  X,
} from 'lucide-react';
import {
  clearStoredDkAuth,
  DkAuthUser,
  DkSeriesItem,
  DkSubjectItem,
  DkTestItem,
  fetchAllDkSeries,
  fetchAndConvertDkTest,
  fetchDkSubjects,
  fetchDkTests,
  getStoredDkAuth,
  loginDkWithPassword,
  sendDkOtp,
  setStoredDkAuth,
  verifyDkOtp,
} from '../services/dkAgarwalService';
import { DkAgarwalConvertedResult } from '../utils/dkAgarwalConverter';

export interface DkAgarwalStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

export function DkAgarwalStudio({ onLoadIntoPdfStudio }: DkAgarwalStudioProps) {
  // Authentication State
  const [authUser, setAuthUser] = useState<DkAuthUser | null>(null);
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

  // Series & Subjects State
  const [seriesList, setSeriesList] = useState<DkSeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('2');
  const [subjectsList, setSubjectsList] = useState<DkSubjectItem[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('2');
  const [testsList, setTestsList] = useState<DkTestItem[]>([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState<boolean>(false);
  const [isLoadingTests, setIsLoadingTests] = useState<boolean>(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Converted Test State
  const [convertingTestId, setConvertingTestId] = useState<string | null>(null);
  const [convertedResult, setConvertedResult] = useState<DkAgarwalConvertedResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'cleantxt' | 'cards' | 'rawjson'>('cleantxt');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Bulk All .txt ZIP Export State
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<{
    done: number;
    total: number;
    failed: number;
    currentTitle: string;
  } | null>(null);
  const zipCancelRef = useRef<boolean>(false);

  // Load stored auth on mount
  useEffect(() => {
    const saved = getStoredDkAuth();
    if (saved) setAuthUser(saved);
  }, []);

  // Fetch Series on mount or auth change
  useEffect(() => {
    let isCancelled = false;
    async function loadSeries() {
      setIsLoadingSeries(true);
      try {
        const list = await fetchAllDkSeries(authUser);
        if (!isCancelled && list.length > 0) {
          setSeriesList(list);
          if (!list.some((s) => s.id === selectedSeriesId)) {
            setSelectedSeriesId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Error loading series', err);
      } finally {
        if (!isCancelled) setIsLoadingSeries(false);
      }
    }
    loadSeries();
    return () => {
      isCancelled = true;
    };
  }, [authUser]);

  // Fetch Subjects when selected series changes
  useEffect(() => {
    if (!selectedSeriesId) return;
    let isCancelled = false;
    async function loadSubjects() {
      setIsLoadingSubjects(true);
      try {
        const subs = await fetchDkSubjects(selectedSeriesId, authUser);
        if (!isCancelled && subs.length > 0) {
          setSubjectsList(subs);
          if (!subs.some((s) => s.id === selectedSubjectId)) {
            setSelectedSubjectId(subs[0].id);
          }
        }
      } catch (err) {
        console.warn('Error loading subjects', err);
      } finally {
        if (!isCancelled) setIsLoadingSubjects(false);
      }
    }
    loadSubjects();
    return () => {
      isCancelled = true;
    };
  }, [selectedSeriesId, authUser]);

  // Fetch Tests when series or subject changes
  useEffect(() => {
    if (!selectedSeriesId || !selectedSubjectId) return;
    let isCancelled = false;
    async function loadTests() {
      setIsLoadingTests(true);
      try {
        const tests = await fetchDkTests(selectedSeriesId, selectedSubjectId, searchQuery, authUser);
        if (!isCancelled) {
          setTestsList(tests);
        }
      } catch (err) {
        console.warn('Error loading tests', err);
      } finally {
        if (!isCancelled) setIsLoadingTests(false);
      }
    }
    loadTests();
    return () => {
      isCancelled = true;
    };
  }, [selectedSeriesId, selectedSubjectId, searchQuery, authUser]);

  // Filtered tests based on search query
  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return testsList;
    const q = searchQuery.toLowerCase();
    return testsList.filter((t) => t.title.toLowerCase().includes(q) || String(t.id).includes(q));
  }, [testsList, searchQuery]);

  const activeSeries = useMemo(() => {
    return seriesList.find((s) => s.id === selectedSeriesId) || seriesList[0];
  }, [seriesList, selectedSeriesId]);

  const activeSubject = useMemo(() => {
    return subjectsList.find((s) => s.id === selectedSubjectId) || subjectsList[0];
  }, [subjectsList, selectedSubjectId]);

  // Handler: Send Mobile OTP
  const handleSendOtp = async () => {
    if (!loginPhone.trim() || loginPhone.trim().length < 10) {
      setLoginError('कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें (Enter valid 10-digit mobile number)');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await sendDkOtp(loginPhone.trim());
      if (res.success) {
        setOtpSent(true);
        setStatusMessage('OTP आपके मोबाइल पर भेज दिया गया है!');
      } else {
        setLoginError(res.message || 'OTP भेजने में त्रुटि हुई');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'OTP request failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handler: Verify Mobile OTP
  const handleVerifyOtp = async () => {
    if (!loginOtp.trim()) {
      setLoginError('कृपया OTP दर्ज करें (Enter OTP)');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await verifyDkOtp(loginPhone.trim(), loginOtp.trim());
      if (res.success && res.auth) {
        setAuthUser(res.auth);
        setStoredDkAuth(res.auth);
        setIsLoginModalOpen(false);
        setOtpSent(false);
        setLoginOtp('');
        setStatusMessage(`नमस्ते, ${res.auth.name}! Agrawal Academy अकाउंट कनेक्ट हो गया।`);
      } else {
        setLoginError(res.error || 'अमान्य OTP (Invalid OTP)');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'OTP verification failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handler: Password Login
  const handlePasswordLogin = async () => {
    if (!loginPhone.trim() || !loginPassword.trim()) {
      setLoginError('कृपया Mobile/Email और Password दर्ज करें');
      return;
    }
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const res = await loginDkWithPassword(loginPhone.trim(), loginPassword.trim());
      if (res.success && res.auth) {
        setAuthUser(res.auth);
        setStoredDkAuth(res.auth);
        setIsLoginModalOpen(false);
        setStatusMessage(`लॉगिन सफल! स्वागत है ${res.auth.name}`);
      } else {
        setLoginError(res.error || 'लॉगिन विफल (Login failed). Please check credentials.');
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Login failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handler: Direct Token Login
  const handleTokenLogin = () => {
    if (!loginTokenInput.trim()) {
      setLoginError('कृपया Auth Token दर्ज करें');
      return;
    }
    const auth: DkAuthUser = {
      token: loginTokenInput.trim(),
      name: 'Agrawal Academy User',
      userId: 'user_token_auth',
    };
    setAuthUser(auth);
    setStoredDkAuth(auth);
    setIsLoginModalOpen(false);
    setStatusMessage('Token Authenticated! All paid & free tests connected.');
  };

  // Handler: Logout
  const handleLogout = () => {
    clearStoredDkAuth();
    setAuthUser(null);
    setStatusMessage('Logged out from Agrawal Academy account.');
  };

  // Handler: Convert Single Test to Clean .txt
  const handleConvertTest = async (test: DkTestItem) => {
    setConvertingTestId(test.id);
    setStatusMessage(`Converting "${test.title}" into clean bilingual .txt (Paid: TRUE)...`);
    try {
      const result = await fetchAndConvertDkTest(
        test,
        activeSeries?.title,
        activeSubject?.name,
        authUser
      );
      setConvertedResult(result);
      setStatusMessage(`✓ "${test.title}" converted successfully! (${result.totalQuestions} Questions)`);
    } catch (err: any) {
      console.error('Test conversion error', err);
      setStatusMessage(`Error: ${err?.message || 'Failed to convert test'}`);
    } finally {
      setConvertingTestId(null);
    }
  };

  // Handler: Copy Clean .txt
  const handleCopyCleanTxt = () => {
    if (!convertedResult?.cleanTxt) return;
    navigator.clipboard.writeText(convertedResult.cleanTxt);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Handler: Download Clean .txt
  const handleDownloadCleanTxt = () => {
    if (!convertedResult?.cleanTxt) return;
    const safeTitle = (convertedResult.title || 'DK_Agarwal_Test').replace(/[^a-zA-Z0-9_-]/g, '_');
    const blob = new Blob(['\uFEFF' + convertedResult.cleanTxt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeTitle}_Bilingual_PaidTrue.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Load into PDF Studio
  const handleLoadIntoPdfStudio = () => {
    if (!convertedResult?.cleanTxt || !onLoadIntoPdfStudio) return;
    const safeTitle = (convertedResult.title || 'DK_Agarwal_Test').replace(/[^a-zA-Z0-9_-]/g, '_');
    onLoadIntoPdfStudio(convertedResult.cleanTxt, `${safeTitle}_Clean_PaidTrue.txt`);
  };

  // Sanitize file/folder name for ZIP structure
  const sanitizeZipName = (name: string): string => {
    return (name || 'Untitled')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100);
  };

  // Handler: Download All .txt as structured ZIP (Series Folder / Subject Folder / ###_Title.txt)
  const handleDownloadAllTxtZip = async () => {
    if (filteredTests.length === 0 || isDownloadingZip) return;

    zipCancelRef.current = false;
    setIsDownloadingZip(true);
    const total = filteredTests.length;
    setZipProgress({
      done: 0,
      total,
      failed: 0,
      currentTitle: 'Preparing ZIP folder structure...',
    });

    const seriesFolderName = sanitizeZipName(activeSeries?.title || 'DK_Agarwal_Test_Series');
    const subjectFolderName = sanitizeZipName(activeSubject?.name || 'All_Tests');

    const zip = new JSZip();
    const seriesFolder = zip.folder(seriesFolderName) || zip;
    const targetFolder = seriesFolder.folder(subjectFolderName) || seriesFolder;

    let done = 0;
    let failed = 0;
    const failedTitles: string[] = [];
    const savedIndex: string[] = [];
    const usedNames = new Set<string>();
    const CONCURRENCY = 6;

    try {
      for (let i = 0; i < total; i += CONCURRENCY) {
        if (zipCancelRef.current) break;

        const batch = filteredTests.slice(i, i + CONCURRENCY);
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

            let res: DkAgarwalConvertedResult | null = null;
            let lastErr: any = null;
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                res = await fetchAndConvertDkTest(
                  test,
                  activeSeries?.title,
                  activeSubject?.name,
                  authUser
                );
                if (res?.cleanTxt) break;
              } catch (err: any) {
                lastErr = err;
              }
            }

            if (res?.cleanTxt) {
              // Prefix UTF-8 BOM so Hindi Devanagari opens cleanly across Windows/Mobile/Editors
              targetFolder.file(fileName, '\uFEFF' + res.cleanTxt);
              savedIndex.push(`${prefix}. ${test.title} (${res.totalQuestions} Qs) -> ${fileName}`);
            } else {
              failed += 1;
              failedTitles.push(`${fileName} (${lastErr?.message || 'Empty response'})`);
            }

            done += 1;
            setZipProgress({
              done,
              total,
              failed,
              currentTitle: test.title,
            });
          })
        );
      }

      if (zipCancelRef.current) {
        setStatusMessage(`ZIP export cancelled (${done}/${total} processed).`);
        return;
      }

      if (savedIndex.length > 0) {
        const indexContent = [
          '==================================================',
          seriesFolderName,
          `Folder: ${subjectFolderName}`,
          `Language Mode: Bilingual (English + Hindi)`,
          `Total Files Exported: ${savedIndex.length}/${total}`,
          '==================================================',
          '',
          ...savedIndex,
        ].join('\n');
        targetFolder.file('_INDEX_BILINGUAL.txt', '\uFEFF' + indexContent);
      }

      if (failedTitles.length > 0) {
        targetFolder.file(
          '_failed_tests_log.txt',
          '\uFEFF' + `Failed (${failedTitles.length}):\n${failedTitles.join('\n')}`
        );
      }

      setZipProgress({
        done,
        total,
        failed,
        currentTitle: 'Compressing Bilingual .zip archive...',
      });

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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const savedCount = done - failed;
      setStatusMessage(
        `✓ Bilingual ZIP Downloaded: "${seriesFolderName}/${subjectFolderName}/" (${savedCount}/${total} .txt files)`
      );
    } catch (err: any) {
      setStatusMessage(`ZIP export error: ${err?.message || 'Failed to generate ZIP'}`);
    } finally {
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Compact Status Bar (only shown while converting or displaying messages) */}
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

      {/* 2. Login Modal */}
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
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Agrawal Academy Login
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    agrawalacademy.com (DK Agarwal)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Login Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('otp');
                  setLoginError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  loginMode === 'otp' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
                  loginMode === 'password' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
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
                  loginMode === 'token' ? 'bg-white text-indigo-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auth Token
              </button>
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* TAB 1: OTP LOGIN */}
            {loginMode === 'otp' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number (10 Digits)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-12 pr-3 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                {!otpSent ? (
                  <button
                    type="button"
                    disabled={isLoggingIn || loginPhone.length < 10}
                    onClick={handleSendOtp}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-4 h-4" />
                        <span>Send OTP to Mobile</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Enter OTP received on {loginPhone}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full px-3 py-2 text-sm font-mono tracking-widest text-center font-bold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={isLoggingIn || !loginOtp.trim()}
                      onClick={handleVerifyOtp}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isLoggingIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Verify &amp; Connect Account</span>
                        </>
                      )}
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

            {/* TAB 2: PASSWORD LOGIN */}
            {loginMode === 'password' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Mobile or student email"
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
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
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  disabled={isLoggingIn || !loginPhone.trim() || !loginPassword.trim()}
                  onClick={handlePasswordLogin}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Login with Password</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: TOKEN LOGIN */}
            {loginMode === 'token' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Session Auth Token
                  </label>
                  <textarea
                    rows={3}
                    value={loginTokenInput}
                    onChange={(e) => setLoginTokenInput(e.target.value)}
                    placeholder="Paste AppX / Agrawal Academy auth token here..."
                    className="w-full p-2.5 font-mono text-[11px] bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  type="button"
                  disabled={!loginTokenInput.trim()}
                  onClick={handleTokenLogin}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4" />
                  <span>Save &amp; Connect Token</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Secure official API proxy</span>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="font-bold text-slate-700 hover:underline cursor-pointer"
              >
                Explore Tests Directly
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Series Selector & Subject Category Grid (Dashed Structure) */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-dashed border-slate-200">
            <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
              <span className="p-1.5 bg-indigo-50 text-indigo-800 rounded-lg shrink-0">
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider whitespace-nowrap">
                Select Test Series
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 shrink-0">
              {seriesList.length} Series
            </span>
          </div>

          {/* Series selector cards — uniform shape across mobile, tablet & laptop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {seriesList.map((series) => {
              const isSelected = series.id === selectedSeriesId;
              return (
                <button
                  key={series.id}
                  type="button"
                  onClick={() => setSelectedSeriesId(series.id)}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                    isSelected
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                >
                  <span className="truncate">{series.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subjects / Sections Folders */}
        <div className="pt-3 border-t-2 border-dashed border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
              <BookOpen className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
              <span>Sections &amp; Folders ({subjectsList.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">
              Tap any category to load all tests
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {subjectsList.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{sub.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Tests List with Search & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900">
              {activeSubject?.name || 'Tests List'}
            </span>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-indigo-50 text-indigo-800 rounded-lg">
              {filteredTests.length} Tests
            </span>
            <button
              type="button"
              disabled={isDownloadingZip || isLoadingTests || filteredTests.length === 0}
              onClick={handleDownloadAllTxtZip}
              className="px-2.5 py-0.5 text-[10px] font-extrabold bg-indigo-900 hover:bg-indigo-800 active:scale-[0.98] text-white border border-indigo-900 rounded-md flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
              title="Download all tests in this folder in Bilingual (English + Hindi) .txt format inside a structured .zip"
            >
              {isDownloadingZip ? (
                <Loader2 className="w-3 h-3 animate-spin text-amber-300" />
              ) : (
                <FolderArchive className="w-3 h-3 text-amber-300" />
              )}
              <span>
                {isDownloadingZip && zipProgress
                  ? `Bilingual ZIP ${zipProgress.done}/${zipProgress.total}`
                  : `Bilingual .txt ZIP (${filteredTests.length})`}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g. 04 Feb, Shift 1)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>
        </div>

        {/* ZIP Export Progress Bar */}
        {isDownloadingZip && zipProgress && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 font-bold text-indigo-950">
              <span className="truncate">
                Packing Bilingual ZIP: {zipProgress.currentTitle}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="tabular-nums font-mono">
                  {zipProgress.done} / {zipProgress.total}
                  {zipProgress.failed > 0 ? ` (${zipProgress.failed} skipped)` : ''}
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
                  width: `${Math.round(
                    (zipProgress.done / Math.max(1, zipProgress.total)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Tests Grid */}
        {isLoadingTests ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs font-bold">Loading tests from Agrawal Academy...</span>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-10 text-center text-slate-500 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No tests found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredTests.map((test) => {
              const isConverting = convertingTestId === test.id;
              const isCurrentActive = convertedResult?.title === test.title;
              return (
                <div
                  key={test.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                    isCurrentActive
                      ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-100 text-indigo-900 rounded">
                        ID: {test.id}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        PAID: TRUE
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {test.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>⏱ {test.time || 45} Mins</span>
                      <span>•</span>
                      <span>📝 {test.questions || 50} Qs</span>
                      <span>•</span>
                      <span>🎯 {test.marks || 150} Marks</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isConverting}
                    onClick={() => handleConvertTest(test)}
                    className={`w-full py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCurrentActive
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        : 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-xs'
                    }`}
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Converting...</span>
                      </>
                    ) : isCurrentActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Converted (Paid: True)</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>Get Clean .txt (Paid ✦)</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Converted Test Clean .txt Viewer & PDF Studio Launcher */}
      {convertedResult && (
        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white rounded-full flex items-center gap-1 shadow-xs">
                  <Check className="w-3 h-3" />
                  Clean .txt Ready · Paid: TRUE
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {convertedResult.totalQuestions} Questions Extracted
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1">
                {convertedResult.title}
              </h3>
            </div>

            {/* Main Action Buttons */}
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
                onClick={handleDownloadCleanTxt}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .txt</span>
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
            <div className="relative">
              <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[480px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                {convertedResult.cleanTxt}
              </pre>
            </div>
          )}

          {/* Tab 2: Question Cards */}
          {activeViewTab === 'cards' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {convertedResult.questions.map((q) => (
                <div
                  key={q.qNum}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded">
                      Question {q.qNum}
                    </span>
                    {q.section && (
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {q.section}
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-slate-900">{q.questionEn}</div>
                  {q.questionHi && (
                    <div className="font-medium text-slate-700">{q.questionHi}</div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {['(A)', '(B)', '(C)', '(D)'].map((optCode, idx) => {
                      const isCorrect = q.correctOptionLetter === optCode.replace(/[()]/g, '');
                      return (
                        <div
                          key={optCode}
                          className={`p-2 rounded-lg border flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-400 font-bold text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>
                            {optCode}{' '}
                            {q.optionsEn[idx] &&
                            q.optionsHi[idx] &&
                            q.optionsEn[idx].toLowerCase() !== q.optionsHi[idx].toLowerCase()
                              ? `${q.optionsEn[idx]} / ${q.optionsHi[idx]}`
                              : q.optionsEn[idx] || q.optionsHi[idx]}
                          </span>
                          {isCorrect && (
                            <span className="text-[9px] font-extrabold bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanationEn && (
                    <div className="mt-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-slate-800">
                      <div className="font-bold text-amber-900 mb-0.5">Solution:</div>
                      <div>{q.explanationEn}</div>
                      {q.explanationHi && <div className="mt-1">{q.explanationHi}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Raw JSON */}
          {activeViewTab === 'rawjson' && (
            <pre className="p-4 bg-slate-900 text-indigo-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-[440px] overflow-y-auto leading-relaxed">
              {convertedResult.rawJson}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
