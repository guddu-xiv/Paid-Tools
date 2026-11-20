import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Film,
  Flame,
  FolderSync,
  ImagePlus,
  KeyRound,
  Layers,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  Mail,
  Maximize2,
  Play,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Unlock,
  Upload,
  X,
} from 'lucide-react';
import {
  clearStoredVnCodesAuth,
  fetchVnCodeCategories,
  fetchVnCodeDetail,
  fetchVnCodesUserLibrary,
  findSavedEmailQrForTemplate,
  getCachedVnCodesCatalog,
  getSavedEmailQrVault,
  getStoredVnCodesAuth,
  importVnCodesFromEmailContent,
  isVnCodesPaidActive,
  loginVnCodesWithPassword,
  lookupVnCodesOrder,
  removeSavedEmailQrRecord,
  requestVnCodesEmailOtp,
  SavedEmailQrRecord,
  saveEmailQrRecords,
  setVnCodesPaidActive,
  syncAllVnCodes,
  verifyVnCodesEmailOtp,
  VnCodeAuthUser,
  VnCodeCategoryItem,
  VnCodeLibraryItem,
  VnCodeTemplateDetail,
  VnCodeTemplateItem,
} from '../services/vnCodesService';

type TimelineFilter = 'all' | 'newest' | 'oldest';
type AccessFilter = 'all' | 'paid' | 'free' | 'library' | 'emailqr';

export function VnCodesStudio() {
  // Direct PAID: TRUE mode (active by default)
  const [paidActive, setPaidActive] = useState<boolean>(() => isVnCodesPaidActive());

  // Catalog state
  const [templates, setTemplates] = useState<VnCodeTemplateItem[]>([]);
  const [categories, setCategories] = useState<VnCodeCategoryItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [syncedAt, setSyncedAt] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string>('');
  const [newAddedBanner, setNewAddedBanner] = useState<number>(0);

  // Automatic background sync (checks vncodes.in for new/updated templates automatically)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const lastMaxIdRef = useRef<number>(0);

  // Filters & Pagination
  const [timeline, setTimeline] = useState<TimelineFilter>('all');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(48);

  // Inline reel video preview state
  const [playingPreviewId, setPlayingPreviewId] = useState<number | null>(null);

  // Detail modal + Fullscreen Scannable QR Modal
  const [selectedItem, setSelectedItem] = useState<VnCodeTemplateItem | null>(null);
  const [detailData, setDetailData] = useState<VnCodeTemplateDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [fullscreenQrUrl, setFullscreenQrUrl] = useState<{ url: string; title: string } | null>(null);

  // Post-payment Email QR Vault (persists Order Key QRs, pasted email QRs, and uploaded QR PNGs)
  const [emailQrVault, setEmailQrVault] = useState<SavedEmailQrRecord[]>(() =>
    getSavedEmailQrVault()
  );
  const [isEmailImportModalOpen, setIsEmailImportModalOpen] = useState<boolean>(false);
  const [emailPasteInput, setEmailPasteInput] = useState<string>('');
  const [emailImportBusy, setEmailImportBusy] = useState<boolean>(false);
  const [emailImportError, setEmailImportError] = useState<string>('');
  const [emailImportSuccess, setEmailImportSuccess] = useState<string>('');
  const [inlineAttachInput, setInlineAttachInput] = useState<string>('');
  const [inlineAttachError, setInlineAttachError] = useState<string>('');
  const [inlineAttachBusy, setInlineAttachBusy] = useState<boolean>(false);

  // vncodes.in Account & Purchased Library Auth
  const [authUser, setAuthUser] = useState<VnCodeAuthUser | null>(() => getStoredVnCodesAuth());
  const [libraryItems, setLibraryItems] = useState<VnCodeLibraryItem[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authOtp, setAuthOtp] = useState<string>('');
  const [otpRequested, setOtpRequested] = useState<boolean>(false);
  const [authStatusMsg, setAuthStatusMsg] = useState<string>('');
  const [authErrorMsg, setAuthErrorMsg] = useState<string>('');
  const [isAuthBusy, setIsAuthBusy] = useState<boolean>(false);

  const handleTogglePaidActive = () => {
    const next = !paidActive;
    setPaidActive(next);
    setVnCodesPaidActive(next);
  };

  // Load cached catalog immediately if available, then sync live Old & New from vncodes.in
  const runSyncAll = useCallback(async (force = false, silent = false) => {
    if (!silent) {
      setIsSyncing(true);
      setSyncError('');
    }
    try {
      const [catsRes, syncRes] = await Promise.all([
        fetchVnCodeCategories(force).catch(() => [] as VnCodeCategoryItem[]),
        syncAllVnCodes(force),
      ]);

      if (catsRes.length > 0) {
        setCategories(catsRes);
      }

      const prevMaxId = lastMaxIdRef.current;
      const nextMaxId = syncRes.templates.reduce((m, t) => Math.max(m, t.id), 0);
      if (prevMaxId > 0 && syncRes.templates.length > 0) {
        const newlyAdded = syncRes.templates.filter((t) => t.id > prevMaxId).length;
        if (newlyAdded > 0) {
          setNewAddedBanner(newlyAdded);
        }
      }
      if (nextMaxId > 0) {
        lastMaxIdRef.current = nextMaxId;
      }

      setTemplates(syncRes.templates);
      setTotalCount(syncRes.total || syncRes.templates.length);
      setSyncedAt(syncRes.syncedAt);
    } catch (err: any) {
      if (!silent) {
        setSyncError(err?.message || 'Failed to sync templates from vncodes.in');
      }
    } finally {
      if (!silent) {
        setIsSyncing(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const cached = getCachedVnCodesCatalog();
    if (cached && cached.templates.length > 0) {
      setTemplates(cached.templates);
      setTotalCount(cached.total);
      setSyncedAt(cached.syncedAt);
      lastMaxIdRef.current = cached.templates.reduce((m, t) => Math.max(m, t.id), 0);
    }
    runSyncAll(false, false);
  }, [runSyncAll]);

  // Automatic periodic Old + New check every 90s when Auto-Sync is ON
  useEffect(() => {
    if (!autoSyncEnabled) return;
    const timer = window.setInterval(() => {
      runSyncAll(true, true);
    }, 90000);
    return () => window.clearInterval(timer);
  }, [autoSyncEnabled, runSyncAll]);

  // Load authenticated user library if logged in
  useEffect(() => {
    if (!authUser?.cookieHeader) {
      setLibraryItems([]);
      return;
    }
    fetchVnCodesUserLibrary(authUser.cookieHeader)
      .then((res) => setLibraryItems(res.items || []))
      .catch(() => setLibraryItems([]));
  }, [authUser]);

  const libraryIdSet = useMemo(() => {
    const set = new Set<number>();
    for (const it of libraryItems) {
      if (it.id) set.add(Number(it.id));
      if (it.template_id) set.add(Number(it.template_id));
    }
    return set;
  }, [libraryItems]);

  const emailQrIdSet = useMemo(() => {
    const set = new Set<number>();
    for (const r of emailQrVault) {
      if (r.templateId) set.add(r.templateId);
    }
    return set;
  }, [emailQrVault]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(templates.map((t) => t.year).filter(Boolean))).sort((a, b) =>
      b.localeCompare(a)
    );
    return ['ALL', ...years];
  }, [templates]);

  const stats = useMemo(() => {
    let freeCount = 0;
    let paidCount = 0;
    let newCount = 0;
    let oldCount = 0;
    for (const t of templates) {
      if (t.isFree) freeCount++;
      else paidCount++;
      if (t.isNew) newCount++;
      else oldCount++;
    }
    return {
      total: templates.length,
      freeCount,
      paidCount,
      newCount,
      oldCount,
    };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = templates.filter((t) => {
      if (selectedCategoryId !== null && !t.categoryIds.includes(selectedCategoryId)) {
        return false;
      }
      if (selectedYear !== 'ALL' && t.year !== selectedYear) {
        return false;
      }
      if (accessFilter === 'free' && !t.isFree) return false;
      if (accessFilter === 'paid' && t.isFree) return false;
      if (accessFilter === 'library' && !libraryIdSet.has(t.id)) return false;
      if (accessFilter === 'emailqr' && !emailQrIdSet.has(t.id)) return false;

      if (q) {
        const hay =
          `${t.id} ${t.title} ${t.slug} ${t.categoryNames.join(' ')} ${t.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (timeline === 'oldest') {
      list = [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return list;
  }, [
    templates,
    selectedCategoryId,
    selectedYear,
    accessFilter,
    libraryIdSet,
    emailQrIdSet,
    searchQuery,
    timeline,
  ]);

  const visibleTemplates = useMemo(
    () => filteredTemplates.slice(0, visibleCount),
    [filteredTemplates, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(48);
  }, [selectedCategoryId, selectedYear, accessFilter, searchQuery, timeline]);

  const handleOpenDetail = async (item: VnCodeTemplateItem) => {
    setSelectedItem(item);
    setDetailData(null);
    setInlineAttachInput('');
    setInlineAttachError('');
    setIsLoadingDetail(true);
    try {
      const detail = await fetchVnCodeDetail(item.id, authUser?.cookieHeader);
      setDetailData(detail);
    } catch {
      setDetailData(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCopyText = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1600);
  };

  // Resolve QR from pasted payment email link, order key (wc_order_...), email HTML, or direct QR image URL
  const processEmailOrOrderInput = async (
    rawInput: string,
    targetTemplate?: VnCodeTemplateItem | null
  ): Promise<{ savedCount: number; message: string }> => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      throw new Error('Paste your payment email link, Order Key, or QR image URL.');
    }

    const recordsToSave: SavedEmailQrRecord[] = [];
    const nowIso = new Date().toISOString();

    // 1. Direct image URL pasted?
    if (
      /^https?:\/\/\S+$/i.test(trimmed) &&
      (/\.(png|jpg|jpeg|webp|svg)(\?|$)/i.test(trimmed) || trimmed.startsWith('data:image/'))
    ) {
      recordsToSave.push({
        templateId: targetTemplate?.id || 0,
        title: targetTemplate?.title || 'Email Payment QR',
        slug: targetTemplate?.slug || '',
        qrUrl: trimmed,
        sourceLabel: 'Direct Email QR URL',
        savedAt: nowIso,
      });
    } else if (/^data:image\//i.test(trimmed)) {
      recordsToSave.push({
        templateId: targetTemplate?.id || 0,
        title: targetTemplate?.title || 'Uploaded Email QR',
        slug: targetTemplate?.slug || '',
        qrUrl: trimmed,
        sourceLabel: 'Email QR Image',
        savedAt: nowIso,
      });
    } else if (
      /[?&]key=[A-Za-z0-9_-]+/i.test(trimmed) ||
      /^(?:wc_order_|vnc_order_|order_)?[A-Za-z0-9_-]{8,64}$/i.test(trimmed)
    ) {
      const orderRes = await lookupVnCodesOrder(trimmed, authUser?.cookieHeader);
      for (const it of orderRes.items) {
        if (!it.qrUrl) continue;
        // Match catalog item by id or slug if order response lacked id
        const matched =
          templates.find((t) => (it.id && t.id === it.id) || (it.slug && t.slug === it.slug)) ||
          targetTemplate;
        recordsToSave.push({
          templateId: matched?.id || it.id || 0,
          title: matched?.title || it.title,
          slug: matched?.slug || it.slug,
          qrUrl: it.qrUrl,
          sourceLabel: `Order #${orderRes.orderId || orderRes.orderKey}`,
          orderKey: orderRes.orderKey,
          savedAt: nowIso,
        });
      }
    } else {
      // Full payment email body / HTML / forward paste
      const parsed = await importVnCodesFromEmailContent(trimmed, authUser?.cookieHeader);
      for (const it of parsed.items) {
        if (!it.qrUrl) continue;
        const matched =
          templates.find((t) => (it.id && t.id === it.id) || (it.slug && t.slug === it.slug)) ||
          targetTemplate;
        recordsToSave.push({
          templateId: matched?.id || it.id || 0,
          title: matched?.title || it.title,
          slug: matched?.slug || it.slug,
          qrUrl: it.qrUrl,
          sourceLabel: parsed.orderKeyFound
            ? `Email Order (${parsed.orderKeyFound})`
            : 'Payment Email Import',
          orderKey: parsed.orderKeyFound || undefined,
          savedAt: nowIso,
        });
      }
      if (recordsToSave.length === 0 && parsed.extractedUrls.length > 0 && targetTemplate) {
        recordsToSave.push({
          templateId: targetTemplate.id,
          title: targetTemplate.title,
          slug: targetTemplate.slug,
          qrUrl: parsed.extractedUrls[0],
          sourceLabel: 'Email Link Extract',
          savedAt: nowIso,
        });
      }
    }

    if (recordsToSave.length === 0) {
      throw new Error(
        'No downloadable QR code found yet for that link/email. Try uploading the QR PNG image from your email or sign in via Email OTP.'
      );
    }

    const updated = saveEmailQrRecords(recordsToSave);
    setEmailQrVault(updated);
    return {
      savedCount: recordsToSave.length,
      message: `${recordsToSave.length} QR code(s) saved from payment email & linked!`,
    };
  };

  // Handle uploading an email QR image file (PNG/JPG/WebP) or saved .eml/.html email file
  const handleEmailFileUpload = async (
    file: File,
    targetTemplate?: VnCodeTemplateItem | null,
    isInline = false
  ) => {
    const setErr = isInline ? setInlineAttachError : setEmailImportError;
    const setBusy = isInline ? setInlineAttachBusy : setEmailImportBusy;
    setErr('');
    setBusy(true);
    try {
      if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read QR image file'));
          reader.readAsDataURL(file);
        });
        const updated = saveEmailQrRecords([
          {
            templateId: targetTemplate?.id || 0,
            title: targetTemplate?.title || file.name.replace(/\.[^.]+$/, ''),
            slug: targetTemplate?.slug || '',
            qrUrl: dataUrl,
            sourceLabel: `Email Attachment (${file.name})`,
            savedAt: new Date().toISOString(),
          },
        ]);
        setEmailQrVault(updated);
        if (!isInline) {
          setEmailImportSuccess(`QR image "${file.name}" saved & ready to open!`);
        }
      } else {
        // .eml / .html / .txt email file
        const textContent = await file.text();
        const res = await processEmailOrOrderInput(textContent, targetTemplate);
        if (!isInline) {
          setEmailImportSuccess(res.message);
        }
      }
    } catch (err: any) {
      setErr(err?.message || 'Could not import file');
    } finally {
      setBusy(false);
    }
  };

  const handleInlineAttachSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setInlineAttachError('');
    setInlineAttachBusy(true);
    try {
      await processEmailOrOrderInput(inlineAttachInput, selectedItem);
      setInlineAttachInput('');
    } catch (err: any) {
      setInlineAttachError(err?.message || 'Could not extract QR');
    } finally {
      setInlineAttachBusy(false);
    }
  };

  const handleEmailModalImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailImportError('');
    setEmailImportSuccess('');
    setEmailImportBusy(true);
    try {
      const res = await processEmailOrOrderInput(emailPasteInput, null);
      setEmailImportSuccess(res.message);
      setEmailPasteInput('');
    } catch (err: any) {
      setEmailImportError(err?.message || 'Could not detect QR from pasted email');
    } finally {
      setEmailImportBusy(false);
    }
  };

  const handleExportTxt = () => {
    const lines: string[] = [];
    lines.push(
      `VN Code.in (vncodes.in) Auto-Synced Catalog | PAID: ${paidActive ? 'TRUE' : 'FALSE'}`
    );
    lines.push(
      `Synced At: ${syncedAt || new Date().toISOString()} | Total Matched: ${filteredTemplates.length}`
    );
    lines.push('====================================================================');
    lines.push('');

    filteredTemplates.forEach((t, idx) => {
      lines.push(`${idx + 1}. [${t.year}${t.isNew ? ' - NEW' : ' - OLD'}] ${t.title} (#${t.id})`);
      lines.push(
        `   Price: ${t.isFree ? 'FREE' : `₹${t.price}`} | PAID: ${paidActive ? 'TRUE' : String(t.paid).toUpperCase()} | ${t.usedCountText || 'VN Code'}`
      );
      lines.push(`   Categories: ${t.categoryNames.join(', ') || 'General'}`);
      lines.push(`   Template Link: ${t.link}`);
      if (t.videoUrl) lines.push(`   MP4 Preview: ${t.videoUrl}`);
      if (t.thumbnailUrl) lines.push(`   Poster: ${t.thumbnailUrl}`);
      lines.push('');
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vncodes-catalog-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = {
      source: 'https://vncodes.in',
      paid: paidActive,
      syncedAt,
      total: filteredTemplates.length,
      templates: filteredTemplates,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vncodes-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg('');
    setAuthStatusMsg('');
    if (!authEmail.trim()) {
      setAuthErrorMsg('Enter your vncodes.in email address.');
      return;
    }
    setIsAuthBusy(true);
    try {
      const msg = await requestVnCodesEmailOtp(authEmail.trim());
      setOtpRequested(true);
      setAuthStatusMsg(msg);
    } catch (err: any) {
      setAuthErrorMsg(err?.message || 'Could not send OTP.');
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg('');
    if (!authEmail.trim() || !authOtp.trim()) {
      setAuthErrorMsg('Enter email and OTP.');
      return;
    }
    setIsAuthBusy(true);
    try {
      const user = await verifyVnCodesEmailOtp(authEmail.trim(), authOtp.trim());
      setAuthUser(user);
      setIsAuthModalOpen(false);
      setOtpRequested(false);
      setAuthOtp('');
    } catch (err: any) {
      setAuthErrorMsg(err?.message || 'OTP verification failed.');
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorMsg('');
    if (!authEmail.trim() || !authPassword) {
      setAuthErrorMsg('Enter both email and password.');
      return;
    }
    setIsAuthBusy(true);
    try {
      const user = await loginVnCodesWithPassword(authEmail.trim(), authPassword);
      setAuthUser(user);
      setIsAuthModalOpen(false);
      setAuthPassword('');
    } catch (err: any) {
      setAuthErrorMsg(err?.message || 'Login failed.');
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleLogout = () => {
    clearStoredVnCodesAuth();
    setAuthUser(null);
    setLibraryItems([]);
  };

  // Compute active resolved QR for currently opened modal item
  const activeSavedEmailQr = selectedItem
    ? findSavedEmailQrForTemplate(emailQrVault, selectedItem)
    : undefined;
  const activeResolvedQrUrl =
    detailData?.libraryDownloadUrl ||
    activeSavedEmailQr?.qrUrl ||
    detailData?.publicQrUrl ||
    null;
  const activeQrSourceBadge = detailData?.libraryDownloadUrl
    ? 'Purchased Library QR'
    : activeSavedEmailQr
    ? activeSavedEmailQr.sourceLabel
    : detailData?.publicQrUrl
    ? 'Free Public QR'
    : null;

  return (
    <div className="space-y-4">
      {/* Studio Header Card */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white p-4 sm:p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-rose-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                VN Code.in Studio
              </h2>
              <button
                type="button"
                onClick={handleTogglePaidActive}
                title="Toggle Direct PAID Status"
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wide transition-all cursor-pointer flex items-center gap-1 ${
                  paidActive
                    ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {paidActive ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>PAID: {paidActive ? 'TRUE' : 'FALSE'}</span>
              </button>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <FolderSync className="w-3 h-3" />
                <span>OLD + NEW AUTO SYNC</span>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Live vncodes.in sync for Old (2024+) &amp; New (2026+) VN templates, plus instant{' '}
              <span className="text-amber-300 font-bold">Payment Email QR / Order Key</span> &amp;{' '}
              <span className="text-emerald-300 font-bold">Email OTP Library</span> support so clicking{' '}
              <strong>Open / QR</strong> displays your purchased QR immediately.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoSyncEnabled((prev) => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                autoSyncEnabled
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Auto-Sync: {autoSyncEnabled ? 'ON (90s)' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => runSyncAll(true, false)}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>{isSyncing ? 'Syncing Old & New...' : 'Sync All Old & New'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEmailImportError('');
                setEmailImportSuccess('');
                setIsEmailImportModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>
                Email QR / Order ({emailQrVault.length})
              </span>
            </button>

            {authUser ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-100 max-w-[140px] truncate">
                  {authUser.name || authUser.email}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-amber-300 font-bold">
                  {libraryItems.length} Lib
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthErrorMsg('');
                  setAuthStatusMsg('');
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-300" />
                <span>Account OTP / Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Stats Strip */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Total Synced</div>
            <div className="text-base font-extrabold text-white mt-0.5">
              {stats.total || totalCount}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">New (Last 45d)</div>
            <div className="text-base font-extrabold text-emerald-400 mt-0.5">{stats.newCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Old Archive (2024+)</div>
            <div className="text-base font-extrabold text-sky-300 mt-0.5">{stats.oldCount}</div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Saved Email / Lib QRs</div>
            <div className="text-base font-extrabold text-amber-300 mt-0.5">
              {emailQrVault.length + libraryItems.length}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Last Auto-Sync</div>
            <div className="text-xs font-bold text-slate-200 mt-1 truncate">
              {syncedAt ? new Date(syncedAt).toLocaleTimeString() : 'Syncing...'}
            </div>
          </div>
        </div>
      </div>

      {/* Newly discovered banner */}
      {newAddedBanner > 0 && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-emerald-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Auto-Sync detected {newAddedBanner} newly published VN Code template(s)!</span>
          </div>
          <button
            type="button"
            onClick={() => setNewAddedBanner(0)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {syncError && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-800 flex items-center justify-between gap-2">
          <span>{syncError}</span>
          <button
            type="button"
            onClick={() => runSyncAll(true, false)}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search, Timeline, Access & Export Controls */}
      <div className="rounded-2xl bg-white border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Old & New VN templates, songs, reels, #ID..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-rose-400 focus:outline-none text-xs font-semibold text-slate-800"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value as TimelineFilter)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">Timeline: All (New + Old)</option>
              <option value="newest">Sort: Newest First (2026)</option>
              <option value="oldest">Sort: Oldest First (2024+)</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr === 'ALL' ? 'All Years' : `Year: ${yr}`}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleExportTxt}
              disabled={filteredTemplates.length === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>TXT</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={filteredTemplates.length === 0}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Access Filter Tabs + Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(
            [
              { id: 'all', label: `All (${templates.length})` },
              { id: 'paid', label: `Paid (${stats.paidCount})` },
              { id: 'free', label: `Free QR (${stats.freeCount})` },
              { id: 'emailqr', label: `Email QRs (${emailQrIdSet.size})` },
              { id: 'library', label: `My Library (${libraryItems.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAccessFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                accessFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <span className="mx-1 text-slate-300">|</span>

          <button
            type="button"
            onClick={() => setSelectedCategoryId(null)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              selectedCategoryId === null
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            All Categories
          </button>

          {categories.slice(0, 14).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId((curr) => (curr === cat.id ? null : cat.id))}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategoryId === cat.id
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Saved Email QRs Quick Strip (for any unlinked QR uploaded/imported from payment email) */}
      {emailQrVault.length > 0 && (
        <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-amber-700" />
              <span>Saved Payment Email QRs ({emailQrVault.length})</span>
            </span>
            <span className="text-[11px] font-semibold text-amber-800">
              Click any QR to view fullscreen &amp; scan directly
            </span>
          </div>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {emailQrVault.map((rec) => (
              <div
                key={`${rec.templateId}-${rec.qrUrl.slice(0, 32)}`}
                className="shrink-0 bg-white border border-amber-200 rounded-xl p-2 flex items-center gap-2.5 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setFullscreenQrUrl({ url: rec.qrUrl, title: rec.title })}
                  className="w-11 h-11 rounded-lg border border-slate-200 bg-white p-0.5 overflow-hidden cursor-pointer hover:border-rose-400"
                  title="Open Fullscreen QR"
                >
                  <img src={rec.qrUrl} alt={rec.title} className="w-full h-full object-contain" />
                </button>
                <div className="min-w-0 max-w-[160px]">
                  <div className="text-xs font-extrabold text-slate-900 truncate">{rec.title}</div>
                  <div className="text-[10px] font-semibold text-amber-700 truncate">
                    {rec.sourceLabel}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setFullscreenQrUrl({ url: rec.qrUrl, title: rec.title })}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Open QR
                    </button>
                    <a
                      href={rec.qrUrl}
                      download={`vn-qr-${rec.templateId || 'email'}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-emerald-700 hover:underline"
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setEmailQrVault(removeSavedEmailQrRecord(rec.templateId, rec.qrUrl))
                      }
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove saved QR"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isSyncing && templates.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-rose-600 animate-spin mx-auto" />
          <div className="text-sm font-extrabold text-slate-800">
            Syncing all Old &amp; New VN Code templates from vncodes.in...
          </div>
          <p className="text-xs text-slate-500">
            Fetching all pages (540+ templates), MP4 reel previews, thumbnails &amp; categories.
          </p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center space-y-2">
          <Film className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="text-sm font-bold text-slate-700">No VN templates match this filter</div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategoryId(null);
              setSelectedYear('ALL');
              setAccessFilter('all');
            }}
            className="mt-2 px-4 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500">
            <span>
              Showing {visibleTemplates.length} of {filteredTemplates.length} templates
            </span>
            <span>PAID Mode: {paidActive ? 'TRUE' : 'FALSE'}</span>
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {visibleTemplates.map((item) => {
              const isPlaying = playingPreviewId === item.id;
              const inLib = libraryIdSet.has(item.id);
              const hasEmailQr = emailQrIdSet.has(item.id);
              return (
                <div
                  key={item.id}
                  className="group rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-rose-300 transition-all flex flex-col"
                >
                  {/* 9:16 Vertical Preview */}
                  <div className="relative aspect-[9/16] bg-slate-900 overflow-hidden">
                    {isPlaying && item.videoUrl ? (
                      <video
                        src={item.videoUrl}
                        poster={item.thumbnailUrl || undefined}
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-3 text-center">
                        <QrCode className="w-8 h-8 mb-1 opacity-50" />
                        <span className="text-[10px] font-bold">#{item.id}</span>
                      </div>
                    )}

                    {/* Top badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1 pointer-events-none">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wide shadow-xs ${
                            item.isNew
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-900/80 text-slate-200'
                          }`}
                        >
                          {item.isNew ? `NEW · ${item.year}` : `OLD · ${item.year}`}
                        </span>
                        {paidActive && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950 shadow-xs">
                            PAID: TRUE
                          </span>
                        )}
                      </div>

                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black shadow-xs ${
                          item.isFree
                            ? 'bg-emerald-400 text-slate-950'
                            : hasEmailQr
                            ? 'bg-amber-400 text-slate-950'
                            : inLib
                            ? 'bg-indigo-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.isFree
                          ? 'FREE'
                          : hasEmailQr
                          ? 'QR READY'
                          : inLib
                          ? 'OWNED'
                          : `₹${item.price}`}
                      </span>
                    </div>

                    {/* Play Video Preview toggle */}
                    {item.videoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setPlayingPreviewId((curr) => (curr === item.id ? null : item.id))
                        }
                        title={isPlaying ? 'Stop Video Preview' : 'Play Reel Video'}
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-xs transition-colors cursor-pointer"
                      >
                        {isPlaying ? (
                          <X className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>
                    )}

                    {item.usedCountText && (
                      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/65 text-white text-[9px] font-bold flex items-center gap-0.5 pointer-events-none">
                        <Flame className="w-2.5 h-2.5 text-amber-400" />
                        <span>{item.usedCountText}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <div className="text-[10px] text-slate-500 mt-1 truncate">
                        {item.categoryNames[0] || 'VN Template'} · #{item.id}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(item)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                          hasEmailQr || item.isFree || inLib
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-900 hover:bg-rose-600 text-white'
                        }`}
                      >
                        <QrCode className="w-3 h-3" />
                        <span>{hasEmailQr || item.isFree || inLib ? 'Open QR' : 'Open / QR'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(item.link, item.id)}
                        title="Copy vncodes.in URL"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < filteredTemplates.length && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 48)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-extrabold shadow-sm transition-colors cursor-pointer"
              >
                Load More ({filteredTemplates.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Template Detail & Open QR Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black shrink-0">
                  PAID: {paidActive ? 'TRUE' : 'FALSE'}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {selectedItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedItem(null);
                  setDetailData(null);
                }}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Video / Poster Preview */}
              <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-[9/16] max-h-[460px] mx-auto w-full flex items-center justify-center">
                {detailData?.videoUrl || selectedItem.videoUrl ? (
                  <video
                    src={detailData?.videoUrl || selectedItem.videoUrl}
                    poster={detailData?.thumbnailUrl || selectedItem.thumbnailUrl || undefined}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : detailData?.thumbnailUrl || selectedItem.thumbnailUrl ? (
                  <img
                    src={detailData?.thumbnailUrl || selectedItem.thumbnailUrl}
                    alt={selectedItem.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <QrCode className="w-14 h-14 text-slate-600" />
                )}
              </div>

              {/* Metadata & Open QR Section */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                    ID #{selectedItem.id}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      selectedItem.isNew
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {selectedItem.isNew
                      ? `NEW (${selectedItem.year})`
                      : `OLD (${selectedItem.year})`}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold">
                    {selectedItem.isFree ? 'FREE' : `₹${selectedItem.price}`}
                  </span>
                  {selectedItem.usedCountText && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                      {selectedItem.usedCountText}
                    </span>
                  )}
                </div>

                {isLoadingDetail ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    <span>Checking vncodes.in Library, Email QRs &amp; attachments...</span>
                  </div>
                ) : (
                  <>
                    {/* Active Resolved QR Card */}
                    <div className="rounded-xl border border-slate-200 p-3.5 space-y-3 bg-slate-50/70">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                          <QrCode className="w-4 h-4 text-rose-600" />
                          <span>VN Code QR</span>
                        </span>
                        {activeQrSourceBadge ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {activeQrSourceBadge}
                          </span>
                        ) : (
                          detailData?.sku && (
                            <span className="text-[10px] font-bold text-slate-500">
                              SKU: {detailData.sku}
                            </span>
                          )
                        )}
                      </div>

                      {activeResolvedQrUrl ? (
                        <div className="space-y-2.5">
                          <div
                            onClick={() =>
                              setFullscreenQrUrl({
                                url: activeResolvedQrUrl,
                                title: selectedItem.title,
                              })
                            }
                            className="w-48 h-48 mx-auto rounded-2xl border-2 border-slate-200 hover:border-rose-400 bg-white p-2.5 cursor-pointer relative group shadow-xs"
                          >
                            <img
                              src={activeResolvedQrUrl}
                              alt="VN Code QR"
                              className="w-full h-full object-contain"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                              <span className="px-2.5 py-1 rounded-lg bg-white text-slate-900 text-[11px] font-extrabold flex items-center gap-1 shadow-sm">
                                <Maximize2 className="w-3.5 h-3.5" />
                                Open QR Full
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setFullscreenQrUrl({
                                  url: activeResolvedQrUrl,
                                  title: selectedItem.title,
                                })
                              }
                              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Open QR</span>
                            </button>
                            <a
                              href={activeResolvedQrUrl}
                              download={`vn-qr-${selectedItem.id}.png`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download QR</span>
                            </a>
                          </div>

                          {activeSavedEmailQr && (
                            <button
                              type="button"
                              onClick={() =>
                                setEmailQrVault(removeSavedEmailQrRecord(selectedItem.id))
                              }
                              className="w-full text-[11px] font-semibold text-slate-500 hover:text-rose-600 cursor-pointer"
                            >
                              Remove attached email QR
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 text-xs text-slate-700">
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                            <div className="font-extrabold flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-amber-700" />
                              <span>Payment ke baad email par aaya QR yahan open karein</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                              Apni payment email ka <strong>Order link / key</strong> paste karein,
                              ya seedha email se QR PNG image upload karein, ya vncodes.in Email OTP
                              se library sync karein:
                            </p>
                          </div>

                          {/* Quick inline attach from payment email link / order key */}
                          <form onSubmit={handleInlineAttachSubmit} className="space-y-2">
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={inlineAttachInput}
                                onChange={(e) => setInlineAttachInput(e.target.value)}
                                placeholder="Paste email order link (?key=wc_order_...) or QR URL"
                                className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                              />
                              <button
                                type="submit"
                                disabled={inlineAttachBusy || !inlineAttachInput.trim()}
                                className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs cursor-pointer shrink-0"
                              >
                                {inlineAttachBusy ? '...' : 'Open QR'}
                              </button>
                            </div>
                            {inlineAttachError && (
                              <p className="text-[11px] font-bold text-rose-600">
                                {inlineAttachError}
                              </p>
                            )}
                          </form>

                          {/* Direct QR PNG or .eml upload for this template */}
                          <label className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-white text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5 text-rose-600" />
                            <span>Upload Email QR PNG or .eml File</span>
                            <input
                              type="file"
                              accept="image/*,.eml,.html,.txt"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleEmailFileUpload(f, selectedItem, true);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {!authUser && (
                              <button
                                type="button"
                                onClick={() => setIsAuthModalOpen(true)}
                                className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Email OTP Sync</span>
                              </button>
                            )}
                            <a
                              href={selectedItem.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>vncodes.in Page</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>

                    {detailData?.description && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {detailData.description}
                      </p>
                    )}

                    {selectedItem.videoUrl && (
                      <a
                        href={selectedItem.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                      >
                        <Film className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Open MP4 Reel Preview</span>
                      </a>
                    )}

                    {(selectedItem.categoryNames.length > 0 || selectedItem.tags.length > 0) && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>Categories &amp; Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedItem.categoryNames.map((c) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 text-[11px] font-bold"
                            >
                              {c}
                            </span>
                          ))}
                          {selectedItem.tags.slice(0, 8).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-semibold"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen High-Contrast QR Viewer (easy VN App scanning) */}
      {fullscreenQrUrl && (
        <div
          onClick={() => setFullscreenQrUrl(null)}
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black">
                SCAN IN VN VIDEO EDITOR
              </span>
              <button
                type="button"
                onClick={() => setFullscreenQrUrl(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 line-clamp-2">
              {fullscreenQrUrl.title}
            </h3>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 inline-block shadow-inner">
              <img
                src={fullscreenQrUrl.url}
                alt={fullscreenQrUrl.title}
                className="w-72 h-72 object-contain mx-auto"
              />
            </div>
            <div className="flex gap-2">
              <a
                href={fullscreenQrUrl.url}
                download="vn-template-qr.png"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download QR PNG</span>
              </a>
              <button
                type="button"
                onClick={() => setFullscreenQrUrl(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 text-white text-xs font-extrabold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Email QR / Order Importer Modal */}
      {isEmailImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Import Payment Email QR / Order
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailImportModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Payment ke baad jo confirmation email vncodes.in se aati hai, uska{' '}
              <strong>Order Link / Order Key</strong> (e.g. <code>?key=wc_order_...</code>) ya{' '}
              <strong>poora email text / QR link</strong> neeche paste karein — sabhi QR codes
              automatically fetch hokar studio mein open hone lagenge.
            </p>

            {emailImportError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {emailImportError}
              </div>
            )}

            {emailImportSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                {emailImportSuccess}
              </div>
            )}

            <form onSubmit={handleEmailModalImportSubmit} className="space-y-3">
              <textarea
                rows={4}
                value={emailPasteInput}
                onChange={(e) => setEmailPasteInput(e.target.value)}
                placeholder="Paste payment email URL (?key=wc_order_...), Order Key, direct QR PNG URL, or copied email text..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
              />
              <button
                type="submit"
                disabled={emailImportBusy || !emailPasteInput.trim()}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {emailImportBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Fetch &amp; Save Email QR</span>
              </button>
            </form>

            <div className="border-t border-slate-200 pt-3">
              <label className="flex flex-col items-center justify-center gap-1.5 py-4 px-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer transition-colors">
                <ImagePlus className="w-5 h-5 text-rose-600" />
                <span>Or Upload QR PNG / .eml Email File from Your Device</span>
                <input
                  type="file"
                  accept="image/*,.eml,.html,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleEmailFileUpload(f, null, false);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* vncodes.in Account Login Modal (OTP or Email+Password) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Connect vncodes.in Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('otp');
                  setAuthErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  authMode === 'otp' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('password');
                  setAuthErrorMsg('');
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  authMode === 'password' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Email &amp; Password
              </button>
            </div>

            {authErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {authErrorMsg}
              </div>
            )}

            {authStatusMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
                {authStatusMsg}
              </div>
            )}

            {authMode === 'otp' ? (
              <form
                onSubmit={otpRequested ? handleVerifyOtp : handleSendOtp}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    vncodes.in Purchase Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {otpRequested && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Verification OTP Code
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value)}
                        placeholder="Enter OTP from email"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthBusy}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isAuthBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{otpRequested ? 'Verify OTP & Load Library' : 'Send Login OTP'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isAuthBusy}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isAuthBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign In &amp; Sync Library</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
