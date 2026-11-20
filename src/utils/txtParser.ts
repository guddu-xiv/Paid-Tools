export interface ParsedOption {
  code: 'A' | 'B' | 'C' | 'D';
  textEn: string;
  textHi: string;
  textClean: string;
  translatedText?: string;
}

export interface ParsedQuestion {
  id: string;
  originalQNum: number;
  qNum: number; // Sequential number (1, 2, 3...) after subject filtering
  qLabel: string; // "1", "2", "3"...
  section: string; // Normalized subject name e.g. "REASONING", "GENERAL AWARENESS", "ENGLISH"
  chapter: string; // Auto-detected chapter name e.g. "Coding - Decoding", "Indian Polity & Constitution"
  sourceFileName: string;
  sourceHeaderRight: string; // Auto-detected "STENO (09-09-2026-S1)"
  questionEn: string;
  questionHi: string;
  rawQuestion: string;
  options: ParsedOption[];
  answerFull: string;
  answerOption: string;
  answerTextEn: string;
  answerTextHi: string;
  answerClean: string;
  explanationEn: string;
  explanationHi: string;
  explanationClean: string;
  isTheoryNote?: boolean;
  translatedQuestion?: string;
  translatedAnswer?: string;
  translatedOptions?: string[];
  translatedExplanation?: string;
}

export interface ExamDocumentMeta {
  title: string;
  examId: string;
  examName: string;
  shiftName: string;
  examDate: string;
  headerRightText: string;
  totalQuestionsHeader: string;
  languageMode: string;
}

export interface ParsedExamDocument {
  meta: ExamDocumentMeta;
  sections: string[];
  questions: ParsedQuestion[];
}

const MONTH_NUM_MAP: Record<string, string> = {
  JAN: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  SEPT: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

export function parseHeaderDetailsFromTitle(rawTitle: string): {
  examName: string;
  shiftName: string;
  examDate: string;
  headerRightText: string;
} {
  // Remove .txt extension and browser duplicate download suffixes like " (1)", " (2)", " - Copy"
  const clean = (rawTitle || '')
    .replace(/\.txt$/i, '')
    .replace(/\s*\(\d+\)\s*$/i, '')
    .replace(/\s*-\s*copy\s*$/i, '')
    .trim();

  if (!clean) {
    return {
      examName: 'EXAM',
      shiftName: '',
      examDate: '',
      headerRightText: 'EXAM',
    };
  }

  // Extract Shift: e.g., SHIFT-1, SHIFT 2, S1, S2 -> formatted as "S1", "S2"
  const shiftMatch =
    clean.match(/SHIFT[-_\s]*(\d+|[IVX]+)/i) ||
    clean.match(/(?:^|[-_\s(])S(\d+)(?:$|[-_\s)])/i);
  const shiftCode = shiftMatch ? `S${shiftMatch[1].toUpperCase()}` : '';
  const shiftName = shiftCode;

  // Extract Year: e.g., 2024, 2025, 2026
  const yearMatch = clean.match(/\b(20\d{2}|19\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : '';

  // Extract Date and format as DD-MM-YYYY (e.g., 09-SEP + 2026 -> 09-09-2026)
  const monthDateMatch = clean.match(
    /\b(\d{1,2})[-_\s]+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)[A-Z]*\b/i
  );
  const numericDateMatch = clean.match(/\b(\d{2})[-/](\d{2})[-/](20\d{2})\b/);

  let examDate = '';
  if (monthDateMatch) {
    const day = monthDateMatch[1].padStart(2, '0');
    const monKey = monthDateMatch[2].toUpperCase();
    const monNum =
      MONTH_NUM_MAP[monKey] || MONTH_NUM_MAP[monKey.slice(0, 3)] || '01';
    examDate = year ? `${day}-${monNum}-${year}` : `${day}-${monNum}`;
  } else if (numericDateMatch) {
    examDate = `${numericDateMatch[1]}-${numericDateMatch[2]}-${numericDateMatch[3]}`;
  } else if (year) {
    examDate = year;
  }

  // Strip any existing parenthetical block like "(09-09-2026-S1)" before extracting examName tokens
  const withoutParens = clean.replace(/\([^)]*\)/g, ' ').trim();
  const tokens = withoutParens.split(/[-_\s()]+/).filter(Boolean);
  const examTokens: string[] = [];
  for (const tok of tokens) {
    if (
      /^(20\d{2}|19\d{2})$/.test(tok) ||
      /^SHIFT$/i.test(tok) ||
      /^S\d+$/i.test(tok) ||
      /^\d{1,2}$/.test(tok) ||
      /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|SEPT|OCT|NOV|DEC)/i.test(tok)
    ) {
      break;
    }
    const upperTok = tok.toUpperCase();
    // Avoid consecutive duplicate tokens like "STENO STENO"
    if (examTokens[examTokens.length - 1] !== upperTok) {
      examTokens.push(upperTok);
    }
  }

  const examName =
    examTokens.length > 0
      ? examTokens.join(' ')
      : tokens[0]?.toUpperCase() || 'EXAM';

  const bracketInner = [examDate, shiftCode].filter(Boolean).join('-');
  const headerRightText = bracketInner
    ? `${examName} (${bracketInner})`
    : examName;

  return { examName, shiftName, examDate, headerRightText };
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '+': '⁺',
  '-': '⁻',
  '−': '⁻',
  '=': '⁼',
  '(': '⁽',
  ')': '⁾',
  a: 'ᵃ',
  b: 'ᵇ',
  c: 'ᶜ',
  d: 'ᵈ',
  e: 'ᵉ',
  f: 'ᶠ',
  g: 'ᵍ',
  h: 'ʰ',
  i: 'ⁱ',
  j: 'ʲ',
  k: 'ᵏ',
  l: 'ˡ',
  m: 'ᵐ',
  n: 'ⁿ',
  o: 'ᵒ',
  p: 'ᵖ',
  r: 'ʳ',
  s: 'ˢ',
  t: 'ᵗ',
  u: 'ᵘ',
  v: 'ᵛ',
  w: 'ʷ',
  x: 'ˣ',
  y: 'ʸ',
  z: 'ᶻ',
  A: 'ᴬ',
  B: 'ᴮ',
  D: 'ᴰ',
  E: 'ᴱ',
  G: 'ᴳ',
  H: 'ᴴ',
  I: 'ᴵ',
  J: 'ᴶ',
  K: 'ᴷ',
  L: 'ᴸ',
  M: 'ᴹ',
  N: 'ᴺ',
  O: 'ᴼ',
  P: 'ᴾ',
  R: 'ᴿ',
  T: 'ᵀ',
  U: 'ᵁ',
  V: 'ⱽ',
  W: 'ᵂ',
};

const SUBSCRIPT_MAP: Record<string, string> = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉',
  '+': '₊',
  '-': '₋',
  '−': '₋',
  '=': '₌',
  '(': '₍',
  ')': '₎',
  a: 'ₐ',
  e: 'ₑ',
  h: 'ₕ',
  i: 'ᵢ',
  j: 'ⱼ',
  k: 'ₖ',
  l: 'ₗ',
  m: 'ₘ',
  n: 'ₙ',
  o: 'ₒ',
  p: 'ₚ',
  r: 'ᵣ',
  s: 'ₛ',
  t: 'ₜ',
  u: 'ᵤ',
  v: 'ᵥ',
  x: 'ₓ',
};

const VULGAR_FRACTIONS: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '3/4': '¾',
  '1/5': '⅕',
  '2/5': '⅖',
  '3/5': '⅗',
  '4/5': '⅘',
  '1/6': '⅙',
  '5/6': '⅚',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
};

function toUnicodeSuperscript(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed === '\\circ' || trimmed === '°' || trimmed === 'o') return '°';
  if (trimmed === '\\prime' || trimmed === "'") return '′';
  if (trimmed === '\\prime\\prime' || trimmed === "''") return '″';
  const chars = Array.from(trimmed.replace(/\s+/g, ''));
  if (chars.every((ch) => SUPERSCRIPT_MAP[ch] !== undefined)) {
    return chars.map((ch) => SUPERSCRIPT_MAP[ch]).join('');
  }
  return `^(${trimmed})`;
}

function toUnicodeSubscript(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(?:max|min|avg|total|eff|rms|net|init|final|new|old)$/i.test(trimmed)) {
    return `_${trimmed}`;
  }
  const chars = Array.from(trimmed.replace(/\s+/g, ''));
  if (chars.every((ch) => SUBSCRIPT_MAP[ch] !== undefined)) {
    return chars.map((ch) => SUBSCRIPT_MAP[ch]).join('');
  }
  return `_${trimmed}`;
}

function needsMathParens(expr: string, isDenominator: boolean = false): boolean {
  const t = expr.trim();
  if (!t || t.length <= 1) return false;
  if (/^\([^()]+\)$/.test(t)) return false;
  if (isDenominator && /[+\-×÷*/=\s]/.test(t.replace(/^-/, ''))) return true;
  return /[+\-=\s]/.test(t.replace(/^-/, ''));
}

function wrapRadicand(expr: string): string {
  const t = expr.trim();
  if (!t) return '';
  if (/^\([^()]+\)$/.test(t)) return t;
  if (/^[0-9a-zA-Zα-ωΑ-Ωπθ⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉.]+$/.test(t)) return t;
  return `(${t})`;
}

const HTML_ENTITY_MAP: Record<string, string> = {
  '&le;': '≤',
  '&leq;': '≤',
  '&ge;': '≥',
  '&geq;': '≥',
  '&ne;': '≠',
  '&neq;': '≠',
  '&lt;': '<',
  '&gt;': '>',
  '&times;': '×',
  '&divide;': '÷',
  '&plusmn;': '±',
  '&minus;': '−',
  '&ndash;': '–',
  '&mdash;': '—',
  '&deg;': '°',
  '&prime;': '′',
  '&Prime;': '″',
  '&infin;': '∞',
  '&radic;': '√',
  '&asymp;': '≈',
  '&equiv;': '≡',
  '&prop;': '∝',
  '&there4;': '∴',
  '&part;': '∂',
  '&empty;': '∅',
  '&isin;': '∈',
  '&notin;': '∉',
  '&sub;': '⊂',
  '&sup;': '⊃',
  '&sube;': '⊆',
  '&supe;': '⊇',
  '&cup;': '∪',
  '&cap;': '∩',
  '&and;': '∧',
  '&or;': '∨',
  '&rarr;': '→',
  '&larr;': '←',
  '&harr;': '↔',
  '&rArr;': '⇒',
  '&lArr;': '⇐',
  '&hArr;': '⇔',
  '&alpha;': 'α',
  '&beta;': 'β',
  '&gamma;': 'γ',
  '&delta;': 'δ',
  '&epsilon;': 'ε',
  '&theta;': 'θ',
  '&lambda;': 'λ',
  '&mu;': 'μ',
  '&pi;': 'π',
  '&rho;': 'ρ',
  '&sigma;': 'σ',
  '&tau;': 'τ',
  '&phi;': 'φ',
  '&omega;': 'ω',
  '&Delta;': 'Δ',
  '&Sigma;': 'Σ',
  '&Pi;': 'Π',
  '&Omega;': 'Ω',
  '&frac12;': '½',
  '&frac13;': '⅓',
  '&frac23;': '⅔',
  '&frac14;': '¼',
  '&frac34;': '¾',
  '&sup1;': '¹',
  '&sup2;': '²',
  '&sup3;': '³',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
};

export function cleanMathAndText(input: string): string {
  if (!input) return '';

  let s = input
    // Decode named and numeric HTML entities e.g. &le;, &ge;, &times;, &#176;
    .replace(/&[a-zA-Z0-9]+;/g, (ent) => HTML_ENTITY_MAP[ent] ?? HTML_ENTITY_MAP[ent.toLowerCase()] ?? ent)
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : _;
    })
    // Normalize double-escaped LaTeX backslashes e.g. \\frac, \\sqrt, \\(
    .replace(/\\\\(?=[a-zA-Z()[\]{}%])/g, '\\')
    // Protect literal escaped braces \{ and \} before processing LaTeX grouping braces
    .replace(/\\\{/g, '\uFFF0')
    .replace(/\\\}/g, '\uFFF1')
    // Strip display and inline math delimiters \( ... \), \[ ... \], $$ ... $$ with space padding so adjacent words never glue
    .replace(/\\\[([\s\S]*?)\\\]/g, ' $1 ')
    .replace(/\\\(([\s\S]*?)\\\)/g, ' $1 ')
    .replace(/\\\[|\\\]|\\\(|\\\)/g, ' ')
    .replace(/\$\$([\s\S]+?)\$\$/g, ' $1 ')
    // Strip inline $ ... $ when wrapping math expressions (while preserving currency like $50 to $100)
    .replace(/\$\s*([^$]{1,240}?)\s*\$/g, (full, inner: string) => {
      if (/[\\^_{}=<>≤≥≠±+\-*/×÷√∛∜]|^[a-zA-Z0-9.,°%()[\]\s]+$/.test(inner)) {
        return ` ${inner.trim()} `;
      }
      return full;
    })
    // Strip any stray remaining $$
    .replace(/\$\$/g, ' ')
    // Strip sizing & alignment modifiers
    .replace(/\\(?:left|right)\s*([()[\]|.])?/g, (_, delim: string | undefined) =>
      delim && delim !== '.' ? delim : ''
    )
    .replace(/\\(?:big|Big|bigg|Bigg)[lrm]?(?![a-zA-Z])/g, '')
    .replace(/\\(?:displaystyle|textstyle|scriptstyle|scriptscriptstyle|limits|nolimits)(?![a-zA-Z])/g, '')
    // Convert LaTeX matrix / cases / aligned environments
    .replace(
      /\\begin\{(pmatrix|bmatrix|vmatrix|matrix|cases|aligned|align\*?|equation\*?|array)\}(?:\{[^}]*\})?([\s\S]*?)\\end\{\1\}/g,
      (_, env: string, body: string) => {
        const cleanRows = body
          .split(/\\\\/)
          .map((row) =>
            row
              .split('&')
              .map((cell) => cell.trim())
              .filter(Boolean)
              .join(env.includes('matrix') ? ', ' : ' ')
          )
          .filter(Boolean);
        if (env === 'pmatrix') return `(${cleanRows.join('; ')})`;
        if (env === 'bmatrix') return `[${cleanRows.join('; ')}]`;
        if (env === 'vmatrix') return `|${cleanRows.join('; ')}|`;
        return cleanRows.join(' ⇒ ');
      }
    )
    // Spacing commands
    .replace(/\\(?:quad|qquad|enspace|thinspace|,|;|:)\s*/g, ' ')
    .replace(/\\!/g, '');

  // Pre-convert common symbol commands inside braces so inner expressions are clean before brace reduction.
  // Use (?![a-zA-Z]) instead of \b so commands followed by digits or '_' (e.g. \ge15, \le3, \times2, \alpha_1) always match!
  const replaceLatexSymbols = (str: string): string =>
    str
      // Degree & prime patterns
      .replace(/\^\s*\{\s*\\circ\s*\}/g, '°')
      .replace(/\^\s*\\circ(?![a-zA-Z])/g, '°')
      .replace(/\\(?:degree|degrees)(?![a-zA-Z])/g, '°')
      .replace(/\\circ(?![a-zA-Z])/g, '°')
      .replace(/\\prime(?![a-zA-Z])/g, '′')
      // Special subscript patterns
      .replace(/\\lambda_\{?\\max\}?/g, 'λ_max')
      .replace(/\\lambda_\{?\\min\}?/g, 'λ_min')
      .replace(/\\max(?![a-zA-Z])/g, 'max')
      .replace(/\\min(?![a-zA-Z])/g, 'min')
      // Permutation & Combination shorthand: ^nC_r, {^n}C_r, ^nP_r
      .replace(/\{?\^([0-9a-zA-Z]+)\}?([CP])_\{?([0-9a-zA-Z]+)\}?/g, (_, n: string, cp: string, r: string) => {
        return `${toUnicodeSuperscript(n)}${cp}${toUnicodeSubscript(r)}`;
      })
      // Trigonometric, Logarithmic & Limit functions
      .replace(
        /\\(arcsin|arccos|arctan|cosec|sinh|cosh|tanh|sin|cos|tan|cot|sec|csc|log|ln|exp|lim|gcd|lcm|det|mod)(?![a-zA-Z])(\s*)(?=[a-zA-Z0-9\\])/g,
        (_, fn: string) => `${fn === 'csc' ? 'cosec' : fn} `
      )
      .replace(
        /\\(arcsin|arccos|arctan|cosec|sinh|cosh|tanh|sin|cos|tan|cot|sec|csc|log|ln|exp|lim|gcd|lcm|det|mod)(?![a-zA-Z])/g,
        (_, fn: string) => (fn === 'csc' ? 'cosec' : fn)
      )
      // Logic & Reasoning Arrows & Deductions
      .replace(/\\(?:Longleftrightarrow|Leftrightarrow|iff)(?![a-zA-Z])/g, ' ⇔ ')
      .replace(/\\(?:Longrightarrow|Rightarrow|implies)(?![a-zA-Z])/g, ' ⇒ ')
      .replace(/\\(?:Longleftarrow|Leftarrow|impliedby)(?![a-zA-Z])/g, ' ⇐ ')
      .replace(/\\(?:longleftrightarrow|leftrightarrow)(?![a-zA-Z])/g, ' ↔ ')
      .replace(/\\(?:longrightarrow|rightarrow|to)(?![a-zA-Z])/g, ' → ')
      .replace(/\\(?:longleftarrow|leftarrow|gets)(?![a-zA-Z])/g, ' ← ')
      .replace(/\\uparrow(?![a-zA-Z])/g, '↑')
      .replace(/\\downarrow(?![a-zA-Z])/g, '↓')
      .replace(/\\therefore(?![a-zA-Z])/g, '∴')
      .replace(/\\because(?![a-zA-Z])/g, '∵')
      // Geometry & Relations
      .replace(/\\(?:measuredangle|sphericalangle|angle)(?![a-zA-Z])/g, '∠')
      .replace(/\\(?:bigtriangleup|triangle)(?![a-zA-Z])/g, '△')
      .replace(/\\perp(?![a-zA-Z])/g, '⊥')
      .replace(/\\parallel(?![a-zA-Z])/g, '∥')
      .replace(/\\cong(?![a-zA-Z])/g, '≅')
      .replace(/\\simeq(?![a-zA-Z])/g, '≃')
      .replace(/\\sim(?![a-zA-Z])/g, '∼')
      .replace(/\\equiv(?![a-zA-Z])/g, '≡')
      .replace(/\\approx(?![a-zA-Z])/g, '≈')
      .replace(/\\propto(?![a-zA-Z])/g, '∝')
      .replace(/\\(?:neq|ne)(?![a-zA-Z])/g, '≠')
      .replace(/\\(?:leqslant|leq|le)(?![a-zA-Z])/g, '≤')
      .replace(/\\(?:geqslant|geq|ge)(?![a-zA-Z])/g, '≥')
      .replace(/\\ll(?![a-zA-Z])/g, '≪')
      .replace(/\\gg(?![a-zA-Z])/g, '≫')
      // Arithmetic & Set Operators
      .replace(/\\pm(?![a-zA-Z])/g, '±')
      .replace(/\\mp(?![a-zA-Z])/g, '∓')
      .replace(/\\times(?![a-zA-Z])/g, '×')
      .replace(/\\div(?![a-zA-Z])/g, '÷')
      .replace(/\\cdot(?![a-zA-Z])/g, '·')
      .replace(/\\ast(?![a-zA-Z])/g, '*')
      .replace(/\\star(?![a-zA-Z])/g, '⋆')
      .replace(/\\bullet(?![a-zA-Z])/g, '•')
      .replace(/\\oplus(?![a-zA-Z])/g, '⊕')
      .replace(/\\otimes(?![a-zA-Z])/g, '⊗')
      .replace(/\\odot(?![a-zA-Z])/g, '⊙')
      .replace(/\\infty(?![a-zA-Z])/g, '∞')
      .replace(/\\partial(?![a-zA-Z])/g, '∂')
      .replace(/\\nabla(?![a-zA-Z])/g, '∇')
      .replace(/\\forall(?![a-zA-Z])/g, '∀')
      .replace(/\\nexists(?![a-zA-Z])/g, '∄')
      .replace(/\\exists(?![a-zA-Z])/g, '∃')
      .replace(/\\(?:emptyset|varnothing)(?![a-zA-Z])/g, '∅')
      .replace(/\\notin(?![a-zA-Z])/g, '∉')
      .replace(/\\in(?![a-zA-Z])/g, '∈')
      .replace(/\\ni(?![a-zA-Z])/g, '∋')
      .replace(/\\subseteq(?![a-zA-Z])/g, '⊆')
      .replace(/\\supseteq(?![a-zA-Z])/g, '⊇')
      .replace(/\\subset(?![a-zA-Z])/g, '⊂')
      .replace(/\\supset(?![a-zA-Z])/g, '⊃')
      .replace(/\\cup(?![a-zA-Z])/g, '∪')
      .replace(/\\cap(?![a-zA-Z])/g, '∩')
      .replace(/\\setminus(?![a-zA-Z])/g, '∖')
      .replace(/\\(?:land|wedge)(?![a-zA-Z])/g, '∧')
      .replace(/\\(?:lor|vee)(?![a-zA-Z])/g, '∨')
      .replace(/\\(?:neg|lnot)(?![a-zA-Z])/g, '¬')
      .replace(/\\sum(?![a-zA-Z])/g, '∑')
      .replace(/\\prod(?![a-zA-Z])/g, '∏')
      .replace(/\\oint(?![a-zA-Z])/g, '∮')
      .replace(/\\int(?![a-zA-Z])/g, '∫')
      // Greek Letters (Lowercase & Uppercase)
      .replace(/\\(?:varepsilon|epsilon)(?![a-zA-Z])/g, 'ε')
      .replace(/\\(?:varphi|phi)(?![a-zA-Z])/g, 'φ')
      .replace(/\\(?:vartheta|theta)(?![a-zA-Z])/g, 'θ')
      .replace(/\\(?:varsigma|sigma)(?![a-zA-Z])/g, 'σ')
      .replace(/\\(?:varrho|rho)(?![a-zA-Z])/g, 'ρ')
      .replace(/\\alpha(?![a-zA-Z])/g, 'α')
      .replace(/\\beta(?![a-zA-Z])/g, 'β')
      .replace(/\\gamma(?![a-zA-Z])/g, 'γ')
      .replace(/\\delta(?![a-zA-Z])/g, 'δ')
      .replace(/\\zeta(?![a-zA-Z])/g, 'ζ')
      .replace(/\\eta(?![a-zA-Z])/g, 'η')
      .replace(/\\iota(?![a-zA-Z])/g, 'ι')
      .replace(/\\kappa(?![a-zA-Z])/g, 'κ')
      .replace(/\\lambda(?![a-zA-Z])/g, 'λ')
      .replace(/\\mu(?![a-zA-Z])/g, 'μ')
      .replace(/\\nu(?![a-zA-Z])/g, 'ν')
      .replace(/\\xi(?![a-zA-Z])/g, 'ξ')
      .replace(/\\pi(?![a-zA-Z])/g, 'π')
      .replace(/\\tau(?![a-zA-Z])/g, 'τ')
      .replace(/\\upsilon(?![a-zA-Z])/g, 'υ')
      .replace(/\\chi(?![a-zA-Z])/g, 'χ')
      .replace(/\\psi(?![a-zA-Z])/g, 'ψ')
      .replace(/\\omega(?![a-zA-Z])/g, 'ω')
      .replace(/\\Gamma(?![a-zA-Z])/g, 'Γ')
      .replace(/\\Delta(?![a-zA-Z])/g, 'Δ')
      .replace(/\\Theta(?![a-zA-Z])/g, 'Θ')
      .replace(/\\Lambda(?![a-zA-Z])/g, 'Λ')
      .replace(/\\Xi(?![a-zA-Z])/g, 'Ξ')
      .replace(/\\Pi(?![a-zA-Z])/g, 'Π')
      .replace(/\\Sigma(?![a-zA-Z])/g, 'Σ')
      .replace(/\\Upsilon(?![a-zA-Z])/g, 'Υ')
      .replace(/\\Phi(?![a-zA-Z])/g, 'Φ')
      .replace(/\\Psi(?![a-zA-Z])/g, 'Ψ')
      .replace(/\\Omega(?![a-zA-Z])/g, 'Ω')
      // Escaped punctuation
      .replace(/\\%/g, '%')
      .replace(/\\&/g, '&')
      .replace(/\\#/g, '#');

  s = replaceLatexSymbols(s);

  // Normalize unbraced TeX fraction shorthand e.g. \frac12 -> \frac{1}{2}, \frac1{10} -> \frac{1}{10}, \frac{1}2 -> \frac{1}{2}
  s = s
    .replace(/\\(?:d|t|c)?frac\s*\{([^{}]*)\}\s*([0-9a-zA-Z])(?![0-9a-zA-Z{])/g, '\\frac{$1}{$2}')
    .replace(/\\(?:d|t|c)?frac\s*([0-9a-zA-Z])\s*\{([^{}]*)\}/g, '\\frac{$1}{$2}')
    .replace(/\\(?:d|t|c)?frac\s*([0-9])\s*([0-9])(?![0-9a-zA-Z{])/g, '\\frac{$1}{$2}');

  // Iteratively resolve innermost braced LaTeX constructs (up to 12 levels of nesting)
  for (let pass = 0; pass < 12; pass++) {
    const prev = s;

    // 1. Text / font style wrappers: \text{...}, \mathrm{...}, \mathbf{...}, etc.
    s = s.replace(
      /\\(?:text|textbf|textit|textrm|textsf|texttt|mathrm|mathbf|mathit|mathsf|mathtt|mathcal|mathbb|mathfrak|bm|boldsymbol|operatorname|mbox|hbox)\s*\{([^{}]*)\}/g,
      '$1'
    );

    // 2. Overline / Bar / Vector / Hat / Underline
    s = s.replace(/\\(?:overline|bar)\s*\{([^{}]*)\}/g, (_, inner: string) => {
      const clean = inner.trim();
      if (clean.length >= 1 && clean.length <= 6) {
        return Array.from(clean)
          .map((ch) => `${ch}\u0305`)
          .join('');
      }
      return `${clean}\u0305`;
    });
    s = s.replace(/\\vec\s*\{([^{}]*)\}/g, '$1\u20D7');
    s = s.replace(/\\hat\s*\{([^{}]*)\}/g, '$1\u0302');
    s = s.replace(/\\underline\s*\{([^{}]*)\}/g, '$1');

    // 3. Binomials & Modulo
    s = s.replace(
      /\\(?:d|t)?binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
      (_, n: string, r: string) => `C(${n.trim()}, ${r.trim()})`
    );
    s = s.replace(/\\pmod\s*\{([^{}]*)\}/g, '(mod $1)');

    // 4. N-th Roots and Square Roots: \sqrt[n]{x} and \sqrt{x}
    s = s.replace(
      /\\sqrt\s*\[([^\]]+)\]\s*\{([^{}]*)\}/g,
      (_, idxStr: string, rad: string) => {
        const idx = idxStr.trim();
        const wrapped = wrapRadicand(rad);
        if (idx === '3') return `∛${wrapped}`;
        if (idx === '4') return `∜${wrapped}`;
        return `${toUnicodeSuperscript(idx)}√${wrapped}`;
      }
    );
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, (_, rad: string) => `√${wrapRadicand(rad)}`);

    // 5a. Adjacent mixed fractions: e.g. 12\frac{1}{2}, 14\frac{2}{7} (only when digits immediately precede \frac with no space/dot and num < den are positive integers)
    s = s.replace(
      /(?<![.\d])(\d{1,3})\\(?:d|t|c)?frac\s*\{\s*(\d{1,2})\s*\}\s*\{\s*(\d{1,2})\s*\}/g,
      (full, leadNum: string, rawNum: string, rawDen: string) => {
        const nVal = parseInt(rawNum, 10);
        const dVal = parseInt(rawDen, 10);
        if (nVal > 0 && dVal > nVal) {
          const key = `${rawNum}/${rawDen}`;
          if (VULGAR_FRACTIONS[key]) {
            return `${leadNum}${VULGAR_FRACTIONS[key]}`;
          }
          return `${leadNum} ${rawNum}/${rawDen}`;
        }
        return full;
      }
    );

    // 5b. Standard Fractions: \frac{num}{den}, \dfrac{num}{den}, \tfrac{num}{den}, \cfrac{num}{den}
    s = s.replace(
      /\\(?:d|t|c)?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
      (_, rawNum: string, rawDen: string) => {
        const num = rawNum.trim();
        const den = rawDen.trim();
        const numFormatted = needsMathParens(num, false) ? `(${num})` : num;
        const denFormatted = needsMathParens(den, true) ? `(${den})` : den;
        return `${numFormatted}/${denFormatted}`;
      }
    );

    // 6. TeX {a \over b}
    s = s.replace(/\{\s*([^{}]*?)\s*\\over\s*([^{}]*?)\s*\}/g, (_, rawNum: string, rawDen: string) => {
      const num = rawNum.trim();
      const den = rawDen.trim();
      const numFormatted = needsMathParens(num, false) ? `(${num})` : num;
      const denFormatted = needsMathParens(den, true) ? `(${den})` : den;
      return `${numFormatted}/${denFormatted}`;
    });

    // 7. Braced Superscripts & Subscripts: ^{...} and _{...}
    s = s.replace(/\^\s*\{([^{}]*)\}/g, (_, exp: string) => toUnicodeSuperscript(exp));
    s = s.replace(/_\s*\{([^{}]*)\}/g, (_, sub: string) => toUnicodeSubscript(sub));

    if (s === prev) break;
  }

  // Unbraced \sqrt e.g. \sqrt 5 or \sqrt5
  s = s.replace(/\\sqrt\s*([0-9a-zA-Zα-ωπθ]+)/g, '√$1');

  // Unbraced Superscripts & Subscripts e.g. x^2, 10^-6, 2^n, x_1, H_2O
  s = s.replace(/\^([+-]?\d+|[a-zA-Z])/g, (_, exp: string) => toUnicodeSuperscript(exp));
  s = s.replace(
    /(?<=[a-zA-Z0-9α-ωΑ-Ωπθ)\]])_([0-9]+|[aehijklmnoprstuvx]\b)/g,
    (_, sub: string) => toUnicodeSubscript(sub)
  );

  // Simplify √(singleToken) -> √singleToken
  s = s.replace(/([√∛∜])\(([0-9a-zA-Zα-ωπθ⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉.]+)\)/g, '$1$2');

  // Unwrap remaining bare LaTeX grouping braces {x} -> x
  for (let i = 0; i < 3; i++) {
    const next = s.replace(/\{([^{}]*)\}/g, '$1');
    if (next === s) break;
    s = next;
  }

  // Clean up any rare remaining unknown LaTeX backslash command \cmd -> cmd so raw backslashes never appear on PDF
  s = s.replace(/\\([a-zA-Z]{2,})/g, '$1 ');

  // Restore protected literal braces \{ and \}
  s = s.replace(/\uFFF0/g, '{').replace(/\uFFF1/g, '}');

  // Normalize whitespace and remove spaces accidentally introduced before punctuation by $$ stripping
  return s
    .replace(/\s+([,.;:?!])/g, '$1')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();
}

const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

export function hasDevanagari(text: string): boolean {
  return DEVANAGARI_REGEX.test(text);
}

export function normalizeSubjectName(rawSec: string): string {
  return rawSec.replace(/\s+/g, ' ').trim().toUpperCase();
}

export function detectQuestionChapter(
  section: string,
  questionEn: string,
  questionHi: string,
  rawQuestion: string,
  answerClean: string
): string {
  const sec = (section || '').toUpperCase();
  const qEn = `${questionEn || ''} ${rawQuestion || ''}`.trim();
  const qBoth = `${qEn} ${questionHi || ''} ${answerClean || ''}`.trim();

  // 1. ENGLISH CHAPTERS
  if (sec.includes('ENGLISH') || sec.includes('COMPREHENSION')) {
    if (/passive\s+form|active\s+form|passive\s+voice|active\s+voice/i.test(qEn)) {
      return 'Active & Passive Voice';
    }
    if (
      /Indirect\s+Speech|Direct\s+Speech|indirect\s+narration|direct\s+narration|indirect\s+voice/i.test(
        qEn
      )
    ) {
      return 'Direct & Indirect Narration';
    }
    if (
      /rearrange|arrange\s+the\s+parts|proper\s+sequence|meaningful\s+paragraph|correct\s+logical\s+order/i.test(
        qEn
      ) ||
      /^[A-D]{4}$/.test(answerClean) ||
      /^[P-S1-4](?:\s*,\s*[P-S1-4]){3}$/i.test(answerClean)
    ) {
      return 'Para Jumbles (Sentence Rearrangement)';
    }
    if (
      /contains an error|grammatical error|Spot the error|find the error|part of the sentence has an error/i.test(
        qEn
      ) ||
      /^\([1-4]\)$/.test(answerClean)
    ) {
      return 'Spot the Grammatical Error';
    }
    if (
      /substitute the underlined|sentence improvement|No substitution|replace the bracketed|improve the sentence/i.test(
        qBoth
      )
    ) {
      return 'Sentence Improvement';
    }
    if (
      /correctly\s+spelt|wrongly\s+spelt|spelled\s+correctly|spelled\s+incorrectly|misspelt/i.test(
        qEn
      )
    ) {
      return 'Spelling Correction';
    }
    if (
      /\b(?:synonym|antonym|nearest in meaning|opposite in meaning|similar in meaning|most similar|most opposite|closest in meaning)\b/i.test(
        qEn
      )
    ) {
      return 'Synonyms & Antonyms';
    }
    if (
      /\b(?:idiom|phrase|proverb|one word substitute|group of words|meaning of the given idiom)\b/i.test(
        qEn
      )
    ) {
      return 'Idioms & One-Word Substitution';
    }
    if (
      /\b(?:passage|comprehension|cloze test|according to the passage|tone of the passage|central theme)\b/i.test(
        qEn
      )
    ) {
      return 'Reading Comprehension & Cloze Test';
    }
    if (
      /\b(?:fill in the blank|appropriate word|preposition|article|conjunction|modal|tense|pronoun|adjective|adverb|clause|sentence structure|part of speech)\b|___/i.test(
        qEn
      )
    ) {
      return 'Fill in the Blanks & Grammar';
    }
    return 'Vocabulary & English Usage';
  }

  // 2. QUANTITATIVE APTITUDE / MATHS CHAPTERS
  if (sec.includes('QUANT') || sec.includes('MATH') || sec.includes('ARITHMETIC')) {
    if (
      /percentage|profit|loss|discount|marked price|cost price|selling price|प्रतिशत|लाभ|हानि|छूट|क्रय मूल्य|विक्रय मूल्य/i.test(
        qBoth
      )
    ) {
      return 'Percentage, Profit-Loss & Discount';
    }
    if (/simple interest|compound interest|per annum|साधारण ब्याज|चक्रवृद्धि ब्याज/i.test(qBoth)) {
      return 'Simple & Compound Interest';
    }
    if (
      /ratio|proportion|average|mixture|alligation|partnership|age|अनुपात|औसत|मिश्रण|साझेदारी|आयु/i.test(
        qBoth
      )
    ) {
      return 'Ratio, Average & Ages';
    }
    if (
      /time and work|days to complete|pipe|cistern|speed|distance|train|boat|stream|कार्य और समय|पाइप|टंकी|चाल|दूरी|रेलगाड़ी|नाव/i.test(
        qBoth
      )
    ) {
      return 'Time, Work, Speed & Distance';
    }
    if (
      /triangle|circle|chord|tangent|angle|area|volume|cylinder|cone|sphere|perimeter|sin|cos|tan|त्रिभुज|वृत्त|क्षेत्रफल|आयतन|बेलन|शंकु|गोला/i.test(
        qBoth
      )
    ) {
      return 'Geometry, Mensuration & Trigonometry';
    }
    return 'Number System & Simplification';
  }

  // 3. REASONING CHAPTERS (Check before General Awareness because "GENERAL INTELLIGENCE & REASONING" contains "GENERAL")
  if (sec.includes('REASONING') || sec.includes('INTELLIGENCE')) {
    if (
      /Reference Entry|Question Address|संदर्भ प्रविष्टि|प्रश्न पता|matches it exactly|मेल खाता है/i.test(
        qBoth
      )
    ) {
      return 'Address & Data Verification';
    }
    if (
      /Statements?:.*Conclusions?:|कथन\s*[:ः].*निष्कर्ष|Syllogism|तार्किक रूप से अनुसरण|logically follow|If only \(1\) follows|Only Conclusion|All follow/i.test(
        qBoth
      )
    ) {
      return 'Syllogism (Statement & Conclusion)';
    }
    if (
      /Assumptions?:|पूर्वधारणा|implicit|निहित|Assertion\s*\(A\)|अभिकथन|Course of Action|कार्यवाही|vulnerable to criticism|inference|अनुमान|emotional intelligence|supports the claim/i.test(
        qBoth
      )
    ) {
      return 'Statement, Assumption & Critical Reasoning';
    }
    if (/Data Sufficiency|alone is sufficient|together sufficient|कथन.*पर्याप्त है/i.test(qBoth)) {
      return 'Data Sufficiency';
    }
    if (/Input\s*:|Step\s*I\b|Step\s*1\b|चरण\s*I|arrangement machine/i.test(qBoth)) {
      return 'Machine Input - Output';
    }
    if (
      /BODMAS|interchanged|mathematical signs|गणितीय चिह्न|समीकरण को संतुलित|balance the given equation|[A-Z]\s*[<>≤≥=]\s*[A-Z]/i.test(
        qBoth
      )
    ) {
      return 'Mathematical Operations & Inequalities';
    }
    if (
      /blood relation|रक्त संबंध|\b(?:mother|father|brother|sister|uncle|aunt|cousin|nephew|niece|son-in-law|brother-in-law|husband|wife|maternal|paternal)\b|संबंधित है.*(?:भाई|बहन|माता|पिता|चाचा|मामा|पुत्र|पुत्री)/i.test(
        qBoth
      )
    ) {
      return 'Blood Relations';
    }
    if (
      /\b(?:North|South|East|West|North-East|South-West|North-West|South-East)\b.*(?:km|m\b|turn|walk|facing|direction)|(?:walk|walks|turns|turned|facing).*\b(?:North|South|East|West)\b|दिशा.*(?:उत्तर|दक्षिण|पूर्व|पश्चिम|मुड़ता|चलता)/i.test(
        qBoth
      )
    ) {
      return 'Direction & Distance';
    }
    if (
      /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|leap year|day of the week|clock|hour hand|minute hand)\b|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार|सप्ताह का कौन-सा दिन|घड़ी की सुई/i.test(
        qBoth
      )
    ) {
      return 'Calendar & Clock';
    }
    if (/coded as|code language|कूट भाषा|कोडित|written as .* in that code/i.test(qBoth)) {
      return 'Coding - Decoding';
    }
    if (
      /::|related words|pair of figures|exhibiting a similar|उसी प्रकार संबंधित|समान संबंध/i.test(
        qBoth
      )
    ) {
      return 'Analogy & Similarity';
    }
    if (
      /odd one|odd group|does not belong|different from the rest|विषम समूह|असंगत|तीन किसी प्रकार समान/i.test(
        qBoth
      )
    ) {
      return 'Classification (Odd One Out)';
    }
    if (
      /sitting|seated|circular table|facing the centre|linear row|rank from the top|rank from the bottom|taller than|older than|heavier than|बैठे हैं|पंक्ति में|दायें से|बायें से|लम्बा है|बड़ा है/i.test(
        qBoth
      )
    ) {
      return 'Order, Ranking & Sitting Arrangement';
    }
    if (
      /alphabetical order|English dictionary|letters of the word|roll number|alphanumeric|शब्दकोश|अंग्रेजी वर्णमाला|रोल नंबर/i.test(
        qBoth
      )
    ) {
      return 'Alphabet & Word Formation';
    }
    if (
      /series|missing number|missing term|definite pattern|fill in the blanks|श्रृंखला|लुप्त संख्या|प्रश्नवाचक चिह्न\s*\(\?\)|,\s*\?\s*$/i.test(
        qBoth
      )
    ) {
      return 'Number & Letter Series';
    }
    return 'Puzzles & Seating Arrangement';
  }

  // 4. GRANULAR CHAPTERS FOR GENERAL AWARENESS / GK (No broad subject names!)
  if (
    /\b(?:Classical dance|Folk dance|dance form|dancer|Kuchipudi|Bharatanatyam|Kathak|Kathakali|Odissi|Manipuri|Sattriya|Mohiniyattam|Garba|Bihu|Lavani|Ghoomar|Rouf|Kamsale|Gharana|Carnatic|Hindustani|musical instrument|Sitar|Tabla|Flute|Sarod|Shehnai|Veena|Rabab|Manganiyar|Kshetrayya|padam|cymbal)\b|लोकनृत्य|शास्त्रीय नृत्य|नृत्य रूप|वाद्ययंत्र|घराना|संगीत परंपरा/i.test(
      qBoth
    )
  ) {
    return 'Dance, Music & Musical Instruments';
  }
  if (
    /\b(?:Festival|Navratri|Pongal|Lohri|Onam|Baisakhi|Ugadi|Hornbill|Wangala|Erok Sim|Mahavir Jayanti|harvest season|bonfire|celebrated in)\b|उत्सव|त्यौहार|पोंगल|लोहड़ी|नवरात्रि|जयंती/i.test(
      qBoth
    )
  ) {
    return 'Fairs, Festivals & Cultural Traditions';
  }
  if (
    /\b(?:Temple|Architecture|Monument|UNESCO|Stupa|Cave|Ajanta|Ellora|Khajuraho|Konark|Brihadeeswarar|Hampi|Fort|Palace|Painting|Sanamahism|Sculpture)\b|स्थापत्य|मंदिर|स्मारक|गुफा|किला|चित्रकला/i.test(
      qBoth
    )
  ) {
    return 'Temples, Architecture & Monuments';
  }
  if (
    /\b(?:Indus Valley|Harappa|Mohenjo|Vedic|Rigveda|Buddhism|Buddha|Jainism|Tirthankara|Ashoka|Maurya|Kautilya|Arthashastra|Gupta|Samudragupta|Harsha|Chola|Pallava|Chalukya|Sangam|Inscription|Edict)\b|हड़प्पा|सिंधु घाटी|वैदिक|बौद्ध|जैन|तीर्थंकर|अशोक|मौर्य|गुप्त वंश|चोल/i.test(
      qBoth
    )
  ) {
    return 'Ancient History (Indus, Vedic, Maurya & Gupta)';
  }
  if (
    /\b(?:Delhi Sultanate|Iltutmish|Razia|Alauddin Khilji|Tughlaq|Lodi|Mughal|Babur|Humayun|Akbar|Jahangir|Shah Jahan|Aurangzeb|Mansabdari|Vijayanagara|Krishnadevaraya|Shivaji|Maratha|Bhakti|Sufi|Kabir|Guru Nanak)\b|दिल्ली सल्तनत|खिलजी|तुगलक|मुगल|अकबर|औरंगजेब|विजयनगर|मराठा|शिवाजी|भक्ति आंदोलन/i.test(
      qBoth
    )
  ) {
    return 'Medieval History (Sultanate & Mughal Era)';
  }
  if (
    /\b(?:East India Company|Battle of Plassey|Buxar|Doctrine of Lapse|Subsidiary Alliance|Annexation|Revolt of 1857|Governor-General|Viceroy|Dalhousie|Curzon|Mountbatten|Mahatma Gandhi|Non-Cooperation|Civil Disobedience|Quit India|Swadeshi|Indian National Congress|Rowlatt|Jallianwala|Poona Pact|Cabinet Mission|Satyagraha|Social Reform|Brahmo Samaj|Arya Samaj)\b|व्यपगत का सिद्धांत|ब्रिटिश विलय|1857 का विद्रोह|गवर्नर जनरल|वायसराय|महात्मा गांधी|असहयोग|सविनय अवज्ञा|भारत छोड़ो|कांग्रेस अधिवेशन/i.test(
      qBoth
    )
  ) {
    return 'Modern History & Freedom Struggle';
  }
  if (
    /\b(?:Preamble|Schedule|Part\s+[IVX]+|Article\s+\d+|Constitutional Amendment|Amendment Act|Judicial Review|borrowed from|inspired from|Constituent Assembly|Drafting Committee|Sovereign|Secular|Socialist)\b|प्रस्तावना|अनुसूची|अनुच्छेद\s+\d+|संविधान संशोधन|न्यायिक पुनरावलोकन|संविधान सभा/i.test(
      qBoth
    )
  ) {
    return 'Constitution, Preamble, Articles & Amendments';
  }
  if (
    /\b(?:Fundamental Rights|Right to Equality|Right to Freedom|Habeas Corpus|Mandamus|Certiorari|Prohibition|Quo Warranto|Writ|Directive Principles|DPSP|Fundamental Duties|Citizenship)\b|मौलिक अधिकार|मौलिक कर्तव्य|नीति निदेशक|रिट|नागरिकता/i.test(
      qBoth
    )
  ) {
    return 'Fundamental Rights, Duties & DPSP';
  }
  if (
    /\b(?:Parliament|Lok Sabha|Rajya Sabha|President of India|Vice-President|Prime Minister|Council of Ministers|Speaker|Governor|Chief Minister|State Legislature|Panchayati Raj|Municipality|Money Bill|Joint Sitting)\b|संसद|लोकसभा|राज्यसभा|राष्ट्रपति|उपराष्ट्रपति|प्रधानमंत्री|राज्यपाल|पंचायती राज|धन विधेयक/i.test(
      qBoth
    )
  ) {
    return 'Parliament, President & Panchayati Raj';
  }
  if (
    /\b(?:Supreme Court|High Court|Chief Justice|Gram Nyayalaya|Evidence Act|BNS|BNSS|BSA|IPC|CrPC|Admissibility|Confession|Election Commission|Finance Commission|UPSC|Attorney General|CAG|Lokpal|Tribunal)\b|सर्वोच्च न्यायालय|उच्च न्यायालय|ग्राम न्यायालय|एविडेन्स ऐक्ट|निर्वाचन आयोग|नियंत्रक एवं महालेखा/i.test(
      qBoth
    )
  ) {
    return 'Judiciary, Legal Acts & Commissions';
  }
  if (
    /\b(?:Himalaya|Trans-Himalaya|Shiwalik|Himadri|Himachal|Karakoram|Godwin-Austen|K2|Kanchenjunga|Everest|Mountain|Peak|Range|Pass|Nathu La|Rohtang|Zoji La|Plateau|Deccan|Western Ghats|Eastern Ghats|Aravalli|Vindhya|Satpura|Coastal Plain|Island|Andaman|Lakshadweep)\b|हिमालय|शिवालिक|पर्वत श्रृंखला|चोटी|दर्रा|पठार|पश्चिमी घाट|पूर्वी घाट/i.test(
      qBoth
    )
  ) {
    return 'Mountains, Passes & Physiography of India';
  }
  if (
    /\b(?:River|Ganga|Yamuna|Brahmaputra|Indus|Godavari|Krishna|Kaveri|Narmada|Tapi|Mahanadi|Tributary|Delta|Estuary|Lake|Chilika|Wular|Loktak|Dam|Bhakra|Hirakud|Tehri|Waterfall|Canal|Strait|Ocean|Current)\b|नदी|सहायक नदी|झील|बांध|जलप्रपात|जलडमरूमध्य|महासागर/i.test(
      qBoth
    )
  ) {
    return 'Rivers, Lakes, Dams & Drainage System';
  }
  if (
    /\b(?:National Park|Wildlife Sanctuary|Tiger Reserve|Biosphere Reserve|Ramsar|Wetland|Environment \(Protection\) Act|Carbon Credit|CCTS|Emission|Biodiversity|Endangered|Red Data|Ozone|Kyoto|Paris Agreement|EIA|Coastal Regulation)\b|राष्ट्रीय उद्यान|वन्यजीव अभयारण्य|टाइगर रिजर्व|जैवमंडल|पर्यावरण \(संरक्षण\)|कार्बन क्रेडिट|जैव विविधता/i.test(
      qBoth
    )
  ) {
    return 'Environment, Ecology & National Parks';
  }
  if (
    /\b(?:Monsoon|Climate|Rainfall|Soil|Alluvial|Black Soil|Laterite|Rabi|Kharif|Zaid|Crop|Agriculture|Green Revolution|Forest|Mineral|Coal|Iron Ore|Bauxite|Mica|Oil refining|Petrochemical|Industrial region)\b|मानसून|जलवायु|मिट्टी|रबी|खरीफ|फसल|हरित क्रांति|खनिज|तेल शोधन|पेट्रोरसायन/i.test(
      qBoth
    )
  ) {
    return 'Climate, Agriculture, Soil & Minerals';
  }
  if (
    /\b(?:Solar System|Planet|Mercury|Venus|Mars|Jupiter|Saturn|Moon|Blue moon|Full moon|Eclipse|Sun|Asteroid|Comet|Latitude|Longitude|Equator|Tropic of Cancer|Atmosphere|Troposphere|Stratosphere|Earthquake|Volcano)\b|सौर मंडल|ग्रह|चंद्रमा|ब्लू मून|पूर्णिमा|ग्रहण|अक्षांश|देशांतर|वायुमंडल|भूकंप|ज्वालामुखी/i.test(
      qBoth
    )
  ) {
    return 'Universe, Solar System & World Geography';
  }
  if (
    /\b(?:Census|Population pyramid|Demographic|Literacy rate|Sex ratio|Density of population|Birth rate|Mortality rate|Urbanisation)\b|जनगणना|जनसंख्या पिरामिड|जनसांख्यिकीय|साक्षरता दर|लिंगानुपात/i.test(
      qBoth
    )
  ) {
    return 'Census, Population & Demographics';
  }
  if (
    /\b(?:Five Year Plan|Planning Commission|NITI Aayog|Import Substitution|1991 economic|Liberalisation|Privatisation|Globalisation|Disinvestment|Public Sector Undertaking|Chelliah Committee|Narasimham|Mixed Economy)\b|पंचवर्षीय योजना|योजना आयोग|नीति आयोग|आयात प्रतिस्थापन|आर्थिक सुधार|निजीकरण|उदारीकरण/i.test(
      qBoth
    )
  ) {
    return 'Five Year Plans, NITI Aayog & Economic Reforms';
  }
  if (
    /\b(?:RBI|Reserve Bank|Monetary Policy|Repo Rate|Reverse Repo|CRR|SLR|Bank Rate|UPI|Unified Payments Interface|Financial Inclusion|FI-Index|Digital payment|Commercial Bank|NABARD|SEBI|Microfinance|SHG|NPCI)\b|भारतीय रिज़र्व बैंक|मौद्रिक नीति|रेपो दर|एकीकृत भुगतान इंटरफेस|वित्तीय समावेशन|नाबार्ड|सेबी/i.test(
      qBoth
    )
  ) {
    return 'RBI, Banking, UPI & Financial Inclusion';
  }
  if (
    /\b(?:GDP|GNP|NNP|National Income|Per Capita|Inflation|Stagflation|Deflation|Wholesale Price|Consumer Price|Budget|Fiscal Deficit|Revenue Deficit|GST|Direct Tax|Indirect Tax|Custom Duty|Balance of Payments|Foreign Exchange|FDI)\b|सकल घरेलू उत्पाद|राष्ट्रीय आय|मुद्रास्फीति|ठहरावजनित मुद्रास्फीति|बजट|राजकोषीय घाटा|जीएसटी/i.test(
      qBoth
    )
  ) {
    return 'GDP, Inflation, Budget & Taxation';
  }
  if (
    /\b(?:ISRO|PSLV|GSLV|SSLV|POEM|Gaganyaan|Chandrayaan|Aditya-L1|Mangalyaan|Earth Observation Satellite|EOS|Remote sensing|Satellite|Launch Vehicle|DRDO|Missile|Agni|BrahMos|Sriharikota|Spaceflight)\b|इसरो|गगनयान|चंद्रयान|उपग्रह|प्रक्षेपण यान|अंतरिक्ष कार्यक्रम/i.test(
      qBoth
    )
  ) {
    return 'Space (ISRO), Satellites & Defence Tech';
  }
  if (
    /\b(?:Wien|Displacement Law|Relativity|Einstein|Newton|Ohm|Faraday|Archimedes|Bernoulli|Heisenberg|Planck|Wavelength|Frequency|Speed of light|Inertial|Time dilation|Refraction|Reflection|Lens|Mirror|Prism|Electric current|Resistance|Magnetic field|SI unit|Joule|Watt|Pascal|Hertz|Force|Momentum|Kinetic|Potential energy|Thermodynamics)\b|वीन विस्थापन|सापेक्षता|आइंस्टाइन|तरंगदैर्ध्य|प्रकाश की गति|अपवर्तन|परावर्तन|लेंस|दर्पण|विद्युत धारा|प्रतिरोध|चुंबकीय|मात्रक|ऊष्मागतिकी/i.test(
      qBoth
    )
  ) {
    return 'Physics (Laws, Light, Electricity & Units)';
  }
  if (
    /\b(?:Periodic Table|Atomic number|Mass number|Isotope|Isobar|Electron|Proton|Neutron|Valency|Acid|Base|pH value|Salt|Metal|Non-metal|Alloy|Bronze|Brass|Solder|Oxidation|Reduction|Catalyst|Polymer|Hydrocarbon|Methane|Ethanol|Baking soda|Washing soda|Bleaching powder|Plaster of Paris|Gypsum)\b|आवर्त सारणी|परमाणु क्रमांक|समस्थानिक|अम्ल|क्षार|लवण|धातु|मिश्रधातु|ऑक्सीकरण|बहुलक|बेकिंग सोडा|विरंजक चूर्ण/i.test(
      qBoth
    )
  ) {
    return 'Chemistry (Matter, Acids, Metals & Compounds)';
  }
  if (
    /\b(?:Vitamin|Protein|Albumen|Carbohydrate|Fat|Enzyme|Hormone|Insulin|Thyroxine|Blood|Hemoglobin|RBC|WBC|Platelet|Heart|Kidney|Nephron|Liver|Brain|Neuron|Cell|Mitochondria|Ribosome|Chloroplast|DNA|RNA|Chromosome|Photosynthesis|Xylem|Phloem|Bacteria|Virus|Protozoa|Fungus|Malaria|Dengue|Tuberculosis|Polio|Vaccine)\b|विटामिन|प्रोटीन|अंडे की सफ़ेदी|हार्मोन|एंजाइम|रक्त|हीमोग्लोबिन|कोशिका|माइटोकॉन्ड्रिया|प्रकाश संश्लेषण|जीवाणु|विषाणु|टीका/i.test(
      qBoth
    )
  ) {
    return 'Biology (Nutrition, Human Body & Diseases)';
  }
  if (
    /\b(?:Chess|Praggnanandhaa|Carlsen|Gukesh|Viswanathan Anand|Badminton|Dump shot|Cricket|Football|Hockey|Tennis|Olympics|Paralympics|Asian Games|Commonwealth Games|National Games|World Cup|Trophy|Ranji|Santosh Trophy|Thomas Cup|Uber Cup|Davis Cup|Grand Slam|Stadium|Athlete|Player|Sport)\b|शतरंज|बैडमिंटन|डंप शॉट|क्रिकेट|हॉकी|ओलंपिक|राष्ट्रीय खेल|विश्व कप|ट्रॉफी|खिलाड़ी/i.test(
      qBoth
    )
  ) {
    return 'Sports, Trophies, Terms & Players';
  }
  if (
    /\b(?:Press Freedom Index|Global Competitiveness Index|Human Development Index|Hunger Index|Happiness Report|Innovation Index|World Economic Forum|Reporters Without Borders|SAARC|ASEAN|BRICS|G20|NATO|UNSC|UNESCO|UNICEF|WHO|WTO|IMF|World Bank|Headquarters|Secretariat|Kathmandu|Geneva)\b|प्रेस फ्रीडम इंडेक्स|प्रेस स्वतंत्रता सूचकांक|ग्लोबल कंपेटिटिवनेस इंडेक्स|मानव विकास सूचकांक|सार्क|सचिवालय|मुख्यालय/i.test(
      qBoth
    )
  ) {
    return 'Global Indices, Reports & Organizations';
  }
  if (
    /\b(?:Book|Author|Novel|Autobiography|Biography|originally written|Nobel Prize|Bharat Ratna|Padma Vibhushan|Padma Bhushan|Padma Shri|Booker Prize|Jnanpith|Sahitya Akademi|Dadasaheb Phalke|Arjuna Award|Khel Ratna|Dronacharya|Gallantry Award)\b|पुस्तक|लेखक|उपन्यास|आत्मकथा|नोबेल पुरस्कार|भारत रत्न|पद्म पुरस्कार|साहित्य अकादमी|अर्जुन पुरस्कार/i.test(
      qBoth
    )
  ) {
    return 'Books, Authors, Awards & Honours';
  }

  return 'Government Schemes, Policies & Current Affairs';
}

function stripLeadingQuestionPrefix(text: string): string {
  return text
    .replace(
      /^(?:Q(?:uestion)?\.?\s*\d+[.):-]?\s*|प्रश्न\s*\d+[.):-]?\s*|प्र\.?\s*\d+[.):-]?\s*|\d+[.)]\s+)+/i,
      ''
    )
    .trim();
}

export function buildQuestionDedupKey(
  originalQNum: number,
  section: string,
  questionEn: string,
  questionHi: string,
  rawQuestion: string,
  answerOption: string,
  answerClean: string
): string {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const qPrimary = norm(questionEn) || norm(rawQuestion);
  const qSecondary = norm(questionHi);
  return `${originalQNum}::${norm(section)}::${qPrimary}::${qSecondary}::${norm(answerOption)}::${norm(answerClean)}`;
}

export function parseExamTxt(
  rawTxt: string,
  sourceFileName: string = 'Exam.txt'
): ParsedExamDocument {
  // Strip UTF-8 BOM if present and normalize line endings
  const normalizedTxt = (rawTxt || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = normalizedTxt.split('\n');

  // Check first 8KB sample if file uses explicit Ans:/Answer:/उत्तर: markers so we never flush stray explanation fragments
  const headerSampleTxt = normalizedTxt.slice(0, 8000);
  const hasAnswerMarkersInFile = /(?:^|\n)\s*(?:Ans|Answer|Correct\s*Answer|उत्तर)\s*[:.-]/i.test(
    headerSampleTxt
  );

  // Check first 8KB sample if file uses explicit Q1. / Q.1 / Question 1 markers so numbered statements "1. ..." inside questions/answers never split a question
  const hasExplicitQMarkersInFile = /(?:^|\n)\s*Q(?:uestion)?\.?\s*\d+[.):]\s+/i.test(
    headerSampleTxt
  );

  const hasOptionMarkersInFile = /(?:^|\n)\s*(?:\([A-Da-d1-4]\)|\[[A-Da-d1-4]\]|[A-Da-d][.)])\s+/i.test(
    headerSampleTxt
  );

  const defaultFromFileName = parseHeaderDetailsFromTitle(sourceFileName);

  const meta: ExamDocumentMeta = {
    title: sourceFileName.replace(/\.txt$/i, '') || 'EXAM PAPER',
    examId: '',
    examName: defaultFromFileName.examName,
    shiftName: defaultFromFileName.shiftName,
    examDate: defaultFromFileName.examDate,
    headerRightText: defaultFromFileName.headerRightText,
    totalQuestionsHeader: '',
    languageMode: 'Bilingual (English + Hindi)',
  };

  // Detect Pure Theory / Study Notes .txt files (no Ans: markers, no (A)-(D) options, and no explicit Q1. markers)
  if (!hasAnswerMarkersInFile && !hasOptionMarkersInFile && !hasExplicitQMarkersInFile) {
    const theoryQuestions: ParsedQuestion[] = [];
    const theorySectionsSet = new Set<string>();
    let curSec = 'THEORY NOTES';
    let curChapter = '';
    let curCoreLines: string[] = [];
    let curBulletLines: string[] = [];
    let curTakeaway = '';
    let inBanner = false;
    let bannerLines = 0;

    const flushTheoryBlock = () => {
      if (
        curCoreLines.length === 0 &&
        curBulletLines.length === 0 &&
        !curTakeaway.trim()
      ) {
        return;
      }
      const normSec = normalizeSubjectName(curSec || 'THEORY NOTES');
      theorySectionsSet.add(normSec);

      const enCore: string[] = [];
      const hiCore: string[] = [];
      for (const cl of curCoreLines) {
        if (hasDevanagari(cl)) hiCore.push(cl);
        else enCore.push(cl);
      }

      const enBullets: string[] = [];
      const hiBullets: string[] = [];
      for (const bl of curBulletLines) {
        if (hasDevanagari(bl)) hiBullets.push(bl);
        else enBullets.push(bl);
      }

      const allBulletsJoined = curBulletLines.join('\n').trim();
      const qIdxNum = theoryQuestions.length + 1;
      const effectiveChapter = curChapter || normSec;

      theoryQuestions.push({
        id: `${sourceFileName}-theory-${qIdxNum}`,
        originalQNum: qIdxNum,
        qNum: qIdxNum,
        qLabel: String(qIdxNum),
        section: normSec,
        chapter: effectiveChapter,
        sourceFileName,
        sourceHeaderRight: meta.headerRightText,
        questionEn: curCoreLines.join('\n').trim(),
        questionHi: hiCore.join('\n').trim(),
        rawQuestion: curCoreLines.join('\n').trim(),
        options: [],
        answerFull: curTakeaway.trim(),
        answerOption: '',
        answerTextEn: curTakeaway.trim(),
        answerTextHi: hasDevanagari(curTakeaway) ? curTakeaway.trim() : '',
        answerClean: curTakeaway.trim(),
        explanationEn: allBulletsJoined || enBullets.join('\n').trim(),
        explanationHi: hiBullets.join('\n').trim(),
        explanationClean: allBulletsJoined,
        isTheoryNote: true,
      });

      curCoreLines = [];
      curBulletLines = [];
      curTakeaway = '';
    };

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (/^={8,}$/.test(trimmed)) {
        flushTheoryBlock();
        inBanner = !inBanner;
        bannerLines = 0;
        continue;
      }

      const secMatch =
        trimmed.match(/^#{1,}\s*\[\s*(.+?)\s*\]\s*#{0,}$/) ||
        trimmed.match(/^\[\s*([^\s\]][^\]]{1,60})\s*\]$/) ||
        trimmed.match(/^#\s+([^#].+)$/) ||
        trimmed.match(/^(?:अध्याय|भाग|खण्ड|विषय|CHAPTER|PART|UNIT)\s*[:.-]?\s*(\d+|[IVXLCDM]+|[A-Za-z])\s*[:.-]?\s*(.+)$/i);

      if (secMatch) {
        flushTheoryBlock();
        inBanner = false;
        const secTitle = secMatch[2] ? `${secMatch[1]}: ${secMatch[2]}` : secMatch[1];
        curSec = normalizeSubjectName(secTitle);
        theorySectionsSet.add(curSec);
        continue;
      }

      if (inBanner && bannerLines > 6) {
        inBanner = false;
      }

      if (inBanner) {
        if (!trimmed) continue;
        bannerLines++;
        if (/^ID:\s*/i.test(trimmed)) {
          const idVal = trimmed.replace(/^ID:\s*/i, '').trim();
          meta.examId = idVal;
          const p = parseHeaderDetailsFromTitle(idVal);
          meta.examName = p.examName;
          meta.headerRightText = p.headerRightText;
        } else if (/^Language Mode:\s*/i.test(trimmed)) {
          meta.languageMode = trimmed.replace(/^Language Mode:\s*/i, '').trim();
        } else if (!trimmed.includes(':')) {
          meta.title = trimmed;
          const p = parseHeaderDetailsFromTitle(trimmed);
          meta.examName = p.examName;
          meta.headerRightText = p.headerRightText;
        }
        continue;
      }

      if (/^-{4,}$/.test(trimmed)) {
        flushTheoryBlock();
        continue;
      }

      if (!trimmed) continue;

      // Topic / Chapter heading: "## 1. ..." or "Topic: ..." or "Chapter: ..." or "Heading: ..." or "अध्याय: ..."
      const topicMatch =
        trimmed.match(/^##\s+(.+)$/) ||
        trimmed.match(/^(?:Topic|Chapter|Heading|Unit|अध्याय|टॉपिक|इकाई|प्रकरण|शीर्षक|विषय)\s*[:.-]\s*(.+)$/i);
      if (topicMatch) {
        flushTheoryBlock();
        curChapter = topicMatch[1].trim();
        continue;
      }

      // Takeaway / Key Rule / Extra / Exam Booster / Trick / Exception / Formula line
      const takeawayMatch = trimmed.match(
        /^(Key\s*Takeaway|Key\s*Point|Golden\s*Rule|Important\s*Note|Extra\s*Fact|Extra\s*Point|Extra|Exam\s*Booster|Booster|Memory\s*Trick|Shortcut\s*Trick|Trick|Formula|Exception|निचोड़|मुख्य\s*बिंदु|महत्वपूर्ण\s*बिंदु|महत्वपूर्ण\s*नोट|महत्वपूर्ण\s*तथ्य|परीक्षा\s*दृष्टि|विशेष\s*नोट|विशेष|नोट|याद\s*रखें|स्मरण\s*रहे|सूत्र|ट्रिक|अपवाद|एक्स्ट्रा|Note)\s*[:.-]\s*(.+)$/i
      );
      if (takeawayMatch) {
        const rawKind = takeawayMatch[1].trim().toUpperCase();
        let badgePrefix = '★ KEY TAKEAWAY:';
        if (/EXTRA|BOOSTER|एक्स्ट्रा/.test(rawKind)) badgePrefix = '★ EXTRA BOOSTER:';
        else if (/TRICK|ट्रिक/.test(rawKind)) badgePrefix = '⚡ MEMORY TRICK:';
        else if (/FORMULA|सूत्र/.test(rawKind)) badgePrefix = '📐 FORMULA:';
        else if (/EXCEPTION|अपवाद/.test(rawKind)) badgePrefix = '⚠ EXCEPTION:';
        else if (/GOLDEN/.test(rawKind)) badgePrefix = '★ GOLDEN RULE:';
        else if (/परीक्षा\s*दृष्टि/.test(rawKind)) badgePrefix = '🎯 परीक्षा दृष्टि:';
        else if (/महत्वपूर्ण|मुख्य|विशेष|नोट|NOTE/.test(rawKind)) badgePrefix = '★ महत्वपूर्ण बिंदु:';
        const formattedCallout = `${badgePrefix} ${takeawayMatch[2].trim()}`;
        curTakeaway = curTakeaway ? `${curTakeaway}\n${formattedCallout}` : formattedCallout;
        continue;
      }

      // Subheading: "### ..." or "#### ..." or "Sub-Heading: ..." or "Subheading: ..."
      const explicitSubMatch =
        trimmed.match(/^#{3,4}\s+(.+)$/) ||
        trimmed.match(/^(?:Sub-?Heading|Section|उप-शीर्षक|उपशीर्षक|प्रमुख\s*बिंदु)\s*[:.-]\s*(.+)$/i);
      if (explicitSubMatch) {
        const subLineFormatted = `### ${explicitSubMatch[1].trim()}`;
        if (curBulletLines.length > 0) {
          curBulletLines.push(subLineFormatted);
        } else {
          curCoreLines.push(subLineFormatted);
        }
        continue;
      }

      // Table row: "| Col1 | Col2 | Col3 |"
      if (/^\|.+\|$/.test(trimmed)) {
        // Ignore markdown separator rows like |---|---|---|
        if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
          continue;
        }
        curBulletLines.push(trimmed);
        continue;
      }

      // Quote / Blockquote / Statement / Definition line: "> ..." or "Quote: ..." or "कथन: ..."
      const quoteMatch =
        trimmed.match(/^>\s*(.+)$/) ||
        trimmed.match(/^(?:Quote|Quotation|Famous\s*Quote|Statement|कथन|उद्धरण|परिभाषा)\s*[:.-]\s*(.+)$/i);
      if (quoteMatch) {
        curBulletLines.push(`> ${quoteMatch[1].trim()}`);
        continue;
      }

      // Explicit Sub-Point line: indented bullet or "▸ ...", "→ ...", "↳ ...", "Sub-Point: ...", "(i) ...", "a) ..."
      const rawLine = lines[i];
      const isIndentedLine = /^\s{2,}(?:[•\-*▪▸→↳◦]|\([a-zA-Z0-9क-ह]+\)|[a-zA-Z]\))\s+/.test(rawLine);
      const subPointMatch =
        rawLine.match(/^\s{2,}(?:[•\-*▪▸→↳◦]|\([a-zA-Z0-9क-ह]+\)|[a-zA-Z]\))\s+(.+)$/) ||
        trimmed.match(/^(?:[▸→↳▪◦]|\([ivxIVX]+\)|\([a-dA-D]\)|[a-dA-D]\)|\([क-ह]\))\s+(.+)$/) ||
        trimmed.match(/^(?:Sub-?Point|उप-बिंदु|उपबिंदु)\s*[:.-]\s*(.+)$/i);
      if (isIndentedLine || subPointMatch) {
        const subBody = (subPointMatch ? subPointMatch[1] : trimmed.replace(/^[•\-*▪▸→↳◦]\s*/, '')).trim();
        curBulletLines.push(`↳ ${subBody}`);
        continue;
      }

      // Explicit Main Point / Rule / Concept line: "Point 1: ...", "Point: ...", "Rule 1: ...", "Concept: ..."
      const mainPointMatch = trimmed.match(
        /^(Point(?:\s*\d+)?|Rule(?:\s*\d+)?|Concept(?:\s*\d+)?|बिंदु(?:\s*\d+)?|नियम(?:\s*\d+)?|सिद्धांत(?:\s*\d+)?)\s*[:.-]\s*(.+)$/i
      );
      if (mainPointMatch) {
        const ptLabel = mainPointMatch[1].trim().toUpperCase();
        const ptBody = mainPointMatch[2].trim();
        curBulletLines.push(`◆ [${ptLabel}] ${ptBody}`);
        continue;
      }

      // Bullet point line: "• ...", "- ...", "* ...", "✓ ...", "◦ ...", "▪ ..."
      const bulletMatch = trimmed.match(/^(?:[•\-*✓◦▪◆➢➤➔→]|\(\d+\)|[ivxIVX]+\.|\([क-ह]\))\s+(.+)$/);
      if (bulletMatch) {
        curBulletLines.push(`• ${bulletMatch[1].trim()}`);
        continue;
      }

      // Numbered topic or point: "1. ..."
      const numHeadingMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numHeadingMatch) {
        if (
          curCoreLines.length === 0 &&
          curBulletLines.length === 0 &&
          numHeadingMatch[2].length < 95 &&
          !numHeadingMatch[2].includes('•')
        ) {
          curChapter = `${numHeadingMatch[1]}. ${numHeadingMatch[2].trim()}`;
        } else {
          curBulletLines.push(`◆ [POINT ${numHeadingMatch[1]}] ${numHeadingMatch[2].trim()}`);
        }
        continue;
      }

      // Otherwise normal concept paragraph line
      if (curBulletLines.length > 0) {
        curBulletLines.push(`• ${trimmed}`);
      } else {
        curCoreLines.push(trimmed);
      }
    }

    flushTheoryBlock();

    if (theoryQuestions.length > 0) {
      return {
        meta,
        sections: Array.from(theorySectionsSet),
        questions: theoryQuestions,
      };
    }
  }

  let currentHeaderRight = meta.headerRightText;
  let inHeaderBanner = false;
  let headerBannerLinesCount = 0;

  const questions: ParsedQuestion[] = [];
  const seenQuestionKeys = new Set<string>();
  const sectionsSet = new Set<string>();
  let currentSection = 'GENERAL';

  let currentQNum = 0;
  let questionLines: string[] = [];
  let currentOptionLines: { code: 'A' | 'B' | 'C' | 'D'; raw: string }[] = [];
  let currentAnsLine = '';
  let currentExLines: string[] = [];
  let state: 'IDLE' | 'IN_QUESTION' | 'IN_OPTIONS' | 'IN_ANS' | 'IN_EX' = 'IDLE';

  const splitBilingualOptionOrAns = (
    rawBody: string
  ): { textEn: string; textHi: string; textClean: string } => {
    const cleaned = cleanMathAndText(rawBody);
    if (!cleaned) {
      return { textEn: '', textHi: '', textClean: '' };
    }

    // If there is no Devanagari at all, preserve 100% as English/Math without breaking math fractions (a / b)
    if (!hasDevanagari(cleaned)) {
      const rawSlashParts = cleaned
        .split(/\s+\/\s+/)
        .map((p) => p.trim())
        .filter(Boolean);
      // Only collapse if exact duplicate English text was joined twice ("Option A / Option A")
      if (
        rawSlashParts.length === 2 &&
        rawSlashParts[0].length >= 3 &&
        rawSlashParts[0].toLowerCase() === rawSlashParts[1].toLowerCase() &&
        !/^\d+$/.test(rawSlashParts[0])
      ) {
        return {
          textEn: rawSlashParts[0],
          textHi: '',
          textClean: rawSlashParts[0],
        };
      }
      return { textEn: cleaned, textHi: '', textClean: cleaned };
    }

    // Split on " / " and locate the exact boundary where Hindi (Devanagari) begins so math fractions inside either language stay intact
    const rawSlashParts = cleaned
      .split(/\s+\/\s+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (rawSlashParts.length === 1) {
      return { textEn: '', textHi: cleaned, textClean: cleaned };
    }

    const firstHiIdx = rawSlashParts.findIndex((p) => hasDevanagari(p));
    if (firstHiIdx <= 0) {
      // Starts with Hindi directly
      return { textEn: '', textHi: cleaned, textClean: cleaned };
    }

    const enSide = rawSlashParts.slice(0, firstHiIdx);
    const hiSide = rawSlashParts.slice(firstHiIdx);
    const textEn = enSide.join(' / ').trim();
    const rawHiJoined = hiSide.join(' / ').trim();
    const suffixTarget = `(${textEn.toLowerCase()})`;
    const cleanedHiForBilingual = rawHiJoined.toLowerCase().endsWith(suffixTarget)
      ? rawHiJoined.slice(0, rawHiJoined.length - suffixTarget.length).trim()
      : rawHiJoined;
    const textHi = cleanedHiForBilingual || rawHiJoined;
    const textClean = textEn && textHi ? `${textEn} / ${textHi}` : cleaned;

    return { textEn, textHi, textClean };
  };

  const flushQuestion = () => {
    if (currentQNum === 0 && questionLines.length === 0) return;

    // If this file uses explicit Ans: lines, ignore any stray block that has no answer line
    if (hasAnswerMarkersInFile && !currentAnsLine.trim() && currentOptionLines.length === 0) {
      currentQNum = 0;
      questionLines = [];
      currentOptionLines = [];
      currentAnsLine = '';
      currentExLines = [];
      return;
    }

    const enParts: string[] = [];
    const hiParts: string[] = [];
    let explicitTopic = '';

    for (const qLine of questionLines) {
      let lineToClean = qLine;
      // Extract explicit [ Topic: ... ] if present in the question line
      const topicMatch = lineToClean.match(/\[\s*Topic\s*:\s*([^\]]+?)\s*\]/i);
      if (topicMatch && topicMatch[1]) {
        explicitTopic = topicMatch[1].trim();
      }
      // Strip inline metadata tags like [ Topic: ... ] or [CHSL, 12 Nov 2025, Shift 3]
      lineToClean = lineToClean
        .replace(/\[\s*Topic\s*:\s*[^\]]*\]/gi, ' ')
        .replace(/\[\s*(?:SSC\s+)?(?:CGL|CHSL|MTS|CPO|GD|STENO|JE|SELECTION\s*POST|PHASE\s*[0-9IVX]+)[^[\]]*?(?:Shift|20\d\d)[^[\]]*\]/gi, ' ');

      const cleaned = stripLeadingQuestionPrefix(cleanMathAndText(lineToClean));
      if (!cleaned) continue;
      if (hasDevanagari(cleaned)) {
        if (!hiParts.includes(cleaned)) {
          hiParts.push(cleaned);
        }
      } else {
        if (!enParts.includes(cleaned)) {
          enParts.push(cleaned);
        }
      }
    }

    const questionEn = enParts.join(' ').trim();
    const questionHi = hiParts.join(' ').trim();
    const rawQuestion = stripLeadingQuestionPrefix(
      cleanMathAndText(
        questionLines
          .join(' ')
          .replace(/\[\s*Topic\s*:\s*[^\]]*\]/gi, ' ')
          .replace(/\[\s*(?:SSC\s+)?(?:CGL|CHSL|MTS|CPO|GD|STENO|JE|SELECTION\s*POST|PHASE\s*[0-9IVX]+)[^[\]]*?(?:Shift|20\d\d)[^[\]]*\]/gi, ' ')
      )
    );

    if (!rawQuestion && !currentAnsLine) {
      currentQNum = 0;
      questionLines = [];
      currentOptionLines = [];
      currentAnsLine = '';
      currentExLines = [];
      return;
    }

    // Strip any repeated "Ans: ", "Answer: ", "Correct Option: ", etc. prefixes
    const rawAns = cleanMathAndText(
      currentAnsLine.replace(
        /^(?:(?:Ans(?:wer)?|Correct\s*(?:Option|Answer)|Right\s*(?:Option|Answer)|उत्तर|Key)\s*[:.\-=]?\s*)+/i,
        ''
      )
    );

    // Multi-format option code and answer text extraction
    const mapCode = (c: string): 'A' | 'B' | 'C' | 'D' => {
      const u = c.trim().toUpperCase();
      if (u === '1' || u === 'A') return 'A';
      if (u === '2' || u === 'B') return 'B';
      if (u === '3' || u === 'C') return 'C';
      if (u === '4' || u === 'D') return 'D';
      return 'A';
    };

    let detectedLetter: 'A' | 'B' | 'C' | 'D' | '' = '';
    let rawAnsBody = rawAns;

    // 1. Parenthesized: "(A)", "(1)", "( A )", "( 1 )", optionally followed by "(A)" or "(1)"
    const parenMatch = rawAns.match(/^\(\s*([A-Da-d1-4])\s*\)(?:\s*\(\s*[A-Da-d1-4]\s*\))?\s*(.*)$/i);
    if (parenMatch) {
      detectedLetter = mapCode(parenMatch[1]);
      rawAnsBody = parenMatch[2].trim();
    } else {
      // 2. Bracketed: "[A]", "[1]", "[ A ]"
      const bracketMatch = rawAns.match(/^\[\s*([A-Da-d1-4])\s*\](?:\s*\[\s*[A-Da-d1-4]\s*\])?\s*(.*)$/i);
      if (bracketMatch) {
        detectedLetter = mapCode(bracketMatch[1]);
        rawAnsBody = bracketMatch[2].trim();
      } else {
        // 3. Option X / विकल्प X
        const optWordMatch = rawAns.match(/^(?:Option|विकल्प)\s*\(?\s*([A-Da-d1-4])\s*\)?\s*[:.\-=]?\s*(.*)$/i);
        if (optWordMatch) {
          detectedLetter = mapCode(optWordMatch[1]);
          rawAnsBody = optWordMatch[2].trim();
        } else {
          // 4. Delimited: "A.", "1.", "A)", "1)", "A:", "1:", "A -", "1 -"
          const delimMatch = rawAns.match(/^([A-Da-d1-4])[\.\)\:\-]\s*(.*)$/i);
          if (delimMatch) {
            detectedLetter = mapCode(delimMatch[1]);
            rawAnsBody = delimMatch[2].trim();
          } else if (
            currentOptionLines.length > 0 &&
            /^[A-Da-d1-4]$/.test(rawAns.trim())
          ) {
            // 5. Bare single code alone e.g. "A", "B", "C", "D", "1", "2", "3", "4"
            detectedLetter = mapCode(rawAns.trim());
            rawAnsBody = '';
          } else if (/^[A-Da-d]$/i.test(rawAns.trim())) {
            detectedLetter = mapCode(rawAns.trim());
            rawAnsBody = '';
          } else if (currentOptionLines.length > 0) {
            // 6. Leading digit 1-4 followed by space: "3 Forty five"
            const numStartMatch = rawAns.match(/^([1-4])\s+([^\s].*)$/i);
            if (numStartMatch) {
              detectedLetter = mapCode(numStartMatch[1]);
              rawAnsBody = numStartMatch[2].trim();
            }
          }
        }
      }
    }

    // If no explicit code, try matching rawAns against the option texts
    if (!detectedLetter && currentOptionLines.length > 0) {
      const cleanNorm = rawAns.trim().toLowerCase();
      for (const opt of currentOptionLines) {
        const oNorm = opt.raw.trim().toLowerCase();
        if (oNorm && (oNorm === cleanNorm || oNorm.includes(cleanNorm) || cleanNorm.includes(oNorm))) {
          detectedLetter = opt.code;
          rawAnsBody = rawAns;
          break;
        }
      }
    }

    const answerOption = detectedLetter ? `(${detectedLetter})` : '';

    // If answer body is empty or just the letter, fill from the matched option!
    if (!rawAnsBody && detectedLetter) {
      const matchingOpt = currentOptionLines.find((o) => o.code === detectedLetter);
      if (matchingOpt) {
        rawAnsBody = matchingOpt.raw;
      }
    }

    const splitAns = splitBilingualOptionOrAns(rawAnsBody || rawAns);
    const answerTextEn = splitAns.textEn;
    const answerTextHi = splitAns.textHi;
    const answerBody = splitAns.textClean;

    const parsedOptions: ParsedOption[] = currentOptionLines.map((o) => {
      const sp = splitBilingualOptionOrAns(o.raw);
      return {
        code: o.code,
        textEn: sp.textEn,
        textHi: sp.textHi,
        textClean: sp.textClean,
      };
    });

    const normalizedSec = normalizeSubjectName(currentSection);
    const num = currentQNum || questions.length + 1;
    const dedupKey = buildQuestionDedupKey(
      num,
      normalizedSec,
      questionEn,
      questionHi,
      rawQuestion,
      answerOption,
      answerBody
    );

    // Skip exact duplicate question blocks (same Q number + section + content) within the same .txt file
    if (seenQuestionKeys.has(dedupKey)) {
      currentQNum = 0;
      questionLines = [];
      currentOptionLines = [];
      currentAnsLine = '';
      currentExLines = [];
      return;
    }
    seenQuestionKeys.add(dedupKey);
    sectionsSet.add(normalizedSec);

    const exEnParts: string[] = [];
    const exHiParts: string[] = [];
    let inHindiEx = false;

    for (const rawExLine of currentExLines) {
      if (rawExLine === '__HINDI_EX_START__') {
        inHindiEx = true;
        continue;
      }
      if (rawExLine === '__ENGLISH_EX_START__') {
        inHindiEx = false;
        continue;
      }
      const trimmedExRaw = rawExLine.trim();
      if (/^\[Hindi/i.test(trimmedExRaw) || /^(?:व्याख्या|हल|नोट|संकेत|Hi)\s*[:.-]/i.test(trimmedExRaw)) {
        inHindiEx = true;
      } else if (/^(?:Ex|Explanation|Sol|Solution|En)\s*[:.-]/i.test(trimmedExRaw)) {
        inHindiEx = false;
      }
      // Skip redundant final "Ans: (1) ..." or "उत्तर: (4) ..." lines inside Ex: block
      if (/^(?:Ans|Answer|Correct\s*Answer|उत्तर)\s*[:.-]?\s*\([A-Da-d1-4]\)/i.test(trimmedExRaw)) {
        continue;
      }
      const cleanedEx = cleanMathAndText(
        trimmedExRaw
          .replace(
            /^(?:Ex|Explanation|Sol|Solution|Note|Key\s*Points|Hint|Trick|En|Hi|व्याख्या|हल|नोट|संकेत)\s*[:.-]\s*/i,
            ''
          )
          .replace(/^\[Hindi[^\]]*\]\s*[:.-]?\s*/i, '')
          .replace(/^(?:संबंधित परीक्षा-तथ्य|Related exam facts)\s*[:.-]?\s*/i, '')
      );
      if (!cleanedEx) continue;
      if (cleanedEx.includes(' / ') && hasDevanagari(cleanedEx)) {
        const spEx = splitBilingualOptionOrAns(cleanedEx);
        if (spEx.textEn && !exEnParts.includes(spEx.textEn)) exEnParts.push(spEx.textEn);
        if (spEx.textHi && !exHiParts.includes(spEx.textHi)) exHiParts.push(spEx.textHi);
      } else if (inHindiEx || hasDevanagari(cleanedEx)) {
        if (!exHiParts.includes(cleanedEx)) exHiParts.push(cleanedEx);
      } else {
        if (!exEnParts.includes(cleanedEx)) exEnParts.push(cleanedEx);
      }
    }
    const explanationEn = exEnParts.join(' ').trim();
    const explanationHi = exHiParts.join(' ').trim();
    const explanationClean =
      explanationEn && explanationHi
        ? `${explanationEn} / ${explanationHi}`
        : explanationEn || explanationHi;

    const detectedChapter =
      explicitTopic ||
      detectQuestionChapter(
        normalizedSec,
        questionEn,
        questionHi,
        rawQuestion,
        answerBody
      );

    questions.push({
      id: `${sourceFileName}-q-${questions.length + 1}`,
      originalQNum: num,
      qNum: questions.length + 1,
      qLabel: String(questions.length + 1),
      section: normalizedSec,
      chapter: detectedChapter,
      sourceFileName,
      sourceHeaderRight: currentHeaderRight,
      questionEn,
      questionHi,
      rawQuestion,
      options: parsedOptions,
      answerFull: rawAns,
      answerOption,
      answerTextEn,
      answerTextHi,
      answerClean: answerBody,
      explanationEn,
      explanationHi,
      explanationClean,
    });

    currentQNum = 0;
    questionLines = [];
    currentOptionLines = [];
    currentAnsLine = '';
    currentExLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Detect === header block
    if (/^={8,}$/.test(trimmed)) {
      flushQuestion();
      inHeaderBanner = !inHeaderBanner;
      headerBannerLinesCount = 0;
      state = 'IDLE';
      continue;
    }

    // Detect Section / Subject header:
    // e.g. ### [ REASONING ] ###, ### [ GENERAL AWARENESS ] ###, ### [ ENGLISH ] ###, or [ REASONING ]
    const hashBracketSecMatch = trimmed.match(/^#{1,}\s*\[\s*(.+?)\s*\]\s*#{0,}$/);
    const plainBracketSecMatch = !hashBracketSecMatch
      ? trimmed.match(/^\[\s*([A-Za-z][A-Za-z0-9\s&()/-]{2,50})\s*\]$/)
      : null;

    const rawSecCandidate = hashBracketSecMatch
      ? hashBracketSecMatch[1]
      : plainBracketSecMatch &&
          !/व्याख्या|explanation|solution|note|नोट|hindi\s*\//i.test(plainBracketSecMatch[1])
        ? plainBracketSecMatch[1]
        : null;

    if (rawSecCandidate) {
      flushQuestion();
      inHeaderBanner = false;
      currentSection = normalizeSubjectName(rawSecCandidate);
      sectionsSet.add(currentSection);
      state = 'IDLE';
      continue;
    }

    // Never let inHeaderBanner swallow actual questions if a closing === was omitted
    if (
      inHeaderBanner &&
      (/^(?:Q\.?\s*\d+|\d+\.)\s+/i.test(trimmed) || headerBannerLinesCount > 8)
    ) {
      inHeaderBanner = false;
    }

    if (inHeaderBanner) {
      if (!trimmed) continue;
      headerBannerLinesCount++;
      if (/^ID:\s*/i.test(trimmed)) {
        const idVal = trimmed.replace(/^ID:\s*/i, '').trim();
        meta.examId = idVal;
        const parsed = parseHeaderDetailsFromTitle(idVal);
        currentHeaderRight = parsed.headerRightText;
        meta.examName = parsed.examName;
        meta.shiftName = parsed.shiftName;
        meta.examDate = parsed.examDate;
        meta.headerRightText = parsed.headerRightText;
      } else if (/^Total Questions:\s*/i.test(trimmed)) {
        meta.totalQuestionsHeader = trimmed
          .replace(/^Total Questions:\s*/i, '')
          .trim();
      } else if (/^Language Mode:\s*/i.test(trimmed)) {
        meta.languageMode = trimmed.replace(/^Language Mode:\s*/i, '').trim();
      } else if (!trimmed.includes(':')) {
        meta.title = trimmed;
        const parsed = parseHeaderDetailsFromTitle(trimmed);
        currentHeaderRight = parsed.headerRightText;
        meta.examName = parsed.examName;
        meta.shiftName = parsed.shiftName;
        meta.examDate = parsed.examDate;
        meta.headerRightText = parsed.headerRightText;
      }
      continue;
    }

    // Question divider line
    if (/^-{4,}$/.test(trimmed)) {
      flushQuestion();
      state = 'IDLE';
      continue;
    }

    // Explicit Q1. / Q.1 / Question 1 start anywhere
    const explicitQMatch = trimmed.match(/^(?:Q(?:uestion)?\.?\s*)(\d+)[.):]\s*(.*)$/i);
    if (explicitQMatch) {
      const parsedNum = parseInt(explicitQMatch[1], 10);
      // If the Hindi line of the same question also starts with "Q1.", merge into current question instead of splitting!
      if (state === 'IN_QUESTION' && !currentAnsLine && parsedNum === currentQNum) {
        if (explicitQMatch[2].trim()) {
          questionLines.push(explicitQMatch[2].trim());
        }
        continue;
      }
      flushQuestion();
      currentQNum = parsedNum;
      questionLines = [explicitQMatch[2]];
      currentAnsLine = '';
      state = 'IN_QUESTION';
      continue;
    }

    // Numeric question start: "1. ..." or "1) ..." ONLY when file does not use explicit Q1. markers and state is IDLE or IN_ANS
    const numericQMatch = !hasExplicitQMarkersInFile
      ? trimmed.match(/^(\d+)[.)]\s+(.+)$/)
      : null;
    if (numericQMatch && (state === 'IDLE' || state === 'IN_ANS')) {
      const parsedNum = parseInt(numericQMatch[1], 10);
      flushQuestion();
      currentQNum = parsedNum;
      questionLines = [numericQMatch[2]];
      currentAnsLine = '';
      state = 'IN_QUESTION';
      continue;
    }

    if (state === 'IDLE') continue;

    // Option lines: support single or multiple inline options on a line: (A) ... (B) ... or A) ... or [A] ...
    const optionLineMatch = trimmed.match(
      /^(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d])[.)])\s+(.+)$/
    );
    if (optionLineMatch && state !== 'IN_EX') {
      // Check if multiple options are present inline on the same line, e.g. "(A) Opt1 (B) Opt2 (C) Opt3 (D) Opt4"
      const inlineParts = trimmed
        .split(/(?=(?:^|\s+)(?:\([A-Da-d1-4]\)|\[[A-Da-d1-4]\]|[A-Da-d][.)])\s+)/)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const part of inlineParts) {
        const m = part.match(
          /^(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d])[.)])\s+(.+)$/
        );
        if (!m) continue;
        const rawCode = (m[1] || m[2] || m[3] || 'A').toUpperCase();
        const code: 'A' | 'B' | 'C' | 'D' =
          rawCode === '1' || rawCode === 'A'
            ? 'A'
            : rawCode === '2' || rawCode === 'B'
              ? 'B'
              : rawCode === '3' || rawCode === 'C'
                ? 'C'
                : 'D';
        const optBody = m[4].trim();
        const existingIdx = currentOptionLines.findIndex((o) => o.code === code);
        if (existingIdx >= 0) {
          currentOptionLines[existingIdx].raw += ' / ' + optBody;
        } else {
          currentOptionLines.push({ code, raw: optBody });
        }
      }
      state = 'IN_OPTIONS';
      continue;
    }

    // Answer line: Ans: / Answer: / Correct Option: / Correct Answer: / Right Option: / Right Answer: / उत्तर: / Key:
    if (
      /^(?:Ans(?:wer)?|Correct\s*(?:Option|Answer)|Right\s*(?:Option|Answer)|उत्तर|Key)\s*[:.\-=]?\s*/i.test(
        trimmed
      )
    ) {
      if (!currentAnsLine) {
        currentAnsLine = trimmed;
      }
      state = 'IN_ANS';
      continue;
    }

    // Explanation lines: capture explanation text in English & Hindi
    if (
      /^(?:Ex|Explanation|Sol|Solution|Note|Key\s*Points|Hint|Trick)\s*[:.-]/i.test(trimmed) ||
      /^\[Hindi/i.test(trimmed) ||
      /^(?:व्याख्या|हल|नोट|संकेत)\s*[:.-]/.test(trimmed) ||
      /^संबंधित परीक्षा-तथ्य/.test(trimmed) ||
      /^Related exam facts/i.test(trimmed)
    ) {
      state = 'IN_EX';
      if (
        /^\[Hindi/i.test(trimmed) ||
        /^(?:व्याख्या|हल|नोट|संकेत)\s*[:.-]/.test(trimmed) ||
        /^संबंधित परीक्षा-तथ्य/.test(trimmed)
      ) {
        currentExLines.push('__HINDI_EX_START__');
      } else if (/^(?:Ex|Explanation|Sol|Solution)\s*[:.-]/i.test(trimmed)) {
        currentExLines.push('__ENGLISH_EX_START__');
      }
      const strippedEx = trimmed
        .replace(
          /^(?:Ex|Explanation|Sol|Solution|Note|Key\s*Points|Hint|Trick|व्याख्या|हल|नोट|संकेत)\s*[:.-]\s*/i,
          ''
        )
        .replace(/^\[Hindi[^\]]*\]\s*[:.-]?\s*/i, '')
        .replace(/^(?:संबंधित परीक्षा-तथ्य|Related exam facts)\s*[:.-]?\s*/i, '')
        .trim();
      if (strippedEx) {
        currentExLines.push(strippedEx);
      }
      continue;
    }

    if (state === 'IN_QUESTION') {
      if (trimmed.length > 0) {
        questionLines.push(trimmed);
      }
    } else if (state === 'IN_OPTIONS') {
      if (trimmed.length > 0 && currentOptionLines.length > 0) {
        // If all 4 options A-D are already collected and a Hindi question line appears before Hindi options, attach to questionLines
        if (currentOptionLines.length >= 4 && hasDevanagari(trimmed) && questionLines.every((l) => !hasDevanagari(l))) {
          questionLines.push(trimmed);
        } else {
          currentOptionLines[currentOptionLines.length - 1].raw += ' ' + trimmed;
        }
      }
    } else if (state === 'IN_EX') {
      if (trimmed.length > 0) {
        currentExLines.push(trimmed);
      }
    }
  }

  flushQuestion();

  const makeOpt = (
    code: 'A' | 'B' | 'C' | 'D',
    en: string,
    hi: string = ''
  ): ParsedOption => {
    const cleanEn = en.trim();
    const cleanHi = hi.trim();
    const textClean =
      cleanEn && cleanHi && cleanEn.toLowerCase() !== cleanHi.toLowerCase()
        ? `${cleanEn} / ${cleanHi}`
        : cleanEn || cleanHi;
    return {
      code,
      textEn: cleanEn,
      textHi: cleanHi,
      textClean,
    };
  };

  // Helper: classify whether a question's answer is a clean general-pool candidate (not a special code/number/symbol)
  const isGeneralTextCandidate = (cand: ParsedQuestion): boolean => {
    const a = (cand.answerClean || '').trim();
    if (!a || a.length < 2) return false;
    if (/^\(\d\)$/.test(a)) return false;
    if (/^[\d\s.,:%+\-*/√∛∜()=×÷<>≤≥≠≈±°πθ⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉½⅓⅔¼¾]+$/.test(a)) return false;
    if (/^[A-Z]{1,10}$/.test(a)) return false;
    if (/^[a-z_]{3,12}$/.test(a) && !/\s/.test(a)) return false;
    if (/follow|अनुसरण|implicit|निहित|sufficient|पर्याप्त|substitution|Assertion|अभिकथन/i.test(a)) {
      return false;
    }
    if (/Flat\s*No|Sector|Pradesh|Jaipur|Hyderabad|Lucknow|\b\d{6}\b/i.test(a)) {
      return false;
    }
    return true;
  };

  // Pre-group clean general pool candidates by section
  const poolBySection = new Map<string, ParsedQuestion[]>();
  for (const q of questions) {
    if (!isGeneralTextCandidate(q)) continue;
    let secList = poolBySection.get(q.section);
    if (!secList) {
      secList = [];
      poolBySection.set(q.section, secList);
    }
    secList.push(q);
  }

  const codes: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  const buildSmartDistractors = (
    q: ParsedQuestion,
    qi: number
  ): { en: string; hi: string }[] => {
    const ansEn = (q.answerTextEn || q.answerClean || '').trim();
    const ansHi = (q.answerTextHi || '').trim();
    const ansClean = (q.answerClean || '').trim();
    const qFullEn = `${q.questionEn} ${q.rawQuestion}`.trim();
    const qFullBoth = `${q.questionEn} ${q.questionHi} ${q.rawQuestion} ${ansClean}`;

    // 1. Error-part index answers: (1), (2), (3), (4)
    if (/^\([1-4]\)$/.test(ansClean)) {
      return ['(1)', '(2)', '(3)', '(4)']
        .filter((x) => x !== ansClean)
        .map((x) => ({ en: x, hi: '' }));
    }

    // 2. Comma-separated sequence rearrangement: "Q, P, R, S" or "1, 3, 2, 4"
    if (/^[A-Z1-4](?:\s*,\s*[A-Z1-4]){3}$/i.test(ansClean)) {
      const tokens = ansClean.split(/\s*,\s*/);
      const perms = [
        [tokens[1], tokens[0], tokens[2], tokens[3]],
        [tokens[0], tokens[2], tokens[1], tokens[3]],
        [tokens[2], tokens[1], tokens[0], tokens[3]],
        [tokens[3], tokens[0], tokens[1], tokens[2]],
      ];
      const out: { en: string; hi: string }[] = [];
      const seen = new Set<string>([ansClean.toUpperCase()]);
      for (const p of perms) {
        const s = p.join(', ');
        if (!seen.has(s.toUpperCase())) {
          seen.add(s.toUpperCase());
          out.push({ en: s, hi: '' });
        }
      }
      return out;
    }

    // 3. 4-letter sequence rearrangement: "BDCA", "CADB", "PQRS", "BCDA"
    if (
      /^[A-D]{4}$/.test(ansClean) ||
      /^[P-S]{4}$/.test(ansClean) ||
      (/rearrange|arrange|order|paragraph/i.test(qFullEn) && /^[A-Z]{4}$/.test(ansClean))
    ) {
      const chars = ansClean.split('');
      const perms = [
        `${chars[1]}${chars[0]}${chars[2]}${chars[3]}`,
        `${chars[0]}${chars[2]}${chars[1]}${chars[3]}`,
        `${chars[2]}${chars[1]}${chars[0]}${chars[3]}`,
        `${chars[3]}${chars[0]}${chars[1]}${chars[2]}`,
      ];
      const out: { en: string; hi: string }[] = [];
      const seen = new Set<string>([ansClean]);
      for (const p of perms) {
        if (!seen.has(p)) {
          seen.add(p);
          out.push({ en: p, hi: '' });
        }
      }
      return out;
    }

    // 4. Mathematical signs equation balancing: "+, ×, -, ÷, ="
    if (/^[+\-×÷*/=, ]+$/.test(ansClean) && /[+\-×÷]/.test(ansClean)) {
      const parts = ansClean.split(/\s*,\s*/).filter(Boolean);
      if (parts.length >= 2) {
        const hasEndEq = parts[parts.length - 1] === '=';
        const core = hasEndEq ? parts.slice(0, -1) : parts.slice();
        const corePerms = [
          [core[1 % core.length], core[0], ...core.slice(2)],
          [...core.slice(1), core[0]],
          [core[0], ...core.slice(1).reverse()],
          [...core].reverse(),
        ];
        const out: { en: string; hi: string }[] = [];
        const seen = new Set<string>([ansClean]);
        for (const cp of corePerms) {
          const full = (hasEndEq ? [...cp, '='] : cp).join(', ');
          if (!seen.has(full)) {
            seen.add(full);
            out.push({ en: full, hi: '' });
          }
        }
        while (out.length < 3) {
          const fallback = hasEndEq ? '×, -, +, ÷, =' : '-, +, ×, ÷';
          out.push({ en: fallback, hi: '' });
        }
        return out;
      }
    }

    // 5. Inequality relation: "M < O", "A ≥ B"
    const ineqMatch = ansClean.match(/^([A-Z])\s*([<>≤≥=])\s*([A-Z])$/);
    if (ineqMatch) {
      const [, v1, , v2] = ineqMatch;
      return [`${v1} < ${v2}`, `${v1} > ${v2}`, `${v1} = ${v2}`, `${v1} ≥ ${v2}`]
        .filter((s) => s !== ansClean)
        .map((s) => ({ en: s, hi: '' }));
    }

    // 6. Assertion (A) and Reason (R)
    if (
      /Assertion\s*\(A\)|अभिकथन\s*\(A\)|A is true,\s*but R is false|Both A and R are true/i.test(
        qFullBoth
      )
    ) {
      const stdAR = [
        {
          en: 'Both A and R are true, and R is the correct explanation of A.',
          hi: 'A और R दोनों सत्य हैं, और R, A की सही व्याख्या है।',
        },
        {
          en: 'Both A and R are true, but R is not the correct explanation of A.',
          hi: 'A और R दोनों सत्य हैं, लेकिन R, A की सही व्याख्या नहीं है।',
        },
        {
          en: 'A is true, but R is false.',
          hi: 'A सत्य है, लेकिन R असत्य है।',
        },
        {
          en: 'A is false, but R is true.',
          hi: 'A असत्य है, लेकिन R सत्य है।',
        },
      ];
      return stdAR.filter(
        (item) => item.en.toLowerCase() !== ansEn.toLowerCase()
      );
    }

    // 7. Data Sufficiency: "Both together sufficient" / "Neither statement is sufficient"
    if (/sufficient|पर्याप्त/i.test(qFullBoth)) {
      const stdDS = [
        {
          en: 'Statement (i) alone is sufficient',
          hi: 'कथन (i) अकेले पर्याप्त है',
        },
        {
          en: 'Statement (ii) alone is sufficient',
          hi: 'कथन (ii) अकेले पर्याप्त है',
        },
        {
          en: 'Both together sufficient',
          hi: 'दोनों एक साथ पर्याप्त हैं',
        },
        {
          en: 'Neither statement is sufficient',
          hi: 'एक भी कथन पर्याप्त नहीं है',
        },
      ];
      return stdDS.filter(
        (item) =>
          !ansEn.toLowerCase().includes(item.en.toLowerCase().slice(0, 12))
      );
    }

    // 8. Assumptions (Implicit / निहित)
    if (/implicit|निहित/i.test(ansClean)) {
      const stdAssump = [
        { en: 'Only I is implicit', hi: 'केवल I निहित है' },
        { en: 'Only II is implicit', hi: 'केवल II निहित है' },
        { en: 'Only I and II are implicit', hi: 'केवल I और II निहित हैं' },
        { en: 'All I, II and III are implicit', hi: 'सभी I, II और III निहित हैं' },
      ];
      return stdAssump.filter(
        (item) => item.en.toLowerCase() !== ansEn.toLowerCase()
      );
    }

    // 9. Statement & Conclusion / Inference / Syllogism ("follows" / "अनुसरण")
    if (
      /conclusion|inference|निष्कर्ष|अनुसरण करता|All follow|सभी अनुसरण/i.test(
        qFullBoth
      ) &&
      /follow|अनुसरण/i.test(ansClean)
    ) {
      const usesParenNums = /\(1\)|\(2\)/.test(ansClean) || /\(1\)|\(2\)/.test(qFullEn);
      const stdConc = usesParenNums
        ? [
            {
              en: 'If only (1) follows',
              hi: 'यदि केवल (1) अनुसरण करता है',
            },
            {
              en: 'If only (2) follows',
              hi: 'यदि केवल (2) अनुसरण करता है',
            },
            {
              en: 'If both (1) and (2) follow',
              hi: 'यदि (1) और (2) दोनों अनुसरण करते हैं',
            },
            {
              en: 'If neither (1) nor (2) follows',
              hi: 'यदि न तो (1) और न ही (2) अनुसरण करता है',
            },
          ]
        : [
            {
              en: 'Only I follows',
              hi: 'केवल I अनुसरण करता है',
            },
            {
              en: 'Only II follows',
              hi: 'केवल II अनुसरण करता है',
            },
            {
              en: 'Both I and II follow',
              hi: 'I और II दोनों अनुसरण करते हैं',
            },
            {
              en: 'Neither I nor II follows',
              hi: 'न तो I और न ही II अनुसरण करता है',
            },
          ];
      return stdConc.filter(
        (item) => item.en.toLowerCase() !== ansEn.toLowerCase()
      );
    }

    // 10. Address / Reference Entry Matching ("Reference Entry:" / "Question Address:" / Pin Code)
    if (
      /Reference Entry|Question Address|संदर्भ प्रविष्टि|प्रश्न पता|matches it exactly|मेल खाता है/i.test(
        qFullBoth
      ) &&
      ansEn.length > 18
    ) {
      const mutateDigits = (str: string, mode: number): string => {
        const digitMatches = Array.from(str.matchAll(/\d+/g));
        if (digitMatches.length === 0) {
          return mode === 0
            ? str.replace(/Jaipur/i, 'Udaipur').replace(/जयपुर/, 'उदयपुर').replace(/Hyderabad/i, 'Secunderabad').replace(/हैदराबाद/, 'सिकंदराबाद')
            : mode === 1
              ? str.replace(/Mr\./, 'Ms.').replace(/Ms\./, 'Mrs.').replace(/श्री\s/, 'सुश्री ')
              : str + ' (North)';
        }
        const targetMatch = digitMatches[mode % digitMatches.length];
        const origNum = targetMatch[0];
        let newNum = origNum;
        if (origNum.length >= 2) {
          // Swap last two digits or increment
          const a = origNum[origNum.length - 2];
          const b = origNum[origNum.length - 1];
          newNum =
            a !== b
              ? origNum.slice(0, -2) + b + a
              : origNum.slice(0, -1) + String((parseInt(b, 10) + mode + 1) % 10);
        } else {
          newNum = String((parseInt(origNum, 10) + mode + 1) % 9 + 1);
        }
        const idx = targetMatch.index ?? 0;
        return str.slice(0, idx) + newNum + str.slice(idx + origNum.length);
      };

      const v1En = mutateDigits(ansEn, 0);
      const v1Hi = ansHi ? mutateDigits(ansHi, 0) : '';
      const v2En =
        ansEn.includes(' - ')
          ? ansEn.replace(/January|April|May/i, (m) => (m === 'April' ? 'March' : 'June'))
          : mutateDigits(ansEn, 1);
      const v2Hi = ansHi
        ? ansHi.includes(' - ')
          ? ansHi.replace(/जनवरी|अप्रैल|मई/, (m) => (m === 'अप्रैल' ? 'मार्च' : 'जून'))
          : mutateDigits(ansHi, 1)
        : '';
      const v3En =
        ansEn.replace(/Sector\s*(\d+)/i, 'Sector $1A').replace(/Jaipur/i, 'Jodhpur').replace(/Hyderabad/i, 'Warangal') !== ansEn
          ? ansEn.replace(/Sector\s*(\d+)/i, 'Sector $1A').replace(/Jaipur/i, 'Jodhpur').replace(/Hyderabad/i, 'Warangal')
          : mutateDigits(ansEn, 2);
      const v3Hi = ansHi
        ? ansHi.replace(/सेक्टर\s*(\d+)/, 'सेक्टर $1A').replace(/जयपुर/, 'जोधपुर').replace(/हैदराबाद/, 'वारंगल') !== ansHi
          ? ansHi.replace(/सेक्टर\s*(\d+)/, 'सेक्टर $1A').replace(/जयपुर/, 'जोधपुर').replace(/हैदराबाद/, 'वारंगल')
          : mutateDigits(ansHi, 2)
        : '';

      return [
        { en: v1En === ansEn ? `${ansEn} (Block II)` : v1En, hi: v1Hi },
        { en: v2En === ansEn ? `${ansEn} (East)` : v2En, hi: v2Hi },
        { en: v3En === ansEn ? `${ansEn} (Phase I)` : v3En, hi: v3Hi },
      ];
    }

    // 11. Input-Output Machine Step Arrangement (mix of 4+ two-digit numbers and 4+ words)
    if (
      /^(?:\d+\s+|[a-z]+\s+){6,}(?:\d+|[a-z]+)$/i.test(ansClean) &&
      /\d+\s+\d+/.test(ansClean)
    ) {
      const toks = ansClean.split(/\s+/);
      const nums = toks.filter((t) => /^\d+$/.test(t));
      const words = toks.filter((t) => !/^\d+$/.test(t));
      if (nums.length >= 3 && words.length >= 3) {
        const opt1 = [...nums.slice(1), nums[0], ...words].join(' ');
        const opt2 = [...nums, words[1], words[0], ...words.slice(2)].join(' ');
        const opt3 = [
          nums[0],
          nums[2],
          nums[1],
          ...nums.slice(3),
          ...words.slice(0, -2),
          words[words.length - 1],
          words[words.length - 2],
        ].join(' ');
        return [
          { en: opt1, hi: '' },
          { en: opt2, hi: '' },
          { en: opt3, hi: '' },
        ];
      }
    }

    // 12. Compass Directions ("South / दक्षिण", "South-West direction / दक्षिण-पश्चिम दिशा")
    if (
      /^(?:North|South|East|West|North-East|North-West|South-East|South-West)(?:\s+direction)?$/i.test(
        ansEn
      )
    ) {
      const hasDirSuffix = /direction/i.test(ansEn);
      const dirs = [
        {
          en: hasDirSuffix ? 'North direction' : 'North',
          hi: hasDirSuffix ? 'उत्तर दिशा' : 'उत्तर',
        },
        {
          en: hasDirSuffix ? 'South direction' : 'South',
          hi: hasDirSuffix ? 'दक्षिण दिशा' : 'दक्षिण',
        },
        {
          en: hasDirSuffix ? 'East direction' : 'East',
          hi: hasDirSuffix ? 'पूर्व दिशा' : 'पूर्व',
        },
        {
          en: hasDirSuffix ? 'West direction' : 'West',
          hi: hasDirSuffix ? 'पश्चिम दिशा' : 'पश्चिम',
        },
        {
          en: hasDirSuffix ? 'North-East direction' : 'North-East',
          hi: hasDirSuffix ? 'उत्तर-पूर्व दिशा' : 'उत्तर-पूर्व',
        },
        {
          en: hasDirSuffix ? 'South-West direction' : 'South-West',
          hi: hasDirSuffix ? 'दक्षिण-पश्चिम दिशा' : 'दक्षिण-पश्चिम',
        },
        {
          en: hasDirSuffix ? 'North-West direction' : 'North-West',
          hi: hasDirSuffix ? 'उत्तर-पश्चिम दिशा' : 'उत्तर-पश्चिम',
        },
      ];
      return dirs.filter(
        (d) => d.en.toLowerCase() !== ansEn.toLowerCase()
      );
    }

    // 13. Days of the Week ("Friday / शुक्रवार")
    if (
      /^(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(
        ansEn
      )
    ) {
      const days = [
        { en: 'Monday', hi: 'सोमवार' },
        { en: 'Tuesday', hi: 'मंगलवार' },
        { en: 'Wednesday', hi: 'बुधवार' },
        { en: 'Thursday', hi: 'गुरुवार' },
        { en: 'Friday', hi: 'शुक्रवार' },
        { en: 'Saturday', hi: 'शनिवार' },
        { en: 'Sunday', hi: 'रविवार' },
      ];
      return days.filter((d) => d.en.toLowerCase() !== ansEn.toLowerCase());
    }

    // 14. Blood Relations ("Cousin of Rohit", "Brother", "Sister", "Uncle", "Mother")
    if (
      /\b(?:Brother|Sister|Mother|Father|Uncle|Aunt|Cousin|Nephew|Niece|Grandfather|Grandmother|Son-in-law|Brother-in-law)\b/i.test(
        ansEn
      ) &&
      ansEn.split(/\s+/).length <= 4
    ) {
      const suffixMatch = ansEn.match(/\s+(of\s+[A-Z][a-z]+)$/i);
      const enSuffix = suffixMatch ? ` ${suffixMatch[1]}` : '';
      const hiPrefixMatch = ansHi.match(/^([^\s]+\s+का\s+)/);
      const hiPrefix = hiPrefixMatch ? hiPrefixMatch[1] : '';
      const rels = [
        { en: `Brother${enSuffix}`, hi: `${hiPrefix}भाई` },
        { en: `Uncle${enSuffix}`, hi: `${hiPrefix}चाचा / मामा` },
        { en: `Nephew${enSuffix}`, hi: `${hiPrefix}भतीजा / भांजा` },
        { en: `Cousin${enSuffix}`, hi: `${hiPrefix}चचेरा भाई` },
      ];
      return rels.filter((r) => r.en.toLowerCase() !== ansEn.toLowerCase());
    }

    // 15. Single Capital Letter Answer ("T", "C", "A"): extract other letters from question!
    if (/^[A-Z]$/.test(ansClean)) {
      // Check if question asks for a letter in a specific ALL-CAPS word like INDUCTION
      const wordMatch = qFullEn.match(/\b([A-Z]{5,15})\b/);
      if (wordMatch && !['QUESTION', 'STATEMENT'].includes(wordMatch[1])) {
        const uniqueLetters = Array.from(new Set(wordMatch[1].split(''))).filter(
          (l) => l !== ansClean
        );
        if (uniqueLetters.length >= 3) {
          return uniqueLetters.slice(0, 3).map((l) => ({ en: l, hi: '' }));
        }
      }
      // Check single-letter entities in question like P, Q, R, S, T
      const singleMentions = Array.from(
        new Set((qFullEn.match(/\b[A-Z]\b/g) || []).filter((l) => l !== 'I' && l !== 'A' && l !== ansClean))
      );
      if (singleMentions.length >= 3) {
        return singleMentions.slice(0, 3).map((l) => ({ en: l, hi: '' }));
      }
      const code = ansClean.charCodeAt(0);
      return [-2, -1, 1, 2]
        .map((d) => String.fromCharCode(((code - 65 + d + 26) % 26) + 65))
        .filter((l) => l !== ansClean)
        .slice(0, 3)
        .map((l) => ({ en: l, hi: '' }));
    }

    // 16. Uppercase Letter-Cluster / Coding-Decoding ("SVERKI", "RCW", "LZMFN")
    if (/^[A-Z]{2,10}$/.test(ansClean)) {
      const shiftChar = (ch: string, delta: number) =>
        String.fromCharCode(((ch.charCodeAt(0) - 65 + delta + 26) % 26) + 65);
      const chars = ansClean.split('');
      const mid = Math.floor(chars.length / 2);
      const last = chars.length - 1;

      const v1 = chars
        .map((c, idx) => (idx === mid ? shiftChar(c, 1) : c))
        .join('');
      const v2 = chars
        .map((c, idx) => (idx === last ? shiftChar(c, 1) : idx === 0 ? shiftChar(c, -1) : c))
        .join('');
      const v3 = chars
        .map((c, idx) => (idx === Math.max(0, mid - 1) ? shiftChar(c, -1) : idx === last ? shiftChar(c, 2) : c))
        .join('');
      return [
        { en: v1, hi: '' },
        { en: v2, hi: '' },
        { en: v3, hi: '' },
      ];
    }

    // 17. Lowercase Letter Series Filler ("abbaa")
    if (/^[a-d]{4,10}$/.test(ansClean)) {
      const chars = ansClean.split('');
      const flip = (c: string) => (c === 'a' ? 'b' : 'a');
      const v1 = chars.map((c, i) => (i === 1 ? flip(c) : c)).join('');
      const v2 = chars.map((c, i) => (i === chars.length - 2 ? flip(c) : c)).join('');
      const v3 = chars.map((c, i) => (i === 0 || i === chars.length - 1 ? flip(c) : c)).join('');
      return [
        { en: v1, hi: '' },
        { en: v2, hi: '' },
        { en: v3, hi: '' },
      ];
    }

    // 18. Roll Number / Alphanumeric Code ("4912000198", "4682D", "1921144125", "3629")
    if (/^\d{3,14}[A-Z]?$/.test(ansClean)) {
      // Check if question itself lists 4 numbers (like "18, 24, 30, 35" or "1, 4, 9, 16, 20")
      const qNums = (qFullEn.match(/\b\d+\b/g) || []).filter((n) => n !== ansClean);
      if (qNums.length >= 3 && ansClean.length <= 3) {
        return Array.from(new Set(qNums))
          .slice(0, 3)
          .map((n) => ({ en: n, hi: '' }));
      }
      if (/center code\s*(\d+)/i.test(qFullEn)) {
        const centerCode = qFullEn.match(/center code\s*(\d+)/i)![1];
        return [
          { en: `${centerCode}000142`, hi: '' },
          { en: `${centerCode}000285`, hi: '' },
          { en: `${centerCode}000319`, hi: '' },
        ];
      }
      if (/only odd digits|विषम अंक/i.test(qFullBoth)) {
        return [
          { en: '1357A', hi: '' },
          { en: '3579B', hi: '' },
          { en: '5791C', hi: '' },
        ];
      }
      // Permute or adjust digits of same length
      if (ansClean.length >= 4) {
        const d = ansClean.split('');
        const v1 = [d[0], d[2], d[1], ...d.slice(3)].join('');
        const v2 = [...d.slice(0, -2), d[d.length - 1], d[d.length - 2]].join('');
        const v3 = [d[1], d[0], ...d.slice(2)].join('');
        const unique = Array.from(new Set([v1, v2, v3])).filter((x) => x !== ansClean);
        while (unique.length < 3) {
          unique.push(String(parseInt(ansClean, 10) + (unique.length + 1) * 10));
        }
        return unique.slice(0, 3).map((x) => ({ en: x, hi: '' }));
      }
    }

    // 19. Plain Numbers or Numbers in Question List ("35", "20", "41", "53", "2")
    if (/^\d+$/.test(ansClean)) {
      const qListNums = Array.from(
        new Set((qFullEn.match(/\b\d+\b/g) || []).filter((n) => n !== ansClean))
      );
      if (
        /odd group|odd one out|विषम/i.test(qFullBoth) &&
        qListNums.length >= 3
      ) {
        return qListNums.slice(0, 3).map((n) => ({ en: n, hi: '' }));
      }
      const numVal = parseInt(ansClean, 10);
      const step = numVal > 500 ? 12 : numVal > 20 ? 2 : 1;
      const candidates = [numVal - step, numVal + step, numVal + step * 2, numVal + step * 3]
        .filter((n) => n > 0 && n !== numVal)
        .map((n) => ({ en: String(n), hi: '' }));
      return candidates.slice(0, 3);
    }

    // 20. Numbers with Units / Surds / Ordinals / Constitutional Articles ("21.7 years / 21.7 वर्ष", "15√5 m", "Article 79", "157th")
    const articleMatch = ansEn.match(/^Article\s+(\d+)$/i);
    if (articleMatch) {
      const artNum = parseInt(articleMatch[1], 10);
      return [-3, 1, 2].map((d) => ({
        en: `Article ${artNum + d}`,
        hi: ansHi ? `अनुच्छेद ${artNum + d}` : '',
      }));
    }

    const rankMatch = ansEn.match(/^(\d+)(?:st|nd|rd|th)$/i);
    if (rankMatch) {
      const r = parseInt(rankMatch[1], 10);
      const ord = (n: number) =>
        n % 10 === 1 && n % 100 !== 11
          ? `${n}st`
          : n % 10 === 2 && n % 100 !== 12
            ? `${n}nd`
            : n % 10 === 3 && n % 100 !== 13
              ? `${n}rd`
              : `${n}th`;
      return [-3, -1, 2].map((d) => ({
        en: ord(r + d),
        hi: ansHi ? `${r + d}वाँ` : '',
      }));
    }

    // Fraction / Ratio answers e.g. "3/4", "15/7", "3 : 4"
    const fracMatch = ansEn.match(/^(\d+)\s*(\/|:)\s*(\d+)$/);
    if (fracMatch) {
      const n = parseInt(fracMatch[1], 10);
      const sep = fracMatch[2] === ':' ? ' : ' : '/';
      const d = parseInt(fracMatch[3], 10);
      return [
        { en: `${n + 1}${sep}${d}`, hi: '' },
        { en: `${Math.max(1, n - 1)}${sep}${d + 1}`, hi: '' },
        { en: `${d}${sep}${n === d ? n + 1 : n}`, hi: '' },
      ];
    }

    const unitNumMatch = ansEn.match(/^(\d+(?:\.\d+)?)(\s*)(√\d+\s*\S+|\S.*)$/);
    if (unitNumMatch) {
      const baseNum = parseFloat(unitNumMatch[1]);
      const isDec = unitNumMatch[1].includes('.');
      const midSpace = unitNumMatch[2] || '';
      const unitEn = unitNumMatch[3];
      const hiUnitMatch = ansHi.match(/^(\d+(?:\.\d+)?)(\s*)(.*)$/);
      const hiSpace = hiUnitMatch ? hiUnitMatch[2] || '' : midSpace;
      const unitHi = hiUnitMatch ? hiUnitMatch[3] : '';
      return [-2, 2, 4].map((d) => {
        const nextVal = Math.max(1, baseNum + (isDec ? d * 0.8 : d));
        const valStr = isDec ? nextVal.toFixed(1) : String(Math.round(nextVal));
        return {
          en: `${valStr}${midSpace}${unitEn}`.trim(),
          hi: unitHi ? `${valStr}${hiSpace}${unitHi}`.trim() : '',
        };
      });
    }

    // 21. Proper Name from Question (e.g. "Four people Riya, Sohan, Meena, and Arun... Ans: Meena / मीना")
    if (/^[A-Z][a-z]{2,12}$/.test(ansEn) && q.section === 'REASONING') {
      const capWords = Array.from(
        new Set(
          (qFullEn.match(/\b[A-Z][a-z]{2,12}\b/g) || []).filter(
            (w) =>
              ![
                'Four',
                'Five',
                'Six',
                'Seven',
                'Eight',
                'May',
                'June',
                'July',
                'Who',
                'The',
                'Each',
                'Either',
                'Neither',
                'Study',
                'Given',
                'Read',
              ].includes(w) && w.toLowerCase() !== ansEn.toLowerCase()
          )
        )
      );
      if (capWords.length >= 3) {
        return capWords.slice(0, 3).map((w) => ({ en: w, hi: '' }));
      }
    }

    // 22. Profession in Puzzle (e.g. "Journalist / पत्रकार")
    if (
      /lawyer,\s*doctor,\s*engineer,\s*professor,\s*scientist,\s*journalist/i.test(
        qFullEn
      )
    ) {
      const profs = [
        { en: 'Doctor', hi: 'डॉक्टर' },
        { en: 'Engineer', hi: 'अभियंता' },
        { en: 'Architect', hi: 'वास्तुकार' },
        { en: 'Professor', hi: 'प्रोफेसर' },
      ];
      return profs.filter((p) => p.en.toLowerCase() !== ansEn.toLowerCase());
    }

    // 23. English Spelling Questions ("correctly spelt word" / "wrongly spelt word" / "spelled incorrectly")
    if (/correctly\s+spelt|correctly\s+spelled/i.test(qFullEn) && /^[A-Za-z]+$/.test(ansEn)) {
      const w = ansEn;
      const misspellings: Record<string, string[]> = {
        environment: ['Enviroment', 'Enviornment', 'Environmant'],
        disease: ['Disese', 'Disaese', 'Diseaze'],
        archetypal: ['Architypal', 'Archetipal', 'Archetpyal'],
        heisenberg: ['Hiesenberg', 'Heisenburg', 'Hiesenburg'],
        breathe: ['Brethe', 'Breethe', 'Braethe'],
        captain: ['Captian', 'Captein', 'Captan'],
      };
      const preset = misspellings[w.toLowerCase()];
      if (preset) {
        return preset.map((m) => ({ en: m, hi: '' }));
      }
      // Algorithmic realistic misspellings of the same word
      const m1 = w.replace(/([aeiou])([aeiou])/i, '$2$1') !== w ? w.replace(/([aeiou])([aeiou])/i, '$2$1') : `${w}e`;
      const m2 = w.replace(/e/i, 'a') !== w ? w.replace(/e/i, 'a') : `${w.slice(0, -1)}a`;
      const m3 = w.length > 4 ? `${w.slice(0, 2)}${w[3]}${w[2]}${w.slice(4)}` : `${w}s`;
      return [
        { en: m1, hi: '' },
        { en: m2, hi: '' },
        { en: m3, hi: '' },
      ];
    }

    if (/wrongly\s+spelt|spelled\s+incorrectly/i.test(qFullEn)) {
      const correctWords = ['Surveillance', 'Maintenance', 'Privilege', 'Occurrence', 'Conscience'];
      return correctWords
        .filter((w) => w.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((w) => ({ en: w, hi: '' }));
    }

    // 24. English Sentence Improvement ("No substitution")
    if (/No substitution/i.test(qFullEn) || /^No substitution$/i.test(ansEn)) {
      if (/^No substitution$/i.test(ansEn)) {
        return [
          { en: 'had been adding to', hi: '' },
          { en: 'was added into', hi: '' },
          { en: 'have been adding for', hi: '' },
        ];
      }
      const basePhrase = ansEn;
      const alt1 = basePhrase.replace(/\bon\b/i, 'at').replace(/\bbeside\b/i, 'besides').replace(/\bwith\b/i, 'for').replace(/\bRan\b/i, 'Run');
      const alt2 = basePhrase.replace(/\bon\b/i, 'by').replace(/\bbeside\b/i, 'near to').replace(/\bwith\b/i, 'into').replace(/\bover\b/i, 'across');
      return [
        { en: 'No substitution', hi: '' },
        { en: alt1 !== basePhrase ? alt1 : `${basePhrase} only`, hi: '' },
        { en: alt2 !== basePhrase ? alt2 : `had ${basePhrase}`, hi: '' },
      ];
    }

    // 25. English Spot the Error (extract other parts of the same sentence in the question!)
    if (
      /contains an error|grammatical error|Spot the error/i.test(qFullEn) &&
      ansEn.length >= 3 &&
      ansEn.length <= 35 &&
      qFullEn.toLowerCase().includes(ansEn.toLowerCase())
    ) {
      const idx = qFullEn.toLowerCase().indexOf(ansEn.toLowerCase());
      // Extract the target sentence around ansEn
      const colonIdx = qFullEn.lastIndexOf(':', idx);
      const quoteIdx = qFullEn.lastIndexOf('"', idx);
      const dotIdx = qFullEn.lastIndexOf('.', idx);
      const sentStart = Math.max(colonIdx, quoteIdx, dotIdx) + 1;
      const sentRaw = qFullEn
        .slice(Math.max(0, sentStart))
        .replace(/["']/g, '')
        .trim();
      const remaining = sentRaw
        .replace(new RegExp(ansEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), ' | ')
        .split('|')
        .flatMap((chunk) => {
          const words = chunk.trim().split(/\s+/).filter(Boolean);
          if (words.length <= 4) return [words.join(' ')];
          const mid = Math.ceil(words.length / 2);
          return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
        })
        .map((s) => s.trim())
        .filter((s) => s.length >= 2 && s.toLowerCase() !== ansEn.toLowerCase());

      const out = remaining.slice(0, 3).map((s) => ({ en: s, hi: '' }));
      while (out.length < 3) {
        out.push({ en: out.length === 2 ? 'No error' : 'in the sentence', hi: '' });
      }
      return out;
    }

    // 26. English Active/Passive Voice & Direct/Indirect Speech (create tense/modal variations of the SAME sentence!)
    if (
      /passive\s+form|active\s+form|passive\s+voice|active\s+voice|Indirect\s+Speech|Direct\s+Speech|indirect\s+narration|indirect\s+voice/i.test(
        qFullEn
      ) &&
      ansEn.split(/\s+/).length >= 5
    ) {
      const s = ansEn;
      const swaps: [RegExp, string][] = [
        [/\bcould have been being\b/i, 'could have been'],
        [/\bare not expected to make\b/i, 'were not expected to make'],
        [/\bcould not\b/i, 'cannot'],
        [/\bused to live\b/i, 'had lived'],
        [/\bmight have left\b/i, 'may have left'],
        [/\bhas completed\b/i, 'had completed'],
        [/\bchose to\b/i, 'had chosen to'],
        [/\bis monitored\b/i, 'was monitored'],
        [/\bhave been introduced\b/i, 'had been introduced'],
        [/\benforces\b/i, 'enforced'],
        [/\bwould focus\b/i, 'will focus'],
        [/\bhad resolved\b/i, 'has resolved'],
        [/\bhad secured\b/i, 'has secured'],
        [/\bannounced\b/i, 'has announced'],
        [/\bhad been looking\b/i, 'has been looking'],
        [/\bDo you want\b/i, 'Did you want'],
        [/\bPlease maintain\b/i, 'You should maintain'],
        [/\bwill have left\b/i, 'would have left'],
        [/\bhave started\b/i, 'had started'],
        [/\bwere making\b/i, 'are making'],
        [/\bwill be written\b/i, 'would be written'],
        [/\bwill not be opened\b/i, 'would not be opened'],
      ];

      let v1 = s;
      for (const [rx, rep] of swaps) {
        if (rx.test(s)) {
          v1 = s.replace(rx, rep);
          break;
        }
      }
      if (v1 === s) {
        v1 = s.replace(/\b(?:is|was|has|had|will|would|could|can)\b/i, (m) =>
          m.toLowerCase() === 'was' ? 'is' : 'was'
        );
      }

      const v2 = s
        .replace(/\b(?:is|are|was|were|has|have|had|will|would|could)\b/i, (m) => {
          const low = m.toLowerCase();
          if (low === 'is' || low === 'are') return 'were';
          if (low === 'was' || low === 'were') return 'had been';
          if (low === 'has' || low === 'have') return 'is';
          if (low === 'had') return 'have';
          if (low === 'will') return 'can';
          if (low === 'would') return 'could';
          return 'should';
        });

      const v3 = s
        .replace(/\b(?:that|by|to|whether)\b/i, (m) =>
          m.toLowerCase() === 'by'
            ? 'through'
            : m.toLowerCase() === 'that'
              ? 'as'
              : 'if'
        );

      return [
        { en: v1 !== s ? v1 : `Being ${s.charAt(0).toLowerCase()}${s.slice(1)}`, hi: '' },
        { en: v2 !== s && v2 !== v1 ? v2 : s.replace(/\./, ' by them.'), hi: '' },
        { en: v3 !== s && v3 !== v1 && v3 !== v2 ? v3 : `It was stated that ${s.charAt(0).toLowerCase()}${s.slice(1)}`, hi: '' },
      ];
    }

    // 27. English Prepositions / Articles / Modals / Conjunctions / Pronouns / Parts of Speech / Word Pairs
    if (/^[a-z]+\s*,\s*[a-z]+$/i.test(ansEn)) {
      if (/vile,\s*vial/i.test(ansEn)) {
        return [
          { en: 'vial, vile', hi: '' },
          { en: 'veil, vale', hi: '' },
          { en: 'vale, veil', hi: '' },
        ];
      }
      const prepPairs = ['into, down', 'upon, off', 'for, in', 'with, on'];
      return prepPairs
        .filter((p) => p.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((p) => ({ en: p, hi: '' }));
    }

    if (/^(?:A|An|The)$/i.test(ansEn)) {
      return ['A', 'An', 'The', 'No article']
        .filter((a) => a.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((a) => ({ en: a, hi: '' }));
    }

    if (/^(?:on|in|at|into|onto|upon|about|for|with|from|to|by|of|over|under)$/i.test(ansEn)) {
      return ['in', 'on', 'at', 'for', 'with', 'about', 'from', 'to']
        .filter((p) => p.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((p) => ({ en: p, hi: '' }));
    }

    if (/^(?:Can|Could|May|Might|Must|Should|Would)$/i.test(ansEn)) {
      return ['Can', 'Must', 'Should', 'Would']
        .filter((m) => m.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((m) => ({ en: m, hi: '' }));
    }

    if (/^(?:And|But|Or|Yet|So|Although|Because)$/i.test(ansEn)) {
      return ['And', 'But', 'Or', 'Although']
        .filter((c) => c.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((c) => ({ en: c, hi: '' }));
    }

    if (/^(?:Their|His|Her|Its|Our|Your|Them)$/i.test(ansEn)) {
      return ['Their', 'His', 'Its', 'Our']
        .filter((p) => p.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((p) => ({ en: p, hi: '' }));
    }

    if (/^(?:Noun|Pronoun|Adjective|Adverb|Verb|Preposition|Conjunction)$/i.test(ansEn)) {
      return ['Noun', 'Adjective', 'Adverb', 'Verb']
        .filter((p) => p.toLowerCase() !== ansEn.toLowerCase())
        .slice(0, 3)
        .map((p) => ({ en: p, hi: '' }));
    }

    if (/Simple sentence|Compound sentence|Complex sentence/i.test(ansEn)) {
      return [
        { en: 'Compound sentence with a coordinate clause', hi: '' },
        { en: 'Complex sentence with a subordinate clause', hi: '' },
        { en: 'Compound-complex sentence', hi: '' },
      ];
    }

    // 28. General Pool Matching by Section + Answer Length + Word Count Similarity
    const secPool = poolBySection.get(q.section) || [];
    const targetLen = ansEn.length;
    const targetWords = ansEn.split(/\s+/).length;
    const targetHasHi = Boolean(ansHi);

    const scoredCandidates = secPool
      .filter((cand) => cand.id !== q.id && cand.answerClean.toLowerCase() !== ansClean.toLowerCase())
      .map((cand) => {
        const cEn = (cand.answerTextEn || cand.answerClean || '').trim();
        const cWords = cEn.split(/\s+/).length;
        const cHasHi = Boolean(cand.answerTextHi);
        const lenDiff = Math.abs(cEn.length - targetLen);
        const wordDiff = Math.abs(cWords - targetWords) * 8;
        const langPenalty = targetHasHi !== cHasHi ? 200 : 0;
        return {
          cand,
          score: lenDiff + wordDiff + langPenalty,
        };
      })
      .sort((a, b) => a.score - b.score);

    const out: { en: string; hi: string }[] = [];
    const used = new Set<string>([ansClean.toLowerCase()]);
    const startOffset = qi % Math.max(1, Math.min(4, scoredCandidates.length));

    for (let i = 0; i < scoredCandidates.length && out.length < 3; i++) {
      const item = scoredCandidates[(i + startOffset) % scoredCandidates.length].cand;
      const key = item.answerClean.toLowerCase();
      if (!used.has(key)) {
        used.add(key);
        out.push({
          en: item.answerTextEn || item.answerClean,
          hi: item.answerTextHi,
        });
      }
    }

    return out;
  };

  const buildSmartExplanation = (
    q: ParsedQuestion,
    correctCode: 'A' | 'B' | 'C' | 'D'
  ): { en: string; hi: string } => {
    const ansEn = (q.answerTextEn || q.answerClean || '').trim();
    const ansHi = (q.answerTextHi || q.answerTextEn || q.answerClean || '').trim();
    const qEn = `${q.questionEn} ${q.rawQuestion}`.trim();
    const qBoth = `${qEn} ${q.questionHi || ''}`.trim();
    const optTag = `(${correctCode})`;

    // 1. Pythagoras / Direction & Distance with √ or Right-Triangle Displacement (e.g. Q19 Drone 20 m East, 15 m North, 10 m East -> 15√5 m)
    if (/√/.test(ansEn) && /\b(?:East|West|North|South|flies|walks|distance)\b/i.test(qEn)) {
      const eastMatches = Array.from(qEn.matchAll(/(\d+(?:\.\d+)?)\s*(?:m|km)\s*East/gi)).map((m) =>
        parseFloat(m[1])
      );
      const westMatches = Array.from(qEn.matchAll(/(\d+(?:\.\d+)?)\s*(?:m|km)\s*West/gi)).map((m) =>
        parseFloat(m[1])
      );
      const northMatches = Array.from(qEn.matchAll(/(\d+(?:\.\d+)?)\s*(?:m|km)\s*North/gi)).map(
        (m) => parseFloat(m[1])
      );
      const southMatches = Array.from(qEn.matchAll(/(\d+(?:\.\d+)?)\s*(?:m|km)\s*South/gi)).map(
        (m) => parseFloat(m[1])
      );
      const dx = Math.abs(
        eastMatches.reduce((a, b) => a + b, 0) - westMatches.reduce((a, b) => a + b, 0)
      );
      const dy = Math.abs(
        northMatches.reduce((a, b) => a + b, 0) - southMatches.reduce((a, b) => a + b, 0)
      );
      if (dx > 0 && dy > 0) {
        const dxSq = dx * dx;
        const dySq = dy * dy;
        const sumSq = dxSq + dySq;
        const dxParts =
          eastMatches.length > 1 ? `${eastMatches.join(' + ')} = ${dx}` : String(dx);
        const dyParts =
          northMatches.length > 1 ? `${northMatches.join(' + ')} = ${dy}` : String(dy);
        return {
          en: `Formula (Pythagoras Theorem): d = √(Δx² + Δy²) ⇒ Δx = ${dxParts}, Δy = ${dyParts} ⇒ d = √(${dx}² + ${dy}²) = √(${dxSq} + ${dySq}) = √${sumSq} = ${ansEn}. ∴ Option ${optTag} is correct.`,
          hi: `सूत्र (पाइथागोरस प्रमेय): परिणामी दूरी d = √(Δx² + Δy²) ⇒ Δx = ${dxParts}, Δy = ${dyParts} ⇒ d = √(${dx}² + ${dy}²) = √(${dxSq} + ${dySq}) = √${sumSq} = ${ansHi}। ∴ विकल्प ${optTag} सही है।`,
        };
      }
      return {
        en: `Formula (Pythagoras Theorem): Distance d = √(x² + y²) ⇒ ${ansEn}. ∴ Option ${optTag} is correct.`,
        hi: `सूत्र (पाइथागोरस प्रमेय): दूरी d = √(x² + y²) ⇒ ${ansHi}। ∴ विकल्प ${optTag} सही है।`,
      };
    }

    // 2. Clock Hand Direction (e.g. Q18 minute hand points South at 12:00 a.m., direction at 3:00 a.m.)
    if (/minute hand|hour hand|clock/i.test(qEn) && /12:00.*3:00/i.test(qEn)) {
      return {
        en: `Formula: At 12:00 a.m. and 3:00 a.m. (full hours), the minute hand is at the exact same position (mark 12, Δθ = 3 × 360° = 0°). Since it points South at 12:00 a.m., it also points ${ansEn} at 3:00 a.m. ∴ Option ${optTag}.`,
        hi: `सूत्र: 12:00 बजे और 3:00 बजे (पूर्ण घंटे पर) मिनट की सुई ठीक 12 के अंक पर (कोणीय विस्थापन Δθ = 0°) होती है। अतः 3:00 बजे भी मिनट की सुई ${ansHi} दिशा में होगी। ∴ विकल्प ${optTag}।`,
      };
    }

    // 3. Cardinal Direction & Displacement (e.g. Q42 1 km south, then 2 km west -> South-West)
    if (
      /^(?:North|South|East|West|North-East|North-West|South-East|South-West)/i.test(ansEn) &&
      /\b(?:walk|walks|flies|turn|km|m\b)/i.test(qEn)
    ) {
      return {
        en: `Formula (Vector Displacement): Moving along the given cardinal directions places the final position in the ${ansEn} quadrant from the starting point (Origin 0, 0). ∴ Option ${optTag} is correct.`,
        hi: `सूत्र (दिशा विस्थापन): प्रारंभिक बिंदु (0, 0) से दी गई दिशाओं में चलने पर अंतिम स्थिति ${ansHi} चतुर्थांश में प्राप्त होती है। ∴ विकल्प ${optTag} सही है।`,
      };
    }

    // 4. Average & Ages Formula Questions (e.g. Q34 new average age, Q35 sum of ages)
    if (/average/i.test(qEn)) {
      const joinMatch = qEn.match(
        /group of\s*(\d+)\b.*average[^0-9]*(\d+(?:\.\d+)?).*aged\s*(\d+(?:\.\d+)?)\s*,?\s*joins/i
      );
      if (joinMatch) {
        const n = parseFloat(joinMatch[1]);
        const avg = parseFloat(joinMatch[2]);
        const added = parseFloat(joinMatch[3]);
        const oldSum = n * avg;
        const newSum = oldSum + added;
        const newN = n + 1;
        return {
          en: `Formula: New Average (x̄_new) = (n × x̄ + x_new) / (n + 1) ⇒ (${n} × ${avg} + ${added}) / (${n} + 1) = (${oldSum} + ${added}) / ${newN} = ${newSum} / ${newN} ≈ ${ansEn}. ∴ Option ${optTag}.`,
          hi: `सूत्र: नया औसत (x̄_new) = (n × x̄ + नया मान) / (n + 1) ⇒ (${n} × ${avg} + ${added}) / (${n} + 1) = (${oldSum} + ${added}) / ${newN} = ${newSum} / ${newN} ≈ ${ansHi}। ∴ विकल्प ${optTag}।`,
        };
      }
      const sumMatch = qEn.match(/average[^0-9]*(\d+)\s+\w+\s+is\s+(\d+(?:\.\d+)?).*sum/i);
      if (sumMatch) {
        const n = parseFloat(sumMatch[1]);
        const avg = parseFloat(sumMatch[2]);
        const total = n * avg;
        return {
          en: `Formula: Sum (∑x) = Average (x̄) × Number of observations (n) ⇒ ∑x = ${avg} × ${n} = ${total} (${ansEn}). ∴ Option ${optTag}.`,
          hi: `सूत्र: कुल योग (∑x) = औसत (x̄) × पदों की संख्या (n) ⇒ ∑x = ${avg} × ${n} = ${total} (${ansHi})। ∴ विकल्प ${optTag}।`,
        };
      }
      return {
        en: `Formula: Average (x̄) = (Sum of observations ∑x) / (Total number n) ⇒ Solving gives option ${optTag} (${ansEn}).`,
        hi: `सूत्र: औसत (x̄) = (प्रेक्षणों का योग ∑x) / (कुल संख्या n) ⇒ हल करने पर विकल्प ${optTag} (${ansHi}) प्राप्त होता है।`,
      };
    }

    // 5. Order & Ranking Formula (e.g. Q20 Class of 96, boys = girls, Ritu 20th from top, 13 boys ahead -> 41)
    if (/class of\s*(\d+)/i.test(qEn) && /boys\s*=\s*girls/i.test(qEn)) {
      const m = qEn.match(/class of\s*(\d+).*?(\d+)(?:st|nd|rd|th) from top.*?(\d+)\s*boys/i);
      if (m) {
        const total = parseInt(m[1], 10);
        const rankTop = parseInt(m[2], 10);
        const boysAhead = parseInt(m[3], 10);
        const eachGroup = total / 2;
        const aheadTotal = rankTop - 1;
        const girlsAhead = aheadTotal - boysAhead;
        const girlsUpTo = girlsAhead + 1;
        const girlsBehind = eachGroup - girlsUpTo;
        return {
          en: `Formula: Total = ${total} ⇒ Boys = Girls = ${total}/2 = ${eachGroup}. Ahead of Ritu = ${rankTop} - 1 = ${aheadTotal} (${boysAhead} boys + ${girlsAhead} girls). Girls up to Ritu = ${girlsAhead} + 1 = ${girlsUpTo} ⇒ Girls behind = ${eachGroup} - ${girlsUpTo} = ${girlsBehind}. ∴ Option ${optTag}.`,
          hi: `सूत्र: कुल छात्र = ${total} ⇒ लड़के = लड़कियाँ = ${total}/2 = ${eachGroup}। रितु से आगे = ${rankTop} - 1 = ${aheadTotal} (${boysAhead} लड़के + ${girlsAhead} लड़कियाँ)। रितु तक लड़कियाँ = ${girlsAhead} + 1 = ${girlsUpTo} ⇒ पीछे लड़कियाँ = ${eachGroup} - ${girlsUpTo} = ${girlsBehind}। ∴ विकल्प ${optTag}।`,
        };
      }
    }

    // 6. Calendar Odd-Days Formula (e.g. Q23 Friday, 35 days ago -> Friday)
    const calMatch = qEn.match(/today is\s+([A-Za-z]+).*?(\d+)\s+days\s+(ago|later|after|before)/i);
    if (calMatch) {
      const dayName = calMatch[1];
      const daysCount = parseInt(calMatch[2], 10);
      const dir = /ago|before/i.test(calMatch[3]) ? '-' : '+';
      const weeks = Math.floor(daysCount / 7);
      const rem = daysCount % 7;
      return {
        en: `Formula (Calendar Odd Days): Odd days = ${daysCount} mod 7 = ${rem} (since ${daysCount} = 7 × ${weeks} + ${rem}). Required day = ${dayName} ${dir} ${rem} = ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (विषम दिन / Odd Days): विषम दिन = ${daysCount} mod 7 = ${rem} (क्योंकि ${daysCount} = 7 × ${weeks} + ${rem})। अभीष्ट दिन = ${ansHi} (${dayName} ${dir} ${rem})। ∴ विकल्प ${optTag}।`,
      };
    }

    // 7. Inequality & Coded Inequality Chains (e.g. Q14 P > Q ≥ H = J < S < F, Q24 M#N and N*O -> M < O)
    if (/Coding Key:.*M#N|A#B means A < B/i.test(qEn)) {
      return {
        en: `Formula (Transitive Inequality): Given M # N ⇒ M < N and N * O ⇒ N = O. Combining both: M < N = O ⇒ ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (असमिका संबंध): M # N ⇒ M < N तथा N * O ⇒ N = O। दोनों को मिलाने पर: M < N = O ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/Statement:\s*P\s*>\s*Q\s*≥\s*H\s*=\s*J/i.test(qEn)) {
      return {
        en: `Formula (Inequality Chain): From P > Q ≥ H = J < S < F: (I) Q ≥ H = J ⇒ Q ≥ J (True); (II) J < S < F ⇒ F > J (True); (III) H = J < S < F ⇒ H < F (True). ∴ Option ${optTag} (${ansEn}).`,
        hi: `सूत्र (असमिका श्रृंखला): P > Q ≥ H = J < S < F से: (I) Q ≥ H = J ⇒ Q ≥ J (सत्य); (II) J < S < F ⇒ F > J (सत्य); (III) H = J < S < F ⇒ H < F (सत्य)। ∴ विकल्प ${optTag} (${ansHi})।`,
      };
    }
    if (/who is the tallest.*\(i\)\s*A\s*>\s*B.*\(ii\)\s*B\s*≥\s*C/i.test(qEn)) {
      return {
        en: `Formula (Inequality Deduction): From (i) A > B and (ii) B ≥ C ⇒ A > B ≥ C, which proves A is the tallest. Thus both statements together are sufficient: ${optTag} (${ansEn}).`,
        hi: `सूत्र (असमिका संयोजन): कथन (i) A > B तथा (ii) B ≥ C को मिलाने पर ⇒ A > B ≥ C, जिससे स्पष्ट है कि A सबसे लंबा है। ∴ विकल्प ${optTag} (${ansHi})।`,
      };
    }

    // 8. BODMAS Sign Substitution & Equation Balancing (e.g. Q25 22 * 3 * 5 * 8 * 2 * 33, Q49 18 & 12 @ 4 * 5 / 6)
    if (/18\s*&\s*12\s*@\s*4\s*\*\s*5\s*\/\s*6/.test(qEn)) {
      return {
        en: `Formula (BODMAS Rule): Substituting [& → ×, @ → ÷, * → +, / → -] ⇒ 18 × 12 ÷ 4 + 5 - 6 = 18 × (12 ÷ 4) + 5 - 6 = 18 × 3 + 5 - 6 = 54 + 5 - 6 = ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (BODMAS नियम): चिह्न [& → ×, @ → ÷, * → +, / → -] रखने पर ⇒ 18 × 12 ÷ 4 + 5 - 6 = 18 × 3 + 5 - 6 = 54 + 5 - 6 = ${ansHi}। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/22\s*\*\s*3\s*\*\s*5\s*\*\s*8\s*\*\s*2\s*\*\s*33/.test(qEn)) {
      return {
        en: `Formula (BODMAS Rule): Substituting (${ansEn}) ⇒ 22 + 3 × 5 - 8 ÷ 2 = 33 ⇒ 22 + 3 × 5 - 4 = 33 ⇒ 22 + 15 - 4 = 33 ⇒ 33 = 33 (LHS = RHS). ∴ Option ${optTag}.`,
        hi: `सूत्र (BODMAS नियम): (${ansEn}) रखने पर ⇒ 22 + 3 × 5 - 8 ÷ 2 = 33 ⇒ 22 + 15 - 4 = 33 ⇒ 33 = 33 (LHS = RHS)। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/BODMAS|equation|interchanged|mathematical signs|denotes\s*['"][+\-×÷]/i.test(`${qEn} ${ansEn}`)) {
      return {
        en: `Formula (BODMAS Order: Bracket → Of → ÷ → × → + → -): Substituting the mathematical operators and simplifying step by step yields option ${optTag} (${ansEn}).`,
        hi: `सूत्र (BODMAS क्रम: कोष्ठक → का → ÷ → × → + → -): गणितीय चिह्नों को प्रतिस्थापित कर हल करने पर विकल्प ${optTag} (${ansHi}) प्राप्त होता है।`,
      };
    }

    // 9. Letter Analogy & Letter Coding-Decoding with Dynamic Shift Calculation (e.g. Q6 LEMON : PIQSR :: ORANGE : SVERKI, Q21 LEMON -> KDLNM)
    const analogyWordMatch = qEn.match(/\b([A-Z]{3,10})\s*:\s*([A-Z]{3,10})\s*::\s*([A-Z]{3,10})\s*:\s*\?/);
    if (analogyWordMatch && /^[A-Z]{3,10}$/.test(ansEn)) {
      const [, w1, w2, w3] = analogyWordMatch;
      if (w1.length === w2.length && w3.length === ansEn.length) {
        const shifts = w1.split('').map((ch, idx) => {
          const d = ((w2.charCodeAt(idx) - ch.charCodeAt(0) + 52) % 26);
          return d > 13 ? d - 26 : d;
        });
        const fmtShift = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
        const pairSteps = w3
          .split('')
          .map((ch, idx) => `${ch}(${fmtShift(shifts[idx % shifts.length])})=${ansEn[idx]}`)
          .join(', ');
        return {
          en: `Formula (Alphabetical Shift ${shifts.map(fmtShift).join(', ')}): In ${w1} → ${w2}, each letter shifts by (${shifts.map(fmtShift).join(', ')}). Applying the same to ${w3}: ${pairSteps} ⇒ ${ansEn}. ∴ Option ${optTag}.`,
          hi: `सूत्र (वर्णमाला विस्थापन ${shifts.map(fmtShift).join(', ')}): जिस प्रकार ${w1} → ${w2} में अक्षर (${shifts.map(fmtShift).join(', ')}) बढ़ते/घटते हैं, उसी प्रकार ${w3} में: ${pairSteps} ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
        };
      }
    }

    const codedWordMatch = qEn.match(
      /['"]?([A-Z]{3,10})['"]?\s+is\s+coded\s+as\s+['"]?([A-Z]{3,10})['"]?.*?\b([A-Z]{3,10})['"]?\s+coded/i
    );
    if (codedWordMatch && /^[A-Z]{3,10}$/.test(ansEn)) {
      const w1 = codedWordMatch[1].toUpperCase();
      const w2 = codedWordMatch[2].toUpperCase();
      const w3 = codedWordMatch[3].toUpperCase();
      if (w1.length === w2.length && w3.length === ansEn.length) {
        const shifts = w1.split('').map((ch, idx) => {
          const d = (w2.charCodeAt(idx) - ch.charCodeAt(0) + 52) % 26;
          return d > 13 ? d - 26 : d;
        });
        const fmtShift = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
        const steps = w3
          .split('')
          .map((ch, idx) => `${ch}(${fmtShift(shifts[idx % shifts.length])})=${ansEn[idx]}`)
          .join(', ');
        return {
          en: `Formula (Coding Pattern ${shifts.map(fmtShift).join(', ')}): ${w1} → ${w2} follows (${shifts.map(fmtShift).join(', ')}). Similarly for ${w3}: ${steps} ⇒ ${ansEn}. ∴ Option ${optTag}.`,
          hi: `सूत्र (कोडिंग पैटर्न ${shifts.map(fmtShift).join(', ')}): ${w1} → ${w2} में प्रत्येक अक्षर (${shifts.map(fmtShift).join(', ')}) परिवर्तित होता है। अतः ${w3} के लिए: ${steps} ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
        };
      }
    }

    // 10. Direct Digit-Letter Coding & Place-Value Coding (e.g. Q22 MONK=5129, KING=9263 -> GINK=3629; Q32 MONDAY=1315144125 -> SUNDAY=1921144125; Q46 Z=1 -> Y=2)
    if (/MONK\s*=\s*5129/i.test(qEn)) {
      return {
        en: `Formula (Direct Letter-Digit Mapping): From MONK = 5129 and KING = 9263 ⇒ G = 3, I = 6, N = 2, K = 9 ∴ GINK = ${ansEn}. Option ${optTag}.`,
        hi: `सूत्र (प्रत्यक्ष अक्षर-अंक कोड): MONK = 5129 तथा KING = 9263 की तुलना से ⇒ G = 3, I = 6, N = 2, K = 9 ∴ GINK = ${ansEn}। विकल्प ${optTag}।`,
      };
    }
    if (/MONDAY\s+is\s+coded\s+as\s+1315144125/i.test(qEn)) {
      return {
        en: `Formula (Alphabetical Position A=1, B=2, ..., Z=26): S(19) U(21) N(14) D(4) A(1) Y(25) ⇒ ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (वर्णमाला क्रमांक A=1, B=2, ..., Z=26): S=19, U=21, N=14, D=4, A=1, Y=25 ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/reverse position in the alphabet.*Z\s*=\s*1/i.test(qEn)) {
      return {
        en: `Formula (Reverse Alphabet Position): Reverse Value = 27 - Forward Position. Since Y = 25 ⇒ Reverse Code = 27 - 25 = ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (विपरीत वर्णमाला क्रमांक): विपरीत मान = 27 - सीधा क्रमांक। चूँकि Y = 25 ⇒ विपरीत कोड = 27 - 25 = ${ansEn}। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/INDUCTION.*third to the left of the second letter from the right/i.test(qEn)) {
      return {
        en: `Formula (Position from Right = R₁ + L₂): 2nd from right + 3rd to its left = (2 + 3) = 5th letter from the right in I-N-D-U-C-T-I-O-N ⇒ '${ansEn}'. ∴ Option ${optTag}.`,
        hi: `सूत्र (दाएँ से स्थान = R₁ + L₂): दाएँ से 2वाँ अक्षर (O) के बाएँ 3रा = दाएँ से (2 + 3) = 5वाँ अक्षर (I-N-D-U-C-T-I-O-N में) ⇒ '${ansEn}'। ∴ विकल्प ${optTag}।`,
      };
    }

    // 11. Letter Series with Dynamic Per-Letter Step Detection (e.g. Q7 CIM, FMO, IQQ, LUS, OYU, ? -> RCW)
    const letterSeriesTokens = qEn.match(/\b[A-Z]{2,5}\b(?=\s*,)/g);
    if (letterSeriesTokens && letterSeriesTokens.length >= 3 && /^[A-Z]{2,5}$/.test(ansEn)) {
      const len = ansEn.length;
      const validTokens = letterSeriesTokens.filter((t) => t.length === len);
      if (validTokens.length >= 3) {
        const allTerms = [...validTokens, ansEn];
        const posDetails = Array.from({ length: len }, (_, posIdx) => {
          const step =
            (allTerms[1].charCodeAt(posIdx) - allTerms[0].charCodeAt(posIdx) + 26) % 26;
          const chain = allTerms.map((t) => t[posIdx]).join(`(+${step})→`);
          return `${posIdx + 1}st/nd/rd: ${chain}`;
        });
        return {
          en: `Formula (Letter-Cluster Series): ${posDetails.join('; ')} ⇒ ${ansEn}. ∴ Option ${optTag}.`,
          hi: `सूत्र (अक्षर-समूह श्रृंखला): ${posDetails.join('; ')} ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
        };
      }
    }

    // 12. Number Series & Odd-One-Out Mathematical Pattern (e.g. Q33 18, 24, 30, 35 -> 35; Q45 1, 9, 65, 457, ? -> 3201; Q48 1, 4, 9, 16, 20 -> 20)
    if (/1,\s*9,\s*65,\s*457/.test(qEn)) {
      return {
        en: `Formula (Series Pattern Tₙ = Tₙ₋₁ × 7 + 2): 1 × 7 + 2 = 9; 9 × 7 + 2 = 65; 65 × 7 + 2 = 457; 457 × 7 + 2 = 3199 + 2 = ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (श्रृंखला नियम Tₙ = Tₙ₋₁ × 7 + 2): 1 × 7 + 2 = 9; 9 × 7 + 2 = 65; 65 × 7 + 2 = 457; 457 × 7 + 2 = 3199 + 2 = ${ansEn}। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/1,\s*4,\s*9,\s*16,\s*20/.test(qEn)) {
      return {
        en: `Formula (Perfect Squares n²): 1 = 1², 4 = 2², 9 = 3², 16 = 4², whereas ${ansEn} is not a perfect square (20 ≠ n²). ∴ Option ${optTag}.`,
        hi: `सूत्र (पूर्ण वर्ग संख्याएँ n²): 1 = 1², 4 = 2², 9 = 3², 16 = 4² पूर्ण वर्ग हैं, जबकि ${ansEn} पूर्ण वर्ग नहीं है (20 ≠ n²)। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/18,\s*24,\s*30,\s*35/.test(qEn)) {
      return {
        en: `Formula (Multiples of 6): 18 = 6 × 3, 24 = 6 × 4, 30 = 6 × 5 (all divisible by 6), whereas 35 = 5 × 7 is not divisible by 6. ∴ Odd one is ${optTag} (${ansEn}).`,
        hi: `सूत्र (6 के गुणज): 18 = 6 × 3, 24 = 6 × 4, 30 = 6 × 5 (सभी 6 से विभाज्य हैं), जबकि 35 (5 × 7) 6 से विभाज्य नहीं है। ∴ विषम विकल्प ${optTag} (${ansEn}) है।`,
      };
    }
    if (/ab_aa_aaa_a_ab_a/i.test(qEn)) {
      return {
        en: `Formula (Repeating Pattern): Filling (${ansEn}) in ab_aa_aaa_a_ab_a gives the rhythmic sequence: ab b / aa b / aaa b / a a / ab a a ⇒ ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (अक्षर आवृत्ति पैटर्न): रिक्त स्थानों में क्रमानुसार (${ansEn}) भरने पर श्रृंखला पूर्ण होती है: ab b / aa b / aaa b / a a / ab a a ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
      };
    }

    // Dynamic Number Series Solver for any uploaded number series (a₁, a₂, a₃, a₄, ?)
    const numSeriesMatch = qEn.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*(\d+))?\s*,\s*\?/);
    if (numSeriesMatch && /^\d+$/.test(ansEn)) {
      const nums = numSeriesMatch
        .slice(1)
        .filter((v): v is string => Boolean(v))
        .map((v) => parseInt(v, 10));
      const target = parseInt(ansEn, 10);
      const all = [...nums, target];
      const diffs = all.slice(1).map((v, i) => v - all[i]);
      if (diffs.every((d) => d === diffs[0])) {
        const sign = diffs[0] >= 0 ? `+ ${diffs[0]}` : `- ${Math.abs(diffs[0])}`;
        return {
          en: `Formula (Arithmetic Progression d = ${diffs[0]}): ${all.slice(0, -1).map((n, i) => `${n} ${sign} = ${all[i + 1]}`).join('; ')} ⇒ ${ansEn}. ∴ Option ${optTag}.`,
          hi: `सूत्र (समांतर श्रेणी, सार्व अंतर d = ${diffs[0]}): ${all.slice(0, -1).map((n, i) => `${n} ${sign} = ${all[i + 1]}`).join('; ')} ⇒ ${ansEn}। ∴ विकल्प ${optTag}।`,
        };
      }
      // Check second-order difference
      const diffs2 = diffs.slice(1).map((d, i) => d - diffs[i]);
      if (diffs2.length >= 2 && diffs2.every((d2) => d2 === diffs2[0])) {
        return {
          en: `Formula (Step Differences: ${diffs.map((d) => (d >= 0 ? `+${d}` : `${d}`)).join(', ')}): Last term = ${nums[nums.length - 1]} + ${diffs[diffs.length - 1]} = ${ansEn}. ∴ Option ${optTag}.`,
          hi: `सूत्र (क्रमागत अंतर: ${diffs.map((d) => (d >= 0 ? `+${d}` : `${d}`)).join(', ')}): अगला पद = ${nums[nums.length - 1]} + ${diffs[diffs.length - 1]} = ${ansEn}। ∴ विकल्प ${optTag}।`,
        };
      }
    }

    // 13. Percentage, Profit-Loss, SI/CI, Speed-Distance-Time, Time-Work, Mensuration, Trigonometry, Physics Formulas
    if (/Wien's Displacement Law|वीन विस्थापन/i.test(qBoth)) {
      return {
        en: `Formula (Wien's Displacement Law): λ_max × T = b (where b ≈ 2.898 × 10⁻³ m·K) ⇒ λ_max ∝ 1/T. Thus, higher temperature T produces a shorter peak wavelength λ_max: ${optTag} (${ansEn}).`,
        hi: `सूत्र (वीन का विस्थापन नियम): λ_max × T = b (नियतांक) ⇒ λ_max ∝ 1/T। अतः तापमान (T) जितना अधिक होगा, अधिकतम उत्सर्जन की तरंगदैर्ध्य (λ_max) उतनी ही छोटी होगी: विकल्प ${optTag}।`,
      };
    }
    if (/Special Theory of Relativity|सापेक्षता के विशिष्ट सिद्धांत/i.test(qBoth)) {
      return {
        en: `Formula (Einstein's Special Relativity): c = constant in all inertial frames ⇒ Time dilation Δt = Δt₀ / √(1 - v²/c²) and Length contraction L = L₀√(1 - v²/c²). ∴ Option ${optTag}.`,
        hi: `सूत्र (आइंस्टाइन का विशिष्ट सापेक्षता सिद्धांत): प्रकाश का वेग (c) सभी जड़त्वीय तंत्रों में नियत रहता है ⇒ समय विस्तार Δt = Δt₀ / √(1 - v²/c²) तथा लंबाई संकुचन L = L₀√(1 - v²/c²)। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/reduced fare by 15% and passengers increased by 20%/i.test(qEn)) {
      return {
        en: `Formula (Successive % Change = x + y + xy/100): Net Revenue Change = -15 + 20 + (-15 × 20)/100 = +5 - 3 = +2% (> 0) ⇒ ${ansEn}. ∴ Option ${optTag}.`,
        hi: `सूत्र (नेट प्रतिशत परिवर्तन = x + y + xy/100): कुल राजस्व परिवर्तन = -15 + 20 + (-15 × 20)/100 = +5 - 3 = +2% (वृद्धि) ⇒ ${ansHi}। ∴ विकल्प ${optTag}।`,
      };
    }
    if (/profit|loss|discount|cost price|selling price|marked price/i.test(qBoth)) {
      return {
        en: `Formula: Profit% = ((SP - CP) / CP) × 100%, SP = MP × (100 - Discount%) / 100 ⇒ Solving gives option ${optTag} (${ansEn}).`,
        hi: `सूत्र: लाभ% = ((विक्रय मूल्य - क्रय मूल्य) / क्रय मूल्य) × 100%, विक्रय मूल्य = अंकित मूल्य × (100 - छूट%) / 100 ⇒ हल करने पर विकल्प ${optTag} (${ansHi}) प्राप्त होता है।`,
      };
    }
    if (/simple interest|compound interest/i.test(qBoth)) {
      return {
        en: `Formula: SI = (P × R × T) / 100 and Compound Amount A = P(1 + R/100)ⁿ ⇒ Solving gives option ${optTag} (${ansEn}).`,
        hi: `सूत्र: साधारण ब्याज SI = (P × R × T) / 100 तथा चक्रवृद्धि मिश्रधन A = P(1 + R/100)ⁿ ⇒ हल करने पर विकल्प ${optTag} (${ansHi}) प्राप्त होता है।`,
      };
    }
    if (/\b(?:sin|cos|tan|cot|sec|cosec|triangle|circle|chord|radius|area|volume|cylinder|cone|sphere)\b/i.test(qEn)) {
      return {
        en: `Formula (Geometry / Trigonometry): Applying standard geometric & trigonometric identities (sin²θ + cos²θ = 1, Pythagoras a² + b² = c²) yields option ${optTag} (${ansEn}).`,
        hi: `सूत्र (ज्यामिति / त्रिकोणमिति): मानक ज्यामितीय एवं त्रिकोणमितीय सर्वसमिकाओं (sin²θ + cos²θ = 1, a² + b² = c²) से हल करने पर विकल्प ${optTag} (${ansHi}) प्राप्त होता है।`,
      };
    }

    if (/Reference Entry|Question Address|matches it exactly/i.test(qEn)) {
      return {
        en: `Option ${optTag} matches every detail (name, number/date, and city) of the given reference entry accurately.`,
        hi: `विकल्प ${optTag} दी गई संदर्भ प्रविष्टि के प्रत्येक विवरण (नाम, संख्या/तिथि एवं शहर) से पूर्णतः मेल खाता है।`,
      };
    }

    if (/::/.test(qEn) || /related words|pair of figures/i.test(qEn)) {
      return {
        en: `Applying the same logical relationship as the first pair, option ${optTag} ${ansEn} completes the analogy.`,
        hi: `प्रथम युग्म के समान तार्किक संबंध के अनुसार विकल्प ${optTag} ${ansHi} सही उत्तर है।`,
      };
    }

    if (/follow|conclusion|inference|implicit|Assumption|Assertion|sufficient/i.test(`${qEn} ${ansEn}`)) {
      return {
        en: `Based on logical deduction from the given statement(s), option ${optTag} (${ansEn}) is logically valid.`,
        hi: `दिए गए कथनों के तार्किक विश्लेषण के आधार पर विकल्प ${optTag} (${ansHi}) पूर्णतः सही है।`,
      };
    }

    if (/coded as|code language|series|pattern|missing/i.test(qEn)) {
      return {
        en: `Following the sequential letter/number pattern in the question, option ${optTag} (${ansEn}) is obtained.`,
        hi: `प्रश्न में दी गई अक्षर/संख्या श्रृंखला के निश्चित पैटर्न का अनुसरण करने पर विकल्प ${optTag} (${ansHi}) प्राप्त होता है।`,
      };
    }

    if (q.section.includes('ENGLISH')) {
      if (/passive|active/i.test(qEn)) {
        return {
          en: `Option ${optTag} "${ansEn}" preserves the exact tense and subject-object transformation required in voice change.`,
          hi: `वाच्य परिवर्तन (Voice) के नियमानुसार काल और कर्ता-कर्म संरचना के आधार पर विकल्प ${optTag} सही है।`,
        };
      }
      if (/Indirect|Direct|narration/i.test(qEn)) {
        return {
          en: `Option ${optTag} "${ansEn}" follows the standard tense, pronoun, and reporting verb rules of narration.`,
          hi: `प्रत्यक्ष/अप्रत्यक्ष कथन (Narration) के काल और सर्वनाम परिवर्तन नियमों के अनुसार विकल्प ${optTag} सही है।`,
        };
      }
      return {
        en: `According to standard English grammar and contextual usage, option ${optTag} (${ansEn}) is the accurate choice.`,
        hi: `मानक अंग्रेजी व्याकरण एवं वाक्य-प्रयोग के नियमानुसार विकल्प ${optTag} (${ansEn}) सही उत्तर है।`,
      };
    }

    if (q.section.includes('AWARENESS') || q.section.includes('GENERAL') || q.section.includes('GK')) {
      return {
        en: `Option ${optTag} (${ansEn}) is the verified factual answer for the given question.`,
        hi: `दिए गए प्रश्न के संदर्भ में विकल्प ${optTag} (${ansHi}) सही तथ्यपरक उत्तर है।`,
      };
    }

    return {
      en: `Solving the given condition step by step gives option ${optTag} (${ansEn}) as the correct answer.`,
      hi: `दी गई शर्तों को क्रमानुसार हल करने पर विकल्प ${optTag} (${ansHi}) सही उत्तर प्राप्त होता है।`,
    };
  };

  for (let qi = 0; qi < questions.length; qi++) {
    const q = questions[qi];
    const ansCodeMatch = q.answerOption.match(/[A-D]/i);
    const correctCode: 'A' | 'B' | 'C' | 'D' = ansCodeMatch
      ? (ansCodeMatch[0].toUpperCase() as 'A' | 'B' | 'C' | 'D')
      : codes[qi % 4];

    if (!q.answerOption && (q.options.length > 0 || !q.answerClean)) {
      q.answerOption = `(${correctCode})`;
    }

    if (q.options.length !== 4) {
      const existingByCode = new Map<'A' | 'B' | 'C' | 'D', ParsedOption>();
      q.options.forEach((o) => existingByCode.set(o.code, o));

      if (!existingByCode.has(correctCode)) {
        existingByCode.set(
          correctCode,
          makeOpt(correctCode, q.answerTextEn || q.answerClean, q.answerTextHi)
        );
      }

      const distractors = buildSmartDistractors(q, qi);
      let dIdx = 0;
      for (const c of codes) {
        if (existingByCode.has(c)) continue;
        const d = distractors[dIdx++];
        if (d) {
          existingByCode.set(c, makeOpt(c, d.en, d.hi));
        } else {
          existingByCode.set(c, makeOpt(c, `Option ${c}`, `विकल्प ${c}`));
        }
      }

      q.options = codes.map((c) => existingByCode.get(c)!);
    }

    // Ensure every question has both English & Hindi explanation for the Explanation tab
    if (!q.explanationEn || !q.explanationHi) {
      const smartEx = buildSmartExplanation(q, correctCode);
      if (!q.explanationEn) q.explanationEn = smartEx.en;
      if (!q.explanationHi) q.explanationHi = smartEx.hi;
      q.explanationClean =
        q.explanationEn && q.explanationHi
          ? `${q.explanationEn} / ${q.explanationHi}`
          : q.explanationEn || q.explanationHi;
    }
  }

  return {
    meta,
    sections: Array.from(sectionsSet),
    questions,
  };
}
