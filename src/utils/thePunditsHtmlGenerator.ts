/**
 * The Pundits Official (thepunditsofficial.in) Interactive HTML Mock Test & Analysis Generator
 * Generates an interactive, standalone, single-file HTML mock test with:
 *  - Real-time live test attempt interface with countdown timer, palette, section navigation
 *  - Full post-test analysis dashboard (Score, Accuracy %, Section-wise breakdown, Incorrect review)
 *  - Native MathJax 3 LaTeX formula rendering for mathematics and complex equations
 *  - Authentic statement question styling (Statement I, Statement II, Assertion, Reason)
 *  - Image rendering with click-to-zoom modal lightbox for geometry/reasoning figures
 *  - Bilingual English + Hindi toggle and full detailed explanations
 */

import { PunditsConvertedResult } from './thePunditsConverter';

export interface PunditsHtmlMeta {
  durationMinutes?: number | string;
  totalMarks?: number | string;
  positiveMarks?: number;
  negativeMarks?: number;
  categoryName?: string;
}

export function generatePunditsInteractiveHtml(
  converted: PunditsConvertedResult,
  meta?: PunditsHtmlMeta
): string {
  const testTitle = converted.title || 'The Pundits ProMocks Test';
  const seriesTitle = converted.seriesTitle || 'THE PUNDITS ProMocks for SSC 2026 Mains';
  const totalQuestions = converted.questions.length;
  const durationMin = meta?.durationMinutes ? Number(String(meta.durationMinutes).replace(/\D/g, '')) || 135 : 135;
  const durationSec = durationMin * 60;
  const posMarks = meta?.positiveMarks || 3.0;
  const negMarks = meta?.negativeMarks !== undefined ? meta.negativeMarks : 1.0;
  const totalMaxMarks = meta?.totalMarks ? Number(String(meta.totalMarks).replace(/\D/g, '')) || totalQuestions * posMarks : totalQuestions * posMarks;

  // Safe JSON serialization of questions
  const safeDataJson = JSON.stringify(converted.questions)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\/');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(testTitle)} - The Pundits Interactive Test & Analysis</title>

  <!-- MathJax Configuration & CDN for Math Formulas & Equations -->
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
        processEscapes: true,
        packages: {'[+]': ['noerrors', 'noundefined']}
      },
      options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
      },
      svg: { fontCache: 'global' }
    };
  </script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

  <!-- Google Fonts: Inter & Noto Sans Devanagari for Pristine Bilingual Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />

  <style>
    :root {
      --primary: #d97706;
      --primary-dark: #b45309;
      --primary-light: #fef3c7;
      --secondary: #0f172a;
      --accent: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --purple: #8b5cf6;
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --radius: 12px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    body {
      font-family: 'Inter', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
      overflow-x: hidden;
      min-height: 100vh;
    }

    /* Top Brand Navigation Header */
    .app-header {
      background: linear-gradient(135deg, #1c1917 0%, #0c0a09 100%);
      color: #ffffff;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #78350f;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .brand-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo-badge {
      background: #f59e0b;
      color: #0c0a09;
      font-size: 11px;
      font-weight: 900;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .header-test-info h1 {
      font-size: 14px;
      font-weight: 800;
      color: #ffffff;
      margin: 0;
      max-width: 420px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-test-info p {
      font-size: 11px;
      color: #fbbf24;
      font-weight: 600;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* Countdown Timer Widget */
    .timer-badge {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(251, 191, 36, 0.4);
      padding: 6px 14px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 800;
      color: #fde68a;
    }

    .timer-badge.danger {
      border-color: #ef4444;
      color: #fca5a5;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .btn-submit-main {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 10px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.35);
    }

    .btn-submit-main:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
    }

    /* Sections Bar */
    .sections-bar {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .sections-list {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sec-tab-btn {
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 11.5px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .sec-tab-btn:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .sec-tab-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
      box-shadow: 0 2px 6px rgba(15, 23, 42, 0.2);
    }

    .sec-badge-count {
      background: rgba(0, 0, 0, 0.12);
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 800;
    }

    .sec-tab-btn.active .sec-badge-count {
      background: #f59e0b;
      color: #000;
    }

    .lang-toggle-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f1f5f9;
      padding: 2px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    .lang-btn {
      padding: 4px 10px;
      border-radius: 6px;
      border: none;
      background: transparent;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      cursor: pointer;
    }

    .lang-btn.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Main Container: 2-Column Split */
    .test-canvas {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 16px;
      padding: 16px;
      max-width: 1540px;
      margin: 0 auto;
      min-height: calc(100vh - 120px);
    }

    @media (max-width: 1024px) {
      .test-canvas {
        grid-template-columns: 1fr;
      }
    }

    /* Left Pane: Question Sheet */
    .question-pane {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-col: column;
      overflow: hidden;
    }

    .q-header-bar {
      padding: 12px 18px;
      background: #fafafa;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }

    .q-num-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .marks-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
    }

    .badge-pos {
      color: #059669;
      background: #ecfdf5;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid #a7f3d0;
    }

    .badge-neg {
      color: #dc2626;
      background: #fef2f2;
      padding: 2px 7px;
      border-radius: 6px;
      border: 1px solid #fecaca;
    }

    .q-body-area {
      padding: 20px 24px;
      overflow-y: auto;
      max-height: calc(100vh - 280px);
    }

    /* Comprehension / Direction Card */
    .passage-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #10b981;
      padding: 14px 16px;
      border-radius: 8px;
      margin-bottom: 18px;
      font-size: 13px;
      color: #14532d;
      line-height: 1.6;
    }

    .passage-title {
      font-weight: 800;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #166534;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Statement Questions Styling */
    .statement-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin: 8px 0;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      color: #1e293b;
    }

    .statement-badge {
      background: #e2e8f0;
      color: #334155;
      font-weight: 800;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 6px;
      white-space: nowrap;
      margin-top: 1px;
    }

    /* Question text */
    .question-stem {
      font-size: 14.5px;
      font-weight: 600;
      color: #0f172a;
      line-height: 1.7;
      margin-bottom: 16px;
    }

    .question-stem-hi {
      font-size: 14px;
      color: #334155;
      line-height: 1.7;
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }

    /* Question Figures / Images */
    .question-image-wrap {
      margin: 14px 0;
      text-align: center;
    }

    .question-img {
      max-width: 100%;
      max-height: 380px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      cursor: zoom-in;
      transition: transform 0.2s;
    }

    .question-img:hover {
      transform: scale(1.01);
    }

    .zoom-hint {
      display: block;
      font-size: 10.5px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
    }

    /* Options List */
    .options-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    .option-card {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 14px;
      transition: all 0.15s ease;
      user-select: none;
    }

    .option-card:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
    }

    .option-card.selected {
      border-color: #d97706;
      background: #fffbeb;
      box-shadow: 0 0 0 1px #d97706;
    }

    .opt-letter {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 2px solid #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      color: #475569;
      flex-shrink: 0;
      transition: all 0.15s;
    }

    .option-card.selected .opt-letter {
      background: #d97706;
      border-color: #d97706;
      color: #ffffff;
    }

    .opt-text {
      font-size: 13.5px;
      font-weight: 500;
      color: #1e293b;
      flex: 1;
      line-height: 1.5;
    }

    .opt-text-hi {
      font-size: 12.5px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Bottom Action Controls */
    .q-footer-bar {
      padding: 12px 18px;
      background: #fafafa;
      border-top: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
    }

    .footer-left-actions, .footer-right-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-action {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .btn-action:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .btn-action.btn-save {
      background: #10b981;
      color: #ffffff;
      border-color: #10b981;
    }

    .btn-action.btn-save:hover {
      background: #059669;
    }

    .btn-action.btn-review {
      background: #8b5cf6;
      color: #ffffff;
      border-color: #8b5cf6;
    }

    .btn-action.btn-review:hover {
      background: #7c3aed;
    }

    /* Right Pane: Question Palette */
    .palette-pane {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .palette-header h3 {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Legend */
    .legend-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: #f8fafc;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 11px;
      font-weight: 600;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .pal-badge {
      width: 22px;
      height: 22px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 800;
      color: #fff;
      flex-shrink: 0;
    }

    .pal-badge.ans { background: #10b981; }
    .pal-badge.not-ans { background: #f97316; }
    .pal-badge.rev { background: #8b5cf6; }
    .pal-badge.ans-rev { background: #8b5cf6; position: relative; }
    .pal-badge.ans-rev::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 5px;
      height: 5px;
      background: #10b981;
      border-radius: 50%;
    }
    .pal-badge.not-vis { background: #cbd5e1; color: #475569; }

    /* Palette Grid */
    .palette-buttons-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      max-height: 380px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .q-pal-btn {
      height: 36px;
      border-radius: 8px;
      border: 1px solid transparent;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.1s;
    }

    .q-pal-btn.current {
      box-shadow: 0 0 0 2px #d97706, 0 0 0 4px #fef3c7;
      transform: scale(1.05);
      z-index: 2;
    }

    /* Analysis Dashboard View */
    .analysis-container {
      display: none;
      max-width: 1400px;
      margin: 20px auto;
      padding: 0 16px 40px;
    }

    .analysis-container.active {
      display: block;
    }

    .hero-score-card {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 24px 28px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.2);
      border: 1px solid #334155;
      margin-bottom: 20px;
    }

    .hero-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .hero-title-box h2 {
      font-size: 20px;
      font-weight: 900;
      color: #fbbf24;
    }

    .hero-title-box p {
      font-size: 12px;
      color: #cbd5e1;
    }

    .stats-tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 14px;
    }

    .stat-tile {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px;
      text-align: center;
    }

    .stat-tile .val {
      font-size: 24px;
      font-weight: 900;
      font-family: 'JetBrains Mono', monospace;
    }

    .stat-tile .lbl {
      font-size: 11px;
      color: #94a3b8;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 2px;
    }

    .stat-tile.score .val { color: #38bdf8; }
    .stat-tile.acc .val { color: #fbbf24; }
    .stat-tile.correct .val { color: #34d399; }
    .stat-tile.incorrect .val { color: #f87171; }
    .stat-tile.skipped .val { color: #cbd5e1; }

    /* Section-wise performance table */
    .analysis-table-wrap {
      background: #ffffff;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow-x: auto;
      margin-bottom: 24px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }

    .analysis-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 12px;
    }

    .analysis-table th {
      background: #f8fafc;
      padding: 12px 16px;
      font-weight: 800;
      color: #334155;
      border-bottom: 1px solid var(--border);
      text-transform: uppercase;
      font-size: 10.5px;
      letter-spacing: 0.5px;
    }

    .analysis-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      color: #1e293b;
      font-weight: 600;
    }

    .analysis-table tr:last-child td {
      border-bottom: none;
    }

    /* Review Questions Section */
    .review-filter-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .review-filter-btn {
      padding: 7px 14px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
    }

    .review-filter-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }

    .solution-card {
      background: #ffffff;
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    }

    .solution-card.correct { border-left: 6px solid #10b981; }
    .solution-card.incorrect { border-left: 6px solid #ef4444; }
    .solution-card.skipped { border-left: 6px solid #94a3b8; }

    .sol-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap;
      gap: 8px;
    }

    .sol-badge-status {
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .sol-badge-status.correct { background: #d1fae5; color: #065f46; }
    .sol-badge-status.incorrect { background: #fee2e2; color: #991b1b; }
    .sol-badge-status.skipped { background: #f1f5f9; color: #475569; }

    .explanation-box {
      margin-top: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      font-size: 13px;
      line-height: 1.7;
    }

    .explanation-box-title {
      font-weight: 800;
      color: #d97706;
      font-size: 12px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Lightbox Modal for Image Zoom */
    .lightbox-modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .lightbox-modal.active { display: flex; }

    .lightbox-content {
      max-width: 90vw;
      max-height: 85vh;
      border-radius: 12px;
      background: #ffffff;
      padding: 8px;
      position: relative;
    }

    .lightbox-content img {
      max-width: 100%;
      max-height: 80vh;
      display: block;
      border-radius: 8px;
    }

    .lightbox-close {
      position: absolute;
      top: -12px;
      right: -12px;
      background: #ef4444;
      color: #ffffff;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-weight: 900;
      font-size: 14px;
      cursor: pointer;
    }

    /* Print Styles */
    @media print {
      .app-header, .sections-bar, .q-footer-bar, .palette-pane, .review-filter-bar, .no-print {
        display: none !important;
      }
      .test-canvas {
        display: block !important;
      }
      .analysis-container {
        display: block !important;
      }
    }
  </style>
</head>
<body>

  <!-- Top App Header -->
  <header class="app-header">
    <div class="brand-wrap">
      <span class="brand-logo-badge">✦ THE PUNDITS</span>
      <div class="header-test-info">
        <h1>${escapeHtml(testTitle)}</h1>
        <p>${escapeHtml(seriesTitle)} • Paid Status: TRUE</p>
      </div>
    </div>

    <div class="header-controls">
      <div class="timer-badge" id="timerBadge">
        <span>⏱</span>
        <span id="timerDisplay">02:15:00</span>
      </div>
      <button class="btn-submit-main no-print" onclick="promptSubmitTest()">
        <span>✓</span>
        <span>Submit Test</span>
      </button>
    </div>
  </header>

  <!-- Sections Bar & Language Selector -->
  <div class="sections-bar no-print" id="sectionsBar">
    <div class="sections-list" id="sectionsList">
      <!-- Section Buttons Populated by JS -->
    </div>

    <div class="lang-toggle-wrap">
      <button class="lang-btn active" id="btnLangBilingual" onclick="setLanguageMode('bilingual')">Bilingual</button>
      <button class="lang-btn" id="btnLangEn" onclick="setLanguageMode('en')">English</button>
      <button class="lang-btn" id="btnLangHi" onclick="setLanguageMode('hi')">Hindi</button>
    </div>
  </div>

  <!-- Main Test Attempt Canvas -->
  <main class="test-canvas" id="testCanvas">
    <!-- Left: Question Sheet -->
    <div class="question-pane">
      <div class="q-header-bar">
        <div class="q-num-title" id="qNumTitle">
          <span>Question No. 1</span>
        </div>
        <div class="marks-info">
          <span class="badge-pos">+${posMarks.toFixed(1)}</span>
          <span class="badge-neg">-${negMarks.toFixed(1)}</span>
          <span id="activeSecBadge" style="color: #64748b; font-size: 11px;">Section: General</span>
        </div>
      </div>

      <div class="q-body-area" id="qBodyArea">
        <!-- Rendered dynamically by renderCurrentQuestion() -->
      </div>

      <div class="q-footer-bar no-print">
        <div class="footer-left-actions">
          <button class="btn-action" onclick="prevQuestion()">← Previous</button>
          <button class="btn-action" onclick="clearResponse()">Clear Response</button>
        </div>
        <div class="footer-right-actions">
          <button class="btn-action btn-review" onclick="markForReviewAndNext()">Mark for Review & Next</button>
          <button class="btn-action btn-save" onclick="saveAndNext()">Save & Next →</button>
        </div>
      </div>
    </div>

    <!-- Right: Question Palette -->
    <aside class="palette-pane no-print">
      <div class="palette-header">
        <h3>Question Palette</h3>
      </div>

      <div class="legend-grid">
        <div class="legend-item"><span class="pal-badge ans">0</span> Answered</div>
        <div class="legend-item"><span class="pal-badge not-ans">0</span> Not Answered</div>
        <div class="legend-item"><span class="pal-badge rev">0</span> Review</div>
        <div class="legend-item"><span class="pal-badge ans-rev">0</span> Ans & Review</div>
        <div class="legend-item" style="grid-column: span 2;"><span class="pal-badge not-vis">0</span> Not Visited</div>
      </div>

      <div class="palette-buttons-grid" id="paletteGrid">
        <!-- Question buttons populated by JS -->
      </div>
    </aside>
  </main>

  <!-- Analysis Dashboard (Rendered upon Submission) -->
  <div class="analysis-container" id="analysisContainer">
    <div class="hero-score-card">
      <div class="hero-top">
        <div class="hero-title-box">
          <h2>✦ Comprehensive Test Analysis & Report</h2>
          <p>${escapeHtml(testTitle)} • Official ProMocks Performance Breakdown</p>
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn-action" style="background:#fbbf24; color:#0f172a; border:none;" onclick="reattemptTest()">🔄 Re-attempt Test</button>
          <button class="btn-action" style="background:#334155; color:#ffffff; border:none;" onclick="window.print()">🖨️ Print / Save PDF</button>
        </div>
      </div>

      <div class="stats-tiles-grid">
        <div class="stat-tile score">
          <div class="val" id="statFinalScore">0</div>
          <div class="lbl">Total Score (/ ${totalMaxMarks})</div>
        </div>
        <div class="stat-tile acc">
          <div class="val" id="statAccuracy">0%</div>
          <div class="lbl">Accuracy</div>
        </div>
        <div class="stat-tile correct">
          <div class="val" id="statCorrect">0</div>
          <div class="lbl">Correct (+${posMarks})</div>
        </div>
        <div class="stat-tile incorrect">
          <div class="val" id="statIncorrect">0</div>
          <div class="lbl">Incorrect (-${negMarks})</div>
        </div>
        <div class="stat-tile skipped">
          <div class="val" id="statSkipped">0</div>
          <div class="lbl">Skipped (0)</div>
        </div>
      </div>
    </div>

    <!-- Section-wise Table -->
    <div class="analysis-table-wrap">
      <table class="analysis-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Total Questions</th>
            <th>Attempted</th>
            <th>Correct</th>
            <th>Incorrect</th>
            <th>Score</th>
            <th>Accuracy</th>
          </tr>
        </thead>
        <tbody id="sectionStatsTbody">
          <!-- Rows inserted by JS -->
        </tbody>
      </table>
    </div>

    <!-- Question-by-Question Review Header -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
      <h3 style="font-size: 16px; font-weight: 800; color: #0f172a;">
        Question-by-Question Solutions & Explanations
      </h3>

      <div class="review-filter-bar no-print">
        <button class="review-filter-btn active" onclick="filterReview('all')">All Questions</button>
        <button class="review-filter-btn" onclick="filterReview('incorrect')">❌ Incorrect (${totalQuestions})</button>
        <button class="review-filter-btn" onclick="filterReview('correct')">✓ Correct</button>
        <button class="review-filter-btn" onclick="filterReview('skipped')">⭕ Skipped</button>
      </div>
    </div>

    <!-- Solutions List -->
    <div id="solutionsReviewList">
      <!-- Cards inserted by JS -->
    </div>
  </div>

  <!-- Lightbox Modal for Question Image Zoom -->
  <div class="lightbox-modal" id="lightboxModal" onclick="closeLightbox()">
    <div class="lightbox-content" onclick="event.stopPropagation()">
      <button class="lightbox-close" onclick="closeLightbox()">×</button>
      <img id="lightboxImg" src="" alt="Enlarged Question Figure" />
    </div>
  </div>

  <!-- Raw Test Data Script & App Engine -->
  <script>
    const QUESTIONS = ${safeDataJson};
    const TOTAL_QS = QUESTIONS.length;
    const POS_MARKS = ${posMarks};
    const NEG_MARKS = ${negMarks};
    const DURATION_SECONDS = ${durationSec};

    // State
    let currentIndex = 0;
    let userAnswers = {}; // { [qIdx]: 'A' | 'B' | 'C' | 'D' }
    let reviewStatus = {}; // { [qIdx]: boolean }
    let visited = { 0: true };
    let timeRemaining = DURATION_SECONDS;
    let timerInterval = null;
    let isSubmitted = false;
    let currentLang = 'bilingual'; // 'bilingual' | 'en' | 'hi'
    let currentReviewFilter = 'all';

    // Unique storage key for saving attempt progress
    const STORAGE_KEY = 'the_pundits_test_${escapeHtml(converted.title || 'exam').replace(/[^a-zA-Z0-9]/g, '_')}';

    function init() {
      // Group sections
      setupSections();
      setupPalette();
      loadSavedState();
      startTimer();
      renderCurrentQuestion();
    }

    function setupSections() {
      const sectionsMap = {};
      QUESTIONS.forEach((q, idx) => {
        const sec = q.section || 'General Section';
        if (!sectionsMap[sec]) sectionsMap[sec] = [];
        sectionsMap[sec].push(idx);
      });

      const listEl = document.getElementById('sectionsList');
      listEl.innerHTML = '';
      Object.keys(sectionsMap).forEach((secName, sIdx) => {
        const btn = document.createElement('button');
        btn.className = 'sec-tab-btn ' + (sIdx === 0 ? 'active' : '');
        btn.id = 'secTab_' + sIdx;
        btn.onclick = () => jumpToQuestion(sectionsMap[secName][0]);
        btn.innerHTML = '<span>' + secName + '</span><span class="sec-badge-count">' + sectionsMap[secName].length + '</span>';
        listEl.appendChild(btn);
      });
    }

    function setupPalette() {
      const grid = document.getElementById('paletteGrid');
      grid.innerHTML = '';
      for (let i = 0; i < TOTAL_QS; i++) {
        const btn = document.createElement('button');
        btn.className = 'q-pal-btn pal-badge not-vis';
        btn.id = 'palBtn_' + i;
        btn.innerText = (i + 1);
        btn.onclick = () => jumpToQuestion(i);
        grid.appendChild(btn);
      }
    }

    function startTimer() {
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          autoSubmitTest();
          return;
        }
        timeRemaining--;
        updateTimerDisplay();
      }, 1000);
      updateTimerDisplay();
    }

    function updateTimerDisplay() {
      const hrs = Math.floor(timeRemaining / 3600);
      const mins = Math.floor((timeRemaining % 3600) / 60);
      const secs = timeRemaining % 60;
      const str = (hrs < 10 ? '0' : '') + hrs + ':' + (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
      const el = document.getElementById('timerDisplay');
      if (el) el.innerText = str;
      const badge = document.getElementById('timerBadge');
      if (badge && timeRemaining < 300) {
        badge.classList.add('danger');
      }
    }

    function renderCurrentQuestion() {
      if (isSubmitted) return;
      visited[currentIndex] = true;
      const q = QUESTIONS[currentIndex];

      // Update question header
      document.getElementById('qNumTitle').innerText = 'Question No. ' + (currentIndex + 1) + ' of ' + TOTAL_QS;
      document.getElementById('activeSecBadge').innerText = 'Section: ' + (q.section || 'General');

      const bodyArea = document.getElementById('qBodyArea');
      let html = '';

      // 1. Comprehension / Direction / Passage
      const compEn = q.comprehensionEn || '';
      const compHi = q.comprehensionHi || '';
      if (compEn || compHi) {
        html += '<div class="passage-card">';
        html += '<div class="passage-title">📖 [Direction / Comprehension / निर्देश]</div>';
        if (currentLang === 'hi' && compHi) {
          html += formatStatementText(compHi);
        } else if (currentLang === 'en' && compEn) {
          html += formatStatementText(compEn);
        } else {
          html += '<div>' + formatStatementText(compEn || compHi) + '</div>';
          if (compHi && compHi !== compEn) {
            html += '<div style="margin-top:8px; padding-top:6px; border-top:1px dashed #bbf7d0; color:#166534;">' + formatStatementText(compHi) + '</div>';
          }
        }
        html += '</div>';
      }

      // 2. Question Stem
      const qEn = q.questionEn || '';
      const qHi = q.questionHi || '';
      html += '<div class="question-stem">';
      if (currentLang === 'hi' && qHi) {
        html += formatStatementText(qHi);
      } else if (currentLang === 'en' && qEn) {
        html += formatStatementText(qEn);
      } else {
        html += formatStatementText(qEn);
        if (qHi && qHi !== qEn) {
          html += '<div class="question-stem-hi">' + formatStatementText(qHi) + '</div>';
        }
      }
      html += '</div>';

      // 3. Question Image / Figure
      const imgUrl = q.imageUrl || extractImageUrl(qEn);
      if (imgUrl) {
        html += '<div class="question-image-wrap">';
        html += '<img src="' + imgUrl + '" class="question-img" alt="Question Figure" onclick="openLightbox(\\'' + imgUrl + '\\')" onerror="handleImageError(this)" />';
        html += '<span class="zoom-hint">🔍 Click image to zoom / enlarge</span>';
        html += '</div>';
      }

      // 4. Options A, B, C, D
      const selected = userAnswers[currentIndex];
      html += '<div class="options-grid">';
      const letters = ['A', 'B', 'C', 'D'];
      letters.forEach((let, optIdx) => {
        const optEn = (q.optionsEn && q.optionsEn[optIdx]) ? q.optionsEn[optIdx] : '';
        const optHi = (q.optionsHi && q.optionsHi[optIdx]) ? q.optionsHi[optIdx] : '';
        const isSel = selected === let;

        html += '<div class="option-card ' + (isSel ? 'selected' : '') + '" onclick="selectOption(\\'' + let + '\\')">';
        html += '<div class="opt-letter">' + let + '</div>';
        html += '<div class="opt-text">';
        if (currentLang === 'hi' && optHi) {
          html += formatStatementText(optHi);
        } else if (currentLang === 'en' && optEn) {
          html += formatStatementText(optEn);
        } else {
          html += formatStatementText(optEn);
          if (optHi && optHi !== optEn) {
            html += '<div class="opt-text-hi">' + formatStatementText(optHi) + '</div>';
          }
        }
        html += '</div></div>';
      });
      html += '</div>';

      bodyArea.innerHTML = html;

      // Update palette buttons & section active highlight
      updatePaletteUI();
      saveState();

      // Trigger MathJax re-render for formulas
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([bodyArea]).catch(() => {});
      }
    }

    // Helper: Formats multi-statement questions cleanly
    function formatStatementText(str) {
      if (!str) return '';
      let s = str;
      // Convert Statement I: / Statement 1: into structured badges
      s = s.replace(/(?:^|\\n)(Statement\\s*(?:[I|V|X]+|\\d+)\\s*:?)/gi, '<div class="statement-box"><span class="statement-badge">$1</span><span>');
      s = s.replace(/(?:^|\\n)(Assertion\\s*\\([A-Z]\\)\\s*:?)/gi, '<div class="statement-box"><span class="statement-badge" style="background:#fef3c7; color:#92400e;">$1</span><span>');
      s = s.replace(/(?:^|\\n)(Reason\\s*\\([A-Z]\\)\\s*:?)/gi, '<div class="statement-box"><span class="statement-badge" style="background:#fee2e2; color:#991b1b;">$1</span><span>');
      s = s.replace(/\\n/g, '<br/>');
      return s;
    }

    function extractImageUrl(text) {
      if (!text) return null;
      const m = text.match(/\\[(?:Figure|Image):\\s*([^\\]]+)\\]/i);
      return m ? m[1].trim() : null;
    }

    function handleImageError(img) {
      img.onerror = null;
      img.parentElement.innerHTML = '<div style="padding:10px; border:1px dashed #cbd5e1; border-radius:8px; font-size:11px; color:#64748b;">[Figure diagram loading - click to view original CDN link: <a href="' + img.src + '" target="_blank" style="color:#d97706; text-decoration:underline;">View Image</a>]</div>';
    }

    function selectOption(letter) {
      userAnswers[currentIndex] = letter;
      renderCurrentQuestion();
    }

    function clearResponse() {
      delete userAnswers[currentIndex];
      renderCurrentQuestion();
    }

    function saveAndNext() {
      if (currentIndex < TOTAL_QS - 1) {
        currentIndex++;
        renderCurrentQuestion();
      } else {
        alert('You have reached the last question. Click "Submit Test" when done.');
      }
    }

    function markForReviewAndNext() {
      reviewStatus[currentIndex] = true;
      if (currentIndex < TOTAL_QS - 1) {
        currentIndex++;
      }
      renderCurrentQuestion();
    }

    function prevQuestion() {
      if (currentIndex > 0) {
        currentIndex--;
        renderCurrentQuestion();
      }
    }

    function jumpToQuestion(idx) {
      if (idx >= 0 && idx < TOTAL_QS) {
        currentIndex = idx;
        renderCurrentQuestion();
      }
    }

    function setLanguageMode(mode) {
      currentLang = mode;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      if (mode === 'bilingual') document.getElementById('btnLangBilingual').classList.add('active');
      if (mode === 'en') document.getElementById('btnLangEn').classList.add('active');
      if (mode === 'hi') document.getElementById('btnLangHi').classList.add('active');
      renderCurrentQuestion();
    }

    function updatePaletteUI() {
      for (let i = 0; i < TOTAL_QS; i++) {
        const btn = document.getElementById('palBtn_' + i);
        if (!btn) continue;

        btn.className = 'q-pal-btn ';
        if (i === currentIndex) btn.className += 'current ';

        const isAnswered = !!userAnswers[i];
        const isReview = !!reviewStatus[i];
        const isVis = !!visited[i];

        if (isAnswered && isReview) {
          btn.className += 'pal-badge ans-rev';
        } else if (isReview) {
          btn.className += 'pal-badge rev';
        } else if (isAnswered) {
          btn.className += 'pal-badge ans';
        } else if (isVis) {
          btn.className += 'pal-badge not-ans';
        } else {
          btn.className += 'pal-badge not-vis';
        }
      }

      // Update section tab active states
      const curSec = QUESTIONS[currentIndex]?.section;
      document.querySelectorAll('.sec-tab-btn').forEach(btn => {
        if (btn.innerText.includes(curSec)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    function promptSubmitTest() {
      const answeredCount = Object.keys(userAnswers).length;
      const unattempted = TOTAL_QS - answeredCount;
      const reviewCount = Object.keys(reviewStatus).length;

      const msg = 'Are you sure you want to SUBMIT this test?\\n\\n' +
        '• Total Questions: ' + TOTAL_QS + '\\n' +
        '• Attempted: ' + answeredCount + '\\n' +
        '• Unattempted: ' + unattempted + '\\n' +
        '• Marked for Review: ' + reviewCount + '\\n\\n' +
        'Click OK to calculate your complete score & open the Analysis Dashboard!';

      if (confirm(msg)) {
        finishAndAnalyzeTest();
      }
    }

    function autoSubmitTest() {
      alert('Time is up! Your test is automatically being submitted now.');
      finishAndAnalyzeTest();
    }

    function finishAndAnalyzeTest() {
      isSubmitted = true;
      if (timerInterval) clearInterval(timerInterval);

      // Hide test canvas & sections bar
      document.getElementById('testCanvas').style.display = 'none';
      document.getElementById('sectionsBar').style.display = 'none';
      document.getElementById('analysisContainer').classList.add('active');

      // Calculate Metrics
      let correctCount = 0;
      let incorrectCount = 0;
      let skippedCount = 0;
      const sectionStats = {};

      QUESTIONS.forEach((q, idx) => {
        const sec = q.section || 'General Section';
        if (!sectionStats[sec]) {
          sectionStats[sec] = { total: 0, attempted: 0, correct: 0, incorrect: 0, score: 0 };
        }
        sectionStats[sec].total++;

        const userAns = userAnswers[idx];
        const correctAns = q.correctOptionLetter || 'A';

        if (!userAns) {
          skippedCount++;
        } else if (userAns === correctAns) {
          correctCount++;
          sectionStats[sec].attempted++;
          sectionStats[sec].correct++;
          sectionStats[sec].score += POS_MARKS;
        } else {
          incorrectCount++;
          sectionStats[sec].attempted++;
          sectionStats[sec].incorrect++;
          sectionStats[sec].score -= NEG_MARKS;
        }
      });

      const totalScore = (correctCount * POS_MARKS) - (incorrectCount * NEG_MARKS);
      const attemptedCount = correctCount + incorrectCount;
      const accuracy = attemptedCount > 0 ? ((correctCount / attemptedCount) * 100).toFixed(1) : '0';

      // Update Hero Metrics
      document.getElementById('statFinalScore').innerText = totalScore.toFixed(1);
      document.getElementById('statAccuracy').innerText = accuracy + '%';
      document.getElementById('statCorrect').innerText = correctCount;
      document.getElementById('statIncorrect').innerText = incorrectCount;
      document.getElementById('statSkipped').innerText = skippedCount;

      // Populate Section Stats Table
      const tbody = document.getElementById('sectionStatsTbody');
      tbody.innerHTML = '';
      Object.keys(sectionStats).forEach(secName => {
        const s = sectionStats[secName];
        const secAcc = s.attempted > 0 ? ((s.correct / s.attempted) * 100).toFixed(1) + '%' : '0%';
        const tr = document.createElement('tr');
        tr.innerHTML = '<td><strong>' + secName + '</strong></td>' +
          '<td>' + s.total + '</td>' +
          '<td>' + s.attempted + '</td>' +
          '<td style="color:#059669; font-weight:800;">' + s.correct + '</td>' +
          '<td style="color:#dc2626; font-weight:800;">' + s.incorrect + '</td>' +
          '<td><strong>' + s.score.toFixed(1) + '</strong></td>' +
          '<td>' + secAcc + '</td>';
        tbody.appendChild(tr);
      });

      renderSolutionsList('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderSolutionsList(filter) {
      currentReviewFilter = filter;
      const listEl = document.getElementById('solutionsReviewList');
      listEl.innerHTML = '';

      let renderedCount = 0;

      QUESTIONS.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const correctAns = q.correctOptionLetter || 'A';
        const isCorrect = userAns === correctAns;
        const isSkipped = !userAns;

        if (filter === 'correct' && !isCorrect) return;
        if (filter === 'incorrect' && (isCorrect || isSkipped)) return;
        if (filter === 'skipped' && !isSkipped) return;

        renderedCount++;
        const cardClass = isCorrect ? 'correct' : (isSkipped ? 'skipped' : 'incorrect');
        const statusLabel = isCorrect ? '✓ Correct (+' + POS_MARKS + ' Marks)' : (isSkipped ? '⭕ Skipped (0 Marks)' : '❌ Incorrect (-' + NEG_MARKS + ' Mark)');

        let cardHtml = '<div class="solution-card ' + cardClass + '">';
        cardHtml += '<div class="sol-header">';
        cardHtml += '<div><strong style="font-size:13px;">Question #' + (idx + 1) + '</strong> <span style="color:#64748b; font-size:11px; margin-left:6px;">' + (q.section || '') + '</span></div>';
        cardHtml += '<span class="sol-badge-status ' + cardClass + '">' + statusLabel + '</span>';
        cardHtml += '</div>';

        // Comprehension if any
        if (q.comprehensionEn || q.comprehensionHi) {
          cardHtml += '<div class="passage-card" style="margin-bottom:12px;">' + formatStatementText(q.comprehensionEn || q.comprehensionHi) + '</div>';
        }

        // Stem
        cardHtml += '<div style="font-size:14px; font-weight:600; margin-bottom:10px;">' + formatStatementText(q.questionEn || q.questionHi) + '</div>';
        if (q.questionHi && q.questionHi !== q.questionEn) {
          cardHtml += '<div style="font-size:13px; color:#475569; margin-bottom:10px;">' + formatStatementText(q.questionHi) + '</div>';
        }

        // Image if any
        const imgUrl = q.imageUrl || extractImageUrl(q.questionEn);
        if (imgUrl) {
          cardHtml += '<div style="margin:10px 0;"><img src="' + imgUrl + '" style="max-height:220px; border-radius:8px; border:1px solid #cbd5e1;" onclick="openLightbox(\\'' + imgUrl + '\\')" /></div>';
        }

        // Options review
        cardHtml += '<div style="margin:12px 0; display:flex; flex-direction:column; gap:6px;">';
        const letters = ['A', 'B', 'C', 'D'];
        letters.forEach((let, optIdx) => {
          const optText = (q.optionsEn && q.optionsEn[optIdx]) ? q.optionsEn[optIdx] : '';
          const isThisCorrect = let === correctAns;
          const isThisUser = let === userAns;

          let optStyle = 'padding:8px 12px; border-radius:8px; font-size:12.5px; display:flex; align-items:center; gap:8px; border:1px solid #e2e8f0;';
          let letBadge = '<span style="font-weight:800; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#f1f5f9; font-size:11px;">' + let + '</span>';

          if (isThisCorrect) {
            optStyle += ' background:#ecfdf5; border-color:#10b981; color:#065f46; font-weight:700;';
            letBadge = '<span style="font-weight:800; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#10b981; color:#fff; font-size:11px;">✓</span>';
          } else if (isThisUser) {
            optStyle += ' background:#fef2f2; border-color:#ef4444; color:#991b1b; font-weight:700;';
            letBadge = '<span style="font-weight:800; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:#ef4444; color:#fff; font-size:11px;">✗</span>';
          }

          cardHtml += '<div style="' + optStyle + '">';
          cardHtml += letBadge;
          cardHtml += '<span>' + formatStatementText(optText) + '</span>';
          if (isThisCorrect) cardHtml += '<span style="margin-left:auto; font-size:11px; font-weight:800; color:#059669;">[Correct Key]</span>';
          if (isThisUser && !isThisCorrect) cardHtml += '<span style="margin-left:auto; font-size:11px; font-weight:800; color:#dc2626;">[Your Answer]</span>';
          cardHtml += '</div>';
        });
        cardHtml += '</div>';

        // Detailed Explanation
        const exEn = q.explanationEn || '';
        const exHi = q.explanationHi || '';
        if (exEn || exHi) {
          cardHtml += '<div class="explanation-box">';
          cardHtml += '<div class="explanation-box-title">💡 Detailed Step-by-Step Explanation & Formula (Ex:)</div>';
          if (exEn) cardHtml += '<div>' + formatStatementText(exEn) + '</div>';
          if (exHi && exHi !== exEn) cardHtml += '<div style="margin-top:8px; padding-top:6px; border-top:1px dashed #cbd5e1; color:#334155;"><strong>हिन्दी समाधान:</strong><br/>' + formatStatementText(exHi) + '</div>';
          cardHtml += '</div>';
        }

        cardHtml += '</div>';
        listEl.innerHTML += cardHtml;
      });

      if (renderedCount === 0) {
        listEl.innerHTML = '<div style="padding:40px; text-align:center; color:#64748b; font-size:13px; font-weight:600;">No questions found under this filter.</div>';
      }

      // Re-typeset MathJax in review cards
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([listEl]).catch(() => {});
      }
    }

    function filterReview(type) {
      document.querySelectorAll('.review-filter-btn').forEach(btn => {
        if (btn.innerText.toLowerCase().includes(type)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      renderSolutionsList(type);
    }

    function reattemptTest() {
      if (confirm('Do you want to clear your current attempt and re-start this mock test from question 1?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      }
    }

    function openLightbox(url) {
      document.getElementById('lightboxImg').src = url;
      document.getElementById('lightboxModal').classList.add('active');
    }

    function closeLightbox() {
      document.getElementById('lightboxModal').classList.remove('active');
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          userAnswers,
          reviewStatus,
          visited,
          currentIndex,
          timeRemaining
        }));
      } catch (e) {}
    }

    function loadSavedState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (d.userAnswers) userAnswers = d.userAnswers;
        if (d.reviewStatus) reviewStatus = d.reviewStatus;
        if (d.visited) visited = d.visited;
        if (typeof d.currentIndex === 'number') currentIndex = d.currentIndex;
        if (typeof d.timeRemaining === 'number') timeRemaining = d.timeRemaining;
      } catch (e) {}
    }

    // Keyboard navigation: 1,2,3,4 for Options, N for Next, P for Prev
    window.addEventListener('keydown', (e) => {
      if (isSubmitted) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === '1') selectOption('A');
      else if (e.key === '2') selectOption('B');
      else if (e.key === '3') selectOption('C');
      else if (e.key === '4') selectOption('D');
      else if (e.key === 'ArrowRight' || e.key === 'n' || e.key === 'N') saveAndNext();
      else if (e.key === 'ArrowLeft' || e.key === 'p' || e.key === 'P') prevQuestion();
    });

    window.onload = init;
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Direct browser trigger to download standalone interactive .html test
 */
export function downloadPunditsInteractiveHtml(
  converted: PunditsConvertedResult,
  testTitle?: string,
  meta?: PunditsHtmlMeta
): void {
  const htmlContent = generatePunditsInteractiveHtml(converted, meta);
  const rawName = (testTitle || converted.title || 'The_Pundits_Interactive_Test').trim();
  // Safe filename preserving original test name
  const safeFileName = rawName.replace(/[/\\?%*:|"<>]/g, '_').trim() + '.html';

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
