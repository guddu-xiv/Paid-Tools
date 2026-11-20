import React, { useState, useMemo } from 'react';
import {
  Check,
  Palette,
  Eye,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Type,
  Layout,
  Laptop,
  Smartphone,
} from 'lucide-react';
import {
  PDF_DESIGN_FORMATS,
  PDF_FONT_FAMILIES,
  PdfAnsBoxStyle,
  PdfBlockCardStyle,
  PdfDesignTheme,
  PdfDesignThemeId,
  PdfExBoxStyle,
  PdfFontFamilyId,
  PdfHeaderFooterStyle,
  PdfLayoutConfig,
  PdfOptionStyle,
  PdfQBadgeStyle,
  getPdfDesignTheme,
  resolveActivePdfFontFamily,
} from '../utils/pdfGenerator';

interface DesignTabContentProps {
  pdfConfig: PdfLayoutConfig;
  setPdfConfig: React.Dispatch<React.SetStateAction<PdfLayoutConfig>>;
  onGoToPreview: () => void;
  onOpenHeaderFooterStudio?: () => void;
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

export const DesignTabContent: React.FC<DesignTabContentProps> = ({
  pdfConfig,
  setPdfConfig,
  onGoToPreview,
  onOpenHeaderFooterStudio,
  isModalMode = false,
  onCloseModal,
}) => {
  const [designCategoryFilter, setDesignCategoryFilter] = useState<
    'ALL' | 'Classic' | 'Modern' | 'Khatarnak' | 'Vintage' | 'Aesthetic' | 'Royal' | 'Minimalist'
  >('ALL');

  const [activeSection, setActiveSection] = useState<'formats' | 'fonts' | 'elements'>('formats');

  const activeTheme: PdfDesignTheme = useMemo(
    () => getPdfDesignTheme(pdfConfig.designTheme),
    [pdfConfig.designTheme]
  );

  const filteredFormats = useMemo(() => {
    if (designCategoryFilter === 'ALL') return PDF_DESIGN_FORMATS;
    return PDF_DESIGN_FORMATS.filter((f) => f.category === designCategoryFilter);
  }, [designCategoryFilter]);

  const hasElementOverrides = Boolean(
    (pdfConfig.customBlockStyle && pdfConfig.customBlockStyle !== 'theme-default') ||
      (pdfConfig.customQBadgeStyle && pdfConfig.customQBadgeStyle !== 'theme-default') ||
      (pdfConfig.customOptionStyle && pdfConfig.customOptionStyle !== 'theme-default') ||
      (pdfConfig.customAnsBoxStyle && pdfConfig.customAnsBoxStyle !== 'theme-default') ||
      (pdfConfig.customExBoxStyle && pdfConfig.customExBoxStyle !== 'theme-default')
  );

  const handleResetElementOverrides = () => {
    setPdfConfig((prev) => ({
      ...prev,
      customBlockStyle: 'theme-default',
      customQBadgeStyle: 'theme-default',
      customOptionStyle: 'theme-default',
      customAnsBoxStyle: 'theme-default',
      customExBoxStyle: 'theme-default',
    }));
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Top Banner & Quick Navigation Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 sm:p-2.5 bg-emerald-100/80 text-emerald-800 rounded-xl shrink-0 shadow-2xs">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Design &amp; Layout Studio
                </h1>
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg">
                  16 Formats • Mobile &amp; Laptop Optimized
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                Active Theme:{' '}
                <strong className="text-slate-900">
                  Format {activeTheme.formatNumber} — {activeTheme.name}
                </strong>{' '}
                · Font:{' '}
                <strong className="text-emerald-700">
                  {pdfConfig.fontFamilyId && pdfConfig.fontFamilyId !== 'theme-default'
                    ? PDF_FONT_FAMILIES.find((f) => f.id === pdfConfig.fontFamilyId)?.name
                    : `${activeTheme.fontLabel} (Auto)`}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            {onOpenHeaderFooterStudio && (
              <button
                type="button"
                onClick={onOpenHeaderFooterStudio}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Header &amp; Footer (15 Styles)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onGoToPreview}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Live A4 Sheet</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Pills (Quick jumps for mobile & desktop) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSection('formats')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeSection === 'formats'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>16 Design Formats ({PDF_DESIGN_FORMATS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('fonts')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeSection === 'fonts'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>PDF Font Pairings (10 Fonts)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('elements')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeSection === 'elements'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Card &amp; Element Styles</span>
            {hasElementOverrides && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: PDF FONT PAIRINGS (shown if activeSection is 'fonts' or in multi-column laptop view) */}
      {(activeSection === 'fonts' || activeSection === 'formats') && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-emerald-700" />
                <span>PDF Typography &amp; Font Pairings (English + Hindi)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Anek Devanagari, Outfit, Poppins, Inter, Hind aur Rozha One font combinations
              </p>
            </div>
            {pdfConfig.fontFamilyId && pdfConfig.fontFamilyId !== 'theme-default' && (
              <button
                type="button"
                onClick={() =>
                  setPdfConfig((prev) => ({ ...prev, fontFamilyId: 'theme-default' }))
                }
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 self-start sm:self-center"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Theme Font ({activeTheme.fontLabel})</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 overflow-x-auto pb-1">
            {PDF_FONT_FAMILIES.map((fontOpt) => {
              const currentFontId = pdfConfig.fontFamilyId || 'theme-default';
              const isFontActive = currentFontId === fontOpt.id;
              return (
                <button
                  key={fontOpt.id}
                  type="button"
                  onClick={() =>
                    setPdfConfig((prev) => ({
                      ...prev,
                      fontFamilyId: fontOpt.id as PdfFontFamilyId,
                    }))
                  }
                  style={{ fontFamily: fontOpt.fontStack }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 min-h-[58px] ${
                    isFontActive
                      ? 'border-emerald-600 bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-emerald-400 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate leading-tight">
                      {fontOpt.name}
                    </span>
                    {isFontActive && <Check className="w-3 h-3 shrink-0" />}
                  </div>
                  <div
                    className={`text-[10px] flex items-center justify-between gap-1 truncate ${
                      isFontActive ? 'text-emerald-100' : 'text-slate-500'
                    }`}
                  >
                    <span>{fontOpt.hindiSample}</span>
                    <span className="text-[9px] font-mono opacity-80">{fontOpt.tag}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: CARD & ELEMENT CUSTOMIZER (Cards, Badges, Options, Ans, Ex) */}
      {(activeSection === 'elements' || activeSection === 'formats') && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <span>Micro Element Styling (Cards • Badges • Options • Answers • Explanations)</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Format ke har component ko alag se customize karein ya format default par rakhein
              </p>
            </div>
            {hasElementOverrides && (
              <button
                type="button"
                onClick={handleResetElementOverrides}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 self-start sm:self-center"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Theme Preset</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* 1. Card Style Selector */}
            <label className="flex flex-col gap-1 p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[10.5px] font-bold text-slate-700">
                1. Q&amp;A Card Design
              </span>
              <select
                value={pdfConfig.customBlockStyle || 'theme-default'}
                onChange={(e) =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    customBlockStyle: e.target.value as PdfBlockCardStyle | 'theme-default',
                  }))
                }
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="theme-default">✨ Theme Default ({activeTheme.blockStyle})</option>
                <option value="top-header-card">Top Accent Header Card</option>
                <option value="neo-brutalist">3D Neo-Brutalist Shadow Card</option>
                <option value="left-stripe">Left Vertical Stripe Card</option>
                <option value="corner-brackets">Cyber HUD Corner Brackets</option>
                <option value="double-royal-card">Double Royal Gold Card</option>
                <option value="ticket-notched-card">Ticket Notched Coupon Card</option>
                <option value="bordered-card">Boxed Modular Grid Card</option>
                <option value="notebook-ruled">Notebook Register Block</option>
                <option value="open">Open Sheet (Divider Line)</option>
              </select>
            </label>

            {/* 2. Question Badge Selector */}
            <label className="flex flex-col gap-1 p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[10.5px] font-bold text-slate-700">
                2. Question Badge (Q.1)
              </span>
              <select
                value={pdfConfig.customQBadgeStyle || 'theme-default'}
                onChange={(e) =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    customQBadgeStyle: e.target.value as PdfQBadgeStyle | 'theme-default',
                  }))
                }
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="theme-default">✨ Theme Default ({activeTheme.qBadgeStyle || 'pill'})</option>
                <option value="solid-pill">Solid Pill (Q.1)</option>
                <option value="circle-badge">Solid Circle Badge (1)</option>
                <option value="outlined-box">Outlined Box (Q.1)</option>
                <option value="brutalist-box">3D Brutalist Box (Q1)</option>
                <option value="slanted-tag">Slanted Power Tag (Q.1)</option>
                <option value="double-ring">Royal Double-Ring Circle</option>
                <option value="left-bracket">Left Vertical Bar (| 1.)</option>
                <option value="plain">Classic Plain Bold (1.)</option>
              </select>
            </label>

            {/* 3. Option Style Selector */}
            <label className="flex flex-col gap-1 p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[10.5px] font-bold text-slate-700">
                3. Option Style (A/B/C/D)
              </span>
              <select
                value={pdfConfig.customOptionStyle || 'theme-default'}
                onChange={(e) =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    customOptionStyle: e.target.value as PdfOptionStyle | 'theme-default',
                  }))
                }
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="theme-default">✨ Theme Default ({activeTheme.optionStyle})</option>
                <option value="omr-circle">OMR Circle Bubble (A)</option>
                <option value="solid-circle">Solid Filled Circle (A)</option>
                <option value="square-keycap">Square Keycap Box [A]</option>
                <option value="pill-tag">Stadium Pill Tag (A)</option>
                <option value="brutalist-chip">3D Brutalist Square Chip</option>
                <option value="row-strip">Full Option Row Strip</option>
                <option value="clean-bold">Classic Clean Bold (A)</option>
              </select>
            </label>

            {/* 4. Answer Box Selector */}
            <label className="flex flex-col gap-1 p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[10.5px] font-bold text-slate-700">
                4. Answer Box Design
              </span>
              <select
                value={pdfConfig.customAnsBoxStyle || 'theme-default'}
                onChange={(e) =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    customAnsBoxStyle: e.target.value as PdfAnsBoxStyle | 'theme-default',
                  }))
                }
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="theme-default">✨ Theme Default ({activeTheme.ansBoxStyle})</option>
                <option value="pure-dash-line">---- Pure Dash Line (---- Ans ----)</option>
                <option value="dash-flanked">---- Ans: (B) ---- Flanked Dashes</option>
                <option value="dashed-underline">Dashed Underline (Ans: ╌╌╌)</option>
                <option value="sharp-dashed-tag">Sharp Dashed Frame (No Curves)</option>
                <option value="dashed-divider-full">Full Width Dashed Divider</option>
                <option value="dashed-coupon">Dashed Coupon Box (Sharp)</option>
                <option value="split-label-box">Split ANS Cap + Box</option>
                <option value="solid-inverse-pill">Solid Inverse Color Pill</option>
                <option value="left-bar-box">Left Accent Bar Box</option>
                <option value="brutalist-tag">3D Brutalist Yellow Tag</option>
                <option value="glass-capsule">Rounded Stadium Capsule</option>
                <option value="solid-badge">Outlined Solid Badge</option>
                <option value="double-underline">Editorial Double Underline</option>
                <option value="inline-tint">Soft Inline Highlight</option>
              </select>
            </label>

            {/* 5. Explanation Box Selector */}
            <label className="flex flex-col gap-1 p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[10.5px] font-bold text-slate-700">
                5. Explanation Callout
              </span>
              <select
                value={pdfConfig.customExBoxStyle || 'theme-default'}
                onChange={(e) =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    customExBoxStyle: e.target.value as PdfExBoxStyle | 'theme-default',
                  }))
                }
                className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="theme-default">✨ Theme Default ({activeTheme.exBoxStyle || 'card'})</option>
                <option value="callout-card">Callout Study Card + Badge</option>
                <option value="left-quote-stripe">Left Quote Stripe Box</option>
                <option value="dashed-note-box">Dashed Revision Note Box</option>
                <option value="brutalist-note">3D Brutalist Note Card</option>
                <option value="cyber-hud-note">Cyber HUD Terminal Box</option>
                <option value="top-rule-editorial">Editorial Top-Rule Note</option>
                <option value="clean-badge">Clean Pill Badge Only</option>
              </select>
            </label>
          </div>

          {/* 🎨 Answer & Brand Colour Selector in Design Tab */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-3">
              {/* Answer Colour Picker */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <span>🎨 Answer Colour:</span>
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { color: '#1d4ed8', label: 'Royal Blue' },
                    { color: '#dc2626', label: 'Crimson Red' },
                    { color: '#0f172a', label: 'Dark Slate' },
                    { color: '#7e22ce', label: 'Deep Purple' },
                    { color: '#ea580c', label: 'Sunset Orange' },
                    { color: '#059669', label: 'Emerald' },
                    { color: '#0891b2', label: 'Teal Cyan' },
                    { color: '#e11d48', label: 'Ruby Pink' },
                  ].map((swatch) => {
                    const isActive =
                      (pdfConfig.customAnsColor || activeTheme.ansColor).toLowerCase() ===
                      swatch.color.toLowerCase();
                    return (
                      <button
                        key={swatch.color}
                        type="button"
                        title={swatch.label}
                        onClick={() =>
                          setPdfConfig((prev) => ({
                            ...prev,
                            customAnsColor: swatch.color,
                          }))
                        }
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                          isActive ? 'scale-125 ring-2 ring-slate-900 border-white' : 'border-black/20 hover:scale-110'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                      />
                    );
                  })}
                </div>
                <label className="flex items-center gap-1 cursor-pointer ml-1 pl-1 border-l border-slate-200" title="Custom Answer Color Picker">
                  <input
                    type="color"
                    value={pdfConfig.customAnsColor || activeTheme.ansColor}
                    onChange={(e) =>
                      setPdfConfig((prev) => ({
                        ...prev,
                        customAnsColor: e.target.value,
                      }))
                    }
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-slate-600 font-semibold uppercase">
                    {pdfConfig.customAnsColor || activeTheme.ansColor}
                  </span>
                </label>
              </div>

              {/* Brand Accent Colour Picker */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs">
                <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <span>🏷️ Brand Accent:</span>
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { color: '#047857', label: 'Emerald' },
                    { color: '#1d4ed8', label: 'Royal Blue' },
                    { color: '#b91c1c', label: 'Ruby Red' },
                    { color: '#0f172a', label: 'Charcoal' },
                    { color: '#7c3aed', label: 'Violet' },
                    { color: '#d97706', label: 'Amber' },
                  ].map((swatch) => {
                    const isActive =
                      (pdfConfig.customBrandColor || activeTheme.brandAccentColor).toLowerCase() ===
                      swatch.color.toLowerCase();
                    return (
                      <button
                        key={swatch.color}
                        type="button"
                        title={swatch.label}
                        onClick={() =>
                          setPdfConfig((prev) => ({
                            ...prev,
                            customBrandColor: swatch.color,
                          }))
                        }
                        className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                          isActive ? 'scale-125 ring-2 ring-slate-900 border-white' : 'border-black/20 hover:scale-110'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                      />
                    );
                  })}
                </div>
                <label className="flex items-center gap-1 cursor-pointer ml-1 pl-1 border-l border-slate-200" title="Custom Brand Accent Picker">
                  <input
                    type="color"
                    value={pdfConfig.customBrandColor || activeTheme.brandAccentColor}
                    onChange={(e) =>
                      setPdfConfig((prev) => ({
                        ...prev,
                        customBrandColor: e.target.value,
                      }))
                    }
                    className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="font-mono text-[10px] text-slate-600 font-semibold uppercase">
                    {pdfConfig.customBrandColor || activeTheme.brandAccentColor}
                  </span>
                </label>
              </div>
            </div>

            {(pdfConfig.customAnsColor || pdfConfig.customBrandColor) && (
              <button
                type="button"
                onClick={() =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    customAnsColor: undefined,
                    customBrandColor: undefined,
                  }))
                }
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
              >
                Reset Colours
              </button>
            )}
          </div>
        </div>
      )}

      {/* SECTION 3: 16 UNIQUE PDF DESIGN FORMAT CARDS */}
      <div className="space-y-3">
        {/* Category Filter Pills (Mobile friendly swipeable) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(
              [
                { id: 'ALL', label: `All (${PDF_DESIGN_FORMATS.length})` },
                { id: 'Classic', label: 'Classic' },
                { id: 'Modern', label: 'Modern' },
                { id: 'Khatarnak', label: 'Khatarnak' },
                { id: 'Vintage', label: 'Vintage' },
                { id: 'Aesthetic', label: 'Aesthetic' },
                { id: 'Royal', label: 'Royal' },
                { id: 'Minimalist', label: 'Minimalist' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setDesignCategoryFilter(cat.id)}
                className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  designCategoryFilter === cat.id
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 shrink-0">
            <Laptop className="w-3.5 h-3.5" /> Desktop 3-Col • <Smartphone className="w-3.5 h-3.5" /> Mobile 1-Col
          </span>
        </div>

        {/* Responsive Grid of Design Format Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredFormats.map((fmt) => {
            const isSelected = (pdfConfig.designTheme || 'classic-emerald') === fmt.id;
            const cardFontStack = resolveActivePdfFontFamily(
              {
                designTheme: fmt.id,
                fontFamilyId: pdfConfig.fontFamilyId,
              },
              fmt
            );

            return (
              <div
                key={fmt.id}
                onClick={() => {
                  setPdfConfig((prev) => ({
                    ...prev,
                    designTheme: fmt.id as PdfDesignThemeId,
                  }));
                }}
                className={`group text-left rounded-2xl border-2 p-3 sm:p-3.5 transition-all flex flex-col justify-between gap-3 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90 bg-white hover:border-emerald-400 hover:bg-slate-50/60 shadow-2xs'
                }`}
              >
                {/* Top Header Row of Format Card */}
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`px-2 py-0.5 text-[11px] font-extrabold rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      Format {fmt.formatNumber}
                    </span>
                    <h3
                      className="text-xs sm:text-sm font-bold text-slate-900 truncate"
                      style={{ fontFamily: cardFontStack }}
                    >
                      {fmt.name}
                    </h3>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                        : 'bg-white border-slate-300 group-hover:border-slate-500'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">#{fmt.formatNumber}</span>
                    )}
                  </div>
                </div>

                {/* Miniature Live A4 Visual Sheet Swatch */}
                <div
                  className="w-full rounded-xl p-2.5 transition-transform relative overflow-hidden shadow-inner border border-black/5"
                  style={{
                    backgroundColor: fmt.pageBgColor,
                    fontFamily: cardFontStack,
                    backgroundImage:
                      fmt.pageTexture === 'dot-grid'
                        ? `radial-gradient(${fmt.isDark ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.22)'} 1px, transparent 1px)`
                        : fmt.pageTexture === 'blueprint-grid'
                          ? `linear-gradient(to right, rgba(56,189,248,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.1) 1px, transparent 1px)`
                          : fmt.pageTexture === 'notebook-lines'
                            ? `repeating-linear-gradient(to bottom, transparent 0px, transparent 11px, rgba(147,197,253,0.38) 12px)`
                            : undefined,
                    backgroundSize:
                      fmt.pageTexture === 'dot-grid'
                        ? '10px 10px'
                        : fmt.pageTexture === 'blueprint-grid'
                          ? '12px 12px'
                          : undefined,
                    boxShadow:
                      fmt.pageTexture === 'double-frame' || fmt.pageTexture === 'royal-corners'
                        ? `inset 0 0 0 2px ${fmt.brandAccentColor}44`
                        : undefined,
                  }}
                >
                  {/* Mini Header Bar reflecting each format's unique Header Architecture */}
                  <div
                    className="flex items-center justify-between px-2 py-1 rounded mb-2 text-[8px] font-extrabold"
                    style={{
                      backgroundColor: fmt.brandPrimaryColor,
                      color: '#ffffff',
                      borderBottom: `2px solid ${fmt.brandAccentColor}`,
                    }}
                  >
                    <span>
                      @DesiCrack<span style={{ color: fmt.brandAccentColor }}>Official</span>
                    </span>
                    <span
                      className="px-1.5 py-0.2 rounded text-[7px]"
                      style={{ backgroundColor: fmt.brandAccentColor }}
                    >
                      {fmt.category}
                    </span>
                    <span style={{ color: fmt.brandAccentColor }}>desicrack.in</span>
                  </div>

                  {/* Mini 2-Column Q&A Preview */}
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2].map((qNum) => {
                      const effCard =
                        pdfConfig.customBlockStyle &&
                        pdfConfig.customBlockStyle !== 'theme-default'
                          ? pdfConfig.customBlockStyle
                          : fmt.blockStyle;
                      const effQBadge =
                        pdfConfig.customQBadgeStyle &&
                        pdfConfig.customQBadgeStyle !== 'theme-default'
                          ? pdfConfig.customQBadgeStyle
                          : fmt.qBadgeStyle;
                      const effOpt =
                        pdfConfig.customOptionStyle &&
                        pdfConfig.customOptionStyle !== 'theme-default'
                          ? pdfConfig.customOptionStyle
                          : fmt.optionStyle || 'omr-circle';
                      const effAns =
                        pdfConfig.customAnsBoxStyle &&
                        pdfConfig.customAnsBoxStyle !== 'theme-default'
                          ? pdfConfig.customAnsBoxStyle
                          : fmt.ansBoxStyle;

                      return (
                        <div
                          key={qNum}
                          className="rounded p-1.5 space-y-1 relative overflow-hidden"
                          style={{
                            backgroundColor:
                              effCard === 'open'
                                ? 'transparent'
                                : fmt.blockCardBg ||
                                  (fmt.isDark
                                    ? 'rgba(15,23,42,0.72)'
                                    : 'rgba(248,250,252,0.88)'),
                            border:
                              effCard === 'neo-brutalist'
                                ? '1.5px solid #09090b'
                                : effCard === 'double-royal-card'
                                  ? `2px double ${fmt.brandAccentColor}`
                                  : effCard !== 'open' && fmt.blockCardBorder
                                    ? `1px solid ${fmt.blockCardBorder}`
                                    : 'none',
                          }}
                        >
                          {/* Question Row */}
                          <div
                            className="text-[8px] font-bold leading-tight truncate flex items-center gap-1"
                            style={{ color: fmt.qPrimaryColor }}
                          >
                            <span
                              className="px-1 py-0.2 rounded text-[7px] text-white font-extrabold shrink-0"
                              style={{ backgroundColor: fmt.brandAccentColor }}
                            >
                              Q.{qNum}
                            </span>
                            <span className="truncate">Sample exam question...</span>
                          </div>

                          {/* Options Row */}
                          <div
                            className="grid grid-cols-2 gap-0.5 text-[7px]"
                            style={{ color: fmt.optionColor }}
                          >
                            <span className="truncate">
                              {effOpt === 'omr-circle' ? 'Ⓐ' : '(A)'} Opt 1
                            </span>
                            <span className="truncate">
                              {effOpt === 'omr-circle' ? 'Ⓑ' : '(B)'} Opt 2
                            </span>
                          </div>

                          {/* Answer Box */}
                          <div
                            className={`px-1.5 text-[7px] font-extrabold flex items-center justify-between ${
                              effAns === 'pure-dash-line' ||
                              effAns === 'dashed-underline' ||
                              effAns === 'dashed-divider-full'
                                ? 'pt-0.5 pb-1 rounded-none'
                                : effAns === 'dashed-coupon' ||
                                  effAns === 'sharp-dashed-tag' ||
                                  effAns === 'dash-flanked'
                                ? 'py-0.5 rounded-none'
                                : effAns === 'glass-capsule'
                                ? 'py-0.5 rounded-full'
                                : 'py-0.5 rounded'
                            }`}
                            style={{
                              backgroundColor:
                                effAns === 'pure-dash-line' ||
                                effAns === 'dash-flanked' ||
                                effAns === 'dashed-underline' ||
                                effAns === 'dashed-divider-full'
                                  ? 'transparent'
                                  : effAns === 'solid-inverse-pill'
                                  ? pdfConfig.customAnsColor || fmt.ansColor || '#047857'
                                  : fmt.ansHighlightBg || `${fmt.brandAccentColor}22`,
                              color:
                                effAns === 'solid-inverse-pill'
                                  ? '#ffffff'
                                  : pdfConfig.customAnsColor || fmt.ansColor || '#047857',
                              border:
                                effAns === 'dashed-coupon' || effAns === 'sharp-dashed-tag'
                                  ? `1px dashed ${pdfConfig.customAnsColor || fmt.ansColor || '#047857'}`
                                  : effAns === 'pure-dash-line' ||
                                    effAns === 'dash-flanked' ||
                                    effAns === 'dashed-underline' ||
                                    effAns === 'dashed-divider-full'
                                  ? undefined
                                  : `1px solid ${pdfConfig.customAnsColor || fmt.ansColor || '#047857'}44`,
                              borderBottom:
                                effAns === 'pure-dash-line' ||
                                effAns === 'dashed-underline' ||
                                effAns === 'dashed-divider-full'
                                  ? `1.5px dashed ${pdfConfig.customAnsColor || fmt.ansColor || '#047857'}`
                                  : undefined,
                            }}
                          >
                            <span>
                              {effAns === 'dash-flanked' || effAns === 'pure-dash-line'
                                ? '---- Ans: (B) ----'
                                : 'Ans: (B)'}
                            </span>
                            <span className="text-[6.5px]">Correct</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="space-y-1 w-full pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-600">
                    <span className="font-semibold text-emerald-800 truncate">
                      Aa {fmt.fontLabel}
                    </span>
                    <span className="font-mono text-slate-500 text-[10px] truncate">
                      {fmt.layoutBadgeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="truncate">{fmt.tagline}</span>
                    <span className="font-mono font-semibold text-slate-700 shrink-0 text-[10px] px-1.5 py-0.2 bg-slate-100 rounded">
                      {fmt.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Quick-Preview Bar for Mobile Devices */}
      <div className="fixed bottom-3 inset-x-3 sm:hidden z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            Active Format
          </div>
          <div className="text-xs font-bold text-white truncate">
            Format {activeTheme.formatNumber}: {activeTheme.name}
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToPreview}
          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>View A4</span>
        </button>
      </div>
    </div>
  );
};
