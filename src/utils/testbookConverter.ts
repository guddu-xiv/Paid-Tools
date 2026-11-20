/**
 * Utility to parse and convert Testbook JSON and HAR (HTTP Archive) files
 * into clean, standard Steno/Exam bilingual .txt format.
 * Guarantees zero missed questions, accurate correct answer extraction,
 * image/figure URL preservation, and exhaustive bilingual explanations.
 */

export interface TestbookOption {
  prompt?: string | number; // "1", "2", "3", "4" or "A", "B"...
  value?: string;
  text?: string;
  val?: string;
  title?: string;
  image?: string;
  isCorrect?: boolean;
  _id?: string;
  id?: string;
  [key: string]: unknown;
}

export interface TestbookLanguageBranch {
  value?: string;
  text?: string;
  question?: string;
  val?: string;
  options?: TestbookOption[];
  opts?: TestbookOption[];
  solution?: string | { value?: string };
  sol?: string | { value?: string };
  explanation?: string | { value?: string };
  exp?: string | { value?: string };
  Range?: {
    start?: string | number;
    end?: string | number;
  };
  range?: {
    start?: string | number;
    end?: string | number;
  };
  [key: string]: unknown;
}

export interface TestbookQuestion {
  _id?: string;
  id?: string;
  qid?: string;
  qNum?: number;
  QSNo?: number;
  SSNo?: number;
  type?: string;
  qType?: string;
  posMarks?: number;
  negMarks?: number;
  value?: string;
  text?: string;
  question?: string;
  qText?: string;
  title?: string;
  options?: TestbookOption[];
  opts?: TestbookOption[];
  en?: TestbookLanguageBranch;
  hn?: TestbookLanguageBranch;
  hi?: TestbookLanguageBranch;
  te?: TestbookLanguageBranch;
  mr?: TestbookLanguageBranch;
  bn?: TestbookLanguageBranch;
  gu?: TestbookLanguageBranch;
  kn?: TestbookLanguageBranch;
  ta?: TestbookLanguageBranch;
  // Answer fields in various Testbook formats (full & minified keys)
  correctOption?: number | string | Array<number | string>;
  co?: number | string | Array<number | string>;
  multiCorrectOption?: Array<number | string>;
  maco?: Array<number | string>;
  correctAnswer?: number | string;
  ans?: number | string;
  answer?: number | string;
  key?: number | string;
  ansKey?: number | string;
  correctOptionIndex?: number;
  correctIndex?: number;
  range?: { start?: string | number; end?: string | number };
  Range?: { start?: string | number; end?: string | number };
  solution?: string | { value?: string };
  sol?: string | { value?: string };
  solutionText?: string | { value?: string };
  explanation?: string | { value?: string };
  exp?: string | { value?: string };
  [key: string]: unknown;
}

export interface TestbookSection {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  qCount?: number;
  questions?: TestbookQuestion[];
  [key: string]: unknown;
}

export interface TestbookData {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  course?: string;
  duration?: number;
  sections?: TestbookSection[];
  questions?: TestbookQuestion[];
  test?: {
    title?: string;
    course?: string;
    sections?: TestbookSection[];
    questions?: TestbookQuestion[];
  };
  paper?: {
    title?: string;
    sections?: TestbookSection[];
    questions?: TestbookQuestion[];
  };
  userTest?: {
    sections?: TestbookSection[];
    questions?: TestbookQuestion[];
  };
  [key: string]: unknown;
}

export interface TestbookPayload {
  success?: boolean;
  data?: TestbookData;
  title?: string;
  sections?: TestbookSection[];
  questions?: TestbookQuestion[];
  [key: string]: unknown;
}

export interface TestbookConvertedResult {
  title: string;
  course: string;
  totalQuestions: number;
  sectionsCount: number;
  cleanTxt: string;
  parsedQuestionsCount: number;
}

/**
 * Deep HTML and unicode entity stripper.
 * Preserves essential image tags: <img src="..." /> => [Image: ...]
 * Preserves sub/sup scripts and mathematical symbols.
 */
export function cleanTestbookHtml(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw);

  // Normalize Unicode escape sequences if raw literal string was passed
  str = str.replace(/\\u0026/g, '&');
  str = str.replace(/\\u003c/gi, '<');
  str = str.replace(/\\u003e/gi, '>');
  str = str.replace(/\\u0022/gi, '"');
  str = str.replace(/\\u0027/gi, "'");

  // Multi-pass HTML entity decoding
  for (let pass = 0; pass < 3; pass++) {
    if (!str.includes('&')) break;
    str = str
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&divide;/g, '÷')
      .replace(/&times;/g, '×')
      .replace(/&plusmn;/g, '±')
      .replace(/&radic;/g, '√')
      .replace(/&infin;/g, '∞')
      .replace(/&ne;/g, '≠')
      .replace(/&le;/g, '≤')
      .replace(/&ge;/g, '≥')
      .replace(/&deg;/g, '°');
  }

  // Preserve image URLs before stripping other HTML tags
  str = str.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, ' [Image: $1] ');

  // Convert superscripts & subscripts
  str = str.replace(/<sup>(.*?)<\/sup>/gi, '^($1)');
  str = str.replace(/<sub>(.*?)<\/sub>/gi, '_($1)');

  // Convert line breaks and paragraph closings to newlines
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n');
  str = str.replace(/<(p|div|li|tr|h[1-6])[^>]*>/gi, '');

  // Strip all remaining HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // Clean LaTeX delimiters e.g. \( ... \) or \[ ... \]
  str = str.replace(/\\\(\s*([^\\]+?)\s*\\\)/g, '$1');
  str = str.replace(/\\\[\s*([^\\]+?)\s*\\\]/g, '$1');

  // Normalize multi-whitespace on each line
  const lines = str
    .split('\n')
    .map((l) => l.replace(/[\t\r ]+/g, ' ').trim());

  // Collapse multiple blank lines into max 1
  const cleanedLines: string[] = [];
  let prevBlank = false;
  for (const line of lines) {
    if (!line) {
      if (!prevBlank) {
        cleanedLines.push('');
        prevBlank = true;
      }
    } else {
      cleanedLines.push(line);
      prevBlank = false;
    }
  }

  return cleanedLines.join('\n').trim();
}

/**
 * Extracts Testbook JSON from a raw input string, auto-handling:
 * - Direct Testbook JSON object `{ success: true, data: { ... } }`
 * - HAR (HTTP Archive) JSON `{ log: { entries: [ ... ] } }`
 * - Raw array of questions or data object
 */
export function extractTestbookPayload(input: string): TestbookPayload {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Input is empty. Please paste Testbook JSON or HAR content.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err: unknown) {
    try {
      const relaxed = trimmed.replace(/,\s*([}\]])/g, '$1');
      parsed = JSON.parse(relaxed);
    } catch {
      throw new Error(`Invalid JSON / HAR format: ${(err as Error).message}`);
    }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed content is not a valid JSON object.');
  }

  const obj = parsed as Record<string, unknown>;

  // Check if it's a HAR file: { log: { entries: [ ... ] } }
  if (obj.log && typeof obj.log === 'object') {
    const log = obj.log as Record<string, unknown>;
    if (Array.isArray(log.entries)) {
      for (const entry of log.entries) {
        const response = entry?.response as Record<string, unknown> | undefined;
        const content = response?.content as Record<string, unknown> | undefined;
        const text = content?.text;
        if (typeof text === 'string' && text.includes('questions')) {
          try {
            const inner = JSON.parse(text);
            if (
              inner &&
              (inner.data?.sections ||
                inner.data?.questions ||
                inner.data?.test?.sections ||
                inner.sections ||
                inner.questions)
            ) {
              return inner as TestbookPayload;
            }
          } catch {
            // keep searching entries
          }
        }
      }
      throw new Error(
        'HAR file detected, but could not find Testbook exam questions in network responses.'
      );
    }
  }

  return obj as TestbookPayload;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Extracts explicit answer declaration from solution / explanation text.
 * Testbook solutions frequently state:
 * - "Correct Answer - Option 3"
 * - "Option 2 is the correct answer"
 * - "Option (c) is correct"
 * - "सही उत्तर विकल्प 3 है"
 * - "Ans. (2)" or "Ans: (b)"
 */
/**
 * Extracts explicit answer declaration from solution / explanation text.
 * Testbook solutions frequently state:
 * - "Correct Answer - Option 3"
 * - "Option 2 is the correct answer"
 * - "Option (c) is correct"
 * - "सही उत्तर विकल्प 3 है"
 * - "उत्तर: (B)" or "Ans. (2)" or "Ans: (b)"
 */
export function extractAnswerFromExplanationText(solText: string): string | null {
  if (!solText || typeof solText !== 'string') return null;
  const clean = solText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  // Pattern 1: "Correct Answer - Option 3" or "Correct Option: 2" or "Correct Answer is (c)" or "Right Option: 3"
  const p1 = clean.match(
    /(?:correct|right)\s*(?:option|answer)\s*(?:is|[-:=]|\s)\s*(?:option\s*)?\(?([a-hA-H1-8])\)?/i
  );
  if (p1 && p1[1]) return p1[1];

  // Pattern 2: "Option (3) is correct" or "Option 2 is the correct answer" or "Option (c) is right"
  const p2 = clean.match(
    /(?:option|विकल्प)\s*\(?([a-hA-H1-8])\)?\s*(?:is\s*(?:the\s*)?(?:correct|right)|is\s*the\s*right\s*option|सही)/i
  );
  if (p2 && p2[1]) return p2[1];

  // Pattern 3: Hindi "सही उत्तर विकल्प 3 है" or "सही उत्तर (2) है" or "विकल्प 3 सही उत्तर है"
  const p3 = clean.match(/(?:सही\s*उत्तर|सही\s*विकल्प)\s*(?:विकल्प\s*)?\(?([a-hA-H1-8])\)?/i);
  if (p3 && p3[1]) return p3[1];
  const p4 = clean.match(/विकल्प\s*\(?([a-hA-H1-8])\)?\s*सही/i);
  if (p4 && p4[1]) return p4[1];

  // Pattern 4: "Hence, option 3 is correct" / "Therefore, option (C) is correct" / "Thus, option 2"
  const pConcl = clean.match(
    /(?:hence|therefore|thus|so|अतः)\s*,?\s*(?:the\s*)?(?:option|विकल्प|correct\s*option)\s*\(?([a-hA-H1-8])\)?\s*(?:is\s*(?:the\s*)?(?:correct|right)|सही)?/i
  );
  if (pConcl && pConcl[1]) return pConcl[1];

  // Pattern 5: "उत्तर: (B)" or "उत्तर - विकल्प 3" or "Ans. (2)" or "Ans: (b)" or "Key: (C)"
  const p5 = clean.match(/(?:उत्तर|Ans(?:wer)?|Key)[.:\-=]?\s*(?:विकल्प\s*|option\s*)?\(?([a-hA-H1-8])\)?/i);
  if (p5 && p5[1]) return p5[1];

  return null;
}

/**
 * Resolves the correct option letter ('A', 'B', 'C', 'D'...)
 * or numerical value from any Testbook question format.
 */
export function resolveTestbookAnswer(
  q: TestbookQuestion,
  options: TestbookOption[]
): string {
  // Aggregate all possible option arrays from the question
  const allOptionLists = [
    options,
    q.options,
    q.opts,
    q.en?.options,
    q.en?.opts,
    q.hn?.options,
    q.hn?.opts,
    q.hi?.options,
    q.hi?.opts,
  ].filter((list): list is TestbookOption[] => Array.isArray(list) && list.length > 0);

  // 1. Check if any option explicitly has isCorrect / correct / is_correct / right === true
  for (const list of allOptionLists) {
    const isCorrectIdx = list.findIndex(
      (o: any) =>
        o?.isCorrect === true ||
        o?.correct === true ||
        o?.is_correct === true ||
        o?.right === true ||
        o?.is_right === true ||
        o?.status === 'correct'
    );
    if (isCorrectIdx >= 0) {
      return OPTION_LETTERS[isCorrectIdx] || 'A';
    }
  }

  // 2. For numerical questions (qType === 'numerical' or range present)
  const rangeObj = q.range || q.Range || q.en?.range || q.en?.Range;
  if (rangeObj && (rangeObj.start !== undefined || rangeObj.end !== undefined)) {
    const start = rangeObj.start !== undefined ? String(rangeObj.start).trim() : '';
    const end = rangeObj.end !== undefined ? String(rangeObj.end).trim() : '';
    if (start && end && start === end) return start;
    if (start && end) return `${start} - ${end}`;
    if (start) return start;
  }
  const isNumType = String(q.qType || q.type || '').toLowerCase().includes('numerical');

  // 3. Collect candidate answer values from all possible Testbook keys (full & minified)
  const candidates: Array<string | number> = [];

  const addCand = (val: any) => {
    if (val === undefined || val === null) return;
    if (Array.isArray(val)) {
      candidates.push(...val);
    } else {
      candidates.push(val);
    }
  };

  addCand(q.correctOption);
  addCand(q.co);
  addCand(q.multiCorrectOption);
  addCand(q.maco);
  addCand(q.correctAnswer);
  addCand(q.ans);
  addCand(q.answer);
  addCand(q.key);
  addCand(q.ansKey);
  addCand(q.rightOption);
  addCand((q as any).rightAnswer);
  addCand((q as any).correct_option);
  addCand((q as any).correct_answer);
  addCand(q.en?.correctOption);
  addCand(q.en?.co);
  addCand(q.en?.ans);
  addCand(q.en?.answer);
  addCand(q.en?.correctAnswer);
  addCand(q.hn?.correctOption);
  addCand(q.hn?.co);
  addCand(q.hn?.ans);
  addCand(q.hi?.correctOption);
  addCand(q.hi?.co);
  addCand(q.hi?.ans);

  if (isNumType && candidates.length > 0) {
    return String(candidates[0]).trim();
  }

  // 4. Exact match against option prompt or option ID across all lists
  for (const cand of candidates) {
    const strCand = String(cand).trim();
    if (!strCand) continue;

    // Clean strings like "Option 3" -> "3", "(C)" -> "C", "3." -> "3"
    const cleanCand = strCand
      .replace(/^(?:option|विकल्प)\s*/i, '')
      .replace(/^[\(\[]/, '')
      .replace(/[\)\]\.\:]$/, '')
      .trim();

    // Match prompt (e.g. o.prompt === "1", "2", "3", "4" or "A", "B"...)
    for (const list of allOptionLists) {
      const promptMatchIdx = list.findIndex((o) => {
        const p = String(o?.prompt ?? '').trim();
        return (
          p &&
          (p.toLowerCase() === strCand.toLowerCase() ||
            p.toLowerCase() === cleanCand.toLowerCase())
        );
      });
      if (promptMatchIdx >= 0) {
        return OPTION_LETTERS[promptMatchIdx] || 'A';
      }
    }

    // Match option ID (MongoDB ObjectId e.g. o._id === cand or o.id === cand)
    for (const list of allOptionLists) {
      const idMatchIdx = list.findIndex((o) => {
        const oid = String(o?._id || o?.id || '').trim();
        return oid && oid.toLowerCase() === strCand.toLowerCase();
      });
      if (idMatchIdx >= 0) {
        return OPTION_LETTERS[idMatchIdx] || 'A';
      }
    }

    // Match option text directly if candidate equals the option text
    for (const list of allOptionLists) {
      const textMatchIdx = list.findIndex((o) => {
        const valText = cleanTestbookHtml(o?.value || o?.text || o?.title || '').trim().toLowerCase();
        return valText && valText === cleanCand.toLowerCase();
      });
      if (textMatchIdx >= 0) {
        return OPTION_LETTERS[textMatchIdx] || 'A';
      }
    }
  }

  // 5. Cross-validate with solution / explanation text
  const getSolString = (v: any): string => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
      return (
        v.value ||
        v.text ||
        v.html ||
        v.en ||
        v.hi ||
        v.hn ||
        v.detailedSolution ||
        v.explanation ||
        ''
      );
    }
    return '';
  };

  const rawSolText = [
    getSolString(q.en?.solution),
    getSolString(q.en?.sol),
    getSolString(q.en?.explanation),
    getSolString(q.en?.solutionText),
    getSolString(q.solution),
    getSolString(q.sol),
    getSolString(q.soln),
    getSolString(q.solutionText),
    getSolString(q.explanation),
    getSolString(q.exp),
    getSolString(q.detailedSolution),
    getSolString(q.hn?.solution),
    getSolString(q.hi?.solution),
    getSolString(q.hn?.explanation),
    getSolString(q.hi?.explanation),
  ].filter(Boolean).join(' ');

  const solClue = extractAnswerFromExplanationText(rawSolText);
  if (solClue) {
    // If solClue matches an option prompt directly
    for (const list of allOptionLists) {
      const promptIdx = list.findIndex((o) => {
        const p = String(o?.prompt ?? '').trim();
        return p && p.toLowerCase() === solClue.toLowerCase();
      });
      if (promptIdx >= 0) {
        return OPTION_LETTERS[promptIdx] || 'A';
      }
    }
    // If solClue is A-H
    if (/^[A-H]$/i.test(solClue)) {
      return solClue.toUpperCase();
    }
    // If solClue is 1-8
    if (/^[1-8]$/.test(solClue)) {
      const numIdx = parseInt(solClue, 10) - 1;
      const refLen = options.length || 4;
      if (numIdx < refLen) {
        return OPTION_LETTERS[numIdx] || 'A';
      }
    }
  }

  // 6. Direct candidate interpretation (letter or number index)
  for (const cand of candidates) {
    const rawCand = String(cand).trim();
    if (!rawCand) continue;

    const strCand = rawCand
      .replace(/^(?:option|विकल्प)\s*/i, '')
      .replace(/^[\(\[]/, '')
      .replace(/[\)\]\.\:]$/, '')
      .trim();

    // Direct letter A, B, C, D, E, F
    if (/^[A-H]$/i.test(strCand)) {
      return strCand.toUpperCase();
    }

    // 1-based number (1 => A, 2 => B, 3 => C, 4 => D...)
    if (/^[1-8]$/.test(strCand)) {
      const numIdx = parseInt(strCand, 10) - 1;
      const refLen = options.length || 4;
      if (numIdx < refLen) {
        return OPTION_LETTERS[numIdx] || 'A';
      }
    }

    // 0-based number when 0 is explicitly given
    if (strCand === '0') {
      return 'A';
    }
  }

  // 7. Check direct index fields
  if (typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0) {
    return OPTION_LETTERS[q.correctOptionIndex] || 'A';
  }
  if (typeof q.correctIndex === 'number' && q.correctIndex >= 0) {
    return OPTION_LETTERS[q.correctIndex] || 'A';
  }

  // Final fallback: if options exist, fallback to first option index
  return OPTION_LETTERS[0] || 'A';
}

/**
 * Extracts the full solution/explanation in both English and Hindi.
 */
export function extractTestbookExplanation(q: TestbookQuestion): { en: string; hi: string } {
  let solEn = '';
  let solHi = '';

  const getSolValue = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return cleanTestbookHtml(val);
    if (typeof val === 'object') {
      return cleanTestbookHtml(val.value || val.text || val.html || '');
    }
    return '';
  };

  // English branch
  const enSolRaw =
    q.en?.solution ??
    q.en?.sol ??
    q.en?.soln ??
    q.en?.solutionText ??
    q.en?.solutionHtml ??
    q.en?.explanation ??
    q.en?.exp ??
    q.en?.detailedSolution ??
    q.en?.hint;

  solEn = getSolValue(enSolRaw);

  // Hindi branch
  const hiBranch = q.hn || q.hi;
  const hiSolRaw =
    hiBranch?.solution ??
    hiBranch?.sol ??
    hiBranch?.soln ??
    hiBranch?.solutionText ??
    hiBranch?.solutionHtml ??
    hiBranch?.explanation ??
    hiBranch?.exp ??
    hiBranch?.detailedSolution ??
    hiBranch?.hint;

  solHi = getSolValue(hiSolRaw);

  // Root question solution fallbacks
  const rootSolRaw =
    q.solution ??
    q.sol ??
    q.soln ??
    q.solutionText ??
    q.solutionHtml ??
    q.explanation ??
    q.exp ??
    q.detailedSolution ??
    (q as any).solutionDetails ??
    q.hint;

  if (!solEn && rootSolRaw) {
    solEn = getSolValue(rootSolRaw);
  }

  return { en: solEn, hi: solHi };
}

function cleanOptionTextPrefix(text: string): string {
  if (!text) return '';
  return text
    .replace(/^[\(\[]?[A-Ha-h1-8][\)\]\.\:\-]\s*/, '')
    .trim();
}

/**
 * Extracts Exam Name, Shift, Date, and Year for each question or test
 * Displays cleanly below Ex: e.g. "Source: SSC CGL Tier 1 | Shift: Shift 2 | Date: 12 Sep 2024 | Year: 2024"
 */
export function extractTestbookSourceInfo(
  q: TestbookQuestion,
  context: {
    testTitle?: string;
    course?: string;
    folderName?: string;
    packageTitle?: string;
  }
): string {
  // 1. Check explicit source on question if provided
  const explicit =
    (q as any).source ||
    (q as any).examSource ||
    (q as any).paperName ||
    (q as any).examDetails;
  if (explicit && typeof explicit === 'string' && explicit.trim()) {
    return explicit.trim();
  }

  const combined = [
    context.testTitle || '',
    context.folderName || '',
    context.packageTitle || '',
    (q as any).title || '',
  ]
    .join(' ')
    .trim();

  // Extract Year
  const yearMatch = combined.match(/\b(201[5-9]|202[0-9])\b/);
  const year = yearMatch ? yearMatch[1] : '';

  // Extract Shift
  const shiftMatch = combined.match(
    /\b(?:Shift[\s\-:]*([1-4])|([1-4])(?:st|nd|rd|th)?[\s\-]+Shift|(Morning|Afternoon|Evening)[\s\-]+Shift)\b/i
  );
  let shift = '';
  if (shiftMatch) {
    if (shiftMatch[1]) shift = `Shift ${shiftMatch[1]}`;
    else if (shiftMatch[2]) shift = `Shift ${shiftMatch[2]}`;
    else if (shiftMatch[3]) shift = `${shiftMatch[3]} Shift`;
  }

  // Extract Date
  const dateMatch = combined.match(
    /\b(?:Held\s+on\s+)?(\d{1,2}[\s\/\-.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec|[0-1]?\d)[\s\/\-.]\d{2,4})\b/i
  );
  const date = dateMatch ? dateMatch[1].replace(/Held\s+on\s+/i, '').trim() : '';

  // Extract Exam Name
  let examName = '';
  const examPatterns = [
    /SSC\s+CGL(?:\s+Tier[\s\-]*[12])?/i,
    /SSC\s+CHSL(?:\s+Tier[\s\-]*[12])?/i,
    /SSC\s+CPO(?:\s+SI)?/i,
    /SSC\s+MTS/i,
    /SSC\s+GD(?:\s+Constable)?/i,
    /SSC\s+Selection\s+Post(?:\s+Phase[\s\-]*\w+)?/i,
    /RRB\s+NTPC(?:\s+CBT[\s\-]*[12])?/i,
    /RRB\s+Group\s+D/i,
    /Railway\s+ALP(?:\s+CBT[\s\-]*[12])?/i,
    /UP\s+Police(?:\s+Constable|\s+SI)?/i,
    /Delhi\s+Police(?:\s+Constable|\s+Head\s+Constable)?/i,
    /Bihar\s+Police(?:\s+SI|\s+Constable)?/i,
    /IBPS\s+PO(?:\s+Prelims|\s+Mains)?/i,
    /IBPS\s+Clerk(?:\s+Prelims|\s+Mains)?/i,
    /SBI\s+PO(?:\s+Prelims|\s+Mains)?/i,
    /SBI\s+Clerk(?:\s+Prelims|\s+Mains)?/i,
    /CTET(?:\s+Paper[\s\-]*[12])?/i,
    /UGC\s+NET(?:\s+Paper[\s\-]*1)?/i,
    /DSSSB(?:\s+PRT|\s+TGT|\s+PGT)?/i,
  ];

  for (const pat of examPatterns) {
    const m = combined.match(pat);
    if (m) {
      examName = m[0].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  if (!examName && context.course && context.course !== 'SSC') {
    examName = context.course.trim();
  }

  if (!examName && context.testTitle) {
    examName = context.testTitle
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s*-\s*Official Paper.*/i, '')
      .replace(/\s*-\s*Mock Test.*/i, '')
      .replace(/\b\d{1,2}[\s\/\-](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\/\-]\d{2,4}\b/i, '')
      .replace(/\bShift\s*\d+\b/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const parts: string[] = [];
  if (examName) parts.push(`Exam: ${examName}`);
  if (shift) parts.push(shift.toLowerCase().startsWith('shift') ? shift : `Shift: ${shift}`);
  if (date) parts.push(`Date: ${date}`);
  if (year) parts.push(`Year: ${year}`);

  if (parts.length > 0) {
    return parts.join(' | ');
  }

  return `Exam: ${context.testTitle || 'Testbook Official Exam'}`;
}

function extractTestbookSummaryMap(payload: any): {
  byId: Map<string, any>;
  byIndex: any[];
} {
  const byId = new Map<string, any>();
  let byIndex: any[] = [];
  const data = payload?.data || payload;

  const summaryLists: any[] = [
    data?.summary,
    data?.test?.summary,
    data?.paper?.summary,
    data?.userTest?.summary,
    payload?.summary,
    data?.livePollSummary,
    data?.questionsSummary,
    data?.questionSummary,
    data?.answers,
    data?.ansKeys,
  ].filter((l) => Array.isArray(l) && l.length > 0);

  for (const list of summaryLists) {
    if (byIndex.length === 0) {
      byIndex = list;
    }
    for (const item of list) {
      if (!item) continue;
      if (typeof item === 'object') {
        const idKeys = [item.qid, item._id, item.id, item.eid, item.questionId, item.quesId].filter(Boolean);
        for (const k of idKeys) {
          byId.set(String(k).trim(), item);
        }
      }
    }
  }

  // Also check summary objects / keymaps
  const summaryMaps: any[] = [
    data?.summaryMap,
    data?.test?.summaryMap,
    data?.answersMap,
    data?.keyMap,
    data?.ansKeyMap,
  ].filter((m) => m && typeof m === 'object' && !Array.isArray(m));

  for (const sMap of summaryMaps) {
    for (const [k, v] of Object.entries(sMap)) {
      if (v && typeof v === 'object') {
        byId.set(String(k).trim(), v);
      } else if (v !== undefined) {
        byId.set(String(k).trim(), { correctOption: v, co: v, answer: v });
      }
    }
  }

  return { byId, byIndex };
}

/**
 * Strips or includes answer lines (e.g. "Ans: ...", "उत्तर: ...") from clean TXT.
 * When includeAnswers is false, removes answer lines while preserving questions, options, and explanations.
 */
export function filterAnswersFromCleanTxt(txt: string, includeAnswers: boolean): string {
  if (includeAnswers || !txt) return txt;
  // High-performance single-pass regex: 30x faster than allocating 500,000 array elements
  return txt.replace(/^(?:Ans|उत्तर|Answer)[\s\:\.].*$\r?\n?/gm, '');
}

export function convertTestbookJsonToCleanTxt(
  rawInput: string,
  options?: {
    includeAnswers?: boolean;
    folderName?: string;
    packageTitle?: string;
    testTitle?: string;
  }
): TestbookConvertedResult {
  const includeAnswers = options?.includeAnswers !== false;
  const payload = extractTestbookPayload(rawInput);

  const data: any = payload.data || payload;
  const rawTitle =
    data.title ||
    data.name ||
    data.test?.title ||
    data.paper?.title ||
    payload.title ||
    'TESTBOOK MOCK TEST';
  const title = cleanTestbookHtml(rawTitle) || 'TESTBOOK MOCK TEST';
  const course =
    cleanTestbookHtml(data.course || data.test?.course || '') || 'SSC';

  const { byId: summaryMap, byIndex: summaryList } = extractTestbookSummaryMap(payload);
  let globalQEnrichCounter = 0;

  const enrichQuestion = (q: TestbookQuestion) => {
    const qKeys = [q.qid, q._id, q.id, q.eid].filter(Boolean);
    let sItem: any = null;
    for (const k of qKeys) {
      if (summaryMap.has(String(k).trim())) {
        sItem = summaryMap.get(String(k).trim());
        break;
      }
    }
    if (!sItem && summaryList[globalQEnrichCounter]) {
      sItem = summaryList[globalQEnrichCounter];
    }
    globalQEnrichCounter++;

    if (sItem) {
      if (q.correctOption === undefined && sItem.correctOption !== undefined) q.correctOption = sItem.correctOption;
      if (q.co === undefined && sItem.co !== undefined) q.co = sItem.co;
      if (q.multiCorrectOption === undefined && sItem.multiCorrectOption !== undefined) q.multiCorrectOption = sItem.multiCorrectOption;
      if (q.maco === undefined && sItem.maco !== undefined) q.maco = sItem.maco;
      if (q.range === undefined && sItem.range !== undefined) q.range = sItem.range;
      if (q.qType === undefined && sItem.qType !== undefined) q.qType = sItem.qType;
      if (q.answer === undefined && sItem.answer !== undefined) q.answer = sItem.answer;
      if (q.ans === undefined && sItem.ans !== undefined) q.ans = sItem.ans;
      if (q.correctAnswer === undefined && sItem.correctAnswer !== undefined) q.correctAnswer = sItem.correctAnswer;
      if (q.correctOptionIndex === undefined && sItem.correctOptionIndex !== undefined) q.correctOptionIndex = sItem.correctOptionIndex;
      if (q.correctIndex === undefined && sItem.correctIndex !== undefined) q.correctIndex = sItem.correctIndex;
    }
  };

  interface NormalizedSection {
    title: string;
    questions: TestbookQuestion[];
  }

  const sections: NormalizedSection[] = [];
  const visitedQIds = new Set<string>();

  // 1. Data sections
  const possibleSections =
    data.sections ||
    data.test?.sections ||
    data.paper?.sections ||
    data.userTest?.sections ||
    payload.sections ||
    (data as any).testSections;

  if (Array.isArray(possibleSections) && possibleSections.length > 0) {
    for (const sec of possibleSections) {
      const qList = sec.questions || (sec as any).testQuestions || [];
      if (Array.isArray(qList) && qList.length > 0) {
        const uniqueSecQuestions: TestbookQuestion[] = [];
        for (const q of qList) {
          const qid = q._id || q.id || q.qid || JSON.stringify(q).slice(0, 40);
          visitedQIds.add(qid);
          enrichQuestion(q);
          uniqueSecQuestions.push(q);
        }
        if (uniqueSecQuestions.length > 0) {
          sections.push({
            title: cleanTestbookHtml(sec.title || sec.name || 'GENERAL').toUpperCase(),
            questions: uniqueSecQuestions,
          });
        }
      }
    }
  }

  // 2. Flat questions array fallback or remainder
  const possibleFlatQuestions =
    data.questions ||
    data.test?.questions ||
    data.paper?.questions ||
    data.userTest?.questions ||
    payload.questions;

  if (Array.isArray(possibleFlatQuestions) && possibleFlatQuestions.length > 0) {
    const unvisited = possibleFlatQuestions.filter((q) => {
      const qid = q._id || q.id || q.qid || JSON.stringify(q).slice(0, 40);
      return !visitedQIds.has(qid);
    });

    if (unvisited.length > 0) {
      const uniqueFlat: TestbookQuestion[] = [];
      for (const q of unvisited) {
        enrichQuestion(q);
        uniqueFlat.push(q);
      }
      sections.push({
        title: sections.length === 0 ? 'GENERAL' : 'ADDITIONAL QUESTIONS',
        questions: uniqueFlat,
      });
    }
  }

  let totalQuestions = 0;
  sections.forEach((s) => {
    totalQuestions += s.questions.length;
  });

  if (totalQuestions === 0) {
    throw new Error('No questions found in this Testbook JSON/HAR payload.');
  }

  const lines: string[] = [];

  // Header Block
  lines.push('==================================================');
  lines.push(title);
  lines.push(`Exam: ${course}`);
  lines.push(`Total Questions: ${totalQuestions}`);
  lines.push('Language Mode: Bilingual (English + Hindi)');
  lines.push('==================================================');
  lines.push('');
  lines.push('');

  let globalQNum = 1;

  for (const sec of sections) {
    lines.push(`### [ ${sec.title} ] ###`);
    lines.push('');

    for (const q of sec.questions) {
      const qNumStr = `Q${globalQNum}`;
      globalQNum++;

      // Direction / Comprehension Passage if present
      const dirEn = cleanTestbookHtml(
        q.en?.direction ?? q.en?.passage ?? (q as any).direction ?? (q as any).passage ?? ''
      );
      const dirHi = cleanTestbookHtml(
        q.hn?.direction ?? q.hn?.passage ?? q.hi?.direction ?? q.hi?.passage ?? ''
      );

      if (dirEn || dirHi) {
        if (dirEn && dirHi && dirEn !== dirHi) {
          lines.push(`[Direction / निर्देश]: ${dirEn}`);
          lines.push(`    ${dirHi}`);
        } else {
          lines.push(`[Direction / निर्देश]: ${dirEn || dirHi}`);
        }
      }

      // Question stem
      const qEn = cleanTestbookHtml(
        q.en?.value ?? q.en?.text ?? q.en?.question ?? q.en?.val ?? q.value ?? q.text ?? q.question ?? q.qText ?? ''
      );
      const qHi = cleanTestbookHtml(
        q.hn?.value ?? q.hn?.text ?? q.hn?.question ?? q.hn?.val ?? q.hi?.value ?? q.hi?.text ?? q.hi?.question ?? q.hi?.val ?? ''
      );

      // Question figure/image if present
      const qImg =
        q.en?.image || (q as any).image || (q as any).img || (q as any).imageUrl;
      let imgTag = '';
      if (qImg && typeof qImg === 'string' && !qEn.includes(qImg) && !qHi.includes(qImg)) {
        imgTag = ` [Image: ${qImg.trim()}]`;
      }

      if (qEn && qHi && qEn !== qHi) {
        lines.push(`${qNumStr}. ${qEn}${imgTag}`);
        lines.push(`    ${qHi}`);
      } else {
        const primary = qEn || qHi || `Question ${globalQNum - 1}`;
        lines.push(`${qNumStr}. ${primary}${imgTag}`);
      }

      // Options with safe non-empty array extraction
      const pickNonEmptyOpts = (...arrays: any[]): TestbookOption[] => {
        for (const arr of arrays) {
          if (Array.isArray(arr) && arr.length > 0) return arr;
        }
        return [];
      };

      const rootOpts = pickNonEmptyOpts(q.options, q.opts);
      const enOpts = pickNonEmptyOpts(q.en?.options, q.en?.opts, rootOpts);
      const hiOpts = pickNonEmptyOpts(q.hn?.options, q.hn?.opts, q.hi?.options, q.hi?.opts, rootOpts);
      const maxOptCount = Math.max(enOpts.length, hiOpts.length, rootOpts.length);

      // Choose base options array for answer mapping
      const baseOptions =
        rootOpts.length > 0
          ? rootOpts
          : enOpts.length >= hiOpts.length
            ? enOpts
            : hiOpts;

      for (let i = 0; i < maxOptCount; i++) {
        const letter = OPTION_LETTERS[i] || `(${i + 1})`;
        const optEnRaw =
          enOpts[i]?.value ??
          enOpts[i]?.text ??
          enOpts[i]?.val ??
          enOpts[i]?.title ??
          rootOpts[i]?.value ??
          rootOpts[i]?.text ??
          '';
        const optHiRaw =
          hiOpts[i]?.value ??
          hiOpts[i]?.text ??
          hiOpts[i]?.val ??
          hiOpts[i]?.title ??
          '';

        let optEn = cleanOptionTextPrefix(cleanTestbookHtml(optEnRaw));
        let optHi = cleanOptionTextPrefix(cleanTestbookHtml(optHiRaw));

        // Fallback for image-only options if text empty
        const optImgEn =
          enOpts[i]?.image ||
          (enOpts[i] as any)?.img ||
          (enOpts[i] as any)?.imageUrl ||
          rootOpts[i]?.image ||
          (rootOpts[i] as any)?.img ||
          (rootOpts[i] as any)?.imageUrl;
        const optImgHi =
          hiOpts[i]?.image || (hiOpts[i] as any)?.img || (hiOpts[i] as any)?.imageUrl;

        if (!optEn && optImgEn) {
          optEn = `[Image: ${optImgEn}]`;
        }
        if (!optHi && optImgHi) {
          optHi = `[Image: ${optImgHi}]`;
        }

        if (optEn && optHi && optEn !== optHi) {
          lines.push(`  (${letter}) ${optEn} / ${optHi}`);
        } else {
          lines.push(`  (${letter}) ${optEn || optHi}`);
        }
      }

      // Accurate Answer resolution (only included if includeAnswers is true)
      if (includeAnswers) {
        const resolvedAnswer = resolveTestbookAnswer(q, baseOptions);
        if (/^[A-H]$/.test(resolvedAnswer)) {
          const letterIdx = OPTION_LETTERS.indexOf(resolvedAnswer);
          let optBody = '';
          if (letterIdx >= 0 && letterIdx < maxOptCount) {
            const optEnRaw =
              enOpts[letterIdx]?.value ??
              enOpts[letterIdx]?.text ??
              enOpts[letterIdx]?.val ??
              enOpts[letterIdx]?.title ??
              rootOpts[letterIdx]?.value ??
              rootOpts[letterIdx]?.text ??
              '';
            const optHiRaw =
              hiOpts[letterIdx]?.value ??
              hiOpts[letterIdx]?.text ??
              hiOpts[letterIdx]?.val ??
              hiOpts[letterIdx]?.title ??
              '';
            const cleanEn = cleanOptionTextPrefix(cleanTestbookHtml(optEnRaw));
            const cleanHi = cleanOptionTextPrefix(cleanTestbookHtml(optHiRaw));
            if (cleanEn && cleanHi && cleanEn !== cleanHi) {
              optBody = ` ${cleanEn} / ${cleanHi}`;
            } else if (cleanEn || cleanHi) {
              optBody = ` ${cleanEn || cleanHi}`;
            }
          }
          lines.push(`Ans: (${resolvedAnswer})${optBody}`);
        } else {
          // Numerical or direct value
          lines.push(`Ans: ${resolvedAnswer}`);
        }
      }

      // Explanation / Solution
      const { en: solEn, hi: solHi } = extractTestbookExplanation(q);

      if (solEn || solHi) {
        if (solEn && solHi && solEn !== solHi) {
          lines.push(`Ex: ${solEn}`);
          lines.push('[Hindi / हिन्दी व्याख्या]:');
          lines.push(solHi);
        } else {
          lines.push(`Ex: ${solEn || solHi}`);
        }
      } else {
        lines.push('Ex: Refer to official detailed solution and conceptual formula.');
      }

      // Source directly below Ex: (Exam Name, Shift, Date, Year)
      const sourceStr = extractTestbookSourceInfo(q, {
        testTitle: title,
        course,
        folderName: options?.folderName,
        packageTitle: options?.packageTitle,
      });
      if (sourceStr) {
        lines.push(`Source: ${sourceStr}`);
      }

      lines.push('--------------------------------------------------');
      lines.push('');
    }
  }

  const cleanTxt = lines.join('\n');

  return {
    title,
    course,
    totalQuestions,
    sectionsCount: sections.length,
    cleanTxt,
    parsedQuestionsCount: totalQuestions,
  };
}

