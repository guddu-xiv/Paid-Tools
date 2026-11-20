import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Eye,
  Link2,
  Unlink,
  RotateCcw,
  Palette,
  Laptop,
  Smartphone,
  Globe,
  MessageCircle,
  Youtube,
  Send,
  SlidersHorizontal,
} from 'lucide-react';
import {
  PDF_HEADER_FOOTER_STYLES,
  PdfDesignTheme,
  PdfHeaderFooterStyle,
  PdfLayoutConfig,
} from '../utils/pdfGenerator';

interface HeaderFooterTabContentProps {
  pdfConfig: PdfLayoutConfig;
  setPdfConfig: React.Dispatch<React.SetStateAction<PdfLayoutConfig>>;
  onGoToPreview: () => void;
  activeDesignTheme: PdfDesignTheme;
  onOpenDesignTab?: () => void;
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

export const HeaderFooterTabContent: React.FC<HeaderFooterTabContentProps> = ({
  pdfConfig,
  setPdfConfig,
  onGoToPreview,
  activeDesignTheme,
  onOpenDesignTab,
  isModalMode = false,
  onCloseModal,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'header' | 'footer' | 'content'>('presets');
  const [syncHeaderAndFooter, setSyncHeaderAndFooter] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const activeHeaderStyle: PdfHeaderFooterStyle =
    pdfConfig.customHeaderStyle && pdfConfig.customHeaderStyle !== 'theme-default'
      ? pdfConfig.customHeaderStyle
      : activeDesignTheme.headerFooterStyle || 'minimal-clean';

  const activeFooterStyle: PdfHeaderFooterStyle =
    pdfConfig.customFooterStyle && pdfConfig.customFooterStyle !== 'theme-default'
      ? pdfConfig.customFooterStyle
      : activeDesignTheme.headerFooterStyle || 'minimal-clean';

  const filteredStyles =
    categoryFilter === 'ALL'
      ? PDF_HEADER_FOOTER_STYLES
      : PDF_HEADER_FOOTER_STYLES.filter((s) => s.category === categoryFilter);

  const activeHeaderObj = PDF_HEADER_FOOTER_STYLES.find((s) => s.id === activeHeaderStyle);
  const activeFooterObj = PDF_HEADER_FOOTER_STYLES.find((s) => s.id === activeFooterStyle);

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 sm:p-2.5 bg-amber-100/80 text-amber-800 rounded-xl shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Header &amp; Footer Studio
                </h1>
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-300 rounded-lg">
                  15+ Unique Mast Designs • Live Synced
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                Minimal Clean, Coaching Ribbon, Floating Pills, Neo-Brutalist, Cyber HUD, Royal Ornate &amp; more
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 w-full sm:w-auto">
            {onOpenDesignTab && (
              <button
                type="button"
                onClick={onOpenDesignTab}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-700" />
                <span>Design Formats</span>
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

        {/* Active Selection Strip & Sync Toggle */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-500">Active Header:</span>
            <span className="px-2.5 py-1 font-bold text-emerald-950 bg-emerald-100/90 rounded-lg border border-emerald-300 flex items-center gap-1 shadow-2xs">
              <span>{activeHeaderObj?.iconTag}</span>
              <span>{activeHeaderObj?.name || activeHeaderStyle}</span>
            </span>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <span className="text-[11px] font-bold text-slate-500">Active Footer:</span>
            <span className="px-2.5 py-1 font-bold text-blue-950 bg-blue-100/90 rounded-lg border border-blue-300 flex items-center gap-1 shadow-2xs">
              <span>{activeFooterObj?.iconTag}</span>
              <span>{activeFooterObj?.name || activeFooterStyle}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={() => setSyncHeaderAndFooter((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                syncHeaderAndFooter
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {syncHeaderAndFooter ? (
                <>
                  <Link2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Sync Matched (1-Click)</span>
                </>
              ) : (
                <>
                  <Unlink className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mix &amp; Match (Independent)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setPdfConfig((prev) => ({
                  ...prev,
                  customHeaderStyle: 'theme-default',
                  customFooterStyle: 'theme-default',
                }));
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
              title="Reset to format default"
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs (1-Click Combos, Header Designs, Footer Designs, Text/Links) */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'presets', label: '⚡ 1-Click Style Combos', count: '15' },
            { id: 'header', label: '🔝 Header Designs', count: '15' },
            { id: 'footer', label: '🔻 Footer Designs', count: '15' },
            { id: 'content', label: '✏️ Text & Social Links', count: 'Brand' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  activeTab === tab.id ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: 1-CLICK STYLE COMBOS */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs text-slate-600">
              Select any style below to <strong>instantly apply both Header &amp; Footer together</strong>:
            </p>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500">
              <Laptop className="w-3.5 h-3.5" /> 3-Col Desktop • <Smartphone className="w-3.5 h-3.5" /> 1-Col Mobile
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {PDF_HEADER_FOOTER_STYLES.map((styleOpt) => {
              const isMatch = activeHeaderStyle === styleOpt.id && activeFooterStyle === styleOpt.id;

              return (
                <div
                  key={styleOpt.id}
                  onClick={() => {
                    setPdfConfig((prev) => ({
                      ...prev,
                      customHeaderStyle: styleOpt.id,
                      customFooterStyle: styleOpt.id,
                    }));
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                    isMatch
                      ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{styleOpt.iconTag}</span>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {styleOpt.name}
                        </h3>
                        <div className="text-[10.5px] font-bold text-emerald-700 truncate">
                          {styleOpt.hindiTag}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold text-slate-700 bg-slate-100 rounded-md shrink-0">
                      {styleOpt.category}
                    </span>
                  </div>

                  {/* Header Visual Mockup */}
                  <div className="p-2 bg-slate-100/90 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Header Preview</span>
                      <span className="text-[8px] text-emerald-800 font-extrabold">TOP OF A4</span>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      {renderHeaderPreviewSnippet(styleOpt.id)}
                    </div>

                    <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pt-1">
                      <span>Footer Preview</span>
                      <span className="text-[8px] text-blue-800 font-extrabold">BOTTOM OF A4</span>
                    </div>
                    <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      {renderFooterPreviewSnippet(styleOpt.id)}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {styleOpt.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">Click to apply</span>
                    {isMatch ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Applied to Both
                      </span>
                    ) : (
                      <span className="font-bold text-slate-700 group-hover:text-emerald-700">
                        Select Preset ➔
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: HEADER DESIGNS */}
      {activeTab === 'header' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {['ALL', 'Clean', 'Coaching', 'Modern', 'Academic', 'Tech', 'Royal'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredStyles.map((styleOpt) => {
              const isSelected = activeHeaderStyle === styleOpt.id;

              return (
                <div
                  key={styleOpt.id}
                  onClick={() => {
                    setPdfConfig((prev) => ({
                      ...prev,
                      customHeaderStyle: styleOpt.id,
                      ...(syncHeaderAndFooter ? { customFooterStyle: styleOpt.id } : {}),
                    }));
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{styleOpt.iconTag}</span>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {styleOpt.name}
                        </h3>
                        <div className="text-[10.5px] font-bold text-emerald-700 truncate">
                          {styleOpt.hindiTag}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold text-slate-700 bg-slate-100 rounded-md shrink-0">
                      {styleOpt.category}
                    </span>
                  </div>

                  {/* Header Visual Mockup */}
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                    {renderHeaderPreviewSnippet(styleOpt.id)}
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {styleOpt.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">
                      {syncHeaderAndFooter ? 'Syncs with Footer' : 'Independent Header'}
                    </span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Active Header
                      </span>
                    ) : (
                      <span className="font-bold text-slate-700 hover:text-emerald-700">
                        Apply Header ➔
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: FOOTER DESIGNS */}
      {activeTab === 'footer' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {['ALL', 'Clean', 'Coaching', 'Modern', 'Academic', 'Tech', 'Royal'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-700 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredStyles.map((styleOpt) => {
              const isSelected = activeFooterStyle === styleOpt.id;

              return (
                <div
                  key={styleOpt.id}
                  onClick={() => {
                    setPdfConfig((prev) => ({
                      ...prev,
                      customFooterStyle: styleOpt.id,
                    }));
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{styleOpt.iconTag}</span>
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                          {styleOpt.name}
                        </h3>
                        <div className="text-[10.5px] font-bold text-blue-700 truncate">
                          {styleOpt.hindiTag}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[9.5px] font-mono font-bold text-slate-700 bg-slate-100 rounded-md shrink-0">
                      {styleOpt.category}
                    </span>
                  </div>

                  {/* Footer Visual Mockup */}
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                    {renderFooterPreviewSnippet(styleOpt.id)}
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">
                    {styleOpt.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">Bottom of each PDF page</span>
                    {isSelected ? (
                      <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                        <Check className="w-3.5 h-3.5" /> Active Footer
                      </span>
                    ) : (
                      <span className="font-bold text-slate-700 hover:text-blue-700">
                        Apply Footer ➔
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: TEXT & SOCIAL LINKS */}
      {activeTab === 'content' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Document Brand &amp; Social Media Links
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Header aur Footer par display hone wale channels, website aur brand names ko customize karein
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Top-Left Brand Name (Header Left)
              </label>
              <input
                type="text"
                value={pdfConfig.brandLeftText}
                onChange={(e) =>
                  setPdfConfig((prev) => ({
                    ...prev,
                    brandLeftText: e.target.value,
                  }))
                }
                placeholder="@DesiCrackOfficial"
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-700"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Header ke baayein side me visible rahega (e.g. @YourInstitute)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Top-Right Website Name (Header Right)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pdfConfig.customHeaderRightText ?? 'desicrack.in'}
                  onChange={(e) =>
                    setPdfConfig((prev) => ({
                      ...prev,
                      customHeaderRightText: e.target.value,
                    }))
                  }
                  placeholder="desicrack.in"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-700"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Header ke daayein side me globe icon ke saath
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                WhatsApp Group / Channel Link (Footer Left)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pdfConfig.whatsappUrl ?? ''}
                  onChange={(e) =>
                    setPdfConfig((prev) => ({
                      ...prev,
                      whatsappUrl: e.target.value,
                    }))
                  }
                  placeholder="https://chat.whatsapp.com/your-group-invite"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-700"
                />
                <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-3" />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Footer Left me &quot;WhatsApp Join&quot; button par ye link direct attach hoga.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Telegram Channel Link / Handle (Footer Right)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pdfConfig.telegramUrl}
                  onChange={(e) =>
                    setPdfConfig((prev) => ({
                      ...prev,
                      telegramUrl: e.target.value,
                    }))
                  }
                  placeholder="https://t.me/DesiCrackOfficial"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-700"
                />
                <Send className="w-4 h-4 text-sky-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setPdfConfig((prev) => ({
                  ...prev,
                  brandLeftText: '@DesiCrackOfficial',
                  customHeaderRightText: 'desicrack.in',
                  telegramUrl: 'https://t.me/DesiCrackOfficial',
                  whatsappUrl: 'https://chat.whatsapp.com/DesiCrack',
                  youtubeUrl: 'https://www.youtube.com/@DesiCrackOfficial',
                }))
              }
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Brand &amp; Links to Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Quick-Preview Bar for Mobile Devices */}
      <div className="fixed bottom-3 inset-x-3 sm:hidden z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            Active Header &amp; Footer
          </div>
          <div className="text-xs font-bold text-white truncate">
            {activeHeaderObj?.name || activeHeaderStyle}
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

// Helper visual renderers for live card snippets
function renderHeaderPreviewSnippet(styleId: PdfHeaderFooterStyle) {
  switch (styleId) {
    case 'minimal-clean':
      return (
        <div className="flex items-center justify-between text-[8px] font-extrabold text-slate-800 px-1 py-0.5">
          <span className="text-emerald-800">@DesiCrackOfficial</span>
          <span className="text-slate-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            desicrack.in
          </span>
        </div>
      );
    case 'solid-coaching-bar':
      return (
        <div className="w-full bg-slate-900 text-white px-2 py-1 rounded flex items-center justify-between text-[7.5px] font-bold">
          <span>@DesiCrack</span>
          <span className="bg-emerald-600 px-1.5 py-0.2 rounded text-[6.5px]">★ EXAM NOTES ★</span>
          <span className="text-amber-300">desicrack.in</span>
        </div>
      );
    case 'floating-stadium-pill':
      return (
        <div className="flex items-center justify-between text-[7.5px] font-extrabold px-1">
          <span className="bg-cyan-50 border border-cyan-400 px-2 py-0.5 rounded-full text-cyan-900">
            @DesiCrack
          </span>
          <span className="text-cyan-700">•••</span>
          <span className="bg-cyan-50 border border-cyan-400 px-2 py-0.5 rounded-full text-cyan-900">
            desicrack.in
          </span>
        </div>
      );
    case 'neo-brutalist-bar':
      return (
        <div className="w-full bg-yellow-300 border border-slate-950 px-2 py-1 rounded flex items-center justify-between text-[7.5px] font-black text-slate-950 shadow-[1px_1px_0px_#09090b]">
          <span>@DESICRACK</span>
          <span className="bg-slate-950 text-yellow-300 px-1">⚡ RAPID NOTE</span>
          <span>DESICRACK.IN</span>
        </div>
      );
    case 'cyber-hud-angled':
      return (
        <div className="w-full bg-slate-950 text-emerald-400 border border-emerald-500/80 px-2 py-1 rounded flex items-center justify-between text-[7px] font-mono">
          <span>[+] @DESICRACK</span>
          <span className="text-sky-400">// HUD READY //</span>
          <span>SYS.ONLINE</span>
        </div>
      );
    case 'gazette-double-rule':
      return (
        <div className="w-full border-t border-b border-double border-amber-900 py-1 flex items-center justify-between text-[7.5px] font-serif text-amber-950">
          <span>@DesiCrackOfficial</span>
          <span>✦ ACADEMIC HANDBOOK ✦</span>
          <span>desicrack.in</span>
        </div>
      );
    case 'royal-ornate-ribbon':
      return (
        <div className="w-full border border-amber-500 bg-amber-50/50 px-2 py-1 rounded flex items-center justify-between text-[7.5px] font-serif text-amber-950">
          <span>❖ @DesiCrack</span>
          <span className="text-amber-800 font-bold">❖ TOPPER EDITION ❖</span>
          <span>desicrack.in ❖</span>
        </div>
      );
    case 'slanted-power-bar':
      return (
        <div className="w-full flex items-center justify-between text-[7.5px] font-extrabold">
          <span className="bg-rose-700 text-white px-2 py-0.5 rounded-l -skew-x-12">
            @DesiCrack ///
          </span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-r skew-x-12">
            desicrack.in
          </span>
        </div>
      );
    case 'register-top-stamp':
      return (
        <div className="w-full border border-slate-400 px-2 py-0.5 rounded flex items-center justify-between text-[7.5px] font-bold">
          <span className="text-slate-900">@DesiCrack</span>
          <span className="border border-red-600 text-red-600 px-1 text-[6.5px]">OFFICIAL DOCKET</span>
          <span className="text-slate-900">desicrack.in</span>
        </div>
      );
    case 'swiss-grid-header':
      return (
        <div className="w-full border-b border-slate-400 pb-0.5 flex items-center justify-between text-[7.5px] font-mono">
          <span>DESICRACK // ED.26</span>
          <span className="text-slate-500">• SWISS GRID •</span>
          <span>DESICRACK.IN</span>
        </div>
      );
    case 'topper-notebook-rule':
      return (
        <div className="w-full border-b-2 border-red-400 pb-0.5 flex items-center justify-between text-[7.5px] text-red-900 font-bold">
          <span>@DesiCrack</span>
          <span className="text-[6.5px] border border-red-300 px-1">DATE: ___ PAGE: ___</span>
          <span>desicrack.in</span>
        </div>
      );
    case 'badge-accent-capsule':
      return (
        <div className="w-full flex items-center justify-between text-[7.5px]">
          <span className="bg-purple-700 text-white px-2 py-0.5 rounded-full font-bold">@DesiCrack</span>
          <span className="text-purple-600 font-bold">•</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">desicrack.in</span>
        </div>
      );
    case 'underlined-gradient':
      return (
        <div className="w-full border-b-2 border-indigo-600 pb-0.5 flex items-center justify-between text-[7.5px] text-indigo-950 font-bold">
          <span>@DesiCrackOfficial</span>
          <span>desicrack.in</span>
        </div>
      );
    case 'bracket-frame':
    default:
      return (
        <div className="w-full flex items-center justify-between text-[7.5px] font-mono text-cyan-900 font-bold">
          <span>⟦ @DesiCrack ⟧</span>
          <span className="text-slate-400">— [+] —</span>
          <span>⟦ desicrack.in ⟧</span>
        </div>
      );
  }
}

function renderFooterPreviewSnippet(styleId: PdfHeaderFooterStyle) {
  switch (styleId) {
    case 'minimal-clean':
      return (
        <div className="flex items-center justify-between text-[7.5px] font-extrabold px-1">
          <span className="text-emerald-600 font-bold">💬 WhatsApp Join</span>
          <span className="text-emerald-700">Page 1 of 5</span>
          <span className="text-sky-600">✈ Join Telegram</span>
        </div>
      );
    case 'solid-coaching-bar':
      return (
        <div className="w-full bg-slate-900 text-white px-2 py-1 rounded flex items-center justify-between text-[7.5px] font-bold">
          <span className="text-emerald-400">💬 WA: Join</span>
          <span className="bg-emerald-600 px-1.5 py-0.2 rounded text-[6.5px]">PAGE 01</span>
          <span className="text-sky-300">✈ TG: Join Now</span>
        </div>
      );
    case 'floating-stadium-pill':
      return (
        <div className="flex items-center justify-between text-[7.5px] font-extrabold px-1">
          <span className="bg-emerald-50 border border-emerald-400 px-1.5 py-0.5 rounded-full text-emerald-900">
            💬 WhatsApp
          </span>
          <span className="bg-cyan-50 border border-cyan-400 px-2 py-0.5 rounded-full text-cyan-900">
            Page 1/5
          </span>
          <span className="bg-sky-50 border border-sky-400 px-1.5 py-0.5 rounded-full text-sky-900">
            ✈ Telegram
          </span>
        </div>
      );
    case 'neo-brutalist-bar':
      return (
        <div className="w-full bg-yellow-300 border border-slate-950 px-2 py-1 rounded flex items-center justify-between text-[7.5px] font-black text-slate-950 shadow-[1px_1px_0px_#09090b]">
          <span>💬 WA JOIN</span>
          <span className="bg-slate-950 text-yellow-300 px-1.5">⚡ P.01</span>
          <span>✈ JOIN CHAT</span>
        </div>
      );
    case 'cyber-hud-angled':
      return (
        <div className="w-full bg-slate-950 text-emerald-400 border border-emerald-500/80 px-2 py-1 rounded flex items-center justify-between text-[7px] font-mono">
          <span>[WA] JOIN</span>
          <span className="text-sky-400">SYS // PG 01/05</span>
          <span>[TG] JOIN</span>
        </div>
      );
    case 'gazette-double-rule':
      return (
        <div className="w-full border-t border-b border-double border-amber-900 py-1 flex items-center justify-between text-[7.5px] font-serif text-amber-950">
          <span>WhatsApp Group</span>
          <span>[ Page 1 of 5 ]</span>
          <span>Telegram Group</span>
        </div>
      );
    case 'royal-ornate-ribbon':
      return (
        <div className="w-full border border-amber-500 bg-amber-50/50 px-2 py-1 rounded flex items-center justify-between text-[7.5px] font-serif text-amber-950">
          <span>❖ WhatsApp</span>
          <span className="font-bold">❖ Page 1 ❖</span>
          <span>Telegram ❖</span>
        </div>
      );
    case 'slanted-power-bar':
      return (
        <div className="w-full flex items-center justify-between text-[7.5px] font-extrabold">
          <span className="bg-emerald-700 text-white px-2 py-0.5 rounded-l -skew-x-12">💬 WA JOIN</span>
          <span className="bg-emerald-600 text-white px-2 py-0.5">PAGE 01</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-r skew-x-12">✈ JOIN</span>
        </div>
      );
    case 'register-top-stamp':
      return (
        <div className="w-full border border-slate-400 px-2 py-0.5 rounded flex items-center justify-between text-[7.5px] font-bold">
          <span>WhatsApp</span>
          <span className="text-red-600 border border-red-500 px-1 text-[6.5px]">[ PAGE 01/05 ]</span>
          <span>Telegram</span>
        </div>
      );
    case 'swiss-grid-header':
      return (
        <div className="w-full border-t border-slate-400 pt-0.5 flex items-center justify-between text-[7.5px] font-mono">
          <span>WA // JOIN</span>
          <span className="text-slate-600">P. 01 / 05</span>
          <span>TG // JOIN</span>
        </div>
      );
    case 'topper-notebook-rule':
      return (
        <div className="w-full border-t-2 border-red-400 pt-0.5 flex items-center justify-between text-[7.5px] text-red-900 font-bold">
          <span>WhatsApp</span>
          <span className="border-b border-red-300 px-1">PAGE — 1 OF 5</span>
          <span>Telegram</span>
        </div>
      );
    case 'badge-accent-capsule':
      return (
        <div className="w-full flex items-center justify-between text-[7.5px]">
          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">WhatsApp</span>
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">Page 1/5</span>
          <span className="bg-sky-600 text-white px-2 py-0.5 rounded-full font-bold">Telegram</span>
        </div>
      );
    case 'underlined-gradient':
      return (
        <div className="w-full border-t-2 border-indigo-600 pt-0.5 flex items-center justify-between text-[7.5px] text-indigo-950 font-bold">
          <span>WhatsApp Join</span>
          <span>Page 1 of 5</span>
          <span>Telegram Join</span>
        </div>
      );
    case 'bracket-frame':
    default:
      return (
        <div className="w-full flex items-center justify-between text-[7.5px] font-mono text-cyan-900 font-bold">
          <span>⟦ WhatsApp ⟧</span>
          <span>⟦ PAGE 01 ⟧</span>
          <span>⟦ Telegram ⟧</span>
        </div>
      );
  }
}
