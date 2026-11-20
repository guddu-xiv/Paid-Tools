import React, { useEffect, useRef, useState } from 'react';
import {
  A4_HEIGHT_IN,
  A4_WIDTH_IN,
  BASE_DPI,
  DEFAULT_BRAND_CIRCLE_LOGO_URL,
  ensureAnekFontLoaded,
  ensureWatermarkImageLoaded,
  normalizeTelegramUrl,
  normalizeWhatsappUrl,
  normalizeYoutubeUrl,
  PaginatedA4Page,
  PdfLayoutConfig,
  PPT_HEIGHT_IN,
  PPT_WIDTH_IN,
  renderA4PageToCanvas,
} from '../utils/pdfGenerator';

interface A4PageCanvasProps {
  page: PaginatedA4Page;
  totalPages: number;
  config: PdfLayoutConfig;
  showMarginGuides: boolean;
  onJumpToPage?: (pageNumber: number) => void;
  onEditQuestion?: (questionId: string, qLabel?: string) => void;
  onEditHeaderFooter?: (currentHeaderRight: string) => void;
  onEditTopicFromIndex?: (topicName: string, topicNumber: number) => void;
}

export const A4PageCanvas: React.FC<A4PageCanvasProps> = React.memo(
  ({
    page,
    totalPages,
    config,
    showMarginGuides,
    onJumpToPage,
    onEditQuestion,
    onEditHeaderFooter,
    onEditTopicFromIndex,
  }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    // Render first 4 pages immediately; lazy-render the rest via IntersectionObserver
    const [isVisible, setIsVisible] = useState<boolean>(page.pageNumber <= 4);

    useEffect(() => {
      const el = containerRef.current;
      if (!el || typeof IntersectionObserver === 'undefined') {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setIsVisible(entry.isIntersecting);
          }
        },
        {
          rootMargin: '1400px 0px',
          threshold: 0.01,
        }
      );

      observer.observe(el);
      return () => {
        observer.disconnect();
      };
    }, []);

    useEffect(() => {
      if (!isVisible) {
        // Release GPU/RAM backing store for far off-screen pages so 50+ pages never lag or crash on mobile
        if (canvasRef.current) {
          canvasRef.current.width = 1;
          canvasRef.current.height = 1;
        }
        return;
      }

      let cancelled = false;
      let rafId = 0;

      const draw = () => {
        if (cancelled || !canvasRef.current) return;
        const target = canvasRef.current;
        const isSmallScreen =
          typeof window !== 'undefined' && window.innerWidth < 640;
        const scale = isSmallScreen ? 1.55 : 1.85;
        const offscreen = renderA4PageToCanvas(page, totalPages, config, scale);
        target.width = offscreen.width;
        target.height = offscreen.height;

        const ctx = target.getContext('2d');
        if (ctx) {
          ctx.drawImage(offscreen, 0, 0);

          if (showMarginGuides) {
            const marginPx = config.marginInches * BASE_DPI * scale;
            const w = target.width;
            const h = target.height;
            ctx.save();
            ctx.strokeStyle = 'rgba(225, 29, 72, 0.55)';
            ctx.lineWidth = 1.4;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(
              marginPx,
              marginPx,
              w - marginPx * 2,
              h - marginPx * 2
            );
            ctx.restore();
          }
        }

        // Immediately release temporary offscreen buffer
        offscreen.width = 1;
        offscreen.height = 1;
      };

      Promise.all([
        ensureAnekFontLoaded(),
        ensureWatermarkImageLoaded(DEFAULT_BRAND_CIRCLE_LOGO_URL),
        config.watermarkLogoUrl
          ? ensureWatermarkImageLoaded(config.watermarkLogoUrl)
          : Promise.resolve(null),
      ]).then(() => {
        if (!cancelled) {
          rafId = requestAnimationFrame(draw);
        }
      });

      return () => {
        cancelled = true;
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [isVisible, page, totalPages, config, showMarginGuides]);

    const isPpt = config.questionFormatMode === 'ppt';
    const pageWidthIn = isPpt ? PPT_WIDTH_IN : A4_WIDTH_IN;
    const baseW = Math.round((isPpt ? PPT_WIDTH_IN : A4_WIDTH_IN) * BASE_DPI);
    const baseH = Math.round((isPpt ? PPT_HEIGHT_IN : A4_HEIGHT_IN) * BASE_DPI);

    const tgHref = normalizeTelegramUrl(config.telegramUrl);
    const waHref = normalizeWhatsappUrl(config.whatsappUrl || config.youtubeUrl);
    const ytHref = normalizeYoutubeUrl(config.youtubeUrl);

    return (
      <div
        ref={containerRef}
        className="relative bg-white border border-slate-300 shadow-sm mx-auto overflow-hidden rounded-lg"
        style={{
          width: '100%',
          maxWidth: `${baseW}px`,
          aspectRatio: `${baseW} / ${baseH}`,
        }}
      >
        {isVisible ? (
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white text-xs text-slate-400 font-mono">
            {isPpt ? `PPT Slide ${page.pageNumber}` : `A4 Page ${page.pageNumber}`}
          </div>
        )}

        {/* Direct Click-to-Edit Question / Answer / Options / Explanation Hotspots on Live Preview */}
        {isVisible &&
          !page.isIndexPage &&
          onEditQuestion &&
          page.items.map((item, idx) => {
            if (!item.questionId) return null;
            const qLinesH = (item.qLines || []).reduce((s, l) => s + l.lineHeightPx, 0);
            const aLinesH = (item.aLines || []).reduce((s, l) => s + l.lineHeightPx, 0);
            const qToAGap = item.qToAGapPx ?? 1.0;
            const ansPadY = item.ansPadYPx ?? 0.8;
            const naturalH = Math.max(
              14,
              qLinesH + qToAGap + (aLinesH > 0 ? ansPadY * 0.8 + aLinesH : 0)
            );
            const boxH = Math.min(item.heightPx, Math.max(naturalH + 3, item.heightPx * 0.92));

            return (
              <div
                key={`edit-q-${item.questionId}-${idx}`}
                onClick={() => onEditQuestion(item.questionId!, item.qLabel)}
                title={`Click to directly edit Question ${item.qLabel || ''}`}
                style={{
                  position: 'absolute',
                  left: `${(Math.max(0, item.xPx - 2) / baseW) * 100}%`,
                  top: `${(Math.max(0, item.yPx - 1) / baseH) * 100}%`,
                  width: `${(Math.min(baseW, item.widthPx + 4) / baseW) * 100}%`,
                  height: `${(boxH / baseH) * 100}%`,
                }}
                className="group cursor-pointer rounded-xs transition-all hover:bg-emerald-500/10 hover:ring-1 hover:ring-emerald-600/60"
              >
                <span className="opacity-0 group-hover:opacity-100 pointer-events-none absolute top-0.5 right-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-700 text-white rounded shadow-xs transition-opacity whitespace-nowrap">
                  ✎ Edit Q{item.qLabel}
                </span>
              </div>
            );
          })}

        {/* Interactive Clickable Topic Index Hotspots (Chapter-wise Index Page) */}
        {page.isIndexPage &&
          page.indexEntries &&
          page.indexEntries.map((entry) => (
            <div
              key={`index-entry-${entry.topicNumber}`}
              style={{
                position: 'absolute',
                left: `${(entry.xPx / baseW) * 100}%`,
                top: `${(entry.yPx / baseH) * 100}%`,
                width: `${(entry.widthPx / baseW) * 100}%`,
                height: `${(entry.heightPx / baseH) * 100}%`,
              }}
              className="group flex items-center justify-end rounded-xs transition-colors hover:bg-emerald-500/15 active:bg-emerald-600/25 border border-transparent hover:border-emerald-500/50"
            >
              <button
                type="button"
                onClick={() => onJumpToPage?.(entry.targetPageNumber)}
                title={`Click to go to ${entry.topicName} (Page ${entry.targetPageNumber})`}
                className="w-full h-full cursor-pointer text-left"
              />
              {onEditTopicFromIndex && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTopicFromIndex(entry.topicName, entry.topicNumber);
                  }}
                  title={`Rename Topic "${entry.topicName}"`}
                  className="opacity-0 group-hover:opacity-100 mr-16 px-1.5 py-0.5 text-[9px] font-bold bg-slate-900 hover:bg-emerald-700 text-white rounded shadow-xs transition-opacity whitespace-nowrap z-10 cursor-pointer"
                >
                  ✎ Rename
                </button>
              )}
            </div>
          ))}

        {/* Interactive Clickable Hotspots on Live A4 / PPT Header & Footer */}
        {config.showDocumentHeader && (
          <>
            {/* Top-Left Brand + Direct Edit Hotspot */}
            <div
              onClick={() => onEditHeaderFooter?.(page.headerRightText)}
              title="Click to directly edit Brand Name, Exam Header, or Links"
              style={{
                position: 'absolute',
                left: `${(config.marginInches / pageWidthIn) * 100}%`,
                top: '0.3%',
                width: `${((pageWidthIn - config.marginInches * 2) / pageWidthIn) * 100}%`,
                height: isPpt ? '4.2%' : '2.4%',
              }}
              className="group cursor-pointer hover:bg-emerald-500/10 hover:ring-1 hover:ring-emerald-600/50 rounded-xs transition-all flex items-center justify-center"
            >
              <span className="opacity-0 group-hover:opacity-100 pointer-events-none px-2 py-0.5 text-[9px] font-bold bg-slate-900/90 text-white rounded shadow-xs transition-opacity">
                ✎ Click to Edit Header (Brand / Exam Title)
              </span>
            </div>
          </>
        )}

        {config.showPageNumbers && (
          <>
            {/* Bottom-Left WhatsApp "Join" Hotspot */}
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              title={`Join WhatsApp: ${waHref}`}
              style={{
                position: 'absolute',
                left: `${(config.marginInches / pageWidthIn) * 100}%`,
                bottom: '0.4%',
                width: '23%',
                height: '2.3%',
              }}
              className="cursor-pointer hover:bg-emerald-500/10 rounded-xs transition-colors"
            />

            {/* Bottom-Center Footer Direct Edit Hotspot */}
            {onEditHeaderFooter && (
              <div
                onClick={() => onEditHeaderFooter(page.headerRightText)}
                title="Click to edit Footer & Channel Links"
                style={{
                  position: 'absolute',
                  left: '35%',
                  bottom: '0.4%',
                  width: '30%',
                  height: '2.3%',
                }}
                className="group cursor-pointer hover:bg-emerald-500/10 rounded-xs transition-colors flex items-center justify-center"
              >
                <span className="opacity-0 group-hover:opacity-100 pointer-events-none px-1.5 py-0.5 text-[8.5px] font-bold bg-slate-900/90 text-white rounded shadow-xs">
                  ✎ Edit Footer
                </span>
              </div>
            )}

            {/* Bottom-Right Telegram "Join Now" Hotspot */}
            <a
              href={tgHref}
              target="_blank"
              rel="noopener noreferrer"
              title={`Join on Telegram: ${tgHref}`}
              style={{
                position: 'absolute',
                right: `${(config.marginInches / pageWidthIn) * 100}%`,
                bottom: '0.4%',
                width: '20%',
                height: '2.3%',
              }}
              className="cursor-pointer hover:bg-sky-500/10 rounded-xs transition-colors"
            />
          </>
        )}
      </div>
    );
  }
);
