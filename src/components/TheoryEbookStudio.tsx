import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  EbookChapter,
  EbookDocument,
  generateAppleStyleEbookPdf,
} from '../utils/appleEbookPdfGenerator';
import { SAMPLE_EBOOKS } from '../data/sampleEbooks';

export interface TheoryEbookStudioProps {
  onLoadIntoPdfStudio?: (cleanTxt: string, fileName: string) => void;
}

export const TheoryEbookStudio: React.FC<TheoryEbookStudioProps> = () => {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('ssc-reasoning');
  const [doc, setDoc] = useState<EbookDocument>(() =>
    JSON.parse(JSON.stringify(SAMPLE_EBOOKS['ssc-reasoning']))
  );
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [previewTab, setPreviewTab] = useState<'reader' | 'cover' | 'index'>('reader');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const activeChapter = doc.chapters[activeChapterIndex] || doc.chapters[0];

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplateKey(key);
    if (SAMPLE_EBOOKS[key]) {
      setDoc(JSON.parse(JSON.stringify(SAMPLE_EBOOKS[key])));
      setActiveChapterIndex(0);
    }
  };

  const handleUpdateMeta = (field: keyof typeof doc.meta, value: string) => {
    setDoc((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        [field]: value,
      },
    }));
  };

  const handleUpdateChapter = (field: keyof EbookChapter, value: string) => {
    setDoc((prev) => {
      const newChapters = [...prev.chapters];
      newChapters[activeChapterIndex] = {
        ...newChapters[activeChapterIndex],
        [field]: value,
      };
      return {
        ...prev,
        chapters: newChapters,
      };
    });
  };

  const handleAddChapter = () => {
    const newId = `ch-${doc.chapters.length + 1}`;
    const newChapter: EbookChapter = {
      id: newId,
      title: `Chapter ${doc.chapters.length + 1}: Key Rules & Formulas`,
      subtitle: 'Important Exam Shortcuts & Theory Points',
      content: `## 1. Core Principles\nWrite your theory notes and high-yield rules here.\n\n> [Rule] Write key shortcuts or memory tricks inside this callout.\n\n- Point 1: Important concept to remember.\n- Point 2: Repeated exam pattern.`,
    };
    setDoc((prev) => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }));
    setActiveChapterIndex(doc.chapters.length);
  };

  const handleDeleteChapter = (indexToDelete: number) => {
    if (doc.chapters.length <= 1) return;
    setDoc((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, idx) => idx !== indexToDelete),
    }));
    setActiveChapterIndex((prev) => (prev >= indexToDelete ? Math.max(0, prev - 1) : prev));
  };

  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    setExportProgress({ current: 0, total: doc.chapters.length });
    try {
      await generateAppleStyleEbookPdf(doc, (current, total) => {
        setExportProgress({ current, total });
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2400);
    } catch (err) {
      console.error('Failed to generate Apple-style Ebook PDF:', err);
    } finally {
      setIsExportingPdf(false);
      setExportProgress(null);
    }
  };

  const handleCopyMarkdown = async () => {
    let fullMd = `# ${doc.meta.title}\n${doc.meta.subtitle || ''}\nAuthor: ${doc.meta.author || ''}\n\n`;
    for (const ch of doc.chapters) {
      fullMd += `\n---\n\n# ${ch.title}\n${ch.subtitle ? `*${ch.subtitle}*\n\n` : ''}${ch.content}\n\n`;
    }
    try {
      await navigator.clipboard.writeText(fullMd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-4 max-w-[1560px] mx-auto pb-16">
      {/* Top Apple Minimalist Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <BookOpen className="w-5 h-5 text-slate-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight font-sans">
                Theory Ebook Studio
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Apple Minimalist PDF
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Create distraction-free, elegant chapter-wise theory, formula sheets &amp; revision capsules with Apple-style typographic hierarchy.
            </p>
          </div>
        </div>

        {/* Top Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => handleSelectTemplate('ssc-reasoning')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                selectedTemplateKey === 'ssc-reasoning'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reasoning Rules
            </button>
            <button
              type="button"
              onClick={() => handleSelectTemplate('polity-capsule')}
              className={`px-3 py-1.5 font-semibold rounded-lg transition-all ${
                selectedTemplateKey === 'polity-capsule'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Polity Capsule
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all shadow-2xs active:scale-[0.98]"
            title="Copy all theory chapters as Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          {/* Download Apple PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                <span>
                  {exportProgress
                    ? `Generating Page ${exportProgress.current}/${exportProgress.total}...`
                    : 'Exporting...'}
                </span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-slate-200" />
                <span>Download Apple-Style PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Dual Grid: Left Content Editor | Right Apple Reader Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Metadata & Chapter Editor */}
        <div className="lg:col-span-6 flex flex-col space-y-4">
          {/* Ebook Metadata Drawer / Settings */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Ebook Cover &amp; Edition Metadata
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Apple Style</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ebook Title:
                </label>
                <input
                  type="text"
                  value={doc.meta.title}
                  onChange={(e) => handleUpdateMeta('title', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="e.g. SSC Reasoning Master Theory"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Target Exam / Kicker:
                </label>
                <input
                  type="text"
                  value={doc.meta.targetExam || ''}
                  onChange={(e) => handleUpdateMeta('targetExam', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="e.g. SSC CGL / CHSL / CPO"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Subtitle / Tagline:
                </label>
                <input
                  type="text"
                  value={doc.meta.subtitle || ''}
                  onChange={(e) => handleUpdateMeta('subtitle', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="e.g. Chapter-Wise Formulas & Direction Tricks"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Author / Channel Brand:
                </label>
                <input
                  type="text"
                  value={doc.meta.author || ''}
                  onChange={(e) => handleUpdateMeta('author', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-800"
                  placeholder="e.g. @DesiCrackOfficial"
                />
              </div>
            </div>
          </div>

          {/* Chapters Strip & Editor */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>Chapters ({doc.chapters.length})</span>
              </div>
              <button
                type="button"
                onClick={handleAddChapter}
                className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>
            </div>

            {/* Chapter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {doc.chapters.map((ch, idx) => (
                <button
                  key={ch.id || idx}
                  type="button"
                  onClick={() => setActiveChapterIndex(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 whitespace-nowrap transition-all border ${
                    activeChapterIndex === idx
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>Ch.{idx + 1}</span>
                  <span className="ml-1 opacity-80 truncate max-w-[120px] inline-block align-bottom">
                    {ch.title.split(':')[0]}
                  </span>
                </button>
              ))}
            </div>

            {/* Active Chapter Form */}
            {activeChapter && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Chapter Title:
                    </label>
                    <input
                      type="text"
                      value={activeChapter.title}
                      onChange={(e) => handleUpdateChapter('title', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Chapter Subtitle / Topic:
                    </label>
                    <input
                      type="text"
                      value={activeChapter.subtitle || ''}
                      onChange={(e) => handleUpdateChapter('subtitle', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-800"
                      placeholder="e.g. Key Rules & Formula Breakdown"
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      Content (Markdown: <code>## Heading</code>, <code>- Bullets</code>, <code>&gt; [Rule] Callout</code>):
                    </span>
                    {doc.chapters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(activeChapterIndex)}
                        className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete Chapter</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    value={activeChapter.content}
                    onChange={(e) => handleUpdateChapter('content', e.target.value)}
                    rows={16}
                    className="w-full flex-1 min-h-[360px] p-3 text-[11.5px] font-mono leading-relaxed bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:bg-white focus:border-slate-800 selection:bg-slate-200 resize-none"
                    placeholder="Enter chapter theory notes, formulas, and rules..."
                    spellCheck={false}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Apple Books Minimalist Reader Preview */}
        <div className="lg:col-span-6 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
          {/* Reader Top Bar */}
          <div className="p-3 sm:p-3.5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Apple-Style Reader Preview
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewTab('cover')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  previewTab === 'cover'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                Cover Page
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('reader')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  previewTab === 'reader'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
                }`}
              >
                Chapter {activeChapterIndex + 1}
              </button>
            </div>
          </div>

          {/* Reader Canvas Area */}
          <div className="p-4 sm:p-6 flex-1 bg-slate-100/60 overflow-y-auto max-h-[760px] flex justify-center">
            {/* Virtual A4 Minimalist Sheet */}
            <div className="w-full max-w-[540px] bg-white rounded-xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-6 text-slate-900 font-sans min-h-[640px] flex flex-col justify-between">
              {previewTab === 'cover' ? (
                /* Minimalist Cover View */
                <div className="space-y-8 my-auto">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      {doc.meta.targetExam || 'THEORY & SHORTCUTS CAPSULE'}
                    </p>
                    <div className="w-12 h-0.5 bg-slate-900" />
                  </div>

                  <div className="space-y-2 pt-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-tight">
                      {doc.meta.title}
                    </h1>
                    {doc.meta.subtitle && (
                      <p className="text-xs text-slate-500 font-normal leading-relaxed">
                        {doc.meta.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Table of Contents preview */}
                  <div className="pt-6 border-t border-slate-100 space-y-2">
                    <h4 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                      Table of Contents
                    </h4>
                    <div className="space-y-1.5 text-xs">
                      {doc.chapters.map((ch, idx) => (
                        <div key={ch.id || idx} className="flex items-center justify-between text-slate-700 py-0.5">
                          <span className="font-semibold text-slate-900">
                            {String(idx + 1).padStart(2, '0')}. {ch.title}
                          </span>
                          <span className="text-[10px] text-slate-400">Ch.{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800">{doc.meta.author || '@DesiCrackOfficial'}</span>
                    <span>{doc.meta.edition || '2025-2026 Edition'}</span>
                  </div>
                </div>
              ) : (
                /* Chapter Content View */
                <div className="space-y-5">
                  {/* Running Top Header */}
                  <div className="flex items-center justify-between text-[9px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-100 pb-2">
                    <span>{doc.meta.title}</span>
                    <span>Ch.{activeChapterIndex + 1}</span>
                  </div>

                  {/* Chapter Header */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                      Chapter {String(activeChapterIndex + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
                      {activeChapter?.title}
                    </h2>
                    {activeChapter?.subtitle && (
                      <p className="text-xs text-slate-500 font-normal">
                        {activeChapter.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Minimalist divider */}
                  <div className="w-8 h-0.5 bg-slate-900" />

                  {/* Formatted Markdown Rendering */}
                  <div className="space-y-3.5 text-xs leading-relaxed text-slate-700 pt-1">
                    {activeChapter?.content.split('\n').map((line, lIdx) => {
                      const trimmed = line.trim();
                      if (!trimmed) return <div key={lIdx} className="h-1" />;

                      // Heading 2
                      if (trimmed.startsWith('## ')) {
                        return (
                          <h3 key={lIdx} className="text-sm font-bold text-slate-900 pt-2 tracking-tight">
                            {trimmed.replace(/^##\s*/, '')}
                          </h3>
                        );
                      }

                      // Heading 3
                      if (trimmed.startsWith('### ')) {
                        return (
                          <h4 key={lIdx} className="text-xs font-bold text-slate-800 pt-1 tracking-tight">
                            {trimmed.replace(/^###\s*/, '')}
                          </h4>
                        );
                      }

                      // Callout Box
                      if (trimmed.startsWith('>') || trimmed.startsWith('[Rule') || trimmed.startsWith('[Note')) {
                        const cleanCallout = trimmed.replace(/^>\s*/, '').replace(/^\[(Rule|Note|Formula)\]\s*/i, '');
                        return (
                          <div
                            key={lIdx}
                            className="p-3 my-2 bg-slate-50 border-l-2 border-slate-900 rounded-r-lg text-slate-900 text-xs font-medium space-y-0.5"
                          >
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Formula / Golden Rule
                            </span>
                            <p>{cleanCallout}</p>
                          </div>
                        );
                      }

                      // Bullet list
                      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                        return (
                          <div key={lIdx} className="flex items-start gap-2 pl-1">
                            <span className="text-slate-900 font-bold">•</span>
                            <span>{trimmed.replace(/^[-*]\s*/, '')}</span>
                          </div>
                        );
                      }

                      return <p key={lIdx}>{trimmed}</p>;
                    })}
                  </div>

                  {/* Running Footer */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{doc.meta.author || '@DesiCrackOfficial'}</span>
                    <span>Page {activeChapterIndex + 2}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
