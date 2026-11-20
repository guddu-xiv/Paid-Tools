import { jsPDF } from 'jspdf';
import { cleanMathAndText, ExamDocumentMeta, ParsedQuestion } from './txtParser';
import { LanguageModeId } from './translator';

export const DEFAULT_WATERMARK_LOGO_URL =
  'https://i.ibb.co/Gh748sC/file-0000000055648211ac80a7ed7a37f3fb.png';

export const DEFAULT_BRAND_CIRCLE_LOGO_URL =
  'https://i.ibb.co/0gXKZyd/Whats-App-Image-2026-09-25-at-3-21-53-PM.jpg';

export type PdfFontFamilyId =
  | 'theme-default'
  | 'noto-devanagari-book'
  | 'outfit-anek'
  | 'poppins-hind'
  | 'merriweather-tiro'
  | 'space-grotesk'
  | 'playfair-sahitya'
  | 'jetbrains-gotu'
  | 'jakarta-khand'
  | 'crimson-martel'
  | 'lexend-baloo'
  | 'rajdhani-teko';

export interface PdfFontOption {
  id: PdfFontFamilyId;
  name: string;
  hindiSample: string;
  tag: string;
  fontStack: string;
}

const REGIONAL_MATH_FALLBACK =
  "'Noto Sans Math', 'Noto Sans Oriya', 'Noto Sans Gurmukhi', 'Noto Sans Bengali', 'Noto Sans Ol Chiki', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Gujarati', 'Noto Sans Kannada', 'Noto Sans Malayalam', 'Noto Sans Arabic', 'Cambria Math', 'STIX Two Math', sans-serif";

export const PDF_FONT_FAMILIES: PdfFontOption[] = [
  {
    id: 'theme-default',
    name: 'Format Signature Font (Auto)',
    hindiSample: 'ऑटो फ़ॉन्ट',
    tag: 'Auto Match',
    fontStack: `'Outfit', 'Anek Devanagari', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'noto-devanagari-book',
    name: 'Noto Sans Devanagari (Hindi Book)',
    hindiSample: 'संविधान की प्रमुख विशेषताएं',
    tag: 'Hindi Book',
    fontStack: `'Noto Sans Devanagari', 'Anek Devanagari', 'Mukta', 'Hind', 'Poppins', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'outfit-anek',
    name: 'Outfit + Anek Devanagari',
    hindiSample: 'आधुनिक क्लीन',
    tag: 'Geometric Sans',
    fontStack: `'Outfit', 'Anek Devanagari', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'poppins-hind',
    name: 'Poppins + Hind',
    hindiSample: 'कोचिंग प्रिंट प्रो',
    tag: 'Coaching Print',
    fontStack: `'Poppins', 'Hind', 'Anek Devanagari', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'merriweather-tiro',
    name: 'Merriweather + Tiro Serif',
    hindiSample: 'यूपीएससी बुक सेरिफ़',
    tag: 'Editorial Serif',
    fontStack: `'Merriweather', 'Tiro Devanagari Hindi', 'Sahitya', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk + Mukta',
    hindiSample: 'नियो-ब्रूटलिस्ट',
    tag: 'Tech Display',
    fontStack: `'Space Grotesk', 'Mukta', 'Anek Devanagari', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'playfair-sahitya',
    name: 'Playfair + Sahitya Royal',
    hindiSample: 'रॉयल मैगज़ीन',
    tag: 'Luxury Serif',
    fontStack: `'Playfair Display', 'Sahitya', 'Tiro Devanagari Hindi', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'jetbrains-gotu',
    name: 'JetBrains Mono + Gotu',
    hindiSample: 'टर्मिनल मोनो',
    tag: 'Code Mono',
    fontStack: `'JetBrains Mono', 'Gotu', 'IBM Plex Mono', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'jakarta-khand',
    name: 'Plus Jakarta + Khand',
    hindiSample: 'स्विस शार्प',
    tag: 'Swiss Sans',
    fontStack: `'Plus Jakarta Sans', 'Khand', 'Mukta', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'crimson-martel',
    name: 'Crimson Pro + Martel',
    hindiSample: 'अकादमिक जर्नल',
    tag: 'Oxford Serif',
    fontStack: `'Crimson Pro', 'Martel', 'Tiro Devanagari Hindi', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'lexend-baloo',
    name: 'Lexend + Baloo 2',
    hindiSample: 'स्पीड रीडिंग बोल्ड',
    tag: 'Rounded Read',
    fontStack: `'Lexend', 'Baloo 2', 'Anek Devanagari', ${REGIONAL_MATH_FALLBACK}`,
  },
  {
    id: 'rajdhani-teko',
    name: 'Rajdhani + Teko Power',
    hindiSample: 'पावर टेस्ट सीरीज़',
    tag: 'Power Display',
    fontStack: `'Rajdhani', 'Khand', 'Teko', ${REGIONAL_MATH_FALLBACK}`,
  },
];

export type PdfDesignThemeId =
  | 'classic-emerald'
  | 'coaching-print-pro'
  | 'vintage-parchment'
  | 'neo-brutalist-pop'
  | 'khatarnak-dark'
  | 'royal-vip'
  | 'modern-editorial'
  | 'aesthetic-pastel'
  | 'oxford-academic'
  | 'khatarnak-inferno'
  | 'topper-notebook'
  | 'aesthetic-lavender'
  | 'modern-grid-box'
  | 'minimalist-swiss'
  | 'minimalist-nordic'
  | 'khatarnak-matrix';

export type PdfHeaderFooterStyle =
  | 'minimal-clean'
  | 'edge-dashed-tabs'
  | 'solid-coaching-bar'
  | 'floating-stadium-pill'
  | 'gazette-double-rule'
  | 'neo-brutalist-bar'
  | 'cyber-hud-angled'
  | 'royal-ornate-ribbon'
  | 'slanted-power-bar'
  | 'register-top-stamp'
  | 'swiss-grid-header'
  | 'topper-notebook-rule'
  | 'badge-accent-capsule'
  | 'underlined-gradient'
  | 'bracket-frame';

export interface HeaderFooterStyleOption {
  id: PdfHeaderFooterStyle;
  name: string;
  category: 'Clean' | 'Coaching' | 'Modern' | 'Academic' | 'Tech' | 'Royal';
  hindiTag: string;
  description: string;
  iconTag: string;
  previewColor: string;
}

export const PDF_HEADER_FOOTER_STYLES: HeaderFooterStyleOption[] = [
  {
    id: 'minimal-clean',
    name: 'Minimal Clean (Mast Simple)',
    category: 'Clean',
    hindiTag: 'मस्त सिंपल • नो बॉर्डर नो बॉक्स',
    description: '100% borderless & shapeless pure colorful typography, colored brand text & globe icon',
    iconTag: '✨',
    previewColor: '#059669',
  },
  {
    id: 'solid-coaching-bar',
    name: 'Coaching Ribbon Bar',
    category: 'Coaching',
    hindiTag: 'कोचिंग टेस्ट सीरीज़ रिबन',
    description: 'Full-span solid color banner ribbon with white typography, exam badge & social buttons',
    iconTag: '🏷️',
    previewColor: '#1e3a8a',
  },
  {
    id: 'floating-stadium-pill',
    name: 'Floating Stadium Pills',
    category: 'Modern',
    hindiTag: 'फ्लोटिंग कैप्सूल पिल्स',
    description: 'Rounded stadium capsules on left, center and right with soft background highlights',
    iconTag: '💊',
    previewColor: '#0891b2',
  },
  {
    id: 'edge-dashed-tabs',
    name: 'Classic Dashed Tabs',
    category: 'Academic',
    hindiTag: 'क्लासिक डैश्ड टैब्स',
    description: 'Curved tab shape containers with stylish dashed outline borders and two-tone branding',
    iconTag: '📑',
    previewColor: '#047857',
  },
  {
    id: 'gazette-double-rule',
    name: 'Gazette Academic Double Rule',
    category: 'Academic',
    hindiTag: 'गज़ट डबल हेयरलाइन',
    description: 'Double hairline rules across width with center star emblem [ ✦ HANDBOOK ✦ ]',
    iconTag: '📜',
    previewColor: '#78350f',
  },
  {
    id: 'neo-brutalist-bar',
    name: 'Neo-Brutalist Pop Block',
    category: 'Modern',
    hindiTag: 'नियो-ब्रूटलिस्ट बोल्ड ब्लॉक',
    description: 'High-contrast bold black border with 2px solid drop shadow & neon yellow rapid badges',
    iconTag: '⚡',
    previewColor: '#eab308',
  },
  {
    id: 'cyber-hud-angled',
    name: 'Cyber HUD Tech Angle',
    category: 'Tech',
    hindiTag: 'साइबर टेक 45° कट',
    description: 'Futuristic 45° angled chamfer cuts, tech crosshair brackets and terminal status look',
    iconTag: '👾',
    previewColor: '#10b981',
  },
  {
    id: 'royal-ornate-ribbon',
    name: 'Royal Ornate Flourish',
    category: 'Royal',
    hindiTag: 'रॉयल गोल्ड फ्लोरीश',
    description: 'Luxury topper crest with diamond separators [ ❖ TOPPER ❖ ] and deep royal tones',
    iconTag: '👑',
    previewColor: '#d97706',
  },
  {
    id: 'slanted-power-bar',
    name: 'Slanted Power Stripe',
    category: 'Coaching',
    hindiTag: 'स्लैंटेड स्पीड स्ट्राइप',
    description: 'Dynamic 20° angled speed stripes [ /// ] with high-energy competitive exam styling',
    iconTag: '🚀',
    previewColor: '#dc2626',
  },
  {
    id: 'register-top-stamp',
    name: 'Official Docket Stamp',
    category: 'Academic',
    hindiTag: 'रजिस्टर ऑफिशियल स्टाम्प',
    description: 'Archival double-ruled ledger box with official verified study material seal stamp',
    iconTag: '🛡️',
    previewColor: '#991b1b',
  },
  {
    id: 'swiss-grid-header',
    name: 'Swiss Architectural Grid',
    category: 'Clean',
    hindiTag: 'स्विस मिनिमल ग्रिड',
    description: 'Ultra-refined micro hairline rules, uppercase tracking and minimalist ratio dots',
    iconTag: '📐',
    previewColor: '#475569',
  },
  {
    id: 'topper-notebook-rule',
    name: 'Topper Notebook Margin',
    category: 'Academic',
    hindiTag: 'रजिस्टर्ड नोटबुक मार्जिन',
    description: 'Classic student register red double-rule margin with DATE & PAGE docket stamp',
    iconTag: '📓',
    previewColor: '#ef4444',
  },
  {
    id: 'badge-accent-capsule',
    name: 'Twin Badge Accent Pills',
    category: 'Modern',
    hindiTag: 'ट्विन बैज कैप्सूल',
    description: 'Compact independent colored pill badges with high contrast icon integration',
    iconTag: '🏷️',
    previewColor: '#8b5cf6',
  },
  {
    id: 'underlined-gradient',
    name: 'Modern Accent Underline',
    category: 'Modern',
    hindiTag: 'मॉडर्न एक्सेंट लाइन',
    description: 'Minimalist layout with a vivid horizontal accent bar spanning across the margin',
    iconTag: '➖',
    previewColor: '#6366f1',
  },
  {
    id: 'bracket-frame',
    name: 'Precision Tech Brackets',
    category: 'Tech',
    hindiTag: 'प्रिसिजन ब्रैकेट फ्रेम',
    description: 'Minimalist tech corner brackets [ BRAND ] and [ DOMAIN ] with sharp geometric feel',
    iconTag: '⟦⟧',
    previewColor: '#06b6d4',
  },
];

export type PdfQBadgeStyle =
  | 'plain'
  | 'solid-pill'
  | 'outlined-box'
  | 'circle-badge'
  | 'left-bracket'
  | 'brutalist-box'
  | 'slanted-tag'
  | 'double-ring';

export type PdfOptionStyle =
  | 'omr-circle'
  | 'solid-circle'
  | 'square-keycap'
  | 'pill-tag'
  | 'brutalist-chip'
  | 'row-strip'
  | 'clean-bold';

export type PdfAnsBoxStyle =
  | 'inline-tint'
  | 'solid-badge'
  | 'solid-inverse-pill'
  | 'left-bar-box'
  | 'dashed-coupon'
  | 'double-underline'
  | 'brutalist-tag'
  | 'split-label-box'
  | 'glass-capsule'
  | 'pure-dash-line'
  | 'dashed-underline'
  | 'dash-flanked'
  | 'sharp-dashed-tag'
  | 'dashed-divider-full';

export type PdfExBoxStyle =
  | 'callout-card'
  | 'left-quote-stripe'
  | 'dashed-note-box'
  | 'brutalist-note'
  | 'top-rule-editorial'
  | 'cyber-hud-note'
  | 'clean-badge';

export type PdfBlockCardStyle =
  | 'open'
  | 'soft-card'
  | 'bordered-card'
  | 'top-header-card'
  | 'neo-brutalist'
  | 'left-stripe'
  | 'corner-brackets'
  | 'double-royal-card'
  | 'ticket-notched-card'
  | 'notebook-ruled';

export interface PdfDesignTheme {
  id: PdfDesignThemeId;
  formatNumber: number;
  name: string;
  category: 'Classic' | 'Aesthetic' | 'Modern' | 'Minimalist' | 'Khatarnak' | 'Royal' | 'Vintage';
  tagline: string;
  defaultFontId: Exclude<PdfFontFamilyId, 'theme-default'>;
  fontLabel: string;
  layoutBadgeLabel: string;
  headerFooterStyle: PdfHeaderFooterStyle;
  qBadgeStyle?: PdfQBadgeStyle;
  optionStyle?: PdfOptionStyle;
  ansBoxStyle?: PdfAnsBoxStyle;
  exBoxStyle?: PdfExBoxStyle;
  blockStyle?: PdfBlockCardStyle;
  pageTexture?: 'none' | 'dot-grid' | 'notebook-lines' | 'blueprint-grid' | 'double-frame' | 'royal-corners';
  isDark?: boolean;
  pageBgColor: string;
  pageFrame?: 'none' | 'single' | 'double' | 'cyber' | 'royal';
  pageFrameColor?: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
  headerMetaColor: string;
  qPrimaryColor: string;
  qSecondaryColor: string;
  optionColor: string;
  ansColor: string;
  ansHighlightBg?: string;
  exPrimaryColor: string;
  exSecondaryColor: string;
  exBgColor?: string;
  dividerColor: string;
  dividerStyle: 'dashed' | 'solid' | 'dotted' | 'double';
  chapterBgColor: string;
  chapterBorderColor: string;
  chapterTextColor: string;
  blockCardBg?: string;
  blockCardBorder?: string;
  blockLeftBarColor?: string;
  footerTextColor: string;
}

export const PDF_DESIGN_FORMATS: PdfDesignTheme[] = [
  {
    id: 'classic-emerald',
    formatNumber: 1,
    name: 'Classic Emerald',
    category: 'Classic',
    tagline: 'Crisp white sheet, OMR circle options, split answer box & callout explanations',
    defaultFontId: 'outfit-anek',
    fontLabel: 'Outfit + Anek',
    layoutBadgeLabel: 'OMR Circle • Split Ans • Callout Ex',
    headerFooterStyle: 'edge-dashed-tabs',
    qBadgeStyle: 'solid-pill',
    optionStyle: 'omr-circle',
    ansBoxStyle: 'split-label-box',
    exBoxStyle: 'callout-card',
    blockStyle: 'open',
    pageTexture: 'none',
    pageBgColor: '#ffffff',
    pageFrame: 'none',
    brandPrimaryColor: '#0f172a',
    brandAccentColor: '#047857',
    headerMetaColor: '#334155',
    qPrimaryColor: '#0f172a',
    qSecondaryColor: '#1e293b',
    optionColor: '#1e293b',
    ansColor: '#047857',
    ansHighlightBg: 'rgba(209, 250, 229, 0.72)',
    exPrimaryColor: '#065f46',
    exSecondaryColor: '#334155',
    exBgColor: 'rgba(236, 253, 245, 0.78)',
    dividerColor: '#94a3b8',
    dividerStyle: 'dashed',
    chapterBgColor: 'rgba(236, 253, 245, 0.92)',
    chapterBorderColor: '#a7f3d0',
    chapterTextColor: '#065f46',
    footerTextColor: '#0f172a',
  },
  {
    id: 'coaching-print-pro',
    formatNumber: 2,
    name: 'Coaching Test Series Pro',
    category: 'Classic',
    tagline: 'Top-header coaching cards, solid circle options, inverse answer pill & quote ex',
    defaultFontId: 'poppins-hind',
    fontLabel: 'Poppins + Hind',
    layoutBadgeLabel: 'Top-Bar Card • Solid Opt • Pill Ans',
    headerFooterStyle: 'solid-coaching-bar',
    qBadgeStyle: 'solid-pill',
    optionStyle: 'solid-circle',
    ansBoxStyle: 'solid-inverse-pill',
    exBoxStyle: 'left-quote-stripe',
    blockStyle: 'top-header-card',
    pageTexture: 'none',
    pageBgColor: '#ffffff',
    pageFrame: 'none',
    brandPrimaryColor: '#0f172a',
    brandAccentColor: '#1d4ed8',
    headerMetaColor: '#334155',
    qPrimaryColor: '#0f172a',
    qSecondaryColor: '#1e293b',
    optionColor: '#1e293b',
    ansColor: '#15803d',
    ansHighlightBg: 'rgba(220, 252, 231, 0.78)',
    exPrimaryColor: '#1d4ed8',
    exSecondaryColor: '#334155',
    exBgColor: 'rgba(239, 246, 255, 0.82)',
    dividerColor: '#cbd5e1',
    dividerStyle: 'solid',
    chapterBgColor: 'rgba(239, 246, 255, 0.95)',
    chapterBorderColor: '#93c5fd',
    chapterTextColor: '#1e3a8a',
    blockCardBg: 'rgba(248, 250, 252, 0.75)',
    blockCardBorder: '#cbd5e1',
    footerTextColor: '#0f172a',
  },
  {
    id: 'vintage-parchment',
    formatNumber: 3,
    name: 'UPSC Newspaper Gazette',
    category: 'Vintage',
    tagline: 'Antique parchment, keycap options, double ink underline answers & editorial ex',
    defaultFontId: 'merriweather-tiro',
    fontLabel: 'Merriweather + Tiro Serif',
    layoutBadgeLabel: 'Gazette • Keycap Opt • Editorial Ex',
    headerFooterStyle: 'gazette-double-rule',
    qBadgeStyle: 'outlined-box',
    optionStyle: 'square-keycap',
    ansBoxStyle: 'double-underline',
    exBoxStyle: 'top-rule-editorial',
    blockStyle: 'open',
    pageTexture: 'double-frame',
    pageBgColor: '#f7f1e3',
    pageFrame: 'double',
    brandPrimaryColor: '#291507',
    brandAccentColor: '#9a3412',
    headerMetaColor: '#5c2d16',
    qPrimaryColor: '#291507',
    qSecondaryColor: '#431407',
    optionColor: '#431407',
    ansColor: '#9a3412',
    ansHighlightBg: 'rgba(254, 215, 170, 0.48)',
    exPrimaryColor: '#7c2d12',
    exSecondaryColor: '#431407',
    exBgColor: 'rgba(254, 243, 199, 0.55)',
    dividerColor: '#a8a29e',
    dividerStyle: 'double',
    chapterBgColor: 'rgba(254, 215, 170, 0.78)',
    chapterBorderColor: '#d97706',
    chapterTextColor: '#431407',
    footerTextColor: '#291507',
  },
  {
    id: 'neo-brutalist-pop',
    formatNumber: 4,
    name: 'Neo-Brutalist Hard Shadow',
    category: 'Modern',
    tagline: '3D hard-shadow pop cards, brutalist option chips, yellow tag answers & note box',
    defaultFontId: 'space-grotesk',
    fontLabel: 'Space Grotesk + Mukta',
    layoutBadgeLabel: '3D Shadow Card • Brutalist Opt & Ex',
    headerFooterStyle: 'neo-brutalist-bar',
    qBadgeStyle: 'brutalist-box',
    optionStyle: 'brutalist-chip',
    ansBoxStyle: 'brutalist-tag',
    exBoxStyle: 'brutalist-note',
    blockStyle: 'neo-brutalist',
    pageTexture: 'dot-grid',
    pageBgColor: '#fffbeb',
    pageFrame: 'none',
    brandPrimaryColor: '#09090b',
    brandAccentColor: '#ea580c',
    headerMetaColor: '#27272a',
    qPrimaryColor: '#09090b',
    qSecondaryColor: '#18181b',
    optionColor: '#18181b',
    ansColor: '#09090b',
    ansHighlightBg: '#fde047',
    exPrimaryColor: '#9a3412',
    exSecondaryColor: '#18181b',
    exBgColor: '#fef9c3',
    dividerColor: '#18181b',
    dividerStyle: 'solid',
    chapterBgColor: '#fef08a',
    chapterBorderColor: '#09090b',
    chapterTextColor: '#09090b',
    blockCardBg: '#ffffff',
    blockCardBorder: '#18181b',
    footerTextColor: '#09090b',
  },
  {
    id: 'khatarnak-dark',
    formatNumber: 5,
    name: 'Khatarnak Cyber Neon',
    category: 'Khatarnak',
    tagline: 'Dark HUD corner-bracket pods, neon option strips, HUD answer badge & terminal ex',
    defaultFontId: 'rajdhani-teko',
    fontLabel: 'Rajdhani + Khand',
    layoutBadgeLabel: 'Cyber HUD Pod • Row Opt • Terminal Ex',
    headerFooterStyle: 'cyber-hud-angled',
    qBadgeStyle: 'slanted-tag',
    optionStyle: 'row-strip',
    ansBoxStyle: 'solid-badge',
    exBoxStyle: 'cyber-hud-note',
    blockStyle: 'corner-brackets',
    pageTexture: 'blueprint-grid',
    isDark: true,
    pageBgColor: '#090d16',
    pageFrame: 'none',
    brandPrimaryColor: '#f8fafc',
    brandAccentColor: '#10b981',
    headerMetaColor: '#94a3b8',
    qPrimaryColor: '#f8fafc',
    qSecondaryColor: '#cbd5e1',
    optionColor: '#e2e8f0',
    ansColor: '#34d399',
    ansHighlightBg: 'rgba(6, 78, 59, 0.72)',
    exPrimaryColor: '#38bdf8',
    exSecondaryColor: '#cbd5e1',
    exBgColor: 'rgba(15, 23, 42, 0.88)',
    dividerColor: '#1e293b',
    dividerStyle: 'dashed',
    chapterBgColor: 'rgba(15, 23, 42, 0.95)',
    chapterBorderColor: '#10b981',
    chapterTextColor: '#34d399',
    blockCardBg: 'rgba(15, 23, 42, 0.68)',
    blockCardBorder: 'rgba(56, 189, 248, 0.28)',
    blockLeftBarColor: '#06b6d4',
    footerTextColor: '#f1f5f9',
  },
  {
    id: 'royal-vip',
    formatNumber: 6,
    name: 'Royal Navy & Gold Serif',
    category: 'Royal',
    tagline: 'Imperial double-gold cards, double-ring Q badges, OMR circles & royal callout ex',
    defaultFontId: 'playfair-sahitya',
    fontLabel: 'Playfair + Sahitya',
    layoutBadgeLabel: 'Double Royal Card • Ring Q • Gold Ans',
    headerFooterStyle: 'royal-ornate-ribbon',
    qBadgeStyle: 'double-ring',
    optionStyle: 'omr-circle',
    ansBoxStyle: 'glass-capsule',
    exBoxStyle: 'callout-card',
    blockStyle: 'double-royal-card',
    pageTexture: 'royal-corners',
    pageBgColor: '#fcfaf2',
    pageFrame: 'royal',
    brandPrimaryColor: '#1e1b4b',
    brandAccentColor: '#b45309',
    headerMetaColor: '#312e81',
    qPrimaryColor: '#1e1b4b',
    qSecondaryColor: '#1e293b',
    optionColor: '#1e293b',
    ansColor: '#b45309',
    ansHighlightBg: 'rgba(254, 243, 199, 0.88)',
    exPrimaryColor: '#1e3a8a',
    exSecondaryColor: '#334155',
    exBgColor: 'rgba(254, 249, 195, 0.65)',
    dividerColor: '#d97706',
    dividerStyle: 'double',
    chapterBgColor: 'rgba(254, 243, 199, 0.92)',
    chapterBorderColor: '#f59e0b',
    chapterTextColor: '#78350f',
    blockCardBg: 'rgba(255, 253, 245, 0.85)',
    blockCardBorder: '#d97706',
    blockLeftBarColor: '#d97706',
    footerTextColor: '#1e1b4b',
  },
  {
    id: 'modern-editorial',
    formatNumber: 7,
    name: 'Modern Editorial Indigo',
    category: 'Modern',
    tagline: 'Indigo stripe cards, square keycap options, left-bar answer box & quote stripe ex',
    defaultFontId: 'jakarta-khand',
    fontLabel: 'Plus Jakarta + Khand',
    layoutBadgeLabel: 'Left-Stripe • Keycap Opt • Bar Ans',
    headerFooterStyle: 'floating-stadium-pill',
    qBadgeStyle: 'outlined-box',
    optionStyle: 'square-keycap',
    ansBoxStyle: 'left-bar-box',
    exBoxStyle: 'left-quote-stripe',
    blockStyle: 'left-stripe',
    pageTexture: 'none',
    pageBgColor: '#ffffff',
    pageFrame: 'none',
    brandPrimaryColor: '#0f172a',
    brandAccentColor: '#4f46e5',
    headerMetaColor: '#475569',
    qPrimaryColor: '#0f172a',
    qSecondaryColor: '#334155',
    optionColor: '#1e293b',
    ansColor: '#4338ca',
    ansHighlightBg: 'rgba(238, 242, 255, 0.92)',
    exPrimaryColor: '#0369a1',
    exSecondaryColor: '#334155',
    exBgColor: 'rgba(240, 249, 255, 0.82)',
    dividerColor: '#cbd5e1',
    dividerStyle: 'solid',
    chapterBgColor: 'rgba(238, 242, 255, 0.95)',
    chapterBorderColor: '#c7d2fe',
    chapterTextColor: '#3730a3',
    blockLeftBarColor: '#4f46e5',
    footerTextColor: '#0f172a',
  },
  {
    id: 'aesthetic-pastel',
    formatNumber: 8,
    name: 'Aesthetic Cream & Sage',
    category: 'Aesthetic',
    tagline: 'Ticket-notched coupon cards, pill-tag options, dashed coupon answers & note ex',
    defaultFontId: 'lexend-baloo',
    fontLabel: 'Lexend + Baloo 2',
    layoutBadgeLabel: 'Ticket Card • Pill Opt • Coupon Ans',
    headerFooterStyle: 'floating-stadium-pill',
    qBadgeStyle: 'circle-badge',
    optionStyle: 'pill-tag',
    ansBoxStyle: 'dashed-coupon',
    exBoxStyle: 'dashed-note-box',
    blockStyle: 'ticket-notched-card',
    pageTexture: 'dot-grid',
    pageBgColor: '#fdfbf7',
    pageFrame: 'none',
    brandPrimaryColor: '#1c1917',
    brandAccentColor: '#0f766e',
    headerMetaColor: '#57534e',
    qPrimaryColor: '#1c1917',
    qSecondaryColor: '#44403c',
    optionColor: '#292524',
    ansColor: '#0f766e',
    ansHighlightBg: 'rgba(204, 251, 241, 0.68)',
    exPrimaryColor: '#9f1239',
    exSecondaryColor: '#44403c',
    exBgColor: 'rgba(240, 253, 250, 0.78)',
    dividerColor: '#d6d3d1',
    dividerStyle: 'dotted',
    chapterBgColor: 'rgba(240, 253, 250, 0.94)',
    chapterBorderColor: '#99f6e4',
    chapterTextColor: '#115e59',
    blockCardBg: 'rgba(255, 255, 255, 0.85)',
    blockCardBorder: '#99f6e4',
    blockLeftBarColor: '#14b8a6',
    footerTextColor: '#292524',
  },
  {
    id: 'oxford-academic',
    formatNumber: 9,
    name: 'Oxford Academic Journal',
    category: 'Classic',
    tagline: 'Publication serif layout, bracket Q, OMR circle options & top-rule academic ex',
    defaultFontId: 'crimson-martel',
    fontLabel: 'Crimson Pro + Martel',
    layoutBadgeLabel: 'Oxford Serif • Bracket Q • Academic Ex',
    headerFooterStyle: 'gazette-double-rule',
    qBadgeStyle: 'left-bracket',
    optionStyle: 'omr-circle',
    ansBoxStyle: 'double-underline',
    exBoxStyle: 'top-rule-editorial',
    blockStyle: 'open',
    pageTexture: 'double-frame',
    pageBgColor: '#fffefc',
    pageFrame: 'single',
    brandPrimaryColor: '#111827',
    brandAccentColor: '#7f1d1d',
    headerMetaColor: '#4b5563',
    qPrimaryColor: '#111827',
    qSecondaryColor: '#1f2937',
    optionColor: '#1f2937',
    ansColor: '#7f1d1d',
    ansHighlightBg: 'rgba(254, 242, 242, 0.68)',
    exPrimaryColor: '#1e3a8a',
    exSecondaryColor: '#374151',
    exBgColor: 'rgba(249, 250, 251, 0.85)',
    dividerColor: '#9ca3af',
    dividerStyle: 'solid',
    chapterBgColor: '#fef2f2',
    chapterBorderColor: '#fca5a5',
    chapterTextColor: '#7f1d1d',
    footerTextColor: '#111827',
  },
  {
    id: 'khatarnak-inferno',
    formatNumber: 10,
    name: 'Khatarnak Agni Crimson',
    category: 'Khatarnak',
    tagline: 'Slanted flame Q tags, solid circle options, inverse crimson pill ans & callout ex',
    defaultFontId: 'rajdhani-teko',
    fontLabel: 'Rajdhani + Teko',
    layoutBadgeLabel: 'Slanted Q Tag • Solid Opt • Flame Pill',
    headerFooterStyle: 'slanted-power-bar',
    qBadgeStyle: 'slanted-tag',
    optionStyle: 'solid-circle',
    ansBoxStyle: 'solid-inverse-pill',
    exBoxStyle: 'callout-card',
    blockStyle: 'top-header-card',
    pageTexture: 'none',
    pageBgColor: '#fffdf9',
    pageFrame: 'none',
    brandPrimaryColor: '#450a0a',
    brandAccentColor: '#dc2626',
    headerMetaColor: '#7f1d1d',
    qPrimaryColor: '#1c1917',
    qSecondaryColor: '#292524',
    optionColor: '#292524',
    ansColor: '#b91c1c',
    ansHighlightBg: 'rgba(254, 226, 226, 0.85)',
    exPrimaryColor: '#92400e',
    exSecondaryColor: '#451a03',
    exBgColor: 'rgba(254, 242, 242, 0.72)',
    dividerColor: '#fca5a5',
    dividerStyle: 'solid',
    chapterBgColor: 'rgba(254, 242, 242, 0.95)',
    chapterBorderColor: '#fca5a5',
    chapterTextColor: '#991b1b',
    blockCardBg: '#ffffff',
    blockCardBorder: '#fecaca',
    blockLeftBarColor: '#dc2626',
    footerTextColor: '#450a0a',
  },
  {
    id: 'topper-notebook',
    formatNumber: 11,
    name: 'Topper Ruled Notebook',
    category: 'Vintage',
    tagline: 'Ruled register lines, circle Q, OMR option bubbles, coupon ans & dashed note ex',
    defaultFontId: 'lexend-baloo',
    fontLabel: 'Lexend + Baloo 2',
    layoutBadgeLabel: 'Register Lines • OMR Opt • Dashed Note',
    headerFooterStyle: 'register-top-stamp',
    qBadgeStyle: 'circle-badge',
    optionStyle: 'omr-circle',
    ansBoxStyle: 'dashed-coupon',
    exBoxStyle: 'dashed-note-box',
    blockStyle: 'notebook-ruled',
    pageTexture: 'notebook-lines',
    pageBgColor: '#fffef7',
    pageFrame: 'none',
    brandPrimaryColor: '#1e3a8a',
    brandAccentColor: '#dc2626',
    headerMetaColor: '#475569',
    qPrimaryColor: '#172554',
    qSecondaryColor: '#1e3a8a',
    optionColor: '#1e293b',
    ansColor: '#047857',
    ansHighlightBg: 'rgba(209, 250, 229, 0.72)',
    exPrimaryColor: '#b45309',
    exSecondaryColor: '#334155',
    exBgColor: 'rgba(254, 249, 195, 0.58)',
    dividerColor: '#93c5fd',
    dividerStyle: 'dashed',
    chapterBgColor: 'rgba(254, 226, 226, 0.85)',
    chapterBorderColor: '#fca5a5',
    chapterTextColor: '#991b1b',
    footerTextColor: '#1e3a8a',
  },
  {
    id: 'aesthetic-lavender',
    formatNumber: 12,
    name: 'Aesthetic Lavender Mist',
    category: 'Aesthetic',
    tagline: 'Pastel glass cards, option row strips, glass capsule answers & callout ex',
    defaultFontId: 'jakarta-khand',
    fontLabel: 'Plus Jakarta + Mukta',
    layoutBadgeLabel: 'Glass Card • Row Strip Opt • Capsule Ans',
    headerFooterStyle: 'floating-stadium-pill',
    qBadgeStyle: 'circle-badge',
    optionStyle: 'row-strip',
    ansBoxStyle: 'glass-capsule',
    exBoxStyle: 'callout-card',
    blockStyle: 'bordered-card',
    pageTexture: 'none',
    pageBgColor: '#faf8ff',
    pageFrame: 'none',
    brandPrimaryColor: '#2e1065',
    brandAccentColor: '#7c3aed',
    headerMetaColor: '#5b21b6',
    qPrimaryColor: '#1e1b4b',
    qSecondaryColor: '#312e81',
    optionColor: '#312e81',
    ansColor: '#6d28d9',
    ansHighlightBg: 'rgba(237, 233, 254, 0.88)',
    exPrimaryColor: '#be185d',
    exSecondaryColor: '#4c1d95',
    exBgColor: 'rgba(243, 232, 255, 0.72)',
    dividerColor: '#c4b5fd',
    dividerStyle: 'dotted',
    chapterBgColor: 'rgba(243, 232, 255, 0.95)',
    chapterBorderColor: '#c4b5fd',
    chapterTextColor: '#5b21b6',
    blockCardBg: 'rgba(255, 255, 255, 0.86)',
    blockCardBorder: 'rgba(196, 181, 253, 0.7)',
    blockLeftBarColor: '#8b5cf6',
    footerTextColor: '#2e1065',
  },
  {
    id: 'modern-grid-box',
    formatNumber: 13,
    name: 'Modern Boxed Card Grid',
    category: 'Modern',
    tagline: 'Modular cobalt-blue cards, square keycap options, split answer box & callout ex',
    defaultFontId: 'space-grotesk',
    fontLabel: 'Space Grotesk + Mukta',
    layoutBadgeLabel: 'Boxed Card • Keycap Opt • Split Ans',
    headerFooterStyle: 'swiss-grid-header',
    qBadgeStyle: 'outlined-box',
    optionStyle: 'square-keycap',
    ansBoxStyle: 'split-label-box',
    exBoxStyle: 'callout-card',
    blockStyle: 'bordered-card',
    pageTexture: 'dot-grid',
    pageBgColor: '#f8fafc',
    pageFrame: 'none',
    brandPrimaryColor: '#0f172a',
    brandAccentColor: '#0284c7',
    headerMetaColor: '#334155',
    qPrimaryColor: '#0f172a',
    qSecondaryColor: '#1e293b',
    optionColor: '#1e293b',
    ansColor: '#0369a1',
    ansHighlightBg: 'rgba(224, 242, 254, 0.85)',
    exPrimaryColor: '#0f766e',
    exSecondaryColor: '#334155',
    exBgColor: 'rgba(240, 249, 255, 0.85)',
    dividerColor: '#cbd5e1',
    dividerStyle: 'solid',
    chapterBgColor: 'rgba(224, 242, 254, 0.95)',
    chapterBorderColor: '#7dd3fc',
    chapterTextColor: '#0c4a6e',
    blockCardBg: '#ffffff',
    blockCardBorder: '#cbd5e1',
    blockLeftBarColor: '#0284c7',
    footerTextColor: '#0f172a',
  },
  {
    id: 'minimalist-swiss',
    formatNumber: 14,
    name: 'Minimalist Pure Swiss',
    category: 'Minimalist',
    tagline: 'Monochrome Swiss grid, solid circle options, left-bar answer & clean badge ex',
    defaultFontId: 'jakarta-khand',
    fontLabel: 'Plus Jakarta + Khand',
    layoutBadgeLabel: 'Swiss Grid • Solid Opt • Bar Ans',
    headerFooterStyle: 'swiss-grid-header',
    qBadgeStyle: 'solid-pill',
    optionStyle: 'solid-circle',
    ansBoxStyle: 'left-bar-box',
    exBoxStyle: 'clean-badge',
    blockStyle: 'open',
    pageTexture: 'none',
    pageBgColor: '#ffffff',
    pageFrame: 'none',
    brandPrimaryColor: '#09090b',
    brandAccentColor: '#18181b',
    headerMetaColor: '#52525b',
    qPrimaryColor: '#09090b',
    qSecondaryColor: '#27272a',
    optionColor: '#27272a',
    ansColor: '#09090b',
    ansHighlightBg: 'rgba(244, 244, 245, 0.95)',
    exPrimaryColor: '#18181b',
    exSecondaryColor: '#3f3f46',
    exBgColor: '#f4f4f5',
    dividerColor: '#d4d4d8',
    dividerStyle: 'solid',
    chapterBgColor: '#f4f4f5',
    chapterBorderColor: '#a1a1aa',
    chapterTextColor: '#09090b',
    footerTextColor: '#09090b',
  },
  {
    id: 'minimalist-nordic',
    formatNumber: 15,
    name: 'Minimalist Nordic Pine',
    category: 'Minimalist',
    tagline: 'Alabaster stone sheet, pine stripe cards, pill-tag options & quote stripe ex',
    defaultFontId: 'merriweather-tiro',
    fontLabel: 'Merriweather + Tiro',
    layoutBadgeLabel: 'Pine Stripe • Pill Opt • Quote Ex',
    headerFooterStyle: 'swiss-grid-header',
    qBadgeStyle: 'left-bracket',
    optionStyle: 'pill-tag',
    ansBoxStyle: 'inline-tint',
    exBoxStyle: 'left-quote-stripe',
    blockStyle: 'left-stripe',
    pageTexture: 'none',
    pageBgColor: '#f9f8f6',
    pageFrame: 'none',
    brandPrimaryColor: '#1c1917',
    brandAccentColor: '#15803d',
    headerMetaColor: '#57534e',
    qPrimaryColor: '#1c1917',
    qSecondaryColor: '#292524',
    optionColor: '#292524',
    ansColor: '#15803d',
    ansHighlightBg: 'rgba(220, 252, 231, 0.72)',
    exPrimaryColor: '#166534',
    exSecondaryColor: '#44403c',
    exBgColor: 'rgba(240, 253, 244, 0.82)',
    dividerColor: '#d6d3d1',
    dividerStyle: 'solid',
    chapterBgColor: 'rgba(220, 252, 231, 0.85)',
    chapterBorderColor: '#86efac',
    chapterTextColor: '#14532d',
    blockLeftBarColor: '#15803d',
    footerTextColor: '#1c1917',
  },
  {
    id: 'khatarnak-matrix',
    formatNumber: 16,
    name: 'Khatarnak Matrix Terminal',
    category: 'Khatarnak',
    tagline: 'Hacker console HUD pods, keycap options, coupon answers & cyber terminal ex',
    defaultFontId: 'jetbrains-gotu',
    fontLabel: 'JetBrains Mono + Gotu',
    layoutBadgeLabel: 'Matrix HUD • Keycap Opt • Cyber Ex',
    headerFooterStyle: 'cyber-hud-angled',
    qBadgeStyle: 'outlined-box',
    optionStyle: 'square-keycap',
    ansBoxStyle: 'dashed-coupon',
    exBoxStyle: 'cyber-hud-note',
    blockStyle: 'corner-brackets',
    pageTexture: 'blueprint-grid',
    isDark: true,
    pageBgColor: '#060a08',
    pageFrame: 'none',
    brandPrimaryColor: '#ecfdf5',
    brandAccentColor: '#22c55e',
    headerMetaColor: '#86efac',
    qPrimaryColor: '#ecfdf5',
    qSecondaryColor: '#d1fae5',
    optionColor: '#a7f3d0',
    ansColor: '#facc15',
    ansHighlightBg: 'rgba(20, 83, 45, 0.78)',
    exPrimaryColor: '#4ade80',
    exSecondaryColor: '#bbf7d0',
    exBgColor: 'rgba(6, 24, 14, 0.92)',
    dividerColor: '#14532d',
    dividerStyle: 'dashed',
    chapterBgColor: 'rgba(20, 83, 45, 0.92)',
    chapterBorderColor: '#22c55e',
    chapterTextColor: '#facc15',
    blockCardBg: 'rgba(6, 24, 14, 0.82)',
    blockCardBorder: 'rgba(34, 197, 94, 0.35)',
    blockLeftBarColor: '#22c55e',
    footerTextColor: '#ecfdf5',
  },
];

export function getPdfDesignTheme(themeId?: PdfDesignThemeId): PdfDesignTheme {
  if (!themeId) return PDF_DESIGN_FORMATS[0];
  return PDF_DESIGN_FORMATS.find((t) => t.id === themeId) || PDF_DESIGN_FORMATS[0];
}

export function resolveEffectiveDesignTheme(config?: PdfLayoutConfig): PdfDesignTheme {
  const base = getPdfDesignTheme(config?.designTheme);
  if (!config) return base;
  const isTheory = config.questionFormatMode === 'theory';
  if (isTheory && (!config.designTheme || config.designTheme === 'classic-emerald')) {
    // Pure Black & White Printout Optimization for Theory Notes (A4 2-Column Xerox / Laser Print Ready)
    return {
      ...base,
      pageBgColor: '#ffffff',
      brandPrimaryColor: '#000000',
      brandAccentColor: '#000000',
      headerMetaColor: '#27272a',
      qPrimaryColor: '#000000',
      qSecondaryColor: '#18181b',
      optionColor: '#000000',
      ansColor: '#000000',
      ansHighlightBg: '#f4f4f5',
      exPrimaryColor: '#000000',
      exSecondaryColor: '#27272a',
      exBgColor: '#f9fafb',
      dividerColor: '#a1a1aa',
      chapterBgColor: '#f4f4f5',
      chapterBorderColor: '#000000',
      chapterTextColor: '#000000',
      footerTextColor: '#000000',
      headerFooterStyle: 'minimal-clean',
    };
  }
  const isOneliner = config.questionFormatMode === 'oneliner';
  return {
    ...base,
    ansColor: config.customAnsColor || '#047857',
    brandAccentColor: config.customBrandColor || base.brandAccentColor,
    headerFooterStyle:
      config.customHeaderStyle && config.customHeaderStyle !== 'theme-default'
        ? config.customHeaderStyle
        : base.headerFooterStyle,
    blockStyle:
      config.customBlockStyle && config.customBlockStyle !== 'theme-default'
        ? config.customBlockStyle
        : base.blockStyle,
    qBadgeStyle:
      config.customQBadgeStyle && config.customQBadgeStyle !== 'theme-default'
        ? config.customQBadgeStyle
        : base.qBadgeStyle,
    optionStyle:
      config.customOptionStyle && config.customOptionStyle !== 'theme-default'
        ? config.customOptionStyle
        : base.optionStyle,
    ansBoxStyle:
      config.customAnsBoxStyle && config.customAnsBoxStyle !== 'theme-default'
        ? config.customAnsBoxStyle
        : isOneliner
        ? 'pure-dash-line'
        : base.ansBoxStyle,
    exBoxStyle:
      config.customExBoxStyle && config.customExBoxStyle !== 'theme-default'
        ? config.customExBoxStyle
        : base.exBoxStyle,
  };
}

export function resolveActivePdfFontFamily(
  config?: Pick<PdfLayoutConfig, 'fontFamilyId' | 'designTheme' | 'questionFormatMode'>,
  themeOverride?: PdfDesignTheme
): string {
  if (
    config?.questionFormatMode === 'theory' &&
    (!config.fontFamilyId || config.fontFamilyId === 'theme-default')
  ) {
    const hindiOpt = PDF_FONT_FAMILIES.find((f) => f.id === 'noto-devanagari-book');
    if (hindiOpt) return hindiOpt.fontStack;
  }
  const theme = themeOverride || getPdfDesignTheme(config?.designTheme);
  const requestedId = config?.fontFamilyId;
  const effectiveId: Exclude<PdfFontFamilyId, 'theme-default'> =
    requestedId && requestedId !== 'theme-default'
      ? requestedId
      : theme.defaultFontId || 'outfit-anek';
  const found = PDF_FONT_FAMILIES.find((f) => f.id === effectiveId);
  return found ? found.fontStack : PDF_FONT_FAMILIES[1].fontStack;
}

export interface PdfLayoutConfig {
  marginInches: number; // default 0.2
  columns: 1 | 2; // default 2
  questionsPerPage: number | 'auto'; // default 25
  fontSizePt: number;
  autoFillFullPage: boolean;
  languageFilter: LanguageModeId;
  showOptionCode: boolean;
  showDocumentHeader: boolean; // Left Logo + "Desi Crack" (with TG link) | Right Auto-Detected "Exam Name • Shift Name • Date"
  showPageNumbers: boolean; // Centered in footer + Left WhatsApp Join + Right Telegram Join Now
  brandLeftText: string; // default "Desi Crack"
  telegramUrl: string; // default "https://t.me/DesiCrack"
  youtubeUrl: string; // default "https://www.youtube.com/@DesiCrack"
  whatsappUrl?: string; // default WhatsApp group/channel/invite link
  showWatermark: boolean; // default true
  watermarkLogoUrl: string; // default DEFAULT_WATERMARK_LOGO_URL
  watermarkOpacity: number; // default 0.15
  watermarkScale: number; // default 0.48 (fraction of page width)
  selectedSubjectLabel?: string; // e.g., "REASONING" or "ALL"
  selectedChapterLabel?: string; // e.g., "Coding - Decoding" or "ALL"
  questionFormatMode?: 'oneliner' | 'options' | 'ppt' | 'explanation' | 'chapterwise' | 'answerkey' | 'theory';
  chapterSubFormat?: 'oneliner' | 'options' | 'explanation';
  designTheme?: PdfDesignThemeId;
  fontFamilyId?: PdfFontFamilyId;
  customBlockStyle?: PdfBlockCardStyle | 'theme-default';
  customQBadgeStyle?: PdfQBadgeStyle | 'theme-default';
  customOptionStyle?: PdfOptionStyle | 'theme-default';
  customAnsBoxStyle?: PdfAnsBoxStyle | 'theme-default';
  customExBoxStyle?: PdfExBoxStyle | 'theme-default';
  customAnsColor?: string;
  customBrandColor?: string;
  customHeaderStyle?: PdfHeaderFooterStyle | 'theme-default';
  customFooterStyle?: PdfHeaderFooterStyle | 'theme-default';
  lectureBannerTitle?: string;
  customHeaderRightText?: string;
}

export interface RenderedBlockLine {
  text: string;
  isBold?: boolean;
  isChapterHeading?: boolean;
  isChapterHeadingLastLine?: boolean;
  isSubHeading?: boolean;
  isTableRow?: boolean;
  isTableHeader?: boolean;
  tableCells?: string[];
  isQuoteLine?: boolean;
  isQuoteFirstLine?: boolean;
  isQuoteLastLine?: boolean;
  isMainPoint?: boolean;
  mainPointBadge?: string;
  isSubPoint?: boolean;
  calloutBadge?: string;
  lineRole?: 'option-first' | 'option-cont' | 'ans-first' | 'ans-cont' | 'ex-first' | 'ex-cont';
  optionCode?: string;
  isLastExLine?: boolean;
  color: string;
  fontSizePx: number;
  lineHeightPx: number;
  indentPx: number;
}

export interface IndexPageEntry {
  topicNumber: number;
  topicName: string;
  questionCount: number;
  startQLabel: string;
  endQLabel: string;
  targetPageNumber: number;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
}

export interface PaginatedItem {
  type: 'qa-block';
  column: 0 | 1;
  xPx: number;
  yPx: number;
  widthPx: number;
  heightPx: number;
  qToAGapPx?: number;
  ansPadYPx?: number;
  qLabel?: string;
  questionId?: string;
  qIndex?: number;
  chapter?: string;
  qLines?: RenderedBlockLine[];
  aLines?: RenderedBlockLine[];
}

export interface PaginatedA4Page {
  pageNumber: number;
  startQLabel: string;
  endQLabel: string;
  questionCount: number;
  effectiveFontPt: number;
  headerRightText: string;
  theoryBannerLines?: string[];
  theoryBannerBottomY?: number;
  isIndexPage?: boolean;
  indexEntries?: IndexPageEntry[];
  totalTopicsCount?: number;
  totalQuestionsCount?: number;
  items: PaginatedItem[];
}

export const A4_WIDTH_IN = 8.2677; // 210mm
export const A4_HEIGHT_IN = 11.6929; // 297mm
export const PPT_WIDTH_IN = 11.6929; // 16:9 Widescreen Slide Width (297mm)
export const PPT_HEIGHT_IN = 6.5773; // 16:9 Widescreen Slide Height (167mm)
export const BASE_DPI = 96;
export const FONT_FAMILY =
  "'Outfit', 'Anek Devanagari', 'Noto Sans Math', 'Noto Sans Oriya', 'Noto Sans Gurmukhi', 'Noto Sans Bengali', 'Noto Sans Ol Chiki', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Gujarati', 'Noto Sans Kannada', 'Noto Sans Malayalam', 'Noto Sans Arabic', 'Cambria Math', 'STIX Two Math', sans-serif";

// Symmetrical Top Header & Bottom Footer offsets
export const HEADER_LINE_OFFSET_PX = 13.5; // Dashed header line sits cleanly below the top header row (mirroring footer)
export const HEADER_CONTENT_GAP_PX = 9.5; // Clear breathing room below header dashed line so top question never touches it
export const HEADER_RESERVE_PX = HEADER_LINE_OFFSET_PX + HEADER_CONTENT_GAP_PX;

export const FOOTER_LINE_OFFSET_PX = 13.5; // Dashed footer line sits cleanly above the bottom footer row
export const FOOTER_CONTENT_GAP_PX = 8.5; // Clear breathing room above footer dashed line
export const FOOTER_RESERVE_PX = FOOTER_LINE_OFFSET_PX + FOOTER_CONTENT_GAP_PX;

// Cache for loaded watermark HTMLImageElement
const watermarkImageCache = new Map<string, HTMLImageElement>();
const watermarkLoadingPromises = new Map<string, Promise<HTMLImageElement | null>>();

export function getCachedWatermarkImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  return watermarkImageCache.get(url) ?? null;
}

export function ensureWatermarkImageLoaded(url: string): Promise<HTMLImageElement | null> {
  const cleanUrl = (url || '').trim();
  if (!cleanUrl || typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  if (watermarkImageCache.has(cleanUrl)) {
    return Promise.resolve(watermarkImageCache.get(cleanUrl)!);
  }
  if (watermarkLoadingPromises.has(cleanUrl)) {
    return watermarkLoadingPromises.get(cleanUrl)!;
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      watermarkImageCache.set(cleanUrl, img);
      resolve(img);
    };
    img.onerror = async () => {
      try {
        const resp = await fetch(cleanUrl);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              watermarkImageCache.set(cleanUrl, fallbackImg);
              resolve(fallbackImg);
            };
            fallbackImg.onerror = () => resolve(null);
            fallbackImg.src = reader.result;
          } else {
            resolve(null);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        resolve(null);
      }
    };
    img.src = cleanUrl;
  });

  watermarkLoadingPromises.set(cleanUrl, promise);
  return promise;
}

export function normalizeTelegramUrl(rawUrl: string): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return 'https://t.me/DesiCrackOfficial';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('t.me/')) return `https://${clean}`;
  if (clean.startsWith('@')) return `https://t.me/${clean.slice(1)}`;
  return `https://t.me/${clean}`;
}

export function normalizeWhatsappUrl(rawUrl?: string): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return 'https://chat.whatsapp.com/DesiCrack';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (
    clean.startsWith('chat.whatsapp.com/') ||
    clean.startsWith('wa.me/') ||
    clean.startsWith('api.whatsapp.com/') ||
    clean.startsWith('whatsapp.com/')
  ) {
    return `https://${clean}`;
  }
  if (clean.startsWith('+') || /^\d{10,15}$/.test(clean)) {
    return `https://wa.me/${clean.replace(/\D/g, '')}`;
  }
  return `https://${clean}`;
}

export function normalizeYoutubeUrl(rawUrl: string): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return 'https://www.youtube.com/@DesiCrackOfficial';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('youtube.com/') || clean.startsWith('www.youtube.com/') || clean.startsWith('youtu.be/')) {
    return `https://${clean}`;
  }
  if (clean.startsWith('@')) return `https://www.youtube.com/${clean}`;
  return `https://www.youtube.com/@${clean}`;
}

export async function ensureAnekFontLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load("400 14px 'Outfit'"),
        document.fonts.load("600 14px 'Outfit'"),
        document.fonts.load("800 14px 'Outfit'"),
        document.fonts.load("400 14px 'Anek Devanagari'"),
        document.fonts.load("700 14px 'Anek Devanagari'"),
        document.fonts.load("600 14px 'Poppins'"),
        document.fonts.load("600 14px 'Hind'"),
        document.fonts.load("700 14px 'Merriweather'"),
        document.fonts.load("400 14px 'Tiro Devanagari Hindi'"),
        document.fonts.load("700 14px 'Space Grotesk'"),
        document.fonts.load("600 14px 'Mukta'"),
        document.fonts.load("700 14px 'Playfair Display'"),
        document.fonts.load("700 14px 'Sahitya'"),
        document.fonts.load("600 14px 'JetBrains Mono'"),
        document.fonts.load("400 14px 'Gotu'"),
        document.fonts.load("700 14px 'Plus Jakarta Sans'"),
        document.fonts.load("600 14px 'Khand'"),
        document.fonts.load("600 14px 'Crimson Pro'"),
        document.fonts.load("600 14px 'Martel'"),
        document.fonts.load("600 14px 'Lexend'"),
        document.fonts.load("600 14px 'Baloo 2'"),
        document.fonts.load("700 14px 'Rajdhani'"),
        document.fonts.load("400 14px 'Noto Sans Math'"),
      ]);
      await document.fonts.ready;
    } catch {
      // ignore font load errors
    }
  }
}

function computePageRightHeader(
  batch: ParsedQuestion[],
  fallbackMeta: ExamDocumentMeta,
  config: PdfLayoutConfig
): string {
  if (config.customHeaderRightText && config.customHeaderRightText.trim()) {
    return config.customHeaderRightText.trim();
  }
  const firstHeader = batch.find((q) => Boolean(q.sourceHeaderRight))?.sourceHeaderRight;
  return firstHeader || fallbackMeta.headerRightText || fallbackMeta.title || 'EXAM';
}

const wordWidth10PxCache: Record<string, Map<string, number>> = {};
let activeMeasureFontSpec = '';

function getWordWidthAt10Px(
  ctx: CanvasRenderingContext2D,
  weight: string,
  word: string,
  fontFamilyStack: string = FONT_FAMILY
): number {
  const cleanWord = word.includes('**') ? word.replace(/\*\*/g, '') : word;
  const isBoldToken = word.startsWith('**') && word.endsWith('**') && cleanWord.length > 0;
  const effectiveWeight = isBoldToken ? '700' : weight;
  const cacheBucketKey = `${effectiveWeight}__${fontFamilyStack}`;

  let cache = wordWidth10PxCache[cacheBucketKey];
  if (!cache) {
    cache = new Map<string, number>();
    wordWidth10PxCache[cacheBucketKey] = cache;
  }
  const existing = cache.get(cleanWord);
  if (existing !== undefined) return existing;

  const targetFontSpec = `${effectiveWeight} 10px ${fontFamilyStack}`;
  if (activeMeasureFontSpec !== targetFontSpec) {
    ctx.font = targetFontSpec;
    activeMeasureFontSpec = targetFontSpec;
  }
  const w = ctx.measureText(cleanWord).width;
  if (cache.size > 30000) {
    cache.clear();
  }
  cache.set(cleanWord, w);
  return w;
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidthPx: number,
  fontStr: string,
  nextLineMaxWidthPx?: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const m = fontStr.match(/^(\d+)\s+([\d.]+)px\s+(.+)$/);
  const weight = m ? m[1] : '400';
  const fontSizePx = m ? parseFloat(m[2]) : 10;
  const fontFamilyStack = m && m[3] ? m[3] : FONT_FAMILY;
  const scale = fontSizePx / 10;
  const spaceW = getWordWidthAt10Px(ctx, weight, ' ', fontFamilyStack) * scale;

  const lines: string[] = [];
  let currentLine = words[0];
  let currentWidth = getWordWidthAt10Px(ctx, weight, currentLine, fontFamilyStack) * scale;

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const wordW = getWordWidthAt10Px(ctx, weight, word, fontFamilyStack) * scale;
    const limitW =
      lines.length === 0 ? maxWidthPx : (nextLineMaxWidthPx ?? maxWidthPx);
    if (currentWidth + spaceW + wordW <= limitW) {
      currentLine += ' ' + word;
      currentWidth += spaceW + wordW;
    } else {
      lines.push(currentLine);
      currentLine = word;
      currentWidth = wordW;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

export function getQuestionDisplayLines(
  q: ParsedQuestion,
  config: PdfLayoutConfig
): { qTexts: string[]; optionTexts: string[]; ansText: string; exTexts: string[] } {
  const qTexts: string[] = [];

  if (config.languageFilter === 'bilingual') {
    if (q.questionEn) qTexts.push(q.questionEn);
    if (q.questionHi && q.questionHi.trim()) qTexts.push(q.questionHi);
    if (!q.questionEn && !q.questionHi && q.rawQuestion) {
      qTexts.push(q.rawQuestion);
    }
  } else if (config.languageFilter === 'english') {
    qTexts.push(q.translatedQuestion || q.questionEn || q.rawQuestion);
  } else if (config.languageFilter === 'hindi') {
    qTexts.push(q.translatedQuestion || q.questionHi || q.questionEn || q.rawQuestion);
  } else {
    // Any selected regional language (te, ur, as, gom, mr, gu, kn, ml, kha, lus, or, pa, bn, trp, sat, ta)
    qTexts.push(q.translatedQuestion || q.questionHi || q.questionEn || q.rawQuestion);
  }

  const optionTexts: string[] = (q.options || []).slice(0, 4).map((opt, idx) => {
    const translatedOpt = q.translatedOptions?.[idx] || opt.translatedText;
    let body = opt.textClean;
    if (config.languageFilter === 'bilingual') {
      body = opt.textClean;
    } else if (config.languageFilter === 'english') {
      body = translatedOpt || opt.textEn || opt.textClean;
    } else if (config.languageFilter === 'hindi') {
      body = translatedOpt || opt.textHi || opt.textClean;
    } else {
      body = translatedOpt || opt.textEn || opt.textHi || opt.textClean;
    }
    return `(${opt.code}) ${body}`;
  });

  let ansBody = q.answerClean;
  if (config.languageFilter === 'bilingual') {
    ansBody = q.answerClean;
  } else if (config.languageFilter === 'english') {
    ansBody = q.translatedAnswer || q.answerTextEn || q.answerClean;
  } else if (config.languageFilter === 'hindi') {
    ansBody = q.translatedAnswer || q.answerTextHi || q.answerClean;
  } else {
    ansBody = q.translatedAnswer || q.answerTextHi || q.answerTextEn || q.answerClean;
  }

  const prefix = config.showOptionCode && q.answerOption ? `${q.answerOption} ` : '';
  const ansText = `Ans: ${prefix}${ansBody}`;

  const exTexts: string[] = [];
  if (config.languageFilter === 'bilingual') {
    if (q.explanationEn && q.explanationEn.trim()) {
      exTexts.push(`Explanation: ${q.explanationEn.trim()}`);
    }
    if (
      q.explanationHi &&
      q.explanationHi.trim() &&
      q.explanationHi.trim().toLowerCase() !== (q.explanationEn || '').trim().toLowerCase()
    ) {
      exTexts.push(`व्याख्या: ${q.explanationHi.trim()}`);
    }
    if (exTexts.length === 0 && q.explanationClean) {
      exTexts.push(`Explanation: ${q.explanationClean.trim()}`);
    }
  } else if (config.languageFilter === 'english') {
    const enEx = (q.translatedExplanation || q.explanationEn || q.explanationClean || '').trim();
    if (enEx) exTexts.push(`Explanation: ${enEx}`);
  } else if (config.languageFilter === 'hindi') {
    const hiEx = (q.translatedExplanation || q.explanationHi || q.explanationClean || '').trim();
    if (hiEx) exTexts.push(`व्याख्या: ${hiEx}`);
  } else {
    const regEx = (
      q.translatedExplanation ||
      q.explanationEn ||
      q.explanationHi ||
      q.explanationClean ||
      ''
    ).trim();
    if (regEx) exTexts.push(`Explanation: ${regEx}`);
  }

  const ensureCleanMath = (str: string): string =>
    str && /[\\$^_&{}]/.test(str) ? cleanMathAndText(str) : str;

  return {
    qTexts: qTexts.map(ensureCleanMath),
    optionTexts: optionTexts.map(ensureCleanMath),
    ansText: ensureCleanMath(ansText),
    exTexts: exTexts.map(ensureCleanMath),
  };
}

interface MeasuredBlock {
  q: ParsedQuestion;
  qIndex: number;
  qLines: RenderedBlockLine[];
  aLines: RenderedBlockLine[];
  totalLines: number;
  heightPx: number;
  qToAGapPx: number;
  ansPadYPx: number;
}

function measureQuestionBatch(
  ctx: CanvasRenderingContext2D,
  batch: ParsedQuestion[],
  colWidthPx: number,
  fontSizePt: number,
  config: PdfLayoutConfig,
  lineHeightRatio: number,
  padBottomPx: number,
  batchStartIndex: number = 0,
  prevBatchChapter: string = ''
): MeasuredBlock[] {
  const fontSizePx = (fontSizePt * BASE_DPI) / 72;
  const lineHeightPx = Math.max(7.0, fontSizePx * lineHeightRatio);
  const qToAGapPx = Math.max(1.0, fontSizePx * 0.12);
  const ansPadYPx = Math.max(0.8, fontSizePx * 0.08);
  const theme = resolveEffectiveDesignTheme(config);
  const activeFontStack = resolveActivePdfFontFamily(config, theme);
  const qBadgeIndentReserve =
    !config.questionFormatMode ||
    config.questionFormatMode !== 'theory'
      ? theme.qBadgeStyle && theme.qBadgeStyle !== 'plain'
        ? 5.5
        : 0
      : 0;

  return batch.map((q, qIdx) => {
    const globalQIdx = batchStartIndex + qIdx;
    const { qTexts, optionTexts, ansText, exTexts } = getQuestionDisplayLines(q, config);
    const qLines: RenderedBlockLine[] = [];
    const aLines: RenderedBlockLine[] = [];

    if (config.questionFormatMode === 'answerkey') {
      const cleanAns = ansText.replace(/^Ans:\s*/i, '');
      const fullKeyLine = `${q.qNum}. ${cleanAns}`;
      const keyFontStr = `700 ${fontSizePx}px ${FONT_FAMILY}`;
      const wrappedKey = wrapTextLines(
        ctx,
        fullKeyLine,
        colWidthPx - 6,
        keyFontStr,
        colWidthPx - 18
      );
      wrappedKey.forEach((lineStr, lIdx) => {
        aLines.push({
          text: lineStr,
          isBold: true,
          color: theme.ansColor || '#047857',
          fontSizePx,
          lineHeightPx: lIdx === 0 ? lineHeightPx + 4.5 : lineHeightPx,
          indentPx: lIdx === 0 ? 0 : 12,
        });
      });

      const totalLines = aLines.length;
      const totalHeightPx = aLines.reduce((sum, l) => sum + l.lineHeightPx, 0);
      const heightPx = totalHeightPx + ansPadYPx + padBottomPx;
      return {
        q,
        qIndex: globalQIdx,
        qLines,
        aLines,
        totalLines,
        heightPx,
        qToAGapPx: 0,
        ansPadYPx,
      };
    }

    // Pure Theory Notes mode (Academic Study Notes Handbook layout matching reference PDF)
    if (config.questionFormatMode === 'theory') {
      const normalizeInlineBoldTokens = (rawStr: string): string => {
        let s = rawStr;
        // Auto-bold leading structured labels in bullet points if not already bolded: e.g. "• Method 1: The 'What' Question: Ask..." or "• Example: In..."
        if (s.startsWith('• ') && !s.includes('**')) {
          s = s.replace(
            /^•\s+((?:Method\s*\d+\s*[:.-]\s*[^:]{2,38}|Example\s*\d*|Rule|Position|Identification(?:\s+Test|\s+Method|\s+Logic)?|Function|Analysis(?:\s+of\s+[^:]{1,25})?|Differentiation|Difference|Similarity|Distinction(?:\s+from\s+[^:]{1,25})?|Exception|Non-Verbs|Action\s+vs\.\s+State|Pre-Nominal\s+Position|Post-Nominal\s+Position|Degrees|Examples(?:\s+Provided)?|Exclusion|Time\s+Adverbs|Manner\s+Adverbs|Contextual\s+(?:Usage|Determination)|Joining\s+(?:Words\/Phrases|Independent\s+Clauses)|Proof\s+Method|Variety\s+of\s+Connectors|Non-Grammatical\s+Status|Core\s+Principle|Methodology|Exam\s+Relevance|Sentence(?:\s+Fragment)?|Grammatical\s+Role|Definition|Meaning|Classification|Structural\s+Requirement|Logic|Subject(?:\s+Identification)?|Verb|Contrast\s+with\s+[^:]{1,25}|Role\s+of\s+[^:]{1,25}|Noun\s+Phrase\s+Definition|Application|Grammar\s+Rule|Conclusion|Subjective\s+Case(?:\s*\([^)]+\))?|Objective\s+Case(?:\s*\([^)]+\))?|Usage\s+Rule|Introductory\s+Function|Time\s+and\s+Weather\s+Contexts|Modification\s+of\s+(?:Adjectives|Adverbs)|As\s+an\s+(?:Adverb|Adjective)|Reflexive\s+Pronouns|Emphatic(?:\s*\([^)]+\))?\s+Pronouns|List\s+of\s+Forms|Transitive\s+Verbs|Intransitive\s+Verbs|Modal\s+Verbs|Proper\s+Nouns\s+vs\.\s+Common\s+Nouns|Abstract\s+Concepts|Prepositional\s+Phrases|Article\s+Usage\s+with\s+Proper\s+Nouns|Preposition\s+vs\.\s+Noun\s+Position|Fragment\s+vs\.\s+Sentence|Key\s+Fact|Correct\s+Answer|उत्तर|व्याख्या|Explanation|Formula|सूत्र|Concept|Trick)\s*:)/i,
            '• **$1**'
          );
        }
        // Convert any **multi word phrase** into per-word **multi** **word** **phrase** so wrapTextLines preserves bolding across line breaks
        return s.replace(/\*\*([^*]+)\*\*/g, (_, inner: string) =>
          inner
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => `**${w}**`)
            .join(' ')
        );
      };

      const prevChapter = qIdx > 0 ? batch[qIdx - 1]?.chapter || batch[qIdx - 1]?.section : prevBatchChapter;
      const activeChapterName = (q.chapter || q.section || '').trim();
      if (activeChapterName && activeChapterName !== prevChapter) {
        const chFontPx = Math.max(8.8, fontSizePx * 1.04);
        const chLineH = Math.max(16.8, chFontPx * 1.78);
        const chFontStr = `800 ${chFontPx}px ${activeFontStack}`;
        const cleanHeading = activeChapterName.toUpperCase();
        const wrappedHeading = wrapTextLines(
          ctx,
          cleanHeading,
          colWidthPx - 52,
          chFontStr,
          colWidthPx - 12
        );
        wrappedHeading.forEach((hLine, hIdx) => {
          const isLast = hIdx === wrappedHeading.length - 1;
          qLines.push({
            text: hLine,
            isBold: true,
            isChapterHeading: true,
            isChapterHeadingLastLine: isLast,
            color: theme.chapterTextColor || theme.qPrimaryColor,
            fontSizePx: chFontPx,
            lineHeightPx: isLast ? chLineH + 3.5 : chLineH,
            indentPx: 0,
          });
        });
      }

      const hasDevanagariChars = (str: string) => /[\u0900-\u097F]/.test(str);
      const langFilter = config.languageFilter || 'bilingual';

      let rawCoreSource = '';
      if (q.translatedQuestion && langFilter !== 'bilingual' && langFilter !== 'english' && langFilter !== 'hindi') {
        rawCoreSource = q.translatedQuestion;
      } else if (q.isTheoryNote) {
        const allLines = (q.questionEn || q.rawQuestion || '').split('\n');
        if (langFilter === 'english') {
          const enOnly = allLines.filter((l) => !hasDevanagariChars(l) || /^#{2,4}\s+/.test(l.trim()));
          rawCoreSource = (enOnly.length > 0 ? enOnly : allLines).join('\n');
        } else if (langFilter === 'hindi') {
          const hiOnly = allLines.filter((l) => hasDevanagariChars(l) || /^#{2,4}\s+/.test(l.trim()));
          rawCoreSource = (hiOnly.length > 0 ? hiOnly : [q.translatedQuestion || q.questionHi || q.questionEn]).join('\n');
        } else {
          rawCoreSource = q.questionEn || q.rawQuestion || '';
        }
      } else {
        // Converting standard real MCQ / Q&A into full Book-Type Theory Concept block
        rawCoreSource = '';
      }

      const coreParagraphs = rawCoreSource
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const coreFontPx = fontSizePx * 0.98;
      const coreLineHPx = Math.max(10.5, coreFontPx * 1.3);
      const coreFontStr = `${q.isTheoryNote ? '400' : '600'} ${coreFontPx}px ${activeFontStack}`;
      coreParagraphs.forEach((para, pIdx) => {
        if (/^#{2,4}\s+/.test(para)) {
          const subText = para.replace(/^#{2,4}\s+/, '').trim();
          const subFontPx = fontSizePx * 0.98;
          const subLineH = Math.max(14.2, subFontPx * 1.52);
          const wrappedSub = wrapTextLines(
            ctx,
            subText,
            colWidthPx - 18,
            `700 ${subFontPx}px ${activeFontStack}`
          );
          wrappedSub.forEach((lineStr) => {
            qLines.push({
              text: lineStr,
              isBold: true,
              isSubHeading: true,
              color: theme.brandPrimaryColor || theme.qPrimaryColor,
              fontSizePx: subFontPx,
              lineHeightPx: subLineH,
              indentPx: 0,
            });
          });
          return;
        }
        const cleanedPara = normalizeInlineBoldTokens(
          /[\\$^_&{}]/.test(para) ? cleanMathAndText(para) : para
        );
        const wrappedCore = wrapTextLines(ctx, cleanedPara, colWidthPx - 10, coreFontStr);
        wrappedCore.forEach((lineStr) => {
          qLines.push({
            text: lineStr,
            isBold: !q.isTheoryNote && pIdx === 0,
            color: pIdx > 0 && !q.isTheoryNote ? theme.qSecondaryColor : theme.qPrimaryColor,
            fontSizePx: coreFontPx,
            lineHeightPx: coreLineHPx,
            indentPx: 2,
          });
        });
      });

      let bulletSource = '';
      if (q.translatedExplanation && langFilter !== 'bilingual' && langFilter !== 'english' && langFilter !== 'hindi' && q.isTheoryNote) {
        bulletSource = q.translatedExplanation;
      } else if (q.isTheoryNote) {
        const allBullets = (q.explanationClean || q.explanationEn || '').split('\n');
        if (langFilter === 'english') {
          const enB = allBullets.filter(
            (l) => !hasDevanagariChars(l) || /^#{2,4}\s+/.test(l.trim()) || /^\|.+\|$/.test(l.trim())
          );
          bulletSource = (enB.length > 0 ? enB : allBullets).join('\n');
        } else if (langFilter === 'hindi') {
          const hiB = allBullets.filter(
            (l) => hasDevanagariChars(l) || /^#{2,4}\s+/.test(l.trim()) || /^\|.+\|$/.test(l.trim())
          );
          bulletSource = (hiB.length > 0 ? hiB : [q.translatedExplanation || q.explanationHi || q.explanationClean]).join('\n');
        } else {
          bulletSource = q.explanationClean || q.explanationEn || '';
        }
      } else {
        // Transform real MCQ / Q&A into full Book-Type Elements (Main Point + Sub-Point + Options Table + Diamond Bullets)
        const autoBookLines: string[] = [];
        let qPrimaryText = '';
        let qSecondaryText = '';
        if (langFilter !== 'bilingual' && langFilter !== 'english' && langFilter !== 'hindi' && q.translatedQuestion) {
          qPrimaryText = q.translatedQuestion;
        } else if (langFilter === 'english') {
          qPrimaryText = q.questionEn || q.translatedQuestion || q.rawQuestion || q.questionHi;
        } else if (langFilter === 'hindi') {
          qPrimaryText = q.questionHi || q.translatedQuestion || q.questionEn || q.rawQuestion;
        } else {
          qPrimaryText = q.questionEn || q.rawQuestion;
          qSecondaryText = q.questionHi && q.questionHi !== qPrimaryText ? q.questionHi : '';
        }
        if (qPrimaryText.trim()) {
          autoBookLines.push(`◆ [POINT ${q.qNum}] ${qPrimaryText.trim()}`);
        }
        if (qSecondaryText.trim()) {
          autoBookLines.push(`↳ ${qSecondaryText.trim()}`);
        }

        // If options exist, convert them into a 2-column Book Reference Table
        const rawOpts = (q.options || []).map((o, idx) => {
          const code = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
          const t =
            langFilter !== 'bilingual' && langFilter !== 'english' && langFilter !== 'hindi' && q.translatedOptions?.[idx]
              ? q.translatedOptions[idx]
              : langFilter === 'english'
                ? o.textEn || o.textClean
                : langFilter === 'hindi'
                  ? o.textHi || o.textClean
                  : o.textClean;
          return `(${code}) ${t.trim()}`;
        }).filter((s) => s.length > 4);

        if (rawOpts.length >= 2) {
          autoBookLines.push(`| ${rawOpts[0] || ''} | ${rawOpts[1] || ''} |`);
          if (rawOpts.length >= 3) {
            autoBookLines.push(`| ${rawOpts[2] || ''} | ${rawOpts[3] || ''} |`);
          }
        }

        // Convert explanation into Diamond Bullets (•) and Sub-Points (↳)
        let rawEx = '';
        if (langFilter !== 'bilingual' && langFilter !== 'english' && langFilter !== 'hindi' && q.translatedExplanation) {
          rawEx = q.translatedExplanation;
        } else if (langFilter === 'english') {
          rawEx = q.explanationEn || q.translatedExplanation || q.explanationClean || '';
        } else if (langFilter === 'hindi') {
          rawEx = q.explanationHi || q.translatedExplanation || q.explanationClean || '';
        } else {
          rawEx =
            q.explanationEn && q.explanationHi && q.explanationEn !== q.explanationHi
              ? `${q.explanationEn}\n${q.explanationHi}`
              : q.explanationEn || q.explanationClean || q.explanationHi || '';
        }

        if (rawEx.trim()) {
          const exParts = rawEx
            .split(/(?:\r?\n|(?<=[.।?!])\s+)/)
            .map((s) => s.trim())
            .filter(Boolean);
          exParts.forEach((part, idx) => {
            if (/^["“'].+["”']$/.test(part)) {
              autoBookLines.push(`> ${part}`);
            } else if (idx === 0) {
              autoBookLines.push(`• **Concept Explanation:** ${part}`);
            } else {
              autoBookLines.push(`↳ ${part}`);
            }
          });
        }

        bulletSource = autoBookLines.join('\n');
      }

      const bulletPoints = bulletSource
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      const bulletFontPx = fontSizePx * 0.96;
      const bulletLineHPx = Math.max(10.2, bulletFontPx * 1.28);
      const bulletFontStr = `400 ${bulletFontPx}px ${activeFontStack}`;

      let inTableBlock = false;
      bulletPoints.forEach((bLine, bIdx) => {
        const rawNoBullet = bLine.replace(/^•\s*/, '').trim();

        // 1. Sub-Heading ("### ..." or "#### ...")
        if (/^#{2,4}\s+/.test(rawNoBullet)) {
          inTableBlock = false;
          const subText = rawNoBullet.replace(/^#{2,4}\s+/, '').trim();
          const subFontPx = fontSizePx * 0.98;
          const subLineH = Math.max(14.2, subFontPx * 1.52);
          const wrappedSub = wrapTextLines(
            ctx,
            subText,
            colWidthPx - 18,
            `700 ${subFontPx}px ${activeFontStack}`
          );
          wrappedSub.forEach((lineStr) => {
            qLines.push({
              text: lineStr,
              isBold: true,
              isSubHeading: true,
              color: theme.brandPrimaryColor || theme.qPrimaryColor,
              fontSizePx: subFontPx,
              lineHeightPx: subLineH,
              indentPx: 0,
            });
          });
          return;
        }

        // 2. Book Table Row ("| Col 1 | Col 2 | Col 3 |")
        if (/^\|.+\|$/.test(rawNoBullet)) {
          if (/^\|[\s\-:|]+\|$/.test(rawNoBullet)) {
            return;
          }
          const cells = rawNoBullet
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => c.trim().replace(/\*\*/g, ''));
          const isHeaderRow = !inTableBlock;
          inTableBlock = true;
          const tableFontPx = Math.max(6.8, bulletFontPx * 0.92);
          const tableRowH = Math.max(13.4, tableFontPx * 1.68);
          qLines.push({
            text: cells.join(' | '),
            isBold: isHeaderRow,
            isTableRow: true,
            isTableHeader: isHeaderRow,
            tableCells: cells,
            color: isHeaderRow ? '#ffffff' : theme.qPrimaryColor,
            fontSizePx: tableFontPx,
            lineHeightPx: tableRowH,
            indentPx: 1,
          });
          return;
        }
        inTableBlock = false;

        // 3. Book Quote / Statement / Definition ("> ...")
        if (/^>\s+/.test(rawNoBullet)) {
          const quoteBody = rawNoBullet.replace(/^>\s+/, '').trim();
          const cleanedQuote = normalizeInlineBoldTokens(
            /[\\$^_&{}]/.test(quoteBody) ? cleanMathAndText(quoteBody) : quoteBody
          );
          const quoteFontPx = bulletFontPx * 0.96;
          const quoteLineH = Math.max(11.4, quoteFontPx * 1.38);
          const quoteFontStr = `600 ${quoteFontPx}px ${activeFontStack}`;
          const wrappedQuote = wrapTextLines(
            ctx,
            cleanedQuote,
            colWidthPx - 46,
            quoteFontStr,
            colWidthPx - 16
          );
          wrappedQuote.forEach((qStr, qLIdx) => {
            const isFirstQ = qLIdx === 0;
            const isLastQ = qLIdx === wrappedQuote.length - 1;
            qLines.push({
              text: qStr,
              isBold: true,
              isQuoteLine: true,
              isQuoteFirstLine: isFirstQ,
              isQuoteLastLine: isLastQ,
              color: theme.brandPrimaryColor || theme.qPrimaryColor,
              fontSizePx: quoteFontPx,
              lineHeightPx: isLastQ ? quoteLineH + 2.4 : quoteLineH,
              indentPx: isFirstQ ? 42 : 8,
            });
          });
          return;
        }

        // 4. Main Point ("◆ [POINT 1] ..." or "◆ [RULE 1] ...")
        const mainPtMatch = rawNoBullet.match(/^◆\s*\[([^\]]+)\]\s*(.+)$/);
        if (mainPtMatch) {
          const badgeText = mainPtMatch[1].trim();
          const ptBody = mainPtMatch[2].trim();
          const cleanedPt = normalizeInlineBoldTokens(
            /[\\$^_&{}]/.test(ptBody) ? cleanMathAndText(ptBody) : ptBody
          );
          const ptFontPx = bulletFontPx * 0.98;
          const ptLineH = Math.max(11.5, ptFontPx * 1.35);
          ctx.font = `800 ${Math.max(6.5, ptFontPx * 0.8)}px ${activeFontStack}`;
          const badgeReserveW = ctx.measureText(badgeText).width + 12;
          const wrappedPt = wrapTextLines(
            ctx,
            cleanedPt,
            colWidthPx - badgeReserveW - 8,
            `600 ${ptFontPx}px ${activeFontStack}`,
            colWidthPx - 14
          );
          wrappedPt.forEach((ptStr, ptIdx) => {
            const isLastPt = ptIdx === wrappedPt.length - 1;
            qLines.push({
              text: ptStr,
              isBold: ptIdx === 0,
              isMainPoint: true,
              mainPointBadge: ptIdx === 0 ? badgeText : undefined,
              color: theme.qPrimaryColor,
              fontSizePx: ptFontPx,
              lineHeightPx: isLastPt ? ptLineH + 1.8 : ptLineH,
              indentPx: ptIdx === 0 ? 2 : 10,
            });
          });
          return;
        }

        // 5. Sub-Point ("↳ ...")
        if (/^↳\s*/.test(rawNoBullet)) {
          const subPtBody = `↳ ${rawNoBullet.replace(/^↳\s*/, '').trim()}`;
          const cleanedSubPt = normalizeInlineBoldTokens(
            /[\\$^_&{}]/.test(subPtBody) ? cleanMathAndText(subPtBody) : subPtBody
          );
          const subPtFontPx = bulletFontPx * 0.93;
          const subPtLineH = Math.max(9.8, subPtFontPx * 1.26);
          const wrappedSubPt = wrapTextLines(
            ctx,
            cleanedSubPt,
            colWidthPx - 18,
            `400 ${subPtFontPx}px ${activeFontStack}`,
            colWidthPx - 24
          );
          wrappedSubPt.forEach((spStr, spIdx) => {
            const isLastSp = spIdx === wrappedSubPt.length - 1;
            qLines.push({
              text: spStr,
              isBold: false,
              isSubPoint: true,
              color: theme.qSecondaryColor || theme.qPrimaryColor,
              fontSizePx: subPtFontPx,
              lineHeightPx: isLastSp ? subPtLineH + 1.5 : subPtLineH,
              indentPx: spIdx === 0 ? 9 : 17,
            });
          });
          return;
        }

        // 6. Standard Diamond Bullet Point ("• ...")
        const formattedBullet = bLine.startsWith('•') ? bLine : `• ${bLine}`;
        const cleanedBullet = normalizeInlineBoldTokens(
          /[\\$^_&{}]/.test(formattedBullet)
            ? cleanMathAndText(formattedBullet)
            : formattedBullet
        );
        const wrappedBullet = wrapTextLines(
          ctx,
          cleanedBullet,
          colWidthPx - 10,
          bulletFontStr,
          colWidthPx - 18
        );
        wrappedBullet.forEach((lineStr, lIdx) => {
          const isLastLineOfBullet = lIdx === wrappedBullet.length - 1;
          const extraBulletGap =
            isLastLineOfBullet && bIdx < bulletPoints.length - 1 ? 2.2 : 0;
          qLines.push({
            text: lineStr,
            isBold: false,
            color: theme.qPrimaryColor,
            fontSizePx: bulletFontPx,
            lineHeightPx: bulletLineHPx + extraBulletGap,
            indentPx: lIdx === 0 ? 2 : 10,
          });
        });
      });

      const rawAnsOrTakeaway =
        langFilter !== 'bilingual' && langFilter !== 'english' && langFilter !== 'hindi' && q.translatedAnswer
          ? q.translatedAnswer
          : langFilter === 'english'
            ? q.answerTextEn || q.answerClean
            : langFilter === 'hindi'
              ? q.answerTextHi || q.answerClean
              : q.answerClean;

      if (rawAnsOrTakeaway && rawAnsOrTakeaway.trim()) {
        const rawCalloutLines = rawAnsOrTakeaway
          .trim()
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean);

        rawCalloutLines.forEach((singleCallout) => {
          const rawRuleLine = q.isTheoryNote
            ? singleCallout
            : `★ KEY ANSWER: ${q.answerOption && config.showOptionCode ? `${q.answerOption} ` : ''}${singleCallout}`;
          const badgeMatch = rawRuleLine.match(
            /^([★⚡📐⚠]\s*(?:KEY\s*TAKEAWAY|EXTRA\s*BOOSTER|MEMORY\s*TRICK|FORMULA|EXCEPTION|GOLDEN\s*RULE|KEY\s*ANSWER|Key\s*Takeaway|Key\s*Answer))\s*:\s*(.+)$/i
          );
          const extractedBadge = badgeMatch ? badgeMatch[1].toUpperCase() : '★ KEY TAKEAWAY';
          const ruleBody = badgeMatch ? badgeMatch[2].trim() : rawRuleLine;
          const cleanedRule = normalizeInlineBoldTokens(
            /[\\$^_&{}]/.test(ruleBody) ? cleanMathAndText(ruleBody) : ruleBody
          );
          const ruleFontStr = `700 ${bulletFontPx}px ${activeFontStack}`;
          ctx.font = `800 ${Math.max(6.4, bulletFontPx * 0.78)}px ${activeFontStack}`;
          const calloutBadgeW = ctx.measureText(extractedBadge).width + 10;
          const wrappedRule = wrapTextLines(
            ctx,
            cleanedRule,
            colWidthPx - calloutBadgeW - 14,
            ruleFontStr,
            colWidthPx - 20
          );
          wrappedRule.forEach((lineStr, lIdx) => {
            aLines.push({
              text: lineStr,
              isBold: true,
              calloutBadge: lIdx === 0 ? extractedBadge : undefined,
              color: theme.ansColor || theme.qPrimaryColor,
              fontSizePx: bulletFontPx,
              lineHeightPx: bulletLineHPx + 1.4,
              indentPx: lIdx === 0 ? 5 : 10,
            });
          });
        });
      }

      const qHeight = qLines.reduce((sum, l) => sum + l.lineHeightPx, 0);
      const aHeight = aLines.reduce((sum, l) => sum + l.lineHeightPx, 0);
      const totalLines = qLines.length + aLines.length;
      const heightPx =
        qHeight +
        (aLines.length > 0 ? qToAGapPx + ansPadYPx + aHeight + 4.5 : 0) +
        padBottomPx +
        3.5;

      return {
        q,
        qIndex: globalQIdx,
        qLines,
        aLines,
        totalLines,
        heightPx,
        qToAGapPx: aLines.length > 0 ? qToAGapPx : 0,
        ansPadYPx: aLines.length > 0 ? ansPadYPx : 0,
      };
    }

    // In Chapter-wise mode, insert a Chapter Heading Banner whenever a new chapter starts
    if (config.questionFormatMode === 'chapterwise') {
      const prevChapter = qIdx > 0 ? batch[qIdx - 1]?.chapter : prevBatchChapter;
      if (q.chapter && q.chapter !== prevChapter) {
        const chFontPx = Math.max(8.6, fontSizePx * 1.02);
        const chLineH = Math.max(16.0, chFontPx * 1.75);
        qLines.push({
          text: `${q.chapter.toUpperCase()}`,
          isBold: true,
          isChapterHeading: true,
          color: theme.chapterTextColor,
          fontSizePx: chFontPx,
          lineHeightPx: chLineH,
          indentPx: 7,
        });
      }
    }

    qTexts.forEach((paragraph, pIdx) => {
      const fullText = pIdx === 0 ? `${q.qNum}. ${paragraph}` : paragraph;
      const fontStr = `${pIdx === 0 ? '600' : '400'} ${fontSizePx}px ${activeFontStack}`;
      const firstLineMaxW = pIdx === 0 ? colWidthPx - 6 - qBadgeIndentReserve : colWidthPx - 6;
      const wrapped = wrapTextLines(ctx, fullText, firstLineMaxW, fontStr, colWidthPx - 6);
      wrapped.forEach((lineStr) => {
        qLines.push({
          text: lineStr,
          isBold: pIdx === 0,
          color: pIdx === 0 ? theme.qPrimaryColor : theme.qSecondaryColor,
          fontSizePx,
          lineHeightPx,
          indentPx: 0,
        });
      });
    });

    const effectiveBodyMode =
      config.questionFormatMode === 'chapterwise'
        ? config.chapterSubFormat || 'oneliner'
        : config.questionFormatMode;

    if (effectiveBodyMode === 'options' || effectiveBodyMode === 'ppt') {
      const optFontStr = `600 ${fontSizePx}px ${activeFontStack}`;
      optionTexts.forEach((optStr) => {
        const codeMatch = optStr.match(/^\(([A-Da-d1-4])\)\s*(.*)$/);
        const optCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;
        const wrappedOpt = wrapTextLines(
          ctx,
          optStr,
          colWidthPx - 14,
          optFontStr,
          colWidthPx - 22
        );
        wrappedOpt.forEach((lineStr, lIdx) => {
          aLines.push({
            text: lineStr,
            isBold: false,
            lineRole: lIdx === 0 ? 'option-first' : 'option-cont',
            optionCode: lIdx === 0 ? optCode : undefined,
            color: theme.optionColor,
            fontSizePx,
            lineHeightPx,
            indentPx: lIdx === 0 ? 4 : 16,
          });
        });
      });
    } else if (effectiveBodyMode === 'explanation') {
      // 1. 4 Options (A, B, C, D) — account for both first-line and hanging indent so text never touches center divider
      const optFontStr = `600 ${fontSizePx}px ${activeFontStack}`;
      optionTexts.forEach((optStr) => {
        const codeMatch = optStr.match(/^\(([A-Da-d1-4])\)\s*(.*)$/);
        const optCode = codeMatch ? codeMatch[1].toUpperCase() : undefined;
        const wrappedOpt = wrapTextLines(
          ctx,
          optStr,
          colWidthPx - 14,
          optFontStr,
          colWidthPx - 22
        );
        wrappedOpt.forEach((lineStr, lIdx) => {
          aLines.push({
            text: lineStr,
            isBold: false,
            lineRole: lIdx === 0 ? 'option-first' : 'option-cont',
            optionCode: lIdx === 0 ? optCode : undefined,
            color: theme.optionColor,
            fontSizePx,
            lineHeightPx,
            indentPx: lIdx === 0 ? 4 : 16,
          });
        });
      });

      // 2. Right Answer (Ans: (A) ...) in Bold Accent Color
      const ansFontStr = `700 ${fontSizePx}px ${activeFontStack}`;
      const wrappedAns = wrapTextLines(
        ctx,
        ansText,
        colWidthPx - 12,
        ansFontStr,
        colWidthPx - 18
      );
      wrappedAns.forEach((lineStr, lIdx) => {
        aLines.push({
          text: lineStr,
          isBold: true,
          lineRole: lIdx === 0 ? 'ans-first' : 'ans-cont',
          color: theme.ansColor || '#047857',
          fontSizePx,
          lineHeightPx: lIdx === 0 ? lineHeightPx + 4.2 : lineHeightPx,
          indentPx: lIdx === 0 ? 0 : 8,
        });
      });

      // 3. Explanation (Explanation: ... / व्याख्या: ...)
      const exFontSizePx = fontSizePx * 0.96;
      const exLineHeightPx = Math.max(6.8, exFontSizePx * 1.24);
      let firstExAdded = false;
      exTexts.forEach((exParagraph, exIdx) => {
        const exWeight = exIdx === 0 ? '600' : '500';
        const exFontStr = `${exWeight} ${exFontSizePx}px ${activeFontStack}`;
        const wrappedEx = wrapTextLines(
          ctx,
          exParagraph,
          colWidthPx - 12,
          exFontStr,
          colWidthPx - 16
        );
        wrappedEx.forEach((lineStr, lIdx) => {
          const isVeryFirstExLine = !firstExAdded && lIdx === 0;
          if (isVeryFirstExLine) firstExAdded = true;
          aLines.push({
            text: lineStr,
            isBold: false,
            lineRole: isVeryFirstExLine ? 'ex-first' : 'ex-cont',
            color: exIdx === 0 ? theme.exPrimaryColor : theme.exSecondaryColor,
            fontSizePx: exFontSizePx,
            lineHeightPx: exLineHeightPx,
            indentPx: lIdx === 0 ? 3 : 8,
          });
        });
      });
    } else {
      const ansFontStr = `700 ${fontSizePx}px ${activeFontStack}`;
      const wrappedAns = wrapTextLines(ctx, ansText, colWidthPx - 12, ansFontStr);
      wrappedAns.forEach((lineStr, lIdx) => {
        aLines.push({
          text: lineStr,
          isBold: true,
          lineRole: lIdx === 0 ? 'ans-first' : 'ans-cont',
          color: theme.ansColor || '#047857',
          fontSizePx,
          lineHeightPx: lIdx === 0 ? lineHeightPx + 4.2 : lineHeightPx,
          indentPx: 0,
        });
      });
    }

    const totalLines = qLines.length + aLines.length;
    const heightPx =
      totalLines * lineHeightPx +
      qToAGapPx +
      ansPadYPx +
      padBottomPx;

    return {
      q,
      qIndex: globalQIdx,
      qLines,
      aLines,
      totalLines,
      heightPx,
      qToAGapPx,
      ansPadYPx,
    };
  });
}

function splitMeasuredBlockToFit(
  block: MeasuredBlock,
  maxFitHeightPx: number,
  padBottomPx: number = 3.5
): [MeasuredBlock, MeasuredBlock] | null {
  if (maxFitHeightPx < 48 || block.qLines.length < 3) return null;

  let accH = 0;
  let splitIdx = 0;
  const maxLinesH = maxFitHeightPx - (padBottomPx + 3.5);

  for (let i = 0; i < block.qLines.length; i++) {
    const nextH = accH + block.qLines[i].lineHeightPx;
    if (nextH > maxLinesH) break;
    accH = nextH;
    splitIdx = i + 1;
  }

  // Prevent leaving an orphaned Chapter Heading, Sub-Heading, or Table Header at the very bottom of the column
  while (
    splitIdx > 0 &&
    (block.qLines[splitIdx - 1]?.isChapterHeading ||
      block.qLines[splitIdx - 1]?.isSubHeading ||
      block.qLines[splitIdx - 1]?.isTableHeader)
  ) {
    splitIdx--;
  }

  // Need at least 2 lines in top part and at least 1 line (or aLines) in bottom part
  if (splitIdx < 2 || splitIdx >= block.qLines.length) {
    return null;
  }

  const topQLines = block.qLines.slice(0, splitIdx);
  const bottomQLines = block.qLines.slice(splitIdx);

  // If we split right in the middle of a table, repeat the table header row at the top of the continuation!
  if (bottomQLines[0]?.isTableRow && !bottomQLines[0]?.isTableHeader) {
    for (let k = splitIdx - 1; k >= 0; k--) {
      if (block.qLines[k]?.isTableHeader) {
        bottomQLines.unshift({ ...block.qLines[k] });
        break;
      }
      if (!block.qLines[k]?.isTableRow) break;
    }
  }

  const topQHeight = topQLines.reduce((sum, l) => sum + l.lineHeightPx, 0);
  const bottomQHeight = bottomQLines.reduce((sum, l) => sum + l.lineHeightPx, 0);
  const aHeight = block.aLines.reduce((sum, l) => sum + l.lineHeightPx, 0);

  const topPart: MeasuredBlock = {
    ...block,
    qLines: topQLines,
    aLines: [],
    totalLines: topQLines.length,
    heightPx: topQHeight + padBottomPx + 3.5,
    qToAGapPx: 0,
    ansPadYPx: 0,
  };

  const bottomPart: MeasuredBlock = {
    ...block,
    qLines: bottomQLines,
    aLines: block.aLines,
    totalLines: bottomQLines.length + block.aLines.length,
    heightPx:
      bottomQHeight +
      (block.aLines.length > 0
        ? block.qToAGapPx + block.ansPadYPx + aHeight + 4.5
        : 0) +
      padBottomPx +
      3.5,
  };

  return [topPart, bottomPart];
}

function justifyColumnBlocksToFullHeight(
  blocks: MeasuredBlock[],
  xPx: number,
  contentTopPx: number,
  colWidthPx: number,
  targetHeightPx: number,
  baseGapPx: number,
  columnIndex: 0 | 1,
  autoFill: boolean
): PaginatedItem[] {
  if (blocks.length === 0) return [];

  const rawBlocksH = blocks.reduce((sum, b) => sum + b.heightPx, 0);
  const numGaps = Math.max(0, blocks.length - 1);
  const rawTotalH = rawBlocksH + numGaps * baseGapPx;

  let extraSlackPx = targetHeightPx - rawTotalH;
  if (!autoFill || extraSlackPx < 0) {
    extraSlackPx = 0;
  }

  const totalLinesInCol = blocks.reduce((sum, b) => sum + b.totalLines, 0);
  // If there is only 1 block in the column (numGaps === 0), 100% of slack must go into its lines so it fills from Header to Footer!
  const lineSlackShare =
    numGaps === 0
      ? extraSlackPx
      : Math.min(extraSlackPx * 0.72, totalLinesInCol * 12.0);
  const extraPerLinePx =
    totalLinesInCol > 0 ? lineSlackShare / totalLinesInCol : 0;

  const remainingSlackPx = Math.max(0, extraSlackPx - lineSlackShare);
  const finalGapPx =
    numGaps > 0
      ? baseGapPx + remainingSlackPx / numGaps
      : baseGapPx;

  const items: PaginatedItem[] = [];
  let curY = contentTopPx;

  blocks.forEach((b, idx) => {
    const adjustedQLines = b.qLines.map((l) => ({
      ...l,
      lineHeightPx: l.lineHeightPx + extraPerLinePx,
    }));
    const adjustedALines = b.aLines.map((l) => ({
      ...l,
      lineHeightPx: l.lineHeightPx + extraPerLinePx,
    }));

    const adjustedBlockH = b.heightPx + b.totalLines * extraPerLinePx;

    const isLast = idx === blocks.length - 1;
    const finalHeightPx =
      autoFill && isLast
        ? Math.max(adjustedBlockH, contentTopPx + targetHeightPx - curY)
        : adjustedBlockH;

    items.push({
      type: 'qa-block',
      column: columnIndex,
      xPx,
      yPx: curY,
      widthPx: colWidthPx,
      heightPx: finalHeightPx,
      qToAGapPx: b.qToAGapPx,
      ansPadYPx: b.ansPadYPx,
      qLabel: String(b.q.qNum),
      questionId: b.q.id,
      qIndex: b.qIndex,
      chapter: b.q.chapter,
      qLines: adjustedQLines,
      aLines: adjustedALines,
    });

    curY += finalHeightPx + finalGapPx;
  });

  return items;
}

let sharedMeasureCtx: CanvasRenderingContext2D | null = null;
function getSharedMeasureCtx(): CanvasRenderingContext2D {
  if (!sharedMeasureCtx) {
    const c = document.createElement('canvas');
    c.width = 10;
    c.height = 10;
    sharedMeasureCtx = c.getContext('2d')!;
  }
  return sharedMeasureCtx;
}

function evaluateBatchAtFont(
  ctx: CanvasRenderingContext2D,
  batch: ParsedQuestion[],
  colWidthPx: number,
  testFontPt: number,
  config: PdfLayoutConfig,
  batchStartIndex: number = 0,
  prevBatchChapter: string = ''
): {
  blocks: MeasuredBlock[];
  gapPx: number;
  splitIndex: number;
  maxColH: number;
} {
  const ratio = testFontPt >= 8.0 ? 1.24 : 1.18;
  const padBottom = testFontPt >= 8.0 ? 3.6 : 2.8;
  const gapPx = testFontPt >= 8.0 ? 6.2 : 5.0;

  const blocks = measureQuestionBatch(
    ctx,
    batch,
    colWidthPx,
    testFontPt,
    config,
    ratio,
    padBottom,
    batchStartIndex,
    prevBatchChapter
  );

  const n = blocks.length;
  if (n === 0) {
    return { blocks, gapPx, splitIndex: 0, maxColH: 0 };
  }

  // O(N) prefix sum of block heights
  const prefixH = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    prefixH[i + 1] = prefixH[i] + blocks[i].heightPx;
  }

  if (config.columns === 1) {
    const totalH = prefixH[n] + Math.max(0, n - 1) * gapPx;
    return { blocks, gapPx, splitIndex: n, maxColH: totalH };
  }

  let bestSplit = Math.ceil(n / 2);
  let bestMaxColH = Infinity;

  for (let split = 1; split <= n; split++) {
    const col1Count = split;
    const col2Count = n - split;
    const col1H = prefixH[split] + Math.max(0, col1Count - 1) * gapPx;
    const col2H =
      prefixH[n] - prefixH[split] + Math.max(0, col2Count - 1) * gapPx;
    const maxH = col1H > col2H ? col1H : col2H;
    if (maxH < bestMaxColH) {
      bestMaxColH = maxH;
      bestSplit = split;
    }
  }

  return { blocks, gapPx, splitIndex: bestSplit, maxColH: bestMaxColH };
}

function layoutFixedCountPage(
  ctx: CanvasRenderingContext2D,
  batch: ParsedQuestion[],
  pageNumber: number,
  meta: ExamDocumentMeta,
  config: PdfLayoutConfig,
  batchStartIndex: number = 0,
  prevBatchChapter: string = ''
): PaginatedA4Page {
  const pageWidthPx = A4_WIDTH_IN * BASE_DPI;
  const pageHeightPx = A4_HEIGHT_IN * BASE_DPI;
  const marginPx = config.marginInches * BASE_DPI;

  const headerOffsetPx = config.showDocumentHeader ? HEADER_RESERVE_PX : 0;
  const footerOffsetPx = config.showPageNumbers ? FOOTER_RESERVE_PX : 0;

  const contentLeftPx = marginPx;
  const contentTopPx = marginPx + headerOffsetPx;
  const contentWidthPx = pageWidthPx - marginPx * 2;
  const availableHeightPx =
    pageHeightPx - marginPx * 2 - headerOffsetPx - footerOffsetPx;

  const colGapPx = config.columns === 2 ? 20 : 0;
  const colWidthPx =
    config.columns === 2
      ? (contentWidthPx - colGapPx) / 2
      : contentWidthPx;

  const minFontPt = 4.6;
  const maxFontPt = config.autoFillFullPage ? 11.6 : config.fontSizePt;

  let chosenEval = evaluateBatchAtFont(
    ctx,
    batch,
    colWidthPx,
    minFontPt,
    config,
    batchStartIndex,
    prevBatchChapter
  );
  let chosenFontPt = minFontPt;

  // Fast 4-step binary search for instant bulk layout
  let low = minFontPt;
  let high = maxFontPt;
  for (let step = 0; step < 4; step++) {
    const mid = Math.round(((low + high) / 2) * 100) / 100;
    const ev = evaluateBatchAtFont(
      ctx,
      batch,
      colWidthPx,
      mid,
      config,
      batchStartIndex,
      prevBatchChapter
    );
    if (ev.maxColH <= availableHeightPx) {
      chosenEval = ev;
      chosenFontPt = mid;
      low = mid + 0.12;
    } else {
      high = mid - 0.12;
    }
  }

  const {
    blocks: chosenBlocks,
    gapPx: chosenGapPx,
    splitIndex: chosenSplitIndex,
  } = chosenEval;

  let items: PaginatedItem[] = [];

  if (config.columns === 1) {
    items = justifyColumnBlocksToFullHeight(
      chosenBlocks,
      contentLeftPx,
      contentTopPx,
      colWidthPx,
      availableHeightPx,
      chosenGapPx,
      0,
      config.autoFillFullPage
    );
  } else {
    const col1 = chosenBlocks.slice(0, chosenSplitIndex);
    const col2 = chosenBlocks.slice(chosenSplitIndex);
    const col2X = contentLeftPx + colWidthPx + colGapPx;

    const col1Items = justifyColumnBlocksToFullHeight(
      col1,
      contentLeftPx,
      contentTopPx,
      colWidthPx,
      availableHeightPx,
      chosenGapPx,
      0,
      config.autoFillFullPage
    );
    const col2Items = justifyColumnBlocksToFullHeight(
      col2,
      col2X,
      contentTopPx,
      colWidthPx,
      availableHeightPx,
      chosenGapPx,
      1,
      config.autoFillFullPage
    );
    items = [...col1Items, ...col2Items];
  }

  return {
    pageNumber,
    startQLabel: String(batch[0]?.qNum || ''),
    endQLabel: String(batch[batch.length - 1]?.qNum || ''),
    questionCount: batch.length,
    effectiveFontPt: chosenFontPt,
    headerRightText: computePageRightHeader(batch, meta, config),
    items,
  };
}

function paginatePptSlides(
  ctx: CanvasRenderingContext2D,
  meta: ExamDocumentMeta,
  questions: ParsedQuestion[],
  config: PdfLayoutConfig
): PaginatedA4Page[] {
  const slideWidthPx = PPT_WIDTH_IN * BASE_DPI;
  const slideHeightPx = PPT_HEIGHT_IN * BASE_DPI;
  const marginPx = config.marginInches * BASE_DPI;

  const headerOffsetPx = config.showDocumentHeader ? HEADER_RESERVE_PX : 0;
  const footerOffsetPx = config.showPageNumbers ? FOOTER_RESERVE_PX : 0;

  const contentLeftPx = marginPx;
  const contentTopPx = marginPx + headerOffsetPx;
  const contentWidthPx = slideWidthPx - marginPx * 2;
  const availableHeightPx =
    slideHeightPx - marginPx * 2 - headerOffsetPx - footerOffsetPx;
  const theme = getPdfDesignTheme(config.designTheme);

  return questions.map((q, idx) => {
    const { qTexts, optionTexts } = getQuestionDisplayLines(q, config);
    const fourOptions = optionTexts.slice(0, 4);

    const buildSlideLines = (fontPt: number) => {
      const fontSizePx = (fontPt * BASE_DPI) / 72;
      const qLineHeightPx = Math.max(9.5, fontSizePx * 1.32);
      const optFontSizePx = fontSizePx * 0.94;
      const optLineHeightPx = Math.max(8.8, optFontSizePx * 1.34);
      const qToAGapPx = Math.max(6, fontSizePx * 0.65);
      const optItemGapPx = Math.max(4, optFontSizePx * 0.42);

      const qLines: RenderedBlockLine[] = [];
      qTexts.forEach((paragraph, pIdx) => {
        const fullText = pIdx === 0 ? `${q.qNum}. ${paragraph}` : paragraph;
        const fontStr = `${pIdx === 0 ? '700' : '600'} ${fontSizePx}px ${FONT_FAMILY}`;
        const wrapped = wrapTextLines(ctx, fullText, contentWidthPx - 8, fontStr);
        wrapped.forEach((lineStr) => {
          qLines.push({
            text: lineStr,
            isBold: true,
            color: pIdx === 0 ? theme.qPrimaryColor : theme.qSecondaryColor,
            fontSizePx,
            lineHeightPx: qLineHeightPx,
            indentPx: 0,
          });
        });
      });

      const aLines: RenderedBlockLine[] = [];
      const optEndLineIndices = new Set<number>();

      fourOptions.forEach((optStr, optIdx) => {
        const fontStr = `600 ${optFontSizePx}px ${FONT_FAMILY}`;
        const wrappedOpt = wrapTextLines(ctx, optStr, contentWidthPx - 16, fontStr);
        const isLastOption = optIdx === fourOptions.length - 1;
        wrappedOpt.forEach((lineStr, lIdx) => {
          const isLastLineOfOpt = lIdx === wrappedOpt.length - 1;
          aLines.push({
            text: lineStr,
            isBold: false,
            color: theme.optionColor,
            fontSizePx: optFontSizePx,
            lineHeightPx:
              isLastLineOfOpt && !isLastOption
                ? optLineHeightPx + optItemGapPx
                : optLineHeightPx,
            indentPx: lIdx === 0 ? 4 : 24,
          });
          if (isLastLineOfOpt && !isLastOption) {
            optEndLineIndices.add(aLines.length - 1);
          }
        });
      });

      const qHeight = qLines.reduce((acc, l) => acc + l.lineHeightPx, 0);
      const aHeight = aLines.reduce((acc, l) => acc + l.lineHeightPx, 0);
      const totalH = qHeight + qToAGapPx + aHeight;
      return { qLines, aLines, optEndLineIndices, qToAGapPx, totalH };
    };

    const minFontPt = 6.2;
    const maxFontPt = 25.0;

    let bestLayout = buildSlideLines(minFontPt);
    let chosenFontPt = minFontPt;

    // Fast 5-step binary search so every slide fits 100% between Header and Footer
    let low = minFontPt;
    let high = maxFontPt;
    for (let step = 0; step < 5; step++) {
      const mid = Math.round(((low + high) / 2) * 100) / 100;
      const candidate = buildSlideLines(mid);
      if (candidate.totalH <= availableHeightPx) {
        bestLayout = candidate;
        chosenFontPt = mid;
        low = mid + 0.25;
      } else {
        high = mid - 0.25;
      }
    }

    // Justify Question + 4 Options across the full slide height from Header down to Footer
    const extraSlackPx = Math.max(0, availableHeightPx - bestLayout.totalH);
    const totalLines = bestLayout.qLines.length + bestLayout.aLines.length;
    const maxExtraPerLinePx = 5.5;
    const lineSlackShare = Math.min(
      extraSlackPx * 0.45,
      totalLines * maxExtraPerLinePx
    );
    const extraPerLinePx = totalLines > 0 ? lineSlackShare / totalLines : 0;

    const remainingGapSlackPx = Math.max(0, extraSlackPx - lineSlackShare);
    // Distribute remaining vertical space across Q->Option(A) gap and the gaps between (A), (B), (C), (D)
    const numInterOptGaps = bestLayout.optEndLineIndices.size;
    const totalGapSlots = 1 + numInterOptGaps; // 1 for qToAGap + 3 inter-option gaps
    const extraPerGapSlotPx =
      totalGapSlots > 0 ? remainingGapSlackPx / totalGapSlots : 0;

    const justifiedQLines = bestLayout.qLines.map((l) => ({
      ...l,
      lineHeightPx: l.lineHeightPx + extraPerLinePx,
    }));

    const justifiedALines = bestLayout.aLines.map((l, aIdx) => ({
      ...l,
      lineHeightPx:
        l.lineHeightPx +
        extraPerLinePx +
        (bestLayout.optEndLineIndices.has(aIdx) ? extraPerGapSlotPx : 0),
    }));

    const justifiedQToAGapPx = bestLayout.qToAGapPx + extraPerGapSlotPx;

    const item: PaginatedItem = {
      type: 'qa-block',
      column: 0,
      xPx: contentLeftPx,
      yPx: contentTopPx,
      widthPx: contentWidthPx,
      heightPx: availableHeightPx,
      qLines: justifiedQLines,
      aLines: justifiedALines,
      qToAGapPx: justifiedQToAGapPx,
      ansPadYPx: 0,
      qLabel: String(q.qNum),
      questionId: q.id,
      qIndex: idx,
      chapter: q.chapter,
    };

    return {
      pageNumber: idx + 1,
      startQLabel: String(q.qNum),
      endQLabel: String(q.qNum),
      questionCount: 1,
      effectiveFontPt: chosenFontPt,
      headerRightText: computePageRightHeader([q], meta, config),
      items: [item],
    };
  });
}

function attachChapterwiseIndexPages(
  meta: ExamDocumentMeta,
  questions: ParsedQuestion[],
  contentPages: PaginatedA4Page[],
  config: PdfLayoutConfig
): PaginatedA4Page[] {
  if (config.questionFormatMode !== 'chapterwise' || contentPages.length === 0) {
    return contentPages;
  }

  // Discover all ordered Topics/Chapters from the questions array
  const discoveredTopics: {
    topicNumber: number;
    topicName: string;
    questionCount: number;
    startQLabel: string;
    endQLabel: string;
    firstQIndex: number;
    contentPageIndex: number;
  }[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const chName = (q.chapter || 'Topic 1').trim();
    const prevChName = i > 0 ? (questions[i - 1].chapter || 'Topic 1').trim() : '';
    if (i === 0 || chName !== prevChName) {
      discoveredTopics.push({
        topicNumber: discoveredTopics.length + 1,
        topicName: chName,
        questionCount: 1,
        startQLabel: String(q.qNum),
        endQLabel: String(q.qNum),
        firstQIndex: i,
        contentPageIndex: 0,
      });
    } else {
      const lastTopic = discoveredTopics[discoveredTopics.length - 1];
      lastTopic.questionCount += 1;
      lastTopic.endQLabel = String(q.qNum);
    }
  }

  if (discoveredTopics.length === 0) {
    return contentPages;
  }

  // Map each discovered topic to the exact 0-based page index in contentPages where its first question lands
  for (const topic of discoveredTopics) {
    let foundPageIdx = 0;
    for (let pIdx = 0; pIdx < contentPages.length; pIdx++) {
      if (contentPages[pIdx].items.some((it) => it.qIndex === topic.firstQIndex)) {
        foundPageIdx = pIdx;
        break;
      }
    }
    topic.contentPageIndex = foundPageIdx;
  }

  // Up to 40 topics per Index page (1-20 in 1 column, 21-40 in 2 columns); automatically spans multiple Index pages if > 40 topics
  const maxTopicsPerIndexPage = 40;
  const numIndexPages = Math.max(
    1,
    Math.ceil(discoveredTopics.length / maxTopicsPerIndexPage)
  );

  const pageWidthPx = A4_WIDTH_IN * BASE_DPI;
  const pageHeightPx = A4_HEIGHT_IN * BASE_DPI;
  const marginPx = config.marginInches * BASE_DPI;
  const headerOffsetPx = config.showDocumentHeader ? HEADER_RESERVE_PX : 0;
  const footerOffsetPx = config.showPageNumbers ? FOOTER_RESERVE_PX : 0;
  const contentTopPx = marginPx + headerOffsetPx;
  const contentWidthPx = pageWidthPx - marginPx * 2;
  const availableHeightPx =
    pageHeightPx - marginPx * 2 - headerOffsetPx - footerOffsetPx;

  const bannerH = 40;
  const tableHeaderH = 21;
  const rowsStartY = contentTopPx + 2 + bannerH + 8 + tableHeaderH + 6;
  const rowsAvailableH = Math.max(
    200,
    contentTopPx + availableHeightPx - rowsStartY - 4
  );

  const indexPages: PaginatedA4Page[] = [];
  const defaultHeaderRight = computePageRightHeader(questions, meta, config);

  for (let idxPage = 0; idxPage < numIndexPages; idxPage++) {
    const pageTopics = discoveredTopics.slice(
      idxPage * maxTopicsPerIndexPage,
      (idxPage + 1) * maxTopicsPerIndexPage
    );

    const isTwoColIndex = pageTopics.length > 20;
    const rowsInLeftCol = isTwoColIndex
      ? Math.ceil(pageTopics.length / 2)
      : pageTopics.length;
    const colGap = isTwoColIndex ? 14 : 0;
    const colW = isTwoColIndex ? (contentWidthPx - colGap) / 2 : contentWidthPx;
    const rowGap = pageTopics.length <= 12 ? 6.5 : 4.5;
    const maxRowH = isTwoColIndex ? 31 : 35;
    const minRowH = 20;
    const computedRowH =
      (rowsAvailableH - Math.max(0, rowsInLeftCol - 1) * rowGap) /
      Math.max(1, rowsInLeftCol);
    const rowH = Math.min(maxRowH, Math.max(minRowH, computedRowH));

    const entries: IndexPageEntry[] = pageTopics.map((topic, k) => {
      const colIdx = isTwoColIndex && k >= rowsInLeftCol ? 1 : 0;
      const rowIdx = colIdx === 0 ? k : k - rowsInLeftCol;
      const xPx = marginPx + colIdx * (colW + colGap);
      const yPx = rowsStartY + rowIdx * (rowH + rowGap);
      return {
        topicNumber: topic.topicNumber,
        topicName: topic.topicName,
        questionCount: topic.questionCount,
        startQLabel: topic.startQLabel,
        endQLabel: topic.endQLabel,
        targetPageNumber: numIndexPages + topic.contentPageIndex + 1,
        xPx,
        yPx,
        widthPx: colW,
        heightPx: rowH,
      };
    });

    indexPages.push({
      pageNumber: idxPage + 1,
      startQLabel: 'INDEX',
      endQLabel: 'INDEX',
      questionCount: questions.length,
      effectiveFontPt: config.fontSizePt,
      headerRightText: defaultHeaderRight,
      isIndexPage: true,
      indexEntries: entries,
      totalTopicsCount: discoveredTopics.length,
      totalQuestionsCount: questions.length,
      items: [],
    });
  }

  const shiftedContentPages: PaginatedA4Page[] = contentPages.map((p) => ({
    ...p,
    pageNumber: p.pageNumber + numIndexPages,
  }));

  return [...indexPages, ...shiftedContentPages];
}

export function paginateQuestionsForA4(
  meta: ExamDocumentMeta,
  questions: ParsedQuestion[],
  config: PdfLayoutConfig
): PaginatedA4Page[] {
  if (questions.length === 0) return [];

  const ctx = getSharedMeasureCtx();

  if (config.questionFormatMode === 'ppt') {
    return paginatePptSlides(ctx, meta, questions, config);
  }

  const isTheoryMode = config.questionFormatMode === 'theory';

  if (
    !isTheoryMode &&
    typeof config.questionsPerPage === 'number' &&
    config.questionsPerPage > 0
  ) {
    const chunkSize = config.questionsPerPage;
    const pages: PaginatedA4Page[] = [];

    for (let i = 0; i < questions.length; i += chunkSize) {
      const batch = questions.slice(i, i + chunkSize);
      const prevChapter = i > 0 ? questions[i - 1]?.chapter || '' : '';
      const page = layoutFixedCountPage(
        ctx,
        batch,
        pages.length + 1,
        meta,
        config,
        i,
        prevChapter
      );
      pages.push(page);
    }
    return attachChapterwiseIndexPages(meta, questions, pages, config);
  }

  const pageWidthPx = A4_WIDTH_IN * BASE_DPI;
  const pageHeightPx = A4_HEIGHT_IN * BASE_DPI;

  const marginLeftPx = isTheoryMode ? 0.3 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginRightPx = isTheoryMode ? 0.1 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginTopPx = isTheoryMode ? 0.1 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginBottomPx = isTheoryMode ? 0.1 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginPx = marginLeftPx;

  const baseHeaderPx = config.showDocumentHeader ? (isTheoryMode ? 15 : HEADER_RESERVE_PX) : 0;
  const footerOffsetPx = config.showPageNumbers ? (isTheoryMode ? 14 : FOOTER_RESERVE_PX) : 0;
  const contentLeftPx = marginLeftPx;
  const contentWidthPx = pageWidthPx - marginLeftPx - marginRightPx;

  const colGapPx = isTheoryMode ? 14 : (config.columns === 2 ? 20 : 0);
  const effectiveColumns = isTheoryMode ? 2 : config.columns;
  const colWidthPx =
    effectiveColumns === 2
      ? (contentWidthPx - colGapPx) / 2
      : contentWidthPx;

  // In 'theory' mode (Publication Book-Type format), Page 1 has a full-width Royal Book Titleplate Banner at the top!
  let page1BannerLines: string[] = [];
  let page1BannerHeightPx = 0;
  if (isTheoryMode) {
    const rawBannerTitle = (
      config.lectureBannerTitle ||
      meta.title?.replace(/_/g, ' ') ||
      'संविधान की प्रमुख विशेषताएं - COMPLETE THEORY NOTES'
    ).trim();
    const bannerFontPx = 13.0;
    const activeFontStack = resolveActivePdfFontFamily(config);
    page1BannerLines = wrapTextLines(
      ctx,
      rawBannerTitle.toUpperCase(),
      contentWidthPx - 40,
      `800 ${bannerFontPx}px ${activeFontStack}`
    );
    page1BannerHeightPx = page1BannerLines.length * 16.5 + 14;
  }

  const effectiveFontPt = isTheoryMode
    ? Math.min(9.6, Math.max(8.0, config.fontSizePt || 8.8))
    : config.fontSizePt;

  const blocks = measureQuestionBatch(
    ctx,
    questions,
    colWidthPx,
    effectiveFontPt,
    config,
    isTheoryMode ? 1.28 : 1.25,
    isTheoryMode ? 3.0 : 4
  );
  const blockGapPx = isTheoryMode ? 3.8 : 6.5;

  const workingBlocks = [...blocks];
  const pages: PaginatedA4Page[] = [];
  let idx = 0;

  const canSplitBlocks =
    isTheoryMode ||
    config.questionFormatMode === 'explanation' ||
    (config.questionFormatMode === 'chapterwise' &&
      config.chapterSubFormat === 'explanation');

  while (idx < workingBlocks.length) {
    const isFirstPage = pages.length === 0;
    const headerOffsetPx = isTheoryMode
      ? baseHeaderPx + (isFirstPage ? page1BannerHeightPx : 0)
      : baseHeaderPx;
    const contentTopPx = marginTopPx + headerOffsetPx;
    const availableHeightPx =
      pageHeightPx - marginTopPx - marginBottomPx - headerOffsetPx - footerOffsetPx;

    // Check if all remaining blocks fit on this single final page with room to spare in 2-column mode;
    // if so, target half the total remaining height per column so both Column 1 and Column 2 are balanced and filled from Header to Footer!
    let remTotalH = 0;
    for (let r = idx; r < workingBlocks.length; r++) {
      remTotalH += workingBlocks[r].heightPx + (r > idx ? blockGapPx : 0);
    }
    const isBalancedFinalPage =
      config.columns === 2 &&
      remTotalH <= availableHeightPx * 1.92 &&
      remTotalH > 120;
    const col1TargetPackH = isBalancedFinalPage
      ? Math.min(availableHeightPx, Math.max(availableHeightPx * 0.52, remTotalH * 0.52))
      : availableHeightPx;

    const col1Blocks: MeasuredBlock[] = [];
    let h1 = 0;
    while (idx < workingBlocks.length) {
      const b = workingBlocks[idx];
      const gapBefore = col1Blocks.length > 0 ? blockGapPx : 0;
      const nextH = h1 + gapBefore + b.heightPx;
      if (col1Blocks.length > 0 && nextH > col1TargetPackH) {
        if (canSplitBlocks) {
          const remSpace = col1TargetPackH - h1 - gapBefore;
          const splitRes = splitMeasuredBlockToFit(b, remSpace, isTheoryMode ? 3.2 : 4);
          if (splitRes) {
            col1Blocks.push(splitRes[0]);
            h1 += gapBefore + splitRes[0].heightPx;
            workingBlocks[idx] = splitRes[1];
          }
        }
        break;
      }
      if (col1Blocks.length === 0 && nextH > col1TargetPackH && canSplitBlocks) {
        const splitRes = splitMeasuredBlockToFit(b, col1TargetPackH, isTheoryMode ? 3.2 : 4);
        if (splitRes) {
          col1Blocks.push(splitRes[0]);
          h1 = splitRes[0].heightPx;
          workingBlocks[idx] = splitRes[1];
          break;
        }
      }
      col1Blocks.push(b);
      h1 = nextH;
      idx++;
    }

    const col2Blocks: MeasuredBlock[] = [];
    if (config.columns === 2) {
      let h2 = 0;
      while (idx < workingBlocks.length) {
        const b = workingBlocks[idx];
        const gapBefore = col2Blocks.length > 0 ? blockGapPx : 0;
        const nextH = h2 + gapBefore + b.heightPx;
        if (col2Blocks.length > 0 && nextH > availableHeightPx) {
          if (canSplitBlocks) {
            const remSpace = availableHeightPx - h2 - gapBefore;
            const splitRes = splitMeasuredBlockToFit(b, remSpace, isTheoryMode ? 3.2 : 4);
            if (splitRes) {
              col2Blocks.push(splitRes[0]);
              h2 += gapBefore + splitRes[0].heightPx;
              workingBlocks[idx] = splitRes[1];
            }
          }
          break;
        }
        if (col2Blocks.length === 0 && nextH > availableHeightPx && canSplitBlocks) {
          const splitRes = splitMeasuredBlockToFit(b, availableHeightPx, isTheoryMode ? 3.2 : 4);
          if (splitRes) {
            col2Blocks.push(splitRes[0]);
            h2 = splitRes[0].heightPx;
            workingBlocks[idx] = splitRes[1];
            break;
          }
        }
        col2Blocks.push(b);
        h2 = nextH;
        idx++;
      }
    }

    const shouldJustify = Boolean(config.autoFillFullPage || isTheoryMode);

    const col1Items = justifyColumnBlocksToFullHeight(
      col1Blocks,
      contentLeftPx,
      contentTopPx,
      colWidthPx,
      availableHeightPx,
      blockGapPx,
      0,
      shouldJustify && col1Blocks.length >= 1
    );

    const col2X = contentLeftPx + colWidthPx + colGapPx;
    const col2Items = justifyColumnBlocksToFullHeight(
      col2Blocks,
      col2X,
      contentTopPx,
      colWidthPx,
      availableHeightPx,
      blockGapPx,
      1,
      shouldJustify && col2Blocks.length >= 1
    );

    const allPageBlocks = [...col1Blocks, ...col2Blocks];
    const batchQs = allPageBlocks.map((b) => b.q);
    pages.push({
      pageNumber: pages.length + 1,
      startQLabel: String(allPageBlocks[0]?.q.qNum || ''),
      endQLabel: String(allPageBlocks[allPageBlocks.length - 1]?.q.qNum || ''),
      questionCount: allPageBlocks.length,
      effectiveFontPt,
      headerRightText: computePageRightHeader(batchQs, meta, config),
      theoryBannerLines: isTheoryMode && isFirstPage ? page1BannerLines : undefined,
      theoryBannerBottomY:
        isTheoryMode && isFirstPage
          ? marginTopPx + baseHeaderPx + page1BannerHeightPx - 4
          : undefined,
      items: [...col1Items, ...col2Items],
    });
  }

  return attachChapterwiseIndexPages(meta, questions, pages, config);
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawLeftTabShape(
  ctx: CanvasRenderingContext2D,
  boxTopY: number,
  boxBottomY: number,
  boxRightX: number,
  cornerR: number,
  theme: PdfDesignTheme
) {
  const style = theme.headerFooterStyle || 'edge-dashed-tabs';
  ctx.save();
  if (style === 'cyber-hud-angled') {
    const cut = 7.5;
    ctx.beginPath();
    ctx.moveTo(0, boxTopY);
    ctx.lineTo(boxRightX - cut, boxTopY);
    ctx.lineTo(boxRightX, boxTopY + cut);
    ctx.lineTo(boxRightX, boxBottomY);
    ctx.lineTo(0, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.chapterBgColor;
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(0, boxTopY, 3.5, boxBottomY - boxTopY);
  } else if (style === 'slanted-power-bar') {
    const slant = 9.0;
    ctx.beginPath();
    ctx.moveTo(0, boxTopY);
    ctx.lineTo(boxRightX, boxTopY);
    ctx.lineTo(boxRightX - slant, boxBottomY);
    ctx.lineTo(0, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fill();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.beginPath();
    ctx.moveTo(boxRightX + 2.5, boxTopY);
    ctx.lineTo(boxRightX + 6.0, boxTopY);
    ctx.lineTo(boxRightX - slant + 6.0, boxBottomY);
    ctx.lineTo(boxRightX - slant + 2.5, boxBottomY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, boxTopY);
    ctx.lineTo(boxRightX - cornerR, boxTopY);
    ctx.quadraticCurveTo(boxRightX, boxTopY, boxRightX, boxTopY + cornerR);
    ctx.lineTo(boxRightX, boxBottomY - cornerR);
    ctx.quadraticCurveTo(boxRightX, boxBottomY, boxRightX - cornerR, boxBottomY);
    ctx.lineTo(0, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.chapterBgColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, boxTopY);
    ctx.lineTo(boxRightX - cornerR, boxTopY);
    ctx.quadraticCurveTo(boxRightX, boxTopY, boxRightX, boxTopY + cornerR);
    ctx.lineTo(boxRightX, boxBottomY - cornerR);
    ctx.quadraticCurveTo(boxRightX, boxBottomY, boxRightX - cornerR, boxBottomY);
    ctx.lineTo(0, boxBottomY);
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4.0, 2.5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawRightTabShape(
  ctx: CanvasRenderingContext2D,
  pageRightEdgeX: number,
  boxTopY: number,
  boxBottomY: number,
  boxLeftX: number,
  cornerR: number,
  theme: PdfDesignTheme
) {
  const style = theme.headerFooterStyle || 'edge-dashed-tabs';
  ctx.save();
  if (style === 'cyber-hud-angled') {
    const cut = 7.5;
    ctx.beginPath();
    ctx.moveTo(pageRightEdgeX, boxTopY);
    ctx.lineTo(boxLeftX + cut, boxTopY);
    ctx.lineTo(boxLeftX, boxTopY + cut);
    ctx.lineTo(boxLeftX, boxBottomY);
    ctx.lineTo(pageRightEdgeX, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.chapterBgColor;
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([]);
    ctx.stroke();
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(pageRightEdgeX - 3.5, boxTopY, 3.5, boxBottomY - boxTopY);
  } else if (style === 'slanted-power-bar') {
    const slant = 9.0;
    ctx.beginPath();
    ctx.moveTo(pageRightEdgeX, boxTopY);
    ctx.lineTo(boxLeftX, boxTopY);
    ctx.lineTo(boxLeftX + slant, boxBottomY);
    ctx.lineTo(pageRightEdgeX, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();
    ctx.fillStyle = theme.brandAccentColor;
    ctx.beginPath();
    ctx.moveTo(boxLeftX - 2.5, boxTopY);
    ctx.lineTo(boxLeftX - 6.0, boxTopY);
    ctx.lineTo(boxLeftX + slant - 6.0, boxBottomY);
    ctx.lineTo(boxLeftX + slant - 2.5, boxBottomY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(pageRightEdgeX, boxTopY);
    ctx.lineTo(boxLeftX + cornerR, boxTopY);
    ctx.quadraticCurveTo(boxLeftX, boxTopY, boxLeftX, boxTopY + cornerR);
    ctx.lineTo(boxLeftX, boxBottomY - cornerR);
    ctx.quadraticCurveTo(boxLeftX, boxBottomY, boxLeftX + cornerR, boxBottomY);
    ctx.lineTo(pageRightEdgeX, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.chapterBgColor;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(pageRightEdgeX, boxTopY);
    ctx.lineTo(boxLeftX + cornerR, boxTopY);
    ctx.quadraticCurveTo(boxLeftX, boxTopY, boxLeftX, boxTopY + cornerR);
    ctx.lineTo(boxLeftX, boxBottomY - cornerR);
    ctx.quadraticCurveTo(boxLeftX, boxBottomY, boxLeftX + cornerR, boxBottomY);
    ctx.lineTo(pageRightEdgeX, boxBottomY);
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4.0, 2.5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawGlobeVectorIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  bgColor: string,
  lineColor: string = '#ffffff'
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.clip();

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.1;
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 0.48, radius + 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  const latY = radius * 0.5;
  ctx.moveTo(cx - radius, cy - latY);
  ctx.lineTo(cx + radius, cy - latY);
  ctx.moveTo(cx - radius, cy + latY);
  ctx.lineTo(cx + radius, cy + latY);
  ctx.stroke();
  ctx.restore();
}

function drawWhatsappVectorIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  iconRadius: number
) {
  ctx.save();
  // WhatsApp brand emerald/green circle
  ctx.fillStyle = '#25D366';
  ctx.beginPath();
  ctx.arc(cx, cy, iconRadius, 0, Math.PI * 2);
  ctx.fill();

  // White speech bubble tail
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - iconRadius * 0.42, cy + iconRadius * 0.38);
  ctx.lineTo(cx - iconRadius * 0.76, cy + iconRadius * 0.74);
  ctx.lineTo(cx - iconRadius * 0.22, cy + iconRadius * 0.54);
  ctx.closePath();
  ctx.fill();

  // Inner white phone handset receiver
  ctx.save();
  ctx.translate(cx, cy);
  const s = iconRadius / 7.0;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-1.6 * s, -2.8 * s);
  ctx.bezierCurveTo(-2.5 * s, -2.7 * s, -3.1 * s, -2.0 * s, -3.0 * s, -1.2 * s);
  ctx.bezierCurveTo(-2.8 * s, 0.5 * s, -1.1 * s, 2.2 * s, 0.6 * s, 2.9 * s);
  ctx.bezierCurveTo(1.4 * s, 3.2 * s, 2.2 * s, 2.8 * s, 2.6 * s, 2.0 * s);
  ctx.lineTo(2.2 * s, 1.3 * s);
  ctx.bezierCurveTo(1.9 * s, 0.9 * s, 1.4 * s, 0.8 * s, 1.0 * s, 1.1 * s);
  ctx.lineTo(0.5 * s, 1.5 * s);
  ctx.bezierCurveTo(-0.6 * s, 0.8 * s, -1.2 * s, 0.2 * s, -1.7 * s, -0.8 * s);
  ctx.lineTo(-1.3 * s, -1.2 * s);
  ctx.bezierCurveTo(-1.0 * s, -1.6 * s, -1.1 * s, -2.1 * s, -1.5 * s, -2.4 * s);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawYoutubeVectorIcon(
  ctx: CanvasRenderingContext2D,
  iconX: number,
  iconY: number,
  iconW: number,
  iconH: number
) {
  ctx.save();
  drawRoundedRectPath(ctx, iconX, iconY, iconW, iconH, 2.8);
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(iconX + iconW * 0.37, iconY + iconH * 0.24);
  ctx.lineTo(iconX + iconW * 0.71, iconY + iconH / 2);
  ctx.lineTo(iconX + iconW * 0.37, iconY + iconH * 0.76);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTelegramVectorIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  iconRadius: number
) {
  ctx.save();
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(cx, cy, iconRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - 3.8, cy + 0.2);
  ctx.lineTo(cx + 3.4, cy - 2.9);
  ctx.lineTo(cx + 1.9, cy + 3.5);
  ctx.lineTo(cx - 0.3, cy + 1.4);
  ctx.lineTo(cx + 2.0, cy - 1.4);
  ctx.lineTo(cx - 1.3, cy + 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTwoToneBrandText(
  ctx: CanvasRenderingContext2D,
  cleanBrand: string,
  curX: number,
  rowCenterY: number,
  primaryColor: string,
  accentColor: string
) {
  const words = cleanBrand.split(/\s+/).filter(Boolean);
  const spaceW = 3.0;
  ctx.textBaseline = 'middle';
  if (words.length >= 2) {
    const firstPart = words[0];
    const secondPart = words.slice(1).join(' ');
    ctx.fillStyle = primaryColor;
    ctx.fillText(firstPart, curX, rowCenterY + 0.4);
    curX += ctx.measureText(firstPart).width + spaceW;
    ctx.fillStyle = accentColor;
    ctx.fillText(secondPart, curX, rowCenterY + 0.4);
  } else if (/^@?desicrackofficial$/i.test(cleanBrand)) {
    const hasAt = cleanBrand.startsWith('@');
    const firstSeg = hasAt ? cleanBrand.slice(0, 10) : cleanBrand.slice(0, 9);
    const secondSeg = hasAt ? cleanBrand.slice(10) : cleanBrand.slice(9);
    ctx.fillStyle = primaryColor;
    ctx.fillText(firstSeg, curX, rowCenterY + 0.4);
    curX += ctx.measureText(firstSeg).width;
    ctx.fillStyle = accentColor;
    ctx.fillText(secondSeg, curX, rowCenterY + 0.4);
  } else {
    ctx.fillStyle = primaryColor;
    ctx.fillText(cleanBrand, curX, rowCenterY + 0.4);
  }
}

function drawCompleteDocumentHeader(
  ctx: CanvasRenderingContext2D,
  baseWidthPx: number,
  marginPx: number,
  headerLineY: number,
  brandText: string,
  websiteText: string,
  theme: PdfDesignTheme,
  activeFontStack: string,
  headerStyleOverride?: PdfHeaderFooterStyle,
  rightMarginPx?: number
) {
  ctx.save();
  const effectiveRight = typeof rightMarginPx === 'number' ? rightMarginPx : marginPx;
  const rawBrand = (brandText || '').trim();
  const cleanBrand =
    !rawBrand || rawBrand === 'Desi Crack' ? '@DesiCrackOfficial' : rawBrand;
  const cleanSite = (websiteText || 'desicrack.in').trim() || 'desicrack.in';
  const dotIdx = cleanSite.lastIndexOf('.');
  const mainDomain = dotIdx > 0 ? cleanSite.slice(0, dotIdx) : cleanSite;
  const tldPart = dotIdx > 0 ? cleanSite.slice(dotIdx) : '';

  const boxH = Math.min(21.5, Math.max(18.0, headerLineY - 7.5));
  const boxTopY = (headerLineY - boxH) / 2;
  const boxBottomY = boxTopY + boxH;
  const rowCenterY = boxTopY + boxH / 2;
  const fontSpec = `800 10.2px ${activeFontStack}`;
  ctx.font = fontSpec;

  const style: PdfHeaderFooterStyle =
    headerStyleOverride || theme.headerFooterStyle || 'minimal-clean';

  const brandW = ctx.measureText(cleanBrand).width;
  const siteTextW = ctx.measureText(cleanSite).width;
  const circleDiameter = 14.8;
  const circleRadius = circleDiameter / 2;
  const gapIconToText = 4.8;
  const rightContentW = circleDiameter + gapIconToText + siteTextW;
  const fullContentW = baseWidthPx - marginPx - effectiveRight;

  if (style === 'minimal-clean') {
    // 1. MINIMAL CLEAN (Mast sa simple, borderless, shapeless, pure typography & globe)
    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx,
      rowCenterY,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );
    const contentStartX = baseWidthPx - effectiveRight - rightContentW;
    drawGlobeVectorIcon(
      ctx,
      contentStartX + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    let rX = contentStartX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY + 0.4);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY + 0.4);
    }
  } else if (style === 'floating-stadium-pill') {
    // 2. FLOATING STADIUM PILLS (Smooth rounded capsules on left & right)
    const pillH = boxH;
    const leftPillW = brandW + 24;
    const rightPillW = rightContentW + 20;

    // Left Pill
    ctx.save();
    drawRoundedRectPath(ctx, marginPx, boxTopY, leftPillW, pillH, pillH / 2);
    ctx.fillStyle = theme.chapterBgColor || 'rgba(241, 245, 249, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx + 12,
      rowCenterY,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );
    ctx.restore();

    // Center Dots Ornament
    ctx.save();
    ctx.fillStyle = theme.brandAccentColor;
    ctx.font = `800 8.0px ${activeFontStack}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('• • •', baseWidthPx / 2, rowCenterY + 0.4);
    ctx.restore();

    // Right Pill
    ctx.save();
    const rightPillX = baseWidthPx - marginPx - rightPillW;
    drawRoundedRectPath(ctx, rightPillX, boxTopY, rightPillW, pillH, pillH / 2);
    ctx.fillStyle = theme.chapterBgColor || 'rgba(241, 245, 249, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();

    const startX = rightPillX + 10;
    drawGlobeVectorIcon(
      ctx,
      startX + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    let rX = startX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY + 0.4);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY + 0.4);
    }
    ctx.restore();
  } else if (style === 'solid-coaching-bar') {
    // 3. SOLID COACHING BAR (Full top banner ribbon)
    ctx.save();
    drawRoundedRectPath(ctx, marginPx, boxTopY, fullContentW, boxH, 4.0);
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();

    // Left brand in white
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.font = `800 10.2px ${activeFontStack}`;
    ctx.fillText(cleanBrand, marginPx + 10, rowCenterY + 0.4);

    // Center badge
    const badgeText = '★ EXAM REVISION NOTES ★';
    ctx.font = `800 7.8px ${activeFontStack}`;
    const badgeW = ctx.measureText(badgeText).width + 14;
    const badgeH = 13.5;
    const badgeX = (baseWidthPx - badgeW) / 2;
    const badgeY = rowCenterY - badgeH / 2;
    drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, baseWidthPx / 2, rowCenterY + 0.3);

    // Right site in white
    ctx.textAlign = 'left';
    ctx.font = `800 10.2px ${activeFontStack}`;
    const rStartX = baseWidthPx - marginPx - rightContentW - 10;
    drawGlobeVectorIcon(
      ctx,
      rStartX + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cleanSite, rStartX + circleDiameter + gapIconToText, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'edge-dashed-tabs') {
    // 4. EDGE DASHED TABS
    const leftTabW = brandW + 28;
    drawLeftTabShape(ctx, boxTopY, boxBottomY, marginPx + leftTabW, 5.0, theme);
    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx,
      rowCenterY,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );

    const rightTabW = rightContentW + 24;
    drawRightTabShape(
      ctx,
      baseWidthPx,
      boxTopY,
      boxBottomY,
      baseWidthPx - marginPx - rightTabW,
      5.0,
      theme
    );
    const contentStartX = baseWidthPx - marginPx - rightContentW;
    drawGlobeVectorIcon(
      ctx,
      contentStartX + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    let rX = contentStartX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY + 0.4);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY + 0.4);
    }
  } else if (style === 'gazette-double-rule') {
    // 5. GAZETTE DOUBLE RULE
    ctx.save();
    ctx.strokeStyle = theme.brandPrimaryColor;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY);
    ctx.stroke();

    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxBottomY);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY);
    ctx.moveTo(marginPx, boxBottomY + 1.8);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY + 1.8);
    ctx.stroke();

    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx + 2,
      rowCenterY,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );

    // Center Gazette Emblem
    ctx.font = `800 8.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText('✦ OFFICIAL STUDY HANDBOOK ✦', baseWidthPx / 2, rowCenterY + 0.4);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = fontSpec;
    const contentStartX = baseWidthPx - marginPx - rightContentW - 2;
    drawGlobeVectorIcon(
      ctx,
      contentStartX + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    let rX = contentStartX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY + 0.4);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY + 0.4);
    }
    ctx.restore();
  } else if (style === 'neo-brutalist-bar') {
    // 6. NEO BRUTALIST BAR
    ctx.save();
    const bX = marginPx;
    const bY = boxTopY;
    const bW = fullContentW;
    const bH = boxH;

    // Hard drop shadow
    ctx.fillStyle = '#09090b';
    ctx.fillRect(bX + 2.5, bY + 2.5, bW, bH);

    // Card fill & crisp border
    ctx.fillStyle = theme.chapterBgColor || '#fef08a';
    ctx.fillRect(bX, bY, bW, bH);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#09090b';
    ctx.strokeRect(bX, bY, bW, bH);

    // Left brand
    ctx.font = `800 10.2px ${activeFontStack}`;
    ctx.fillStyle = '#09090b';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanBrand, bX + 8, rowCenterY + 0.4);

    // Center rapid badge
    const badgeText = '⚡ RAPID REVISION ⚡';
    ctx.font = `800 7.8px ${activeFontStack}`;
    const badgeW = ctx.measureText(badgeText).width + 12;
    const badgeH = 13.0;
    const badgeX = (baseWidthPx - badgeW) / 2;
    const badgeY = rowCenterY - badgeH / 2;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, baseWidthPx / 2, rowCenterY + 0.3);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = `800 10.2px ${activeFontStack}`;
    ctx.fillStyle = '#09090b';
    ctx.fillText(cleanSite, bX + bW - ctx.measureText(cleanSite).width - 8, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'cyber-hud-angled') {
    // 7. CYBER HUD ANGLED
    ctx.save();
    const cut = 6.5;
    const bX = marginPx;
    const bY = boxTopY;
    const bW = fullContentW;
    const bH = boxH;

    ctx.beginPath();
    ctx.moveTo(bX + cut, bY);
    ctx.lineTo(bX + bW - cut, bY);
    ctx.lineTo(bX + bW, bY + cut);
    ctx.lineTo(bX + bW, bY + bH - cut);
    ctx.lineTo(bX + bW - cut, bY + bH);
    ctx.lineTo(bX + cut, bY + bH);
    ctx.lineTo(bX, bY + bH - cut);
    ctx.lineTo(bX, bY + cut);
    ctx.closePath();

    ctx.fillStyle = theme.chapterBgColor || 'rgba(15, 23, 42, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Accent edge notches
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(bX, bY + cut, 3.5, bH - cut * 2);
    ctx.fillRect(bX + bW - 3.5, bY + cut, 3.5, bH - cut * 2);

    // Left tech brand
    ctx.font = `800 9.8px 'JetBrains Mono', ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(`[+] ${cleanBrand}`, bX + 10, rowCenterY + 0.4);

    // Center HUD mark
    ctx.font = `800 8.0px 'JetBrains Mono', ${activeFontStack}`;
    ctx.fillStyle = theme.headerMetaColor || theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText('// SYS.VERIFIED //', baseWidthPx / 2, rowCenterY + 0.4);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = `800 9.8px 'JetBrains Mono', ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    const sW = ctx.measureText(cleanSite).width;
    ctx.fillText(cleanSite, bX + bW - sW - 10, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'royal-ornate-ribbon') {
    // 8. ROYAL ORNATE FLOURISH
    ctx.save();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(marginPx, boxTopY, fullContentW, boxH);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(marginPx + 2.2, boxTopY + 2.2, fullContentW - 4.4, boxH - 4.4);

    // Left brand
    ctx.font = `800 10.0px 'Playfair Display', ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(`❖ ${cleanBrand}`, marginPx + 9, rowCenterY + 0.4);

    // Center crest
    ctx.font = `800 8.2px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText('❖ TOPPER’S HANDBOOK ❖', baseWidthPx / 2, rowCenterY + 0.4);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = `800 10.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    const sW = ctx.measureText(cleanSite).width;
    ctx.fillText(`${cleanSite} ❖`, baseWidthPx - marginPx - sW - 9, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'slanted-power-bar') {
    // 9. SLANTED POWER STRIPE
    const slant = 10.0;
    const leftTabW = brandW + 28;
    const rightTabW = rightContentW + 28;

    // Left Tab
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(marginPx, boxTopY);
    ctx.lineTo(marginPx + leftTabW, boxTopY);
    ctx.lineTo(marginPx + leftTabW - slant, boxBottomY);
    ctx.lineTo(marginPx, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();

    // Speed stripe
    ctx.fillStyle = theme.brandAccentColor;
    ctx.beginPath();
    ctx.moveTo(marginPx + leftTabW + 2.5, boxTopY);
    ctx.lineTo(marginPx + leftTabW + 6.0, boxTopY);
    ctx.lineTo(marginPx + leftTabW - slant + 6.0, boxBottomY);
    ctx.lineTo(marginPx + leftTabW - slant + 2.5, boxBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `800 10.2px ${activeFontStack}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanBrand, marginPx + 6, rowCenterY + 0.4);
    ctx.restore();

    // Right Tab
    ctx.save();
    const rStartX = baseWidthPx - marginPx - rightTabW;
    ctx.beginPath();
    ctx.moveTo(rStartX + slant, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY);
    ctx.lineTo(rStartX, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();

    // Speed stripe
    ctx.fillStyle = theme.brandAccentColor;
    ctx.beginPath();
    ctx.moveTo(rStartX - 2.5, boxTopY);
    ctx.lineTo(rStartX - 6.0, boxTopY);
    ctx.lineTo(rStartX - slant - 6.0, boxBottomY);
    ctx.lineTo(rStartX - slant - 2.5, boxBottomY);
    ctx.closePath();
    ctx.fill();

    drawGlobeVectorIcon(
      ctx,
      rStartX + slant + 8 + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 10.2px ${activeFontStack}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanSite, rStartX + slant + 8 + circleDiameter + gapIconToText, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'register-top-stamp') {
    // 10. REGISTER TOP STAMP
    ctx.save();
    ctx.strokeStyle = theme.brandPrimaryColor;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(marginPx, boxTopY, fullContentW, boxH);

    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx + 8,
      rowCenterY,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );

    // Stamped seal
    const stampText = '★ OFFICIAL VERIFIED MATERIAL ★';
    ctx.font = `800 7.2px ${activeFontStack}`;
    const stampW = ctx.measureText(stampText).width + 12;
    const stampH = 13.0;
    const stampX = (baseWidthPx - stampW) / 2;
    const stampY = rowCenterY - stampH / 2;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(stampX, stampY, stampW, stampH);
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText(stampText, baseWidthPx / 2, rowCenterY + 0.3);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = fontSpec;
    const contentStartX = baseWidthPx - marginPx - rightContentW - 8;
    drawGlobeVectorIcon(
      ctx,
      contentStartX + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    let rX = contentStartX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY + 0.4);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY + 0.4);
    }
    ctx.restore();
  } else if (style === 'swiss-grid-header') {
    // 11. SWISS GRID HEADER
    ctx.save();
    ctx.strokeStyle = theme.dividerColor || '#cbd5e1';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxBottomY);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY);
    ctx.stroke();

    // Left brand
    ctx.font = `800 9.8px 'Plus Jakarta Sans', ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanBrand.toUpperCase(), marginPx, rowCenterY + 0.4);

    // Center category
    ctx.font = `700 8.0px ${activeFontStack}`;
    ctx.fillStyle = theme.headerMetaColor || '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('A4 STUDY EDITION // 2026', baseWidthPx / 2, rowCenterY + 0.4);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = `800 9.8px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    const sW = ctx.measureText(cleanSite.toUpperCase()).width;
    ctx.fillText(cleanSite.toUpperCase(), baseWidthPx - marginPx - sW, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'topper-notebook-rule') {
    // 12. TOPPER NOTEBOOK RULE
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxBottomY);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY);
    ctx.moveTo(marginPx, boxBottomY + 2.0);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY + 2.0);
    ctx.stroke();

    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx,
      rowCenterY,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );

    // Center docket
    ctx.font = `700 8.0px ${activeFontStack}`;
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('DATE: _________ | NOTES: ______', baseWidthPx / 2, rowCenterY + 0.4);

    // Right site
    ctx.textAlign = 'left';
    ctx.font = fontSpec;
    const contentStartX = baseWidthPx - marginPx - rightContentW;
    drawGlobeVectorIcon(
      ctx,
      contentStartX + circleRadius,
      rowCenterY,
      circleRadius,
      '#dc2626',
      '#ffffff'
    );
    let rX = contentStartX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY + 0.4);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY + 0.4);
    }
    ctx.restore();
  } else if (style === 'badge-accent-capsule') {
    // 13. BADGE ACCENT CAPSULE
    ctx.save();
    const pillH = boxH;
    const leftPillW = brandW + 20;
    const rightPillW = rightContentW + 20;

    // Left filled pill
    drawRoundedRectPath(ctx, marginPx, boxTopY, leftPillW, pillH, pillH / 2);
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fill();
    ctx.font = fontSpec;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanBrand, marginPx + 10, rowCenterY + 0.4);

    // Center dots
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.font = `800 8.5px ${activeFontStack}`;
    ctx.textAlign = 'center';
    ctx.fillText('••• EXAM NOTES •••', baseWidthPx / 2, rowCenterY + 0.4);

    // Right filled pill
    const rightPillX = baseWidthPx - marginPx - rightPillW;
    drawRoundedRectPath(ctx, rightPillX, boxTopY, rightPillW, pillH, pillH / 2);
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();
    drawGlobeVectorIcon(
      ctx,
      rightPillX + 10 + circleRadius,
      rowCenterY,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(cleanSite, rightPillX + 10 + circleDiameter + gapIconToText, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'underlined-gradient') {
    // 14. UNDERLINED GRADIENT / ACCENT
    ctx.save();
    drawTwoToneBrandText(
      ctx,
      cleanBrand,
      marginPx,
      rowCenterY - 1,
      theme.brandPrimaryColor,
      theme.brandAccentColor
    );
    const contentStartX = baseWidthPx - marginPx - rightContentW;
    drawGlobeVectorIcon(
      ctx,
      contentStartX + circleRadius,
      rowCenterY - 1,
      circleRadius,
      theme.brandAccentColor,
      '#ffffff'
    );
    let rX = contentStartX + circleDiameter + gapIconToText;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(mainDomain, rX, rowCenterY - 0.6);
    rX += ctx.measureText(mainDomain).width;
    if (tldPart) {
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillText(tldPart, rX, rowCenterY - 0.6);
    }

    // Bold accent line
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(marginPx, boxBottomY, fullContentW, 2.2);
    ctx.restore();
  } else if (style === 'bracket-frame') {
    // 15. BRACKET FRAME
    ctx.save();
    ctx.font = `800 10.5px 'JetBrains Mono', ${activeFontStack}`;
    ctx.textBaseline = 'middle';

    // Left bracketed brand
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText('⟦ ', marginPx, rowCenterY + 0.4);
    const bShift = ctx.measureText('⟦ ').width;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(cleanBrand, marginPx + bShift, rowCenterY + 0.4);
    const brandTotalW = bShift + ctx.measureText(cleanBrand).width;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText(' ⟧', marginPx + brandTotalW, rowCenterY + 0.4);

    // Center crosshair
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText('— [+] —', baseWidthPx / 2, rowCenterY + 0.4);

    // Right bracketed domain
    ctx.textAlign = 'left';
    const siteBracketStr = `⟦ ${cleanSite} ⟧`;
    const sbW = ctx.measureText(siteBracketStr).width;
    const startX = baseWidthPx - marginPx - sbW;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText('⟦ ', startX, rowCenterY + 0.4);
    const sShift = ctx.measureText('⟦ ').width;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(cleanSite, startX + sShift, rowCenterY + 0.4);
    const siteInnerW = sShift + ctx.measureText(cleanSite).width;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText(' ⟧', startX + siteInnerW, rowCenterY + 0.4);
    ctx.restore();
  }

  ctx.restore();
}

function drawCompleteDocumentFooter(
  ctx: CanvasRenderingContext2D,
  baseWidthPx: number,
  baseHeightPx: number,
  marginPx: number,
  footerLineY: number,
  pageNumber: number,
  totalPages: number,
  isPpt: boolean,
  theme: PdfDesignTheme,
  activeFontStack: string,
  footerStyleOverride?: PdfHeaderFooterStyle,
  rightMarginPx?: number
) {
  ctx.save();
  const effectiveRight = typeof rightMarginPx === 'number' ? rightMarginPx : marginPx;
  const footerBandH = baseHeightPx - footerLineY;
  const boxH = Math.min(21.5, Math.max(18.0, footerBandH - 7.5));
  const boxTopY = footerLineY + (footerBandH - boxH) / 2;
  const boxBottomY = boxTopY + boxH;
  const rowCenterY = boxTopY + boxH / 2;
  const waLabel = 'WhatsApp Join';
  const tgLabel = 'Join Now';
  const pageLabel = isPpt
    ? `Slide ${pageNumber} of ${totalPages}`
    : `— पृष्ठ ${pageNumber} of ${totalPages} —`;

  const style: PdfHeaderFooterStyle =
    footerStyleOverride || theme.headerFooterStyle || 'minimal-clean';

  const gap = 5.0;
  const waRadius = 7.0;
  const tgRadius = 7.0;
  const fullContentW = baseWidthPx - marginPx - effectiveRight;

  ctx.font = `800 9.5px ${activeFontStack}`;
  const waTextW = ctx.measureText(waLabel).width;
  const tgTextW = ctx.measureText(tgLabel).width;
  ctx.font = `800 9.0px ${activeFontStack}`;
  const pageTextW = ctx.measureText(pageLabel).width;

  if (style === 'minimal-clean') {
    // 1. MINIMAL CLEAN (No box, no border, crisp colorful icons and text)
    drawWhatsappVectorIcon(ctx, marginPx + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor || theme.footerTextColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + waRadius * 2 + gap, rowCenterY + 0.4);

    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    const pageCenter = marginPx + (baseWidthPx - marginPx - effectiveRight) / 2;
    ctx.fillText(pageLabel, pageCenter - pageTextW / 2, rowCenterY + 0.4);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - effectiveRight - tgContentW;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.font = `800 9.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor || theme.footerTextColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
  } else if (style === 'floating-stadium-pill') {
    // 2. FLOATING STADIUM PILLS
    ctx.save();
    const pillH = boxH;

    // Left pill (WhatsApp)
    const leftW = waRadius * 2 + gap + waTextW + 18;
    drawRoundedRectPath(ctx, marginPx, boxTopY, leftW, pillH, pillH / 2);
    ctx.fillStyle = theme.chapterBgColor || 'rgba(241, 245, 249, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    drawWhatsappVectorIcon(ctx, marginPx + 9 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 9 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center pill (Page)
    const centerW = pageTextW + 22;
    const centerX = (baseWidthPx - centerW) / 2;
    drawRoundedRectPath(ctx, centerX, boxTopY, centerW, pillH, pillH / 2);
    ctx.fillStyle = theme.chapterBgColor || 'rgba(241, 245, 249, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(pageLabel, baseWidthPx / 2, rowCenterY + 0.4);

    // Right pill (Telegram)
    const rightW = tgRadius * 2 + gap + tgTextW + 18;
    const rightX = baseWidthPx - marginPx - rightW;
    drawRoundedRectPath(ctx, rightX, boxTopY, rightW, pillH, pillH / 2);
    ctx.fillStyle = theme.chapterBgColor || 'rgba(241, 245, 249, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    drawTelegramVectorIcon(ctx, rightX + 9 + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, rightX + 9 + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'solid-coaching-bar') {
    // 3. SOLID COACHING BAR
    ctx.save();
    drawRoundedRectPath(ctx, marginPx, boxTopY, fullContentW, boxH, 4.0);
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();

    drawWhatsappVectorIcon(ctx, marginPx + 10 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 10 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center pill badge
    const badgeW = pageTextW + 16;
    const badgeH = 13.5;
    const badgeX = (baseWidthPx - badgeW) / 2;
    const badgeY = rowCenterY - badgeH / 2;
    drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fill();
    ctx.font = `800 8.5px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(pageLabel, baseWidthPx / 2, rowCenterY + 0.3);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - marginPx - tgContentW - 10;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'edge-dashed-tabs') {
    // 4. EDGE DASHED TABS
    const leftW = waRadius * 2 + gap + waTextW + 24;
    drawLeftTabShape(ctx, boxTopY, boxBottomY, marginPx + leftW, 5.0, theme);
    drawWhatsappVectorIcon(ctx, marginPx + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center page pill with dashed border
    const centerW = pageTextW + 18;
    const centerX = (baseWidthPx - centerW) / 2;
    drawRoundedRectPath(ctx, centerX, boxTopY + 1, centerW, boxH - 2, 4.0);
    ctx.fillStyle = theme.chapterBgColor;
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.setLineDash([3.0, 2.0]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(pageLabel, baseWidthPx / 2, rowCenterY + 0.4);

    const rightW = tgRadius * 2 + gap + tgTextW + 24;
    drawRightTabShape(
      ctx,
      baseWidthPx,
      boxTopY,
      boxBottomY,
      baseWidthPx - marginPx - rightW,
      5.0,
      theme
    );
    const startX = baseWidthPx - marginPx - (tgRadius * 2 + gap + tgTextW);
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
  } else if (style === 'gazette-double-rule') {
    // 5. GAZETTE DOUBLE RULE
    ctx.save();
    ctx.strokeStyle = theme.brandPrimaryColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxTopY - 1.8);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY - 1.8);
    ctx.moveTo(marginPx, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY);
    ctx.stroke();

    drawWhatsappVectorIcon(ctx, marginPx + 2 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 2 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center academic brackets
    ctx.font = `800 8.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`[ ${pageLabel} ]`, baseWidthPx / 2, rowCenterY + 0.4);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - marginPx - tgContentW - 2;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'neo-brutalist-bar') {
    // 6. NEO BRUTALIST BAR
    ctx.save();
    const bX = marginPx;
    const bY = boxTopY;
    const bW = fullContentW;
    const bH = boxH;

    ctx.fillStyle = '#09090b';
    ctx.fillRect(bX + 2.5, bY + 2.5, bW, bH);
    ctx.fillStyle = theme.chapterBgColor || '#fef08a';
    ctx.fillRect(bX, bY, bW, bH);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#09090b';
    ctx.strokeRect(bX, bY, bW, bH);

    drawWhatsappVectorIcon(ctx, bX + 8 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = '#09090b';
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, bX + 8 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center black badge
    const badgeText = `⚡ ${pageLabel.toUpperCase()} ⚡`;
    ctx.font = `800 7.8px ${activeFontStack}`;
    const badgeW = ctx.measureText(badgeText).width + 12;
    const badgeH = 13.0;
    const badgeX = (baseWidthPx - badgeW) / 2;
    const badgeY = rowCenterY - badgeH / 2;
    ctx.fillStyle = '#09090b';
    ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, baseWidthPx / 2, rowCenterY + 0.3);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = bX + bW - tgContentW - 8;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = '#09090b';
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'cyber-hud-angled') {
    // 7. CYBER HUD ANGLED
    ctx.save();
    const cut = 6.5;
    const bX = marginPx;
    const bY = boxTopY;
    const bW = fullContentW;
    const bH = boxH;

    ctx.beginPath();
    ctx.moveTo(bX + cut, bY);
    ctx.lineTo(bX + bW - cut, bY);
    ctx.lineTo(bX + bW, bY + cut);
    ctx.lineTo(bX + bW, bY + bH - cut);
    ctx.lineTo(bX + bW - cut, bY + bH);
    ctx.lineTo(bX + cut, bY + bH);
    ctx.lineTo(bX, bY + bH - cut);
    ctx.lineTo(bX, bY + cut);
    ctx.closePath();

    ctx.fillStyle = theme.chapterBgColor || 'rgba(15, 23, 42, 0.95)';
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(bX, bY + cut, 3.5, bH - cut * 2);
    ctx.fillRect(bX + bW - 3.5, bY + cut, 3.5, bH - cut * 2);

    ctx.font = `800 9.0px 'JetBrains Mono', ${activeFontStack}`;
    ctx.fillStyle = '#22c55e';
    ctx.textBaseline = 'middle';
    ctx.fillText('[WA] JOIN NOW', bX + 10, rowCenterY + 0.4);

    ctx.font = `800 8.2px 'JetBrains Mono', ${activeFontStack}`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(`PAGE // ${String(pageNumber).padStart(2, '0')} OF ${String(totalPages).padStart(2, '0')}`, baseWidthPx / 2, rowCenterY + 0.4);

    ctx.textAlign = 'left';
    ctx.font = `800 9.0px 'JetBrains Mono', ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    const tgTxt = '[TG] JOIN NOW';
    ctx.fillText(tgTxt, bX + bW - ctx.measureText(tgTxt).width - 10, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'royal-ornate-ribbon') {
    // 8. ROYAL ORNATE FLOURISH
    ctx.save();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(marginPx, boxTopY, fullContentW, boxH);

    drawWhatsappVectorIcon(ctx, marginPx + 8 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 8 + waRadius * 2 + gap, rowCenterY + 0.4);

    ctx.font = `800 8.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`❖ ${pageLabel} ❖`, baseWidthPx / 2, rowCenterY + 0.4);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - marginPx - tgContentW - 8;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'slanted-power-bar') {
    // 9. SLANTED POWER STRIPE
    const slant = 9.0;
    const leftW = waRadius * 2 + gap + waTextW + 24;
    const rightW = tgRadius * 2 + gap + tgTextW + 24;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(marginPx, boxTopY);
    ctx.lineTo(marginPx + leftW, boxTopY);
    ctx.lineTo(marginPx + leftW - slant, boxBottomY);
    ctx.lineTo(marginPx, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();

    drawWhatsappVectorIcon(ctx, marginPx + 5 + waRadius, rowCenterY, waRadius);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 5 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center power badge
    const badgeW = pageTextW + 18;
    const badgeH = 14.0;
    const badgeX = (baseWidthPx - badgeW) / 2;
    const badgeY = rowCenterY - badgeH / 2;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.beginPath();
    ctx.moveTo(badgeX + slant * 0.6, badgeY);
    ctx.lineTo(badgeX + badgeW, badgeY);
    ctx.lineTo(badgeX + badgeW - slant * 0.6, badgeY + badgeH);
    ctx.lineTo(badgeX, badgeY + badgeH);
    ctx.closePath();
    ctx.fill();
    ctx.font = `800 8.5px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(pageLabel, baseWidthPx / 2, rowCenterY + 0.4);

    // Right slanted tab
    const rStartX = baseWidthPx - marginPx - rightW;
    ctx.beginPath();
    ctx.moveTo(rStartX + slant, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxBottomY);
    ctx.lineTo(rStartX, boxBottomY);
    ctx.closePath();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();

    drawTelegramVectorIcon(ctx, rStartX + slant + 8 + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tgLabel, rStartX + slant + 8 + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'register-top-stamp') {
    // 10. REGISTER DOCKET STAMP
    ctx.save();
    ctx.strokeStyle = theme.brandPrimaryColor;
    ctx.lineWidth = 1.0;
    ctx.strokeRect(marginPx, boxTopY, fullContentW, boxH);

    drawWhatsappVectorIcon(ctx, marginPx + 8 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 8 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center docket seal
    const sealText = `[ ${pageLabel.toUpperCase()} ]`;
    ctx.font = `800 8.0px ${activeFontStack}`;
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText(sealText, baseWidthPx / 2, rowCenterY + 0.4);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - marginPx - tgContentW - 8;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'swiss-grid-header') {
    // 11. SWISS GRID PROGRESS
    ctx.save();
    ctx.strokeStyle = theme.dividerColor || '#cbd5e1';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY);
    ctx.stroke();

    ctx.font = `800 9.0px 'Plus Jakarta Sans', ${activeFontStack}`;
    ctx.fillStyle = '#16a34a';
    ctx.textBaseline = 'middle';
    ctx.fillText('WHATSAPP // JOIN', marginPx, rowCenterY + 0.4);

    ctx.font = `800 8.5px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`PAGE ${String(pageNumber).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, baseWidthPx / 2, rowCenterY + 0.4);

    ctx.textAlign = 'left';
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    const tgTxt = 'TELEGRAM // @DESICRACK';
    ctx.fillText(tgTxt, baseWidthPx - marginPx - ctx.measureText(tgTxt).width, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'topper-notebook-rule') {
    // 12. TOPPER NOTEBOOK RULE
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(marginPx, boxTopY);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY);
    ctx.moveTo(marginPx, boxTopY + 2.0);
    ctx.lineTo(baseWidthPx - marginPx, boxTopY + 2.0);
    ctx.stroke();

    drawWhatsappVectorIcon(ctx, marginPx + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + waRadius * 2 + gap, rowCenterY + 0.4);

    ctx.font = `700 8.5px ${activeFontStack}`;
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText(`PAGE — ${pageNumber} OF ${totalPages}`, baseWidthPx / 2, rowCenterY + 0.4);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - marginPx - tgContentW;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'badge-accent-capsule') {
    // 13. BADGE ACCENT CAPSULE
    ctx.save();
    const pillH = boxH;

    // Left pill (WhatsApp green)
    const leftW = waRadius * 2 + gap + waTextW + 18;
    drawRoundedRectPath(ctx, marginPx, boxTopY, leftW, pillH, pillH / 2);
    ctx.fillStyle = '#25D366';
    ctx.fill();
    drawWhatsappVectorIcon(ctx, marginPx + 8 + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + 8 + waRadius * 2 + gap, rowCenterY + 0.4);

    // Center pill
    const centerW = pageTextW + 20;
    const centerX = (baseWidthPx - centerW) / 2;
    drawRoundedRectPath(ctx, centerX, boxTopY, centerW, pillH, pillH / 2);
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(pageLabel, baseWidthPx / 2, rowCenterY + 0.4);

    // Right pill
    const rightW = tgRadius * 2 + gap + tgTextW + 18;
    const rightX = baseWidthPx - marginPx - rightW;
    drawRoundedRectPath(ctx, rightX, boxTopY, rightW, pillH, pillH / 2);
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    drawTelegramVectorIcon(ctx, rightX + 8 + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(tgLabel, rightX + 8 + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'underlined-gradient') {
    // 14. UNDERLINED GRADIENT / OVERLINE
    ctx.save();
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(marginPx, boxTopY - 2, fullContentW, 2.2);

    drawWhatsappVectorIcon(ctx, marginPx + waRadius, rowCenterY, waRadius);
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(waLabel, marginPx + waRadius * 2 + gap, rowCenterY + 0.4);

    ctx.font = `800 9.0px ${activeFontStack}`;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(pageLabel, baseWidthPx / 2, rowCenterY + 0.4);

    const tgContentW = tgRadius * 2 + gap + tgTextW;
    const startX = baseWidthPx - marginPx - tgContentW;
    drawTelegramVectorIcon(ctx, startX + tgRadius, rowCenterY, tgRadius);
    ctx.textAlign = 'left';
    ctx.font = `800 9.2px ${activeFontStack}`;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(tgLabel, startX + tgRadius * 2 + gap, rowCenterY + 0.4);
    ctx.restore();
  } else if (style === 'bracket-frame') {
    // 15. BRACKET FRAME
    ctx.save();
    ctx.font = `800 9.5px 'JetBrains Mono', ${activeFontStack}`;
    ctx.textBaseline = 'middle';

    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText('⟦ ', marginPx, rowCenterY + 0.4);
    const bShift = ctx.measureText('⟦ ').width;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(`WA: ${waLabel}`, marginPx + bShift, rowCenterY + 0.4);
    const w1 = bShift + ctx.measureText(`WA: ${waLabel}`).width;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText(' ⟧', marginPx + w1, rowCenterY + 0.4);

    ctx.fillStyle = theme.brandAccentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`⟦ ${pageLabel.toUpperCase()} ⟧`, baseWidthPx / 2, rowCenterY + 0.4);

    ctx.textAlign = 'left';
    const tgBracketStr = `⟦ TG: ${tgLabel} ⟧`;
    const tbW = ctx.measureText(tgBracketStr).width;
    const startX = baseWidthPx - marginPx - tbW;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText('⟦ ', startX, rowCenterY + 0.4);
    const tShift = ctx.measureText('⟦ ').width;
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(`TG: ${tgLabel}`, startX + tShift, rowCenterY + 0.4);
    const w2 = tShift + ctx.measureText(`TG: ${tgLabel}`).width;
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillText(' ⟧', startX + w2, rowCenterY + 0.4);
    ctx.restore();
  }

  ctx.restore();
}

function drawMathAwareTextLine(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  x: number,
  y: number,
  fontSizePx: number,
  maxWidth: number
) {
  if (!/[√∛∜]/.test(rawText)) {
    ctx.fillText(rawText, x, y, maxWidth);
    return;
  }

  // Parse radical segments: unwrap outer parens of √(...) so vinculum overbar covers the radicand cleanly
  interface Seg {
    text: string;
    overbar: boolean;
  }
  const segs: Seg[] = [];
  let i = 0;
  const n = rawText.length;

  while (i < n) {
    const ch = rawText[i];
    if (ch === '√' || ch === '∛' || ch === '∜') {
      segs.push({ text: ch, overbar: false });
      i++;
      if (i < n && rawText[i] === '(') {
        // Find matching closing paren
        let depth = 0;
        let closeIdx = -1;
        for (let k = i; k < n; k++) {
          if (rawText[k] === '(') depth++;
          else if (rawText[k] === ')') {
            depth--;
            if (depth === 0) {
              closeIdx = k;
              break;
            }
          }
        }
        if (closeIdx > i + 1) {
          const inner = rawText.slice(i + 1, closeIdx);
          segs.push({ text: inner, overbar: true });
          i = closeIdx + 1;
          continue;
        }
      }
      // Single token radicand e.g. √7, √3x, √x²
      let start = i;
      while (
        i < n &&
        /[0-9a-zA-Zα-ωΑ-Ωπθ⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉.]/.test(rawText[i])
      ) {
        i++;
      }
      if (i > start) {
        segs.push({ text: rawText.slice(start, i), overbar: true });
      }
    } else {
      let start = i;
      while (i < n && rawText[i] !== '√' && rawText[i] !== '∛' && rawText[i] !== '∜') {
        i++;
      }
      segs.push({ text: rawText.slice(start, i), overbar: false });
    }
  }

  const fullDisplayText = segs.map((s) => s.text).join('');
  const naturalTotalW = ctx.measureText(fullDisplayText).width;
  const horizScale = naturalTotalW > maxWidth && naturalTotalW > 0 ? maxWidth / naturalTotalW : 1;

  ctx.fillText(fullDisplayText, x, y, maxWidth);

  // Draw crisp horizontal vinculum bar over each radicand segment
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle as string;
  ctx.lineWidth = Math.max(0.65, fontSizePx * 0.075);
  let curOffset = 0;
  const barY = y + fontSizePx * 0.08;
  for (const seg of segs) {
    const segW = ctx.measureText(seg.text).width * horizScale;
    if (seg.overbar && segW > 0) {
      ctx.beginPath();
      ctx.moveTo(x + curOffset - fontSizePx * 0.04, barY);
      ctx.lineTo(x + curOffset + segW, barY);
      ctx.stroke();
    }
    curOffset += segW;
  }
  ctx.restore();
}

export function renderA4PageToCanvas(
  page: PaginatedA4Page,
  totalPages: number,
  config: PdfLayoutConfig,
  scale: number = 2.6
): HTMLCanvasElement {
  const isPpt = config.questionFormatMode === 'ppt';
  const canvas = document.createElement('canvas');
  const baseWidthPx = (isPpt ? PPT_WIDTH_IN : A4_WIDTH_IN) * BASE_DPI;
  const baseHeightPx = (isPpt ? PPT_HEIGHT_IN : A4_HEIGHT_IN) * BASE_DPI;

  canvas.width = Math.round(baseWidthPx * scale);
  canvas.height = Math.round(baseHeightPx * scale);

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const theme = resolveEffectiveDesignTheme(config);
  const activeFontStack = resolveActivePdfFontFamily(config, theme);

  // Page / Slide background from selected Design Format
  ctx.fillStyle = theme.pageBgColor;
  ctx.fillRect(0, 0, baseWidthPx, baseHeightPx);
  ctx.textBaseline = 'top';

  const isTheory = config.questionFormatMode === 'theory';
  const marginLeftPx = isTheory ? 0.3 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginRightPx = isTheory ? 0.1 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginTopPx = isTheory ? 0.1 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginBottomPx = isTheory ? 0.1 * BASE_DPI : config.marginInches * BASE_DPI;
  const marginPx = marginLeftPx;

  // 0A. UNIQUE SHEET TEXTURE & PAGE FRAME ARCHITECTURE (per Design Format)
  if (!isPpt && !isTheory && theme.pageTexture && theme.pageTexture !== 'none') {
    ctx.save();
    const topBound = marginPx + (config.showDocumentHeader ? HEADER_RESERVE_PX : 0);
    const bottomBound = baseHeightPx - marginPx - (config.showPageNumbers ? FOOTER_RESERVE_PX : 0);

    if (theme.pageTexture === 'dot-grid') {
      ctx.fillStyle = theme.isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(100, 116, 139, 0.16)';
      const step = 14;
      for (let gx = marginPx + 4; gx < baseWidthPx - marginPx; gx += step) {
        for (let gy = topBound + 4; gy < bottomBound; gy += step) {
          ctx.fillRect(gx, gy, 1.1, 1.1);
        }
      }
    } else if (theme.pageTexture === 'blueprint-grid') {
      ctx.strokeStyle = theme.isDark
        ? 'rgba(56, 189, 248, 0.065)'
        : 'rgba(14, 165, 233, 0.08)';
      ctx.lineWidth = 0.45;
      const step = 18;
      ctx.beginPath();
      for (let gx = marginPx; gx <= baseWidthPx - marginPx; gx += step) {
        ctx.moveTo(gx, topBound);
        ctx.lineTo(gx, bottomBound);
      }
      for (let gy = topBound; gy <= bottomBound; gy += step) {
        ctx.moveTo(marginPx, gy);
        ctx.lineTo(baseWidthPx - marginPx, gy);
      }
      ctx.stroke();
    } else if (theme.pageTexture === 'notebook-lines') {
      // Subtle horizontal register lines + red vertical margin rule
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.32)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let gy = topBound + 12; gy < bottomBound; gy += 13.5) {
        ctx.moveTo(marginPx, gy);
        ctx.lineTo(baseWidthPx - marginPx, gy);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.28)';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(marginPx - 3.5, topBound);
      ctx.lineTo(marginPx - 3.5, bottomBound);
      ctx.moveTo(marginPx - 5.2, topBound);
      ctx.lineTo(marginPx - 5.2, bottomBound);
      ctx.stroke();
    } else if (theme.pageTexture === 'double-frame' || theme.pageTexture === 'royal-corners') {
      const fX = Math.max(4, marginPx * 0.32);
      const fY = topBound - 3;
      const fW = baseWidthPx - fX * 2;
      const fH = Math.max(20, bottomBound - topBound + 6);
      ctx.strokeStyle = theme.brandAccentColor;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.85;
      ctx.strokeRect(fX, fY, fW, fH);
      if (theme.pageTexture === 'royal-corners') {
        ctx.lineWidth = 0.5;
        ctx.strokeRect(fX + 2.2, fY + 2.2, fW - 4.4, fH - 4.4);
      }
    }
    ctx.restore();
  }

  const watermarkImg = config.watermarkLogoUrl
    ? getCachedWatermarkImage(config.watermarkLogoUrl)
    : null;

  // 0. PERFECT CENTER LOGO WATERMARK (Unobstructed — large, bold center watermark)
  if (config.showWatermark && watermarkImg && watermarkImg.width > 0 && watermarkImg.height > 0) {
    ctx.save();
    const frac = isPpt
      ? Math.min(0.56, Math.max(0.32, (config.watermarkScale || 0.76) * 0.68))
      : Math.min(0.88, Math.max(0.35, config.watermarkScale || 0.76));
    const targetW = baseWidthPx * frac;
    const aspect = watermarkImg.height / watermarkImg.width;
    const targetH = targetW * aspect;
    const wmX = (baseWidthPx - targetW) / 2;
    const wmY = (baseHeightPx - targetH) / 2;

    ctx.globalCompositeOperation = theme.isDark ? 'screen' : 'multiply';
    const baseOpacity = isTheory
      ? Math.min(0.045, config.watermarkOpacity || 0.05)
      : (config.watermarkOpacity || 0.16);
    ctx.globalAlpha = theme.isDark
      ? Math.min(0.22, Math.max(0.05, baseOpacity * 0.65))
      : Math.min(0.45, Math.max(0.03, baseOpacity));
    ctx.drawImage(watermarkImg, wmX, wmY, targetW, targetH);
    ctx.restore();
  }

  // Helper to apply divider dash pattern based on theme.dividerStyle
  const applyThemeDash = (dashScale = 1) => {
    if (theme.dividerStyle === 'solid' || theme.dividerStyle === 'double') {
      ctx.setLineDash([]);
    } else if (theme.dividerStyle === 'dotted') {
      ctx.setLineDash([1.5 * dashScale, 2.2 * dashScale]);
    } else {
      ctx.setLineDash([4 * dashScale, 2.5 * dashScale]);
    }
  };

  // 1. TOP HEADER BAR:
  if (config.showDocumentHeader) {
    const headerLineY = isTheory
      ? marginTopPx + 11.5
      : marginPx + HEADER_LINE_OFFSET_PX;
    const brandText = (config.brandLeftText || 'Desi Crack').trim();
    const rightWebsiteText = (config.customHeaderRightText || 'desicrack.in').trim() || 'desicrack.in';

    drawCompleteDocumentHeader(
      ctx,
      baseWidthPx,
      marginLeftPx,
      headerLineY,
      brandText,
      rightWebsiteText,
      theme,
      activeFontStack,
      isTheory
        ? 'minimal-clean'
        : config.customHeaderStyle && config.customHeaderStyle !== 'theme-default'
          ? config.customHeaderStyle
          : undefined,
      isTheory ? marginRightPx : undefined
    );
  }

  // 1B. SIMPLE CLEAN B&W PAGE 1 BOOK TITLE
  if (isTheory && page.theoryBannerLines && page.theoryBannerLines.length > 0) {
    const bBoxX = marginLeftPx;
    const bBoxY = marginTopPx + (config.showDocumentHeader ? 15 : 0);
    const bBoxW = baseWidthPx - marginLeftPx - marginRightPx;

    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.font = `800 13px 'Noto Sans Devanagari', 'Anek Devanagari', ${activeFontStack}`;
    ctx.textAlign = 'center';
    let bY = bBoxY + 11.0;
    for (const bLine of page.theoryBannerLines) {
      ctx.fillText(bLine, bBoxX + bBoxW / 2, bY);
      bY += 15.5;
    }
    // Clean subtle rule below the titleplate
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(bBoxX, bY + 1.0);
    ctx.lineTo(bBoxX + bBoxW, bY + 1.0);
    ctx.stroke();
    ctx.restore();
  }

  // 2. CHAPTER-WISE TOPIC INDEX PAGE RENDERING (When page.isIndexPage is true)
  if (page.isIndexPage && page.indexEntries) {
    const headerOffsetPx = config.showDocumentHeader ? HEADER_RESERVE_PX : 0;
    const contentTopPx = marginPx + headerOffsetPx;
    const contentWidthPx = baseWidthPx - marginPx * 2;
    const bannerY = contentTopPx + 2;
    const bannerH = 40;

    // Top Index Banner Box
    ctx.save();
    drawRoundedRectPath(ctx, marginPx, bannerY, contentWidthPx, bannerH, 5);
    ctx.fillStyle = theme.chapterBgColor;
    ctx.fill();
    ctx.strokeStyle = theme.chapterBorderColor;
    ctx.lineWidth = 0.85;
    ctx.stroke();

    // Left accent stripe on Index Banner
    ctx.fillStyle = theme.brandAccentColor;
    ctx.fillRect(marginPx, bannerY + 2, 4.2, bannerH - 4);

    // Banner Title & Subtitle
    ctx.fillStyle = theme.chapterTextColor;
    ctx.font = `800 12.2px 'Outfit', ${FONT_FAMILY}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(
      'CHAPTER-WISE TOPIC INDEX  (विषय-सूची)',
      marginPx + 12,
      bannerY + 14
    );

    ctx.fillStyle = theme.headerMetaColor;
    ctx.font = `600 8.6px 'Outfit', ${FONT_FAMILY}`;
    ctx.fillText(
      'Click on any Topic / Chapter row below to jump directly to its starting page',
      marginPx + 12,
      bannerY + 29
    );

    // Right summary pill inside Index Banner
    const summaryText = `Topics: ${page.totalTopicsCount || page.indexEntries.length}  •  Questions: ${page.totalQuestionsCount || page.questionCount}`;
    ctx.font = `700 9.0px 'Outfit', ${FONT_FAMILY}`;
    const sumW = ctx.measureText(summaryText).width + 16;
    const sumH = 20;
    const sumX = baseWidthPx - marginPx - sumW - 8;
    const sumY = bannerY + (bannerH - sumH) / 2;
    drawRoundedRectPath(ctx, sumX, sumY, sumW, sumH, 4);
    ctx.fillStyle = theme.pageBgColor;
    ctx.fill();
    ctx.strokeStyle = theme.brandAccentColor;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = theme.brandPrimaryColor;
    ctx.fillText(summaryText, sumX + 8, sumY + sumH / 2 + 0.4);
    ctx.restore();

    // Table Column Header Row(s)
    const tableHeaderY = bannerY + bannerH + 8;
    const tableHeaderH = 21;
    const isTwoColIndex = page.indexEntries.length > 20;
    const colGap = isTwoColIndex ? 14 : 0;
    const colW = isTwoColIndex ? (contentWidthPx - colGap) / 2 : contentWidthPx;
    const numCols = isTwoColIndex ? 2 : 1;

    for (let c = 0; c < numCols; c++) {
      const colX = marginPx + c * (colW + colGap);
      ctx.save();
      drawRoundedRectPath(ctx, colX, tableHeaderY, colW, tableHeaderH, 3.5);
      ctx.fillStyle = theme.isDark ? 'rgba(30, 41, 59, 0.9)' : '#0f172a';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = `700 8.2px 'Outfit', ${FONT_FAMILY}`;
      ctx.textBaseline = 'middle';
      const thCenterY = tableHeaderY + tableHeaderH / 2 + 0.4;
      ctx.fillText('S.NO', colX + 8, thCenterY);
      ctx.fillText('TOPIC / CHAPTER NAME', colX + 38, thCenterY);

      const qColLabel = 'QUESTIONS';
      const pgColLabel = 'PAGE NO.';
      const pgLabelW = ctx.measureText(pgColLabel).width;
      const qLabelW = ctx.measureText(qColLabel).width;
      ctx.fillText(
        qColLabel,
        colX + colW - pgLabelW - qLabelW - 36,
        thCenterY
      );
      ctx.fillText(pgColLabel, colX + colW - pgLabelW - 10, thCenterY);
      ctx.restore();
    }

    // Render each Clickable Topic Index Entry Row
    page.indexEntries.forEach((entry, idx) => {
      const { xPx, yPx, widthPx, heightPx } = entry;
      const rowCenterY = yPx + heightPx / 2;

      ctx.save();
      drawRoundedRectPath(ctx, xPx, yPx, widthPx, heightPx, 4);
      if (theme.blockCardBg) {
        ctx.fillStyle = theme.blockCardBg;
      } else {
        ctx.fillStyle =
          idx % 2 === 0
            ? theme.isDark
              ? 'rgba(15, 23, 42, 0.72)'
              : 'rgba(248, 250, 252, 0.92)'
            : theme.pageBgColor;
      }
      ctx.fill();

      ctx.strokeStyle = theme.blockCardBorder || theme.dividerColor;
      ctx.lineWidth = 0.65;
      ctx.stroke();

      // Left Accent Bar on each Topic Row
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fillRect(xPx, yPx + 2, 2.8, heightPx - 4);

      // 1. Serial Number Badge (01, 02, ...)
      const numBadgeW = 22;
      const numBadgeH = Math.min(18, heightPx - 5);
      const numBadgeX = xPx + 7;
      const numBadgeY = rowCenterY - numBadgeH / 2;
      drawRoundedRectPath(ctx, numBadgeX, numBadgeY, numBadgeW, numBadgeH, 3);
      ctx.fillStyle = theme.brandAccentColor;
      ctx.fill();

      const numStr = String(entry.topicNumber).padStart(2, '0');
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 8.5px 'Outfit', ${FONT_FAMILY}`;
      ctx.textBaseline = 'middle';
      const numW = ctx.measureText(numStr).width;
      ctx.fillText(numStr, numBadgeX + (numBadgeW - numW) / 2, rowCenterY + 0.4);

      // 2. Right-side Page Jump Button Badge ("Page 2 ➔")
      const pageBtnText = `Page ${entry.targetPageNumber} ➔`;
      ctx.font = `800 8.6px 'Outfit', ${FONT_FAMILY}`;
      const pageBtnTextW = ctx.measureText(pageBtnText).width;
      const pageBtnW = Math.max(54, pageBtnTextW + 14);
      const pageBtnH = Math.min(19, heightPx - 5);
      const pageBtnX = xPx + widthPx - pageBtnW - 7;
      const pageBtnY = rowCenterY - pageBtnH / 2;

      drawRoundedRectPath(ctx, pageBtnX, pageBtnY, pageBtnW, pageBtnH, 3.5);
      ctx.fillStyle = theme.chapterBgColor;
      ctx.fill();
      ctx.strokeStyle = theme.brandAccentColor;
      ctx.lineWidth = 0.85;
      ctx.stroke();

      ctx.fillStyle = theme.chapterTextColor;
      ctx.fillText(
        pageBtnText,
        pageBtnX + (pageBtnW - pageBtnTextW) / 2,
        rowCenterY + 0.4
      );

      // 3. Questions Count & Range Badge ("15 Qs (Q1–Q15)")
      const qRangeText = `${entry.questionCount} Qs (Q${entry.startQLabel}–Q${entry.endQLabel})`;
      ctx.font = `600 8.2px 'Outfit', ${FONT_FAMILY}`;
      const qRangeW = ctx.measureText(qRangeText).width;
      const qRangeX = pageBtnX - qRangeW - 12;
      ctx.fillStyle = theme.headerMetaColor;
      ctx.fillText(qRangeText, qRangeX, rowCenterY + 0.4);

      // 4. Topic / Chapter Name + Dotted Leader Line
      const topicStartX = numBadgeX + numBadgeW + 8;
      const maxTopicW = Math.max(40, qRangeX - topicStartX - 12);
      ctx.font = `700 ${isTwoColIndex ? '9.2px' : '10.0px'} 'Outfit', ${FONT_FAMILY}`;
      ctx.fillStyle = theme.qPrimaryColor;

      let displayTopic = entry.topicName.toUpperCase();
      while (
        displayTopic.length > 4 &&
        ctx.measureText(displayTopic).width > maxTopicW
      ) {
        displayTopic = `${displayTopic.slice(0, -2).trim()}…`;
      }
      ctx.fillText(displayTopic, topicStartX, rowCenterY + 0.4);

      const topicActualW = ctx.measureText(displayTopic).width;
      const dotsStartX = topicStartX + topicActualW + 6;
      const dotsEndX = qRangeX - 8;
      if (dotsEndX > dotsStartX + 10) {
        ctx.save();
        ctx.strokeStyle = theme.dividerColor;
        ctx.lineWidth = 0.75;
        ctx.setLineDash([1.5, 2.5]);
        ctx.beginPath();
        ctx.moveTo(dotsStartX, rowCenterY + 1);
        ctx.lineTo(dotsEndX, rowCenterY + 1);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    });
  }

  // 2B. Vertical center column separator for 2-column mode (A4 only, non-index pages)
  if (!isPpt && !page.isIndexPage && (config.columns === 2 || isTheory)) {
    const colGapPx = isTheory ? 14 : 20;
    const colWidthPx = isTheory
      ? (baseWidthPx - marginLeftPx - marginRightPx - colGapPx) / 2
      : (baseWidthPx - marginPx * 2 - colGapPx) / 2;
    const centerX = isTheory
      ? marginLeftPx + colWidthPx + colGapPx / 2
      : baseWidthPx / 2;
    const topDividerY = isTheory
      ? page.theoryBannerBottomY
        ? page.theoryBannerBottomY + 4
        : marginTopPx + (config.showDocumentHeader ? 14 : 2)
      : config.showDocumentHeader
        ? marginPx + HEADER_LINE_OFFSET_PX + 5
        : marginPx;
    const bottomDividerY = isTheory
      ? baseHeightPx - marginBottomPx - (config.showPageNumbers ? 14 : 2)
      : config.showPageNumbers
        ? baseHeightPx - marginPx - FOOTER_LINE_OFFSET_PX - 5
        : baseHeightPx - marginPx;
    ctx.save();
    if (isTheory) {
      // Clean Razor-Sharp Vertical Divider Line for B&W 2-Column Theory Notes
      ctx.strokeStyle = '#a1a1aa';
      ctx.lineWidth = 0.55;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX, topDividerY);
      ctx.lineTo(centerX, bottomDividerY);
      ctx.stroke();
    } else if (
      theme.headerFooterStyle === 'gazette-double-rule' ||
      theme.headerFooterStyle === 'royal-ornate-ribbon'
    ) {
      ctx.strokeStyle = theme.brandAccentColor;
      ctx.lineWidth = 0.6;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX - 1.1, topDividerY);
      ctx.lineTo(centerX - 1.1, bottomDividerY);
      ctx.moveTo(centerX + 1.1, topDividerY);
      ctx.lineTo(centerX + 1.1, bottomDividerY);
      ctx.stroke();
    } else if (theme.headerFooterStyle === 'neo-brutalist-bar') {
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.25;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX, topDividerY);
      ctx.lineTo(centerX, bottomDividerY);
      ctx.stroke();
    } else if (theme.headerFooterStyle === 'register-top-stamp') {
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.55)';
      ctx.lineWidth = 0.85;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(centerX - 0.9, topDividerY);
      ctx.lineTo(centerX - 0.9, bottomDividerY);
      ctx.moveTo(centerX + 0.9, topDividerY);
      ctx.lineTo(centerX + 0.9, bottomDividerY);
      ctx.stroke();
    } else {
      ctx.strokeStyle =
        theme.headerFooterStyle === 'cyber-hud-angled'
          ? theme.brandAccentColor
          : theme.dividerColor;
      ctx.lineWidth = theme.dividerStyle === 'solid' ? 0.65 : 0.8;
      applyThemeDash(1);
      ctx.beginPath();
      ctx.moveTo(centerX, topDividerY);
      ctx.lineTo(centerX, bottomDividerY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Group items by column so we can compute exact gap between answer bottom and next question top
  const itemsByCol: Record<number, PaginatedItem[]> = { 0: [], 1: [] };
  for (const it of page.items) {
    if (it.type === 'qa-block') {
      itemsByCol[it.column].push(it);
    }
  }

  // 3. Render Question & Answer/Option blocks
  for (const colIdx of [0, 1] as const) {
    const colItems = itemsByCol[colIdx];
    for (let idx = 0; idx < colItems.length; idx++) {
      const item = colItems[idx];
      let curY = item.yPx;
      const qToAGap = item.qToAGapPx ?? 1.0;
      const ansPadY = item.ansPadYPx ?? 0.8;

      // Pre-compute total natural height of this block's rendered lines for card/bar decorations
      const qLinesH = (item.qLines || []).reduce((s, l) => s + l.lineHeightPx, 0);
      const aLinesH = (item.aLines || []).reduce((s, l) => s + l.lineHeightPx, 0);
      const rawContentH =
        qLinesH + qToAGap + (aLinesH > 0 ? ansPadY * 0.8 + aLinesH : 0);
      const stretchDeltaPx =
        isTheory || config.autoFillFullPage
          ? Math.max(0, item.heightPx - rawContentH - 4.2)
          : 0;
      const effectiveQToAGap =
        aLinesH > 0 ? qToAGap + stretchDeltaPx : qToAGap;
      const naturalBlockBottomY =
        item.yPx +
        qLinesH +
        effectiveQToAGap +
        (aLinesH > 0 ? ansPadY * 0.8 + aLinesH : stretchDeltaPx);

      // Optional structural block container around each Q&A block (Disabled in Theory mode for clean borderless/shapeless look)
      if (!isPpt && !isTheory) {
        const blockX = item.xPx - 2.6;
        const blockY = item.yPx - 1.8;
        const blockW = item.widthPx + 3.8;
        const blockH = Math.max(8, naturalBlockBottomY - item.yPx + 3.8);

        if (theme.blockStyle === 'neo-brutalist') {
          ctx.save();
          // 3D Hard offset Neo-Brutalist shadow
          drawRoundedRectPath(ctx, blockX + 2.1, blockY + 2.1, blockW, blockH, 2.5);
          ctx.fillStyle = theme.blockCardBorder || '#09090b';
          ctx.fill();
          // Crisp main card
          drawRoundedRectPath(ctx, blockX, blockY, blockW, blockH, 2.5);
          ctx.fillStyle = theme.blockCardBg || '#ffffff';
          ctx.fill();
          ctx.strokeStyle = theme.blockCardBorder || '#09090b';
          ctx.lineWidth = 1.15;
          ctx.stroke();
          ctx.restore();
        } else if (theme.blockStyle === 'top-header-card') {
          ctx.save();
          drawRoundedRectPath(ctx, blockX, blockY, blockW, blockH, 3.2);
          ctx.fillStyle =
            theme.blockCardBg ||
            (theme.isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(248, 250, 252, 0.85)');
          ctx.fill();
          ctx.strokeStyle = theme.blockCardBorder || theme.dividerColor;
          ctx.lineWidth = 0.75;
          ctx.stroke();
          // Bold Top Accent Header Strip on Card
          ctx.fillStyle = theme.brandAccentColor;
          ctx.fillRect(blockX + 0.5, blockY + 0.5, blockW - 1, 2.4);
          ctx.restore();
        } else if (theme.blockStyle === 'double-royal-card') {
          ctx.save();
          drawRoundedRectPath(ctx, blockX, blockY, blockW, blockH, 2.5);
          ctx.fillStyle =
            theme.blockCardBg ||
            (theme.isDark ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 253, 245, 0.88)');
          ctx.fill();
          ctx.strokeStyle = theme.brandAccentColor;
          ctx.lineWidth = 0.9;
          ctx.stroke();
          drawRoundedRectPath(ctx, blockX + 1.6, blockY + 1.6, blockW - 3.2, blockH - 3.2, 1.5);
          ctx.lineWidth = 0.45;
          ctx.stroke();
          ctx.restore();
        } else if (theme.blockStyle === 'ticket-notched-card') {
          ctx.save();
          drawRoundedRectPath(ctx, blockX, blockY, blockW, blockH, 3.2);
          ctx.fillStyle =
            theme.blockCardBg ||
            (theme.isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.88)');
          ctx.fill();
          ctx.strokeStyle = theme.brandAccentColor;
          ctx.lineWidth = 0.75;
          ctx.setLineDash([3.2, 2.0]);
          ctx.stroke();
          ctx.setLineDash([]);
          // Semicircular ticket notches on left & right middle
          const notchY = blockY + Math.min(16, blockH * 0.35);
          ctx.fillStyle = theme.pageBgColor;
          ctx.beginPath();
          ctx.arc(blockX, notchY, 2.4, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(blockX + blockW, notchY, 2.4, Math.PI / 2, (Math.PI * 3) / 2);
          ctx.fill();
          ctx.restore();
        } else if (theme.blockStyle === 'corner-brackets') {
          ctx.save();
          if (theme.blockCardBg || isTheory) {
            drawRoundedRectPath(ctx, blockX, blockY, blockW, blockH, 2.5);
            ctx.fillStyle =
              theme.blockCardBg ||
              (theme.isDark ? 'rgba(15, 23, 42, 0.68)' : 'rgba(248, 250, 252, 0.78)');
            ctx.fill();
          }
          // Tech L-shaped corner brackets
          const bLen = 5.8;
          ctx.strokeStyle = theme.brandAccentColor;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(blockX, blockY + bLen);
          ctx.lineTo(blockX, blockY);
          ctx.lineTo(blockX + bLen, blockY);
          ctx.moveTo(blockX + blockW - bLen, blockY);
          ctx.lineTo(blockX + blockW, blockY);
          ctx.lineTo(blockX + blockW, blockY + bLen);
          ctx.moveTo(blockX, blockY + blockH - bLen);
          ctx.lineTo(blockX, blockY + blockH);
          ctx.lineTo(blockX + bLen, blockY + blockH);
          ctx.moveTo(blockX + blockW - bLen, blockY + blockH);
          ctx.lineTo(blockX + blockW, blockY + blockH);
          ctx.lineTo(blockX + blockW, blockY + blockH - bLen);
          ctx.stroke();
          ctx.restore();
        } else if (
          isTheory ||
          theme.blockStyle === 'bordered-card' ||
          theme.blockStyle === 'soft-card' ||
          theme.blockCardBg
        ) {
          ctx.save();
          drawRoundedRectPath(ctx, blockX, blockY, blockW, blockH, 3.2);
          ctx.fillStyle =
            theme.blockCardBg ||
            (theme.isDark ? 'rgba(15, 23, 42, 0.68)' : 'rgba(248, 250, 252, 0.82)');
          ctx.fill();
          if (isTheory || theme.blockStyle === 'bordered-card' || theme.blockCardBorder) {
            ctx.strokeStyle =
              theme.blockCardBorder || theme.chapterBorderColor || theme.dividerColor;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
          if (isTheory) {
            ctx.fillStyle = theme.brandAccentColor;
            ctx.fillRect(blockX, blockY + 1.5, 2.5, Math.max(6, blockH - 3.0));
          }
          ctx.restore();
        }

        // Left vertical accent stripe on Q&A block
        if (
          !isTheory &&
          (theme.blockStyle === 'left-stripe' || theme.blockLeftBarColor) &&
          theme.blockStyle !== 'neo-brutalist' &&
          theme.blockStyle !== 'top-header-card' &&
          theme.blockStyle !== 'double-royal-card'
        ) {
          ctx.save();
          ctx.fillStyle = theme.blockLeftBarColor || theme.brandAccentColor;
          ctx.fillRect(
            item.xPx - 2.8,
            item.yPx + 0.5,
            2.0,
            Math.max(6, naturalBlockBottomY - item.yPx - 1.0)
          );
          ctx.restore();
        }
      }

      if (item.qLines) {
        for (let qLineIdx = 0; qLineIdx < item.qLines.length; qLineIdx++) {
          const qLine = item.qLines[qLineIdx];
          const indent = qLine.indentPx || 0;
          const maxLineW = Math.max(20, item.widthPx - indent - 2);
          if (qLine.isChapterHeading) {
            if (isTheory) {
              // B&W Laser Printout: Solid black chapter heading with clean underline rule
              const isFirstHeadingLine =
                qLineIdx === 0 || !item.qLines[qLineIdx - 1]?.isChapterHeading;

              ctx.save();
              ctx.textBaseline = 'top';
              let textStartX = item.xPx;
              if (isFirstHeadingLine) {
                const badgeLbl = '❖ ';
                ctx.font = `800 ${qLine.fontSizePx}px ${activeFontStack}`;
                ctx.fillStyle = '#000000';
                ctx.fillText(badgeLbl, textStartX, curY + 1.0);
                textStartX += ctx.measureText(badgeLbl).width;
              }

              ctx.fillStyle = '#000000';
              ctx.font = `800 ${qLine.fontSizePx * 1.05}px ${activeFontStack}`;
              ctx.fillText(
                qLine.text,
                textStartX,
                curY + 0.8,
                Math.max(20, item.widthPx - (textStartX - item.xPx) - 2)
              );

              // Solid rule below the chapter title if last line of heading
              if (
                qLine.isChapterHeadingLastLine ||
                qLineIdx === item.qLines.length - 1 ||
                !item.qLines[qLineIdx + 1]?.isChapterHeading
              ) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 0.85;
                ctx.beginPath();
                ctx.moveTo(item.xPx, curY + qLine.lineHeightPx - 1.2);
                ctx.lineTo(item.xPx + item.widthPx, curY + qLine.lineHeightPx - 1.2);
                ctx.stroke();
              }
              ctx.restore();
              curY += qLine.lineHeightPx;
              continue;
            }
            const bannerH = Math.max(12.5, qLine.fontSizePx * 1.42);
            const bannerW = item.widthPx - 2;
            const bannerY = curY;
            ctx.save();
            if (theme.headerFooterStyle === 'neo-brutalist-bar') {
              ctx.fillStyle = '#09090b';
              ctx.fillRect(item.xPx + 1.6, bannerY + 1.6, bannerW, bannerH);
              ctx.fillStyle = theme.chapterBgColor;
              ctx.fillRect(item.xPx, bannerY, bannerW, bannerH);
              ctx.strokeStyle = '#09090b';
              ctx.lineWidth = 1.1;
              ctx.strokeRect(item.xPx, bannerY, bannerW, bannerH);
            } else if (
              theme.headerFooterStyle === 'solid-coaching-bar' ||
              theme.headerFooterStyle === 'slanted-power-bar'
            ) {
              drawRoundedRectPath(ctx, item.xPx, bannerY, bannerW, bannerH, 2.8);
              ctx.fillStyle = theme.brandPrimaryColor;
              ctx.fill();
              ctx.fillStyle = theme.brandAccentColor;
              ctx.fillRect(item.xPx, bannerY, 4.0, bannerH);
            } else if (theme.headerFooterStyle === 'floating-stadium-pill') {
              drawRoundedRectPath(ctx, item.xPx, bannerY, bannerW, bannerH, bannerH / 2);
              ctx.fillStyle = theme.chapterBgColor;
              ctx.fill();
              ctx.strokeStyle = theme.brandAccentColor;
              ctx.lineWidth = 0.85;
              ctx.stroke();
            } else {
              ctx.fillStyle = theme.chapterBgColor;
              ctx.fillRect(item.xPx, bannerY, bannerW, bannerH);
              ctx.strokeStyle = theme.chapterBorderColor;
              ctx.lineWidth = 0.65;
              ctx.strokeRect(item.xPx, bannerY, bannerW, bannerH);
              ctx.fillStyle = theme.brandAccentColor;
              ctx.fillRect(item.xPx, bannerY, 3.0, bannerH);
            }
            // Chapter Title text centered vertically inside the banner
            ctx.fillStyle =
              theme.headerFooterStyle === 'solid-coaching-bar' ||
              theme.headerFooterStyle === 'slanted-power-bar'
                ? '#ffffff'
                : theme.chapterTextColor;
            ctx.font = `800 ${qLine.fontSizePx}px ${activeFontStack}`;
            ctx.textBaseline = 'middle';
            ctx.fillText(
              qLine.text,
              item.xPx + indent + (theme.headerFooterStyle === 'floating-stadium-pill' ? 4 : 0),
              bannerY + bannerH / 2 + 0.4,
              maxLineW
            );
            ctx.restore();
            curY += qLine.lineHeightPx;
            continue;
          }

          if (isTheory && qLine.isSubHeading) {
            // Clean B&W Sub-Heading: Crisp solid black ◆ marker and bold text
            ctx.save();
            const cleanSub = qLine.text.replace(/^#{2,4}\s+/, '').trim();
            ctx.font = `800 ${qLine.fontSizePx}px ${activeFontStack}`;
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#000000';
            ctx.fillText('◆', item.xPx + 1, curY + 0.8);
            ctx.fillText(
              cleanSub,
              item.xPx + 10,
              curY + 0.8,
              Math.max(20, item.widthPx - 12)
            );
            ctx.restore();
            curY += qLine.lineHeightPx;
            continue;
          }

          if (isTheory && qLine.isTableRow && qLine.tableCells && qLine.tableCells.length > 0) {
            // Clean B&W Table with subtle gray header fill and crisp borders
            const cells = qLine.tableCells;
            const numCols = Math.max(1, cells.length);
            const tblX = item.xPx + 1;
            const tblW = item.widthPx - 2;
            const tblH = qLine.lineHeightPx;
            const colW = tblW / numCols;

            ctx.save();
            ctx.fillStyle = qLine.isTableHeader ? '#f4f4f5' : '#ffffff';
            ctx.fillRect(tblX, curY, tblW, tblH);

            ctx.strokeStyle = qLine.isTableHeader ? '#000000' : '#d4d4d8';
            ctx.lineWidth = qLine.isTableHeader ? 0.75 : 0.45;
            ctx.strokeRect(tblX, curY, tblW, tblH);

            for (let cIdx = 0; cIdx < numCols; cIdx++) {
              const cellX = tblX + cIdx * colW;
              const cellText = cells[cIdx] || '';
              ctx.font = `${qLine.isTableHeader || cIdx === 0 ? '700' : '400'} ${qLine.fontSizePx}px ${activeFontStack}`;
              ctx.fillStyle = '#000000';
              ctx.textBaseline = 'middle';
              ctx.fillText(
                cellText,
                cellX + 2.5,
                curY + tblH / 2 + 0.2,
                Math.max(10, colW - 5)
              );
              if (cIdx > 0) {
                ctx.beginPath();
                ctx.moveTo(cellX, curY);
                ctx.lineTo(cellX, curY + tblH);
                ctx.stroke();
              }
            }
            ctx.restore();
            curY += qLine.lineHeightPx;
            continue;
          }

          if (isTheory && qLine.isQuoteLine) {
            // Clean B&W Quote Line with solid black left bar
            ctx.save();
            ctx.textBaseline = 'top';
            let quoteTextX = item.xPx + 4;
            if (qLine.isQuoteFirstLine) {
              const qPrefix = '❝ ';
              ctx.font = `800 ${qLine.fontSizePx}px ${activeFontStack}`;
              ctx.fillStyle = '#000000';
              ctx.fillText(qPrefix, quoteTextX, curY + 0.4);
              quoteTextX += ctx.measureText(qPrefix).width;
            } else {
              quoteTextX = item.xPx + 10;
            }

            const cleanQText = qLine.text.replace(/\*\*/g, '');
            ctx.font = `italic 600 ${qLine.fontSizePx}px ${activeFontStack}`;
            ctx.fillStyle = '#000000';
            ctx.fillText(
              cleanQText,
              quoteTextX,
              curY + 0.4,
              Math.max(20, item.xPx + item.widthPx - quoteTextX - 3)
            );
            ctx.restore();
            curY += qLine.lineHeightPx;
            continue;
          }

          if (isTheory && qLine.isMainPoint) {
            // Clean B&W Main Point
            ctx.save();
            ctx.textBaseline = 'top';
            let textStartX = item.xPx + indent;
            if (qLine.mainPointBadge) {
              const badgeStr = `◆ ${qLine.mainPointBadge}: `;
              ctx.font = `800 ${qLine.fontSizePx}px ${activeFontStack}`;
              ctx.fillStyle = '#000000';
              ctx.fillText(badgeStr, textStartX, curY + 0.4);
              textStartX += ctx.measureText(badgeStr).width;
            }
            const cleanPtText = qLine.text.replace(/\*\*/g, '');
            ctx.font = `${qLine.mainPointBadge ? '700' : '600'} ${qLine.fontSizePx}px ${activeFontStack}`;
            ctx.fillStyle = '#000000';
            ctx.fillText(
              cleanPtText,
              textStartX,
              curY + 0.4,
              Math.max(20, item.xPx + item.widthPx - textStartX - 3)
            );
            ctx.restore();
            curY += qLine.lineHeightPx;
            continue;
          }

          if (isTheory && (qLine.text.includes('**') || qLine.isSubPoint || qLine.text.startsWith('•'))) {
            // Render inline **bold** words in solid black 700 weight, bullets (• / ↳) in solid black
            ctx.save();
            ctx.textBaseline = 'top';
            const tokens = qLine.text.split(' ');
            const segs: Array<{ text: string; bold: boolean; isBulletSym?: boolean }> = [];
            for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
              const rawTok = tokens[tIdx];
              if (tIdx === 0 && (rawTok === '•' || rawTok === '❖')) {
                segs.push({ text: '• ', bold: true, isBulletSym: true });
                continue;
              }
              if (tIdx === 0 && rawTok === '↳') {
                segs.push({ text: '↳ ', bold: true, isBulletSym: true });
                continue;
              }
              const isTokBold =
                rawTok.startsWith('**') && rawTok.endsWith('**') && rawTok.length > 4;
              const cleanTok = rawTok.replace(/\*\*/g, '');
              const withSpace = tIdx < tokens.length - 1 ? `${cleanTok} ` : cleanTok;
              if (
                segs.length > 0 &&
                segs[segs.length - 1].bold === isTokBold &&
                !segs[segs.length - 1].isBulletSym
              ) {
                segs[segs.length - 1].text += withSpace;
              } else {
                segs.push({ text: withSpace, bold: isTokBold });
              }
            }
            let totalNaturalW = 0;
            for (const seg of segs) {
              ctx.font = `${seg.bold ? '700' : '400'} ${qLine.fontSizePx}px ${activeFontStack}`;
              totalNaturalW += ctx.measureText(seg.text).width;
            }
            const scaleX =
              totalNaturalW > maxLineW && totalNaturalW > 0 ? maxLineW / totalNaturalW : 1;
            let drawX = item.xPx + indent;
            for (const seg of segs) {
              ctx.font = `${seg.bold ? '700' : '400'} ${qLine.fontSizePx}px ${activeFontStack}`;
              ctx.fillStyle = '#000000';
              const w = ctx.measureText(seg.text).width * scaleX;
              ctx.fillText(seg.text, drawX, curY, w + 1);
              drawX += w;
            }
            ctx.restore();
            curY += qLine.lineHeightPx;
            continue;
          }

          const cleanLineText = qLine.text.replace(/\*\*/g, '');
          const isFirstQuestionTextLine =
            !isPpt &&
            !isTheory &&
            qLine.isBold &&
            /^\d+\.\s+/.test(cleanLineText) &&
            theme.qBadgeStyle &&
            theme.qBadgeStyle !== 'plain';

          if (isFirstQuestionTextLine) {
            const numMatch = cleanLineText.match(/^(\d+)\.\s+(.*)$/);
            if (numMatch) {
              const qNumStr = numMatch[1];
              const restQuestionText = numMatch[2];
              ctx.save();
              ctx.font = `800 ${qLine.fontSizePx * 0.9}px ${activeFontStack}`;
              const badgeLabel =
                theme.qBadgeStyle === 'solid-pill' ||
                theme.qBadgeStyle === 'outlined-box' ||
                theme.qBadgeStyle === 'slanted-tag'
                  ? `Q.${qNumStr}`
                  : theme.qBadgeStyle === 'brutalist-box'
                    ? `Q${qNumStr}`
                    : qNumStr;
              const labelW = ctx.measureText(badgeLabel).width;
              const badgePadX =
                theme.qBadgeStyle === 'circle-badge' || theme.qBadgeStyle === 'double-ring'
                  ? 3.6
                  : 3.3;
              const badgeW = Math.max(qLine.fontSizePx * 1.38, labelW + badgePadX * 2);
              const badgeH = Math.max(8.6, qLine.fontSizePx * 1.18);
              const badgeX = item.xPx + indent;
              const badgeY = curY + Math.max(0, (qLine.lineHeightPx - badgeH) * 0.35 - 0.3);

              if (theme.qBadgeStyle === 'solid-pill') {
                drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 2.6);
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  badgeLabel,
                  badgeX + (badgeW - labelW) / 2,
                  badgeY + badgeH / 2 + 0.3
                );
              } else if (theme.qBadgeStyle === 'brutalist-box') {
                ctx.fillStyle = '#09090b';
                ctx.fillRect(badgeX + 1.2, badgeY + 1.2, badgeW, badgeH);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
                ctx.strokeStyle = '#09090b';
                ctx.lineWidth = 0.85;
                ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
                ctx.fillStyle = '#09090b';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  badgeLabel,
                  badgeX + (badgeW - labelW) / 2,
                  badgeY + badgeH / 2 + 0.3
                );
              } else if (theme.qBadgeStyle === 'slanted-tag') {
                const slant = 2.6;
                ctx.beginPath();
                ctx.moveTo(badgeX + slant, badgeY);
                ctx.lineTo(badgeX + badgeW + slant, badgeY);
                ctx.lineTo(badgeX + badgeW, badgeY + badgeH);
                ctx.lineTo(badgeX, badgeY + badgeH);
                ctx.closePath();
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  badgeLabel,
                  badgeX + slant / 2 + (badgeW - labelW) / 2,
                  badgeY + badgeH / 2 + 0.3
                );
              } else if (theme.qBadgeStyle === 'double-ring') {
                drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
                ctx.fillStyle = theme.chapterBgColor;
                ctx.fill();
                ctx.strokeStyle = theme.brandAccentColor;
                ctx.lineWidth = 0.9;
                ctx.stroke();
                drawRoundedRectPath(
                  ctx,
                  badgeX + 1.3,
                  badgeY + 1.3,
                  badgeW - 2.6,
                  badgeH - 2.6,
                  (badgeH - 2.6) / 2
                );
                ctx.lineWidth = 0.45;
                ctx.stroke();
                ctx.fillStyle = theme.brandPrimaryColor;
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  badgeLabel,
                  badgeX + (badgeW - labelW) / 2,
                  badgeY + badgeH / 2 + 0.3
                );
              } else if (theme.qBadgeStyle === 'outlined-box') {
                drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, 2.2);
                ctx.fillStyle = theme.chapterBgColor;
                ctx.fill();
                ctx.strokeStyle = theme.brandAccentColor;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                ctx.fillStyle = theme.brandAccentColor;
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  badgeLabel,
                  badgeX + (badgeW - labelW) / 2,
                  badgeY + badgeH / 2 + 0.3
                );
              } else if (theme.qBadgeStyle === 'circle-badge') {
                drawRoundedRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                  badgeLabel,
                  badgeX + (badgeW - labelW) / 2,
                  badgeY + badgeH / 2 + 0.3
                );
              } else if (theme.qBadgeStyle === 'left-bracket') {
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fillRect(badgeX, badgeY + 0.5, 2.2, badgeH - 1);
                ctx.font = `800 ${qLine.fontSizePx}px ${activeFontStack}`;
                ctx.textBaseline = 'top';
                ctx.fillText(`${qNumStr}.`, badgeX + 3.6, curY);
              }
              ctx.restore();

              const textOffsetX =
                theme.qBadgeStyle === 'left-bracket'
                  ? ctx.measureText(`${qNumStr}. `).width + 4.8
                  : theme.qBadgeStyle === 'slanted-tag'
                    ? badgeW + 5.5
                    : badgeW + 4.0;
              ctx.fillStyle = qLine.color;
              ctx.font = `600 ${qLine.fontSizePx}px ${activeFontStack}`;
              ctx.textBaseline = 'top';
              drawMathAwareTextLine(
                ctx,
                restQuestionText,
                item.xPx + indent + textOffsetX,
                curY,
                qLine.fontSizePx,
                Math.max(20, maxLineW - textOffsetX)
              );
              curY += qLine.lineHeightPx;
              continue;
            }
          }

          ctx.fillStyle = qLine.color;
          ctx.font = `${qLine.isBold ? (isPpt || isTheory ? '700' : '600') : '400'} ${qLine.fontSizePx}px ${activeFontStack}`;
          ctx.textBaseline = 'top';
          drawMathAwareTextLine(
            ctx,
            cleanLineText,
            item.xPx + indent,
            curY,
            qLine.fontSizePx,
            maxLineW
          );
          curY += qLine.lineHeightPx;
        }
      }

      curY += effectiveQToAGap;

      let ansBottomY = curY;
      if (item.aLines && item.aLines.length > 0) {
        let aY = curY + ansPadY * 0.4;

        // Pre-draw full Explanation Callout Box behind all explanation lines if present (Non-Theory mode only)
        if (!isPpt && !isTheory) {
          let exStartY = -1;
          let exEndY = -1;
          let scanY = aY;
          for (const scanLine of item.aLines) {
            if (scanLine.lineRole === 'ex-first' || scanLine.lineRole === 'ex-cont') {
              if (exStartY < 0) exStartY = scanY;
              exEndY = scanY + scanLine.lineHeightPx;
            }
            scanY += scanLine.lineHeightPx;
          }
          if (exStartY >= 0 && exEndY > exStartY) {
            const exBoxStyle = theme.exBoxStyle || 'callout-card';
            const exX = item.xPx + 0.5;
            const exY = exStartY - 0.8;
            const exW = item.widthPx - 2.0;
            const exH = Math.max(8, exEndY - exStartY + 1.6);
            ctx.save();
            if (exBoxStyle === 'callout-card') {
              drawRoundedRectPath(ctx, exX, exY, exW, exH, 2.8);
              ctx.fillStyle = theme.exBgColor || theme.chapterBgColor;
              ctx.fill();
              ctx.strokeStyle = theme.chapterBorderColor || theme.dividerColor;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            } else if (exBoxStyle === 'left-quote-stripe') {
              drawRoundedRectPath(ctx, exX, exY, exW, exH, 2.2);
              ctx.fillStyle = theme.exBgColor || theme.chapterBgColor;
              ctx.fill();
              ctx.fillStyle = theme.exPrimaryColor || theme.brandAccentColor;
              ctx.fillRect(exX, exY + 0.5, 2.4, Math.max(4, exH - 1));
            } else if (exBoxStyle === 'dashed-note-box') {
              drawRoundedRectPath(ctx, exX, exY, exW, exH, 2.8);
              ctx.fillStyle = theme.exBgColor || theme.chapterBgColor;
              ctx.fill();
              ctx.strokeStyle = theme.exPrimaryColor || theme.brandAccentColor;
              ctx.lineWidth = 0.65;
              ctx.setLineDash([2.8, 1.8]);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (exBoxStyle === 'brutalist-note') {
              ctx.fillStyle = '#09090b';
              ctx.fillRect(exX + 1.3, exY + 1.3, exW, exH);
              ctx.fillStyle = theme.exBgColor || '#fef9c3';
              ctx.fillRect(exX, exY, exW, exH);
              ctx.strokeStyle = '#09090b';
              ctx.lineWidth = 0.85;
              ctx.strokeRect(exX, exY, exW, exH);
            } else if (exBoxStyle === 'cyber-hud-note') {
              drawRoundedRectPath(ctx, exX, exY, exW, exH, 2.2);
              ctx.fillStyle = theme.exBgColor || 'rgba(15, 23, 42, 0.88)';
              ctx.fill();
              ctx.strokeStyle = theme.exPrimaryColor || theme.brandAccentColor;
              ctx.lineWidth = 0.75;
              ctx.stroke();
              ctx.fillStyle = theme.exPrimaryColor || theme.brandAccentColor;
              ctx.fillRect(exX, exY, 2.5, exH);
            } else if (exBoxStyle === 'top-rule-editorial') {
              ctx.strokeStyle = theme.exPrimaryColor || theme.brandAccentColor;
              ctx.lineWidth = 0.65;
              ctx.beginPath();
              ctx.moveTo(exX, exY + 0.3);
              ctx.lineTo(exX + exW, exY + 0.3);
              ctx.stroke();
            }
            ctx.restore();
          }
        }

        for (const aLine of item.aLines) {
          const indent = aLine.indentPx || 0;
          const maxLineW = Math.max(20, item.widthPx - indent - 2);

          // A. OPTION LINE RENDERING (7 Unique Option Styles for (A), (B), (C), (D))
          if (aLine.lineRole === 'option-first' && !isPpt && !isTheory) {
            const optMatch = aLine.text.match(/^\(([A-Da-d1-4])\)\s*(.*)$/);
            const optStyle = theme.optionStyle || 'omr-circle';
            if (optMatch && optStyle !== 'clean-bold') {
              const optCode = optMatch[1].toUpperCase();
              const optBodyText = optMatch[2];
              const optX = item.xPx + indent;
              const badgeSize = Math.max(8.2, aLine.fontSizePx * 1.14);
              const badgeY = aY + Math.max(0, (aLine.lineHeightPx - badgeSize) * 0.36 - 0.3);

              ctx.save();
              if (optStyle === 'row-strip') {
                drawRoundedRectPath(
                  ctx,
                  optX - 1.5,
                  aY - 0.4,
                  item.widthPx - indent - 1,
                  aLine.lineHeightPx - 0.4,
                  2.2
                );
                ctx.fillStyle = theme.isDark
                  ? 'rgba(30, 41, 59, 0.65)'
                  : theme.chapterBgColor;
                ctx.fill();
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fillRect(optX - 1.5, aY + 0.4, 2.0, Math.max(4, aLine.lineHeightPx - 2));
              }

              ctx.font = `800 ${aLine.fontSizePx * 0.84}px ${activeFontStack}`;
              ctx.textBaseline = 'middle';

              if (optStyle === 'omr-circle' || optStyle === 'row-strip') {
                const r = badgeSize / 2;
                const cx = optX + r + (optStyle === 'row-strip' ? 2 : 0);
                const cy = badgeY + r;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = theme.chapterBgColor;
                ctx.fill();
                ctx.strokeStyle = theme.brandAccentColor;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                const cW = ctx.measureText(optCode).width;
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fillText(optCode, cx - cW / 2, cy + 0.3);
              } else if (optStyle === 'solid-circle') {
                const r = badgeSize / 2;
                const cx = optX + r;
                const cy = badgeY + r;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fill();
                const cW = ctx.measureText(optCode).width;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(optCode, cx - cW / 2, cy + 0.3);
              } else if (optStyle === 'square-keycap') {
                drawRoundedRectPath(ctx, optX, badgeY, badgeSize, badgeSize, 2.0);
                ctx.fillStyle = theme.chapterBgColor;
                ctx.fill();
                ctx.strokeStyle = theme.brandAccentColor;
                ctx.lineWidth = 0.8;
                ctx.stroke();
                const cW = ctx.measureText(optCode).width;
                ctx.fillStyle = theme.brandPrimaryColor;
                ctx.fillText(optCode, optX + (badgeSize - cW) / 2, badgeY + badgeSize / 2 + 0.3);
              } else if (optStyle === 'pill-tag') {
                const pillW = badgeSize + 3.2;
                drawRoundedRectPath(ctx, optX, badgeY, pillW, badgeSize, badgeSize / 2);
                ctx.fillStyle = theme.chapterBgColor;
                ctx.fill();
                ctx.strokeStyle = theme.brandAccentColor;
                ctx.lineWidth = 0.7;
                ctx.stroke();
                const cW = ctx.measureText(optCode).width;
                ctx.fillStyle = theme.brandAccentColor;
                ctx.fillText(optCode, optX + (pillW - cW) / 2, badgeY + badgeSize / 2 + 0.3);
              } else if (optStyle === 'brutalist-chip') {
                ctx.fillStyle = '#09090b';
                ctx.fillRect(optX + 1.0, badgeY + 1.0, badgeSize, badgeSize);
                ctx.fillStyle = '#fde047';
                ctx.fillRect(optX, badgeY, badgeSize, badgeSize);
                ctx.strokeStyle = '#09090b';
                ctx.lineWidth = 0.8;
                ctx.strokeRect(optX, badgeY, badgeSize, badgeSize);
                const cW = ctx.measureText(optCode).width;
                ctx.fillStyle = '#09090b';
                ctx.fillText(optCode, optX + (badgeSize - cW) / 2, badgeY + badgeSize / 2 + 0.3);
              }
              ctx.restore();

              const textShiftX =
                optStyle === 'pill-tag'
                  ? badgeSize + 6.5
                  : optStyle === 'row-strip'
                    ? badgeSize + 5.5
                    : badgeSize + 3.8;
              ctx.fillStyle = aLine.color || theme.optionColor;
              ctx.font = `500 ${aLine.fontSizePx}px ${activeFontStack}`;
              ctx.textBaseline = 'top';
              drawMathAwareTextLine(
                ctx,
                optBodyText,
                optX + textShiftX,
                aY,
                aLine.fontSizePx,
                Math.max(18, maxLineW - textShiftX)
              );
              aY += aLine.lineHeightPx;
              continue;
            }
          }

          // B. ANSWER BOX RENDERING (Unique Answer Styles)
          if (aLine.isBold && !isPpt && !isTheory) {
            const isOneliner = config.questionFormatMode === 'oneliner';
            ctx.save();
            ctx.font = `700 ${aLine.fontSizePx}px ${activeFontStack}`;
            const measuredAnsW = Math.min(
              maxLineW,
              ctx.measureText(aLine.text).width + 10
            );
            const boxX = item.xPx + indent - 1.5;
            const boxY = aY - 0.6;
            const boxW =
              theme.ansBoxStyle === 'solid-badge' ||
              theme.ansBoxStyle === 'solid-inverse-pill' ||
              theme.ansBoxStyle === 'brutalist-tag' ||
              theme.ansBoxStyle === 'dashed-coupon' ||
              theme.ansBoxStyle === 'glass-capsule' ||
              theme.ansBoxStyle === 'split-label-box' ||
              theme.ansBoxStyle === 'sharp-dashed-tag'
                ? Math.max(54, Math.min(item.widthPx - indent, measuredAnsW + 6))
                : Math.min(maxLineW + 3, item.widthPx - indent);
            const boxH = aLine.lineHeightPx;

            const ansGreenColor =
              theme.ansColor &&
              theme.ansColor !== '#09090b' &&
              theme.ansColor !== '#000000'
                ? theme.ansColor
                : '#047857';

            if (
              isOneliner &&
              (theme.ansBoxStyle === 'split-label-box' ||
                theme.ansBoxStyle === 'solid-badge' ||
                theme.ansBoxStyle === 'glass-capsule' ||
                theme.ansBoxStyle === 'solid-inverse-pill' ||
                theme.ansBoxStyle === 'brutalist-tag' ||
                theme.ansBoxStyle === 'left-bar-box')
            ) {
              // In One Liner Tab: NEVER draw curved box or curved green box!
              // Render clean dashed ruler slightly below text with zero overlap
              const textBottomY = aY + aLine.fontSizePx * 1.18 + 2.0;
              const uY = Math.min(aY + aLine.lineHeightPx - 1.2, textBottomY);
              ctx.strokeStyle = ansGreenColor;
              ctx.lineWidth = 0.95;
              ctx.setLineDash([3.2, 2.0]);
              ctx.beginPath();
              ctx.moveTo(item.xPx + indent, uY);
              ctx.lineTo(item.xPx + indent + Math.max(measuredAnsW + 6, 46), uY);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'solid-inverse-pill') {
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 3.0);
              ctx.fillStyle = theme.ansColor;
              ctx.fill();
            } else if (theme.ansBoxStyle === 'split-label-box') {
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 2.5);
              ctx.fillStyle = theme.ansHighlightBg || theme.chapterBgColor;
              ctx.fill();
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.75;
              ctx.stroke();
              // Left solid cap behind "Ans:"
              const ansPrefixW = Math.min(24, ctx.measureText('Ans:').width + 5);
              ctx.fillStyle = theme.ansColor;
              ctx.fillRect(boxX, boxY, ansPrefixW, boxH);
            } else if (theme.ansBoxStyle === 'glass-capsule') {
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, boxH / 2);
              ctx.fillStyle = theme.ansHighlightBg || theme.chapterBgColor;
              ctx.fill();
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            } else if (theme.ansBoxStyle === 'brutalist-tag') {
              drawRoundedRectPath(ctx, boxX + 1.4, boxY + 1.4, boxW, boxH, 2.0);
              ctx.fillStyle = '#09090b';
              ctx.fill();
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 2.0);
              ctx.fillStyle = theme.ansHighlightBg || '#fde047';
              ctx.fill();
              ctx.strokeStyle = '#09090b';
              ctx.lineWidth = 0.85;
              ctx.stroke();
            } else if (theme.ansBoxStyle === 'left-bar-box') {
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 2.2);
              ctx.fillStyle = theme.ansHighlightBg || theme.chapterBgColor;
              ctx.fill();
              ctx.fillStyle = theme.ansColor;
              ctx.fillRect(boxX, boxY + 0.5, 2.6, Math.max(4, boxH - 1));
            } else if (theme.ansBoxStyle === 'dashed-coupon') {
              // Flat sharp rectangular ticket — NO curved square corners!
              if (theme.ansHighlightBg) {
                ctx.fillStyle = theme.ansHighlightBg;
                ctx.fillRect(boxX, boxY, boxW, boxH);
              }
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.75;
              ctx.setLineDash([2.8, 1.8]);
              ctx.strokeRect(boxX, boxY, boxW, boxH);
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'sharp-dashed-tag') {
              // Crisp sharp dashed border (zero curvature, completely flat)
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.8;
              ctx.setLineDash([3.0, 2.0]);
              ctx.strokeRect(boxX, boxY, boxW, boxH);
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'pure-dash-line') {
              // ---- Dash Line ho bas: Clean dashed line ruler directly under Ans with zero overlap
              const textBottomY = aY + aLine.fontSizePx * 1.18 + 2.0;
              const uY = Math.min(aY + aLine.lineHeightPx - 1.2, textBottomY);
              ctx.strokeStyle = ansGreenColor;
              ctx.lineWidth = 0.95;
              ctx.setLineDash([3.2, 2.0]);
              ctx.beginPath();
              ctx.moveTo(item.xPx + indent, uY);
              ctx.lineTo(item.xPx + indent + Math.max(measuredAnsW + 6, 48), uY);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'dashed-underline') {
              // Crisp dashed underline slightly lower with zero overlap
              const textBottomY = aY + aLine.fontSizePx * 1.18 + 2.0;
              const uY = Math.min(aY + aLine.lineHeightPx - 1.2, textBottomY);
              ctx.strokeStyle = ansGreenColor;
              ctx.lineWidth = 0.9;
              ctx.setLineDash([2.8, 1.8]);
              ctx.beginPath();
              ctx.moveTo(item.xPx + indent, uY);
              ctx.lineTo(item.xPx + indent + measuredAnsW - 2, uY);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'dash-flanked') {
              // ---- Ans: (B) ---- (Flanked dashes on both sides)
              const midY = aY + aLine.lineHeightPx * 0.5;
              const leftDashW = 16;
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.85;
              ctx.setLineDash([2.8, 1.8]);
              // Left dash
              ctx.beginPath();
              ctx.moveTo(item.xPx + indent, midY);
              ctx.lineTo(item.xPx + indent + leftDashW, midY);
              ctx.stroke();
              // Right dash
              const textWidth = ctx.measureText(aLine.text).width;
              const rightDashStart = item.xPx + indent + leftDashW + 5 + textWidth + 5;
              ctx.beginPath();
              ctx.moveTo(rightDashStart, midY);
              ctx.lineTo(rightDashStart + leftDashW, midY);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'dashed-divider-full') {
              // Full column dashed divider rule below Ans
              const lineY = aY + aLine.lineHeightPx + 1.2;
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.75;
              ctx.setLineDash([3.0, 2.0]);
              ctx.beginPath();
              ctx.moveTo(item.xPx + indent, lineY);
              ctx.lineTo(item.xPx + item.widthPx - 4, lineY);
              ctx.stroke();
              ctx.setLineDash([]);
            } else if (theme.ansBoxStyle === 'solid-badge') {
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 3.0);
              ctx.fillStyle = theme.ansHighlightBg || theme.chapterBgColor;
              ctx.fill();
              ctx.strokeStyle = theme.brandAccentColor;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            } else if (theme.ansBoxStyle === 'double-underline') {
              if (theme.ansHighlightBg) {
                drawRoundedRectPath(ctx, boxX, boxY, measuredAnsW, boxH, 1.8);
                ctx.fillStyle = theme.ansHighlightBg;
                ctx.fill();
              }
              const uY = boxY + boxH - 0.8;
              ctx.strokeStyle = theme.ansColor;
              ctx.lineWidth = 0.75;
              ctx.beginPath();
              ctx.moveTo(item.xPx + indent, uY);
              ctx.lineTo(item.xPx + indent + measuredAnsW - 4, uY);
              ctx.stroke();
            } else if (theme.ansHighlightBg && !isOneliner) {
              drawRoundedRectPath(ctx, boxX, boxY, boxW, boxH, 2.2);
              ctx.fillStyle = theme.ansHighlightBg;
              ctx.fill();
            }
            ctx.restore();

            if (!isOneliner && theme.ansBoxStyle === 'split-label-box' && /^Ans:\s*/i.test(aLine.text)) {
              const restAns = aLine.text.replace(/^Ans:\s*/i, '');
              const ansPrefixW = Math.min(24, ctx.measureText('Ans:').width + 5);
              ctx.save();
              ctx.font = `800 ${aLine.fontSizePx * 0.88}px ${activeFontStack}`;
              ctx.fillStyle = '#ffffff';
              ctx.textBaseline = 'middle';
              ctx.fillText('ANS', boxX + 2.5, aY + aLine.lineHeightPx / 2 - 0.2);
              ctx.restore();

              ctx.fillStyle = aLine.color || theme.ansColor;
              ctx.font = `700 ${aLine.fontSizePx}px ${activeFontStack}`;
              ctx.textBaseline = 'top';
              drawMathAwareTextLine(
                ctx,
                restAns,
                boxX + ansPrefixW + 3.5,
                aY,
                aLine.fontSizePx,
                Math.max(18, maxLineW - ansPrefixW - 3.5)
              );
              aY += aLine.lineHeightPx;
              continue;
            }
          }

          // C. EXPLANATION FIRST-LINE PILL BADGE ("EXPLANATION:" / "व्याख्या:")
          if (aLine.lineRole === 'ex-first' && !isPpt && !isTheory) {
            const exMatch = aLine.text.match(/^(Explanation:|व्याख्या:)\s*(.*)$/i);
            if (exMatch) {
              const exLabel = exMatch[1].replace(':', '').toUpperCase();
              const exRestText = exMatch[2];
              ctx.save();
              ctx.font = `800 ${aLine.fontSizePx * 0.82}px ${activeFontStack}`;
              const lblW = ctx.measureText(exLabel).width + 6.5;
              const lblH = Math.max(7.8, aLine.fontSizePx * 1.08);
              const lblX = item.xPx + indent;
              const lblY = aY + Math.max(0, (aLine.lineHeightPx - lblH) * 0.35 - 0.2);

              drawRoundedRectPath(ctx, lblX, lblY, lblW, lblH, 2.2);
              ctx.fillStyle = theme.exPrimaryColor || theme.brandAccentColor;
              ctx.fill();
              ctx.fillStyle = '#ffffff';
              ctx.textBaseline = 'middle';
              ctx.fillText(exLabel, lblX + 3.2, lblY + lblH / 2 + 0.3);
              ctx.restore();

              ctx.fillStyle = aLine.color || theme.exPrimaryColor;
              ctx.font = `600 ${aLine.fontSizePx}px ${activeFontStack}`;
              ctx.textBaseline = 'top';
              drawMathAwareTextLine(
                ctx,
                exRestText,
                lblX + lblW + 3.5,
                aY,
                aLine.fontSizePx,
                Math.max(18, maxLineW - lblW - 3.5)
              );
              aY += aLine.lineHeightPx;
              continue;
            }
          }

          if (isTheory) {
            ctx.save();
            ctx.textBaseline = 'top';
            let textDrawX = item.xPx + 3;
            if (aLine.calloutBadge) {
              const cBadge = `${aLine.calloutBadge}: `;
              ctx.font = `800 ${aLine.fontSizePx}px ${activeFontStack}`;
              ctx.fillStyle = '#000000';
              ctx.fillText(cBadge, textDrawX, aY + 0.3);
              textDrawX += ctx.measureText(cBadge).width;
            } else {
              textDrawX = item.xPx + 8;
            }
            const cleanCalloutText = aLine.text.replace(/\*\*/g, '');
            ctx.fillStyle = '#000000';
            ctx.font = `700 ${aLine.fontSizePx}px ${activeFontStack}`;
            drawMathAwareTextLine(
              ctx,
              cleanCalloutText,
              textDrawX,
              aY + 0.3,
              aLine.fontSizePx,
              Math.max(18, item.xPx + item.widthPx - textDrawX - 3)
            );
            ctx.restore();
            aY += aLine.lineHeightPx;
            continue;
          }

          const ansTextShiftX =
            aLine.isBold &&
            !isPpt &&
            !isTheory &&
            (theme.ansBoxStyle === 'left-bar-box' ||
              theme.ansBoxStyle === 'solid-inverse-pill' ||
              theme.ansBoxStyle === 'glass-capsule' ||
              theme.ansBoxStyle === 'brutalist-tag' ||
              theme.ansBoxStyle === 'dashed-coupon' ||
              theme.ansBoxStyle === 'sharp-dashed-tag' ||
              theme.ansBoxStyle === 'solid-badge')
              ? 3.0
              : theme.ansBoxStyle === 'dash-flanked'
              ? 21.0
              : 0;

          const ansGreenFallback =
            theme.ansColor &&
            theme.ansColor !== '#09090b' &&
            theme.ansColor !== '#000000'
              ? theme.ansColor
              : '#047857';

          ctx.fillStyle =
            aLine.isBold &&
            !isPpt &&
            !isTheory &&
            theme.ansBoxStyle === 'solid-inverse-pill'
              ? '#ffffff'
              : aLine.color || ansGreenFallback;
          ctx.font = `${aLine.isBold ? '700' : isPpt ? '600' : '500'} ${aLine.fontSizePx}px ${activeFontStack}`;
          ctx.textBaseline = 'top';
          drawMathAwareTextLine(
            ctx,
            aLine.text,
            item.xPx + indent + ansTextShiftX,
            aY,
            aLine.fontSizePx,
            maxLineW - ansTextShiftX
          );
          aY += aLine.lineHeightPx;
        }
        ansBottomY = aY + ansPadY * 0.4;
      }

      const nextItem = colItems[idx + 1];
      if (nextItem && !theme.blockCardBg && !isTheory) {
        const sepY = ansBottomY + (nextItem.yPx - ansBottomY) * 0.42;
        ctx.save();
        ctx.strokeStyle = theme.dividerColor;
        ctx.lineWidth = theme.dividerStyle === 'solid' ? 0.45 : 0.6;
        applyThemeDash(0.8);
        ctx.beginPath();
        ctx.moveTo(item.xPx, sepY);
        ctx.lineTo(item.xPx + item.widthPx, sepY);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // 4. BOTTOM FOOTER (Placed right at the bottom of the page/slide below the footer line):
  if (config.showPageNumbers) {
    const footerLineY = isTheory
      ? baseHeightPx - marginBottomPx - 11.5
      : baseHeightPx - marginPx - FOOTER_LINE_OFFSET_PX;

    drawCompleteDocumentFooter(
      ctx,
      baseWidthPx,
      baseHeightPx,
      marginLeftPx,
      footerLineY,
      page.pageNumber,
      totalPages,
      isPpt,
      theme,
      activeFontStack,
      isTheory
        ? 'minimal-clean'
        : config.customFooterStyle && config.customFooterStyle !== 'theme-default'
          ? config.customFooterStyle
          : undefined,
      isTheory ? marginRightPx : undefined
    );
  }

  return canvas;
}

export async function generateAndDownloadA4Pdf(
  meta: ExamDocumentMeta,
  pages: PaginatedA4Page[],
  config: PdfLayoutConfig,
  onProgress?: (currentPage: number, totalPages: number) => void,
  customSuffix?: string,
  customExactFileName?: string
): Promise<void> {
  await Promise.all([
    ensureAnekFontLoaded(),
    ensureWatermarkImageLoaded(DEFAULT_BRAND_CIRCLE_LOGO_URL),
    config.watermarkLogoUrl
      ? ensureWatermarkImageLoaded(config.watermarkLogoUrl)
      : Promise.resolve(null),
  ]);

  const isPpt = config.questionFormatMode === 'ppt';
  const pageWidthIn = isPpt ? PPT_WIDTH_IN : A4_WIDTH_IN;
  const pageHeightIn = isPpt ? PPT_HEIGHT_IN : A4_HEIGHT_IN;

  const pdf = new jsPDF({
    orientation: isPpt ? 'landscape' : 'portrait',
    unit: 'in',
    format: isPpt ? [PPT_WIDTH_IN, PPT_HEIGHT_IN] : 'a4',
    compress: true,
  });

  const totalPages = pages.length;
  const normalizedTgUrl = normalizeTelegramUrl(config.telegramUrl);
  const normalizedWaUrl = normalizeWhatsappUrl(config.whatsappUrl || config.youtubeUrl);
  const normalizedYtUrl = normalizeYoutubeUrl(config.youtubeUrl);

  // Adaptive scale so even 50+ or 100+ page/slide PDFs never run out of memory or crash
  const renderScale =
    totalPages > 60 ? 2.0 : totalPages > 30 ? 2.25 : 2.55;

  for (let i = 0; i < totalPages; i++) {
    if (onProgress) {
      onProgress(i + 1, totalPages);
    }
    // Yield to browser UI frame so progress updates smoothly without freezing
    await new Promise<void>((resolve) => {
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => setTimeout(resolve, 4));
      } else {
        setTimeout(resolve, 12);
      }
    });

    if (i > 0) {
      if (isPpt) {
        pdf.addPage([PPT_WIDTH_IN, PPT_HEIGHT_IN], 'landscape');
      } else {
        pdf.addPage('a4', 'portrait');
      }
    }

    const canvas = renderA4PageToCanvas(pages[i], totalPages, config, renderScale);
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    // Immediately free GPU/RAM backing store for this page's temporary canvas
    canvas.width = 1;
    canvas.height = 1;

    pdf.addImage(
      imgData,
      'JPEG',
      0,
      0,
      pageWidthIn,
      pageHeightIn,
      undefined,
      'FAST'
    );

    const effMarginIn = config.marginInches;

    // 1. Clickable hyperlinks over Top-Left ("Desi Crack") and Top-Right ("desicrack.in") Header Tabs
    if (config.showDocumentHeader) {
      const headerBandHIn = effMarginIn + HEADER_LINE_OFFSET_PX / BASE_DPI;
      if (normalizedTgUrl) {
        pdf.link(0, 0.03, 1.45, headerBandHIn, {
          url: normalizedTgUrl,
        });
      }
      const rawSite = (config.customHeaderRightText || 'desicrack.in').trim() || 'desicrack.in';
      const siteUrl = /^https?:\/\//i.test(rawSite) ? rawSite : `https://${rawSite}`;
      pdf.link(pageWidthIn - 1.45, 0.03, 1.45, headerBandHIn, {
        url: siteUrl,
      });
    }

    // 2. Clickable Footer Links right at the bottom of the page/slide:
    //    - Bottom-Left: WhatsApp Logo + "WhatsApp Join" -> opens WhatsApp link
    //    - Bottom-Right: Telegram Logo + "Join Now" -> opens Telegram channel
    if (config.showPageNumbers) {
      const footerLineYIn = pageHeightIn - effMarginIn - FOOTER_LINE_OFFSET_PX / BASE_DPI;
      const footerBandYIn = footerLineYIn + 0.02;
      const footerBandHIn = pageHeightIn - footerBandYIn;

      // Left Footer WhatsApp Join hotspot
      if (normalizedWaUrl) {
        pdf.link(0, footerBandYIn, 1.45, footerBandHIn, {
          url: normalizedWaUrl,
        });
      }

      // Right Footer Telegram Join Now hotspot
      if (normalizedTgUrl) {
        pdf.link(
          pageWidthIn - 1.45,
          footerBandYIn,
          1.45,
          footerBandHIn,
          { url: normalizedTgUrl }
        );
      }
    }
  }

  // 3. Clickable Chapter-wise Topic Index Internal Page Links (jumps directly to the Topic's starting page in PDF)
  for (let i = 0; i < totalPages; i++) {
    const p = pages[i];
    if (p.isIndexPage && p.indexEntries && p.indexEntries.length > 0) {
      pdf.setPage(i + 1);
      for (const entry of p.indexEntries) {
        const targetPage = Math.min(
          totalPages,
          Math.max(1, entry.targetPageNumber)
        );
        pdf.link(
          entry.xPx / BASE_DPI,
          entry.yPx / BASE_DPI,
          entry.widthPx / BASE_DPI,
          entry.heightPx / BASE_DPI,
          { pageNumber: targetPage }
        );
      }
    }
  }
  if (totalPages > 0) {
    pdf.setPage(totalPages);
  }

  if (customExactFileName && customExactFileName.trim()) {
    const cleaned = customExactFileName.trim().replace(/[\\/:*?"<>|]+/g, '_');
    const finalFileName = cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
    pdf.save(finalFileName);
    return;
  }

  const baseName = (meta.title || 'Exam_QA_Sheet')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const suffix = customSuffix || `25PerPage_2Col_DesiCrack`;

  pdf.save(`${baseName}_${suffix}.pdf`);
}

export async function generateAndDownloadAnswerKeyPdf(
  meta: ExamDocumentMeta,
  questions: ParsedQuestion[],
  config: PdfLayoutConfig,
  onProgress?: (currentPage: number, totalPages: number) => void,
  customExactFileName?: string
): Promise<void> {
  if (questions.length === 0) return;

  const answerKeyConfig: PdfLayoutConfig = {
    ...config,
    columns: 2,
    questionsPerPage: 50,
    showOptionCode: true,
    questionFormatMode: 'answerkey',
  };

  const answerKeyPages = paginateQuestionsForA4(meta, questions, answerKeyConfig);
  const baseFileName = (customExactFileName || `${meta.title || 'Exam'}_PPT`)
    .trim()
    .replace(/\.pdf$/i, '');
  const answerKeyFileName = `${baseFileName} - ANSWER KEY.pdf`;

  await generateAndDownloadA4Pdf(
    meta,
    answerKeyPages,
    answerKeyConfig,
    onProgress,
    'ANSWER_KEY',
    answerKeyFileName
  );
}
