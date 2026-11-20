/**
 * Utility to parse and convert Mock Matrix / Online Test JSON into
 * clean, standard Steno/Exam bilingual .txt format.
 */

export interface MockMatrixQuestion {
  id?: string | number;
  question?: string | { en?: string; hi?: string };
  option_1?: string | { en?: string; hi?: string };
  option_2?: string | { en?: string; hi?: string };
  option_3?: string | { en?: string; hi?: string };
  option_4?: string | { en?: string; hi?: string };
  option_5?: string | { en?: string; hi?: string };
  answer?: string | number; // "1", "2", "3", "4" or 1, 2, 3, 4
  solution_text?: string | { en?: string; hi?: string };
  topic?: string;
  correct_score?: string | number;
  negative_score?: string | number;
  [key: string]: unknown;
}

export interface MockMatrixPayload {
  meta?: {
    title?: string;
    id?: string;
    total_questions?: number;
    correct_score?: string | number;
    negative_score?: string | number;
    timer_minutes?: string | number;
    timer_seconds?: number;
    [key: string]: unknown;
  };
  sections?: Record<
    string,
    {
      time_seconds?: number;
      questions?: MockMatrixQuestion[];
      [key: string]: unknown;
    }
  >;
  questions?: MockMatrixQuestion[];
  [key: string]: unknown;
}

export interface ConvertedResult {
  title: string;
  id: string;
  totalQuestions: number;
  cleanTxt: string;
  sectionsCount: number;
  parsedQuestionsCount: number;
}

export function cleanHtmlText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  let str = String(raw);

  // Replace common break tags with newlines
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n');
  str = str.replace(/<(p|div|li|tr|h[1-6])[^>]*>/gi, '');

  // Strip all other HTML tags
  str = str.replace(/<[^>]+>/g, '');

  // Decode standard HTML entities
  str = str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ');

  // Clean LaTeX delimiters like \( 14 \) -> 14
  str = str.replace(/\\\(\s*([^\\]+?)\s*\\\)/g, '$1');
  str = str.replace(/\\\[\s*([^\\]+?)\s*\\\]/g, '$1');

  // Normalize spaces on each line, remove excessive blanks
  const lines = str.split('\n').map((l) => l.trim());
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

function extractEnHi(field: unknown): { en: string; hi: string } {
  if (!field) return { en: '', hi: '' };
  if (typeof field === 'string') {
    return { en: cleanHtmlText(field), hi: '' };
  }
  if (typeof field === 'object' && field !== null) {
    const obj = field as Record<string, unknown>;
    const en = cleanHtmlText(obj.en || obj.EN || obj.English || obj.english || '');
    const hi = cleanHtmlText(obj.hi || obj.HI || obj.Hindi || obj.hindi || '');
    return { en, hi };
  }
  return { en: cleanHtmlText(String(field)), hi: '' };
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Assemble Mock Matrix Hub Worker v4 response format:
 * { meta, sections: { "PART-1": [[localId, quid, c, n, overrides], ...] | { questions: [...] } }, questions: { QUID: { ... } } }
 * into standard { meta, sections: { NAME: { time_seconds?, questions: MockMatrixQuestion[] } } }.
 */
export function assembleMockMatrixWorkerPayload(raw: any): MockMatrixPayload {
  if (
    !raw ||
    typeof raw !== 'object' ||
    !raw.questions ||
    typeof raw.questions !== 'object' ||
    Array.isArray(raw.questions)
  ) {
    return raw as MockMatrixPayload;
  }

  const test = raw.test || raw;
  const bank = raw.questions as Record<string, any>;
  const meta = (test.meta || raw.meta || {}) as Record<string, any>;
  const mid = typeof meta.id === 'string' && meta.id ? meta.id : null;
  const srcSections = test.sections || {};

  const LANG_STD = ['question', 'option_1', 'option_2', 'option_3', 'option_4', 'solution_text'];
  const STR_STD = [
    'option_5',
    'option_image_1',
    'option_image_2',
    'option_image_3',
    'option_image_4',
    'option_image_5',
    'question_image',
    'solution_image',
    'solution_video',
  ];

  const fillLang = (v: any) => {
    if (v === undefined || v === null) return { en: '', hi: '' };
    if (typeof v === 'object' && !Array.isArray(v)) {
      return {
        ...v,
        en: v.en ?? '',
        hi: v.hi ?? '',
      };
    }
    return v;
  };

  const restoreStd = (q: Record<string, any>, slots: number[] | null) => {
    for (const f of LANG_STD) {
      if (slots && f.startsWith('option_')) continue;
      q[f] = fillLang(q[f]);
    }
    if (slots) {
      for (let k = 1; k <= 5; k++) {
        const f = `option_${k}`;
        if (slots.includes(k)) q[f] = fillLang(q[f]);
        else if (q[f] === undefined || q[f] === null) q[f] = '';
      }
    }
    for (const f of STR_STD) {
      if (!(f in q)) q[f] = '';
    }
  };

  const order: string[] | null =
    Array.isArray(meta.section_order) && meta.section_order.length > 0
      ? meta.section_order
      : null;
  const sectionKeys = order
    ? [
        ...order.filter((k) => Object.prototype.hasOwnProperty.call(srcSections, k)),
        ...Object.keys(srcSections).filter((k) => !order.includes(k)),
      ]
    : Object.keys(srcSections);

  const assembledSections: Record<string, { time_seconds?: number; questions: MockMatrixQuestion[] }> =
    {};

  for (const secName of sectionKeys) {
    const sv = srcSections[secName];
    const list: any[] = Array.isArray(sv) ? sv : Array.isArray(sv?.questions) ? sv.questions : [];
    const qs: MockMatrixQuestion[] = [];

    for (const item of list) {
      // Handle already-assembled object or tuple [localId, quid, correct, negative, overrides]
      if (!Array.isArray(item)) {
        if (item && typeof item === 'object') qs.push(item as MockMatrixQuestion);
        continue;
      }
      const lid = item[0];
      const quid = String(item[1] || '');
      const bankBody = bank[quid];
      if (!bankBody) continue;

      const q: Record<string, any> = { id: lid, quid };
      for (const k of Object.keys(bankBody)) {
        if (k !== 'option_slots') {
          q[k] = JSON.parse(JSON.stringify(bankBody[k]));
        }
      }
      if (mid) q.quiz_id = mid;
      if (item.length >= 4) {
        if (item[2] !== null && item[2] !== undefined) q.correct_score = item[2];
        if (item[3] !== null && item[3] !== undefined) q.negative_score = item[3];
      } else {
        if (meta.correct_score !== undefined) q.correct_score = meta.correct_score;
        if (meta.negative_score !== undefined) q.negative_score = meta.negative_score;
      }
      if (item.length >= 5 && item[4] && typeof item[4] === 'object') {
        for (const k of Object.keys(item[4])) {
          if (item[4][k] === null) delete q[k];
          else q[k] = item[4][k];
        }
      }
      restoreStd(q, Array.isArray(bankBody.option_slots) ? bankBody.option_slots : null);
      qs.push(q as MockMatrixQuestion);
    }

    assembledSections[secName] = {
      ...(typeof sv === 'object' && !Array.isArray(sv) && sv.time_seconds
        ? { time_seconds: sv.time_seconds }
        : {}),
      questions: qs,
    };
  }

  return {
    meta,
    sections: assembledSections,
  };
}

export function convertMockMatrixJsonToCleanTxt(input: string | MockMatrixPayload): ConvertedResult {
  let parsed: MockMatrixPayload;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error('Input is empty');
    }
    try {
      parsed = JSON.parse(trimmed) as MockMatrixPayload;
    } catch (e: unknown) {
      // Loose clean-up attempt if JSON has trailing commas
      try {
        const relaxed = trimmed.replace(/,\s*([}\]])/g, '$1');
        parsed = JSON.parse(relaxed) as MockMatrixPayload;
      } catch {
        throw new Error(`Invalid JSON format: ${(e as Error).message}`);
      }
    }
  } else {
    parsed = input;
  }

  // Unpack Worker v4 compressed question bank format if needed
  parsed = assembleMockMatrixWorkerPayload(parsed);

  // Extract meta info
  const meta = parsed.meta || {};
  const rawTitle = meta.title || 'MOCK MATRIX TEST';
  const title = cleanHtmlText(rawTitle) || 'MOCK MATRIX TEST';
  const id = cleanHtmlText(meta.id || title.replace(/\s+/g, '-').toUpperCase());

  // Collect sections and questions
  const sectionEntries: { sectionName: string; questions: MockMatrixQuestion[] }[] = [];

  if (parsed.sections && typeof parsed.sections === 'object') {
    for (const [secName, secVal] of Object.entries(parsed.sections)) {
      if (secVal && Array.isArray(secVal.questions)) {
        sectionEntries.push({
          sectionName: secName.toUpperCase(),
          questions: secVal.questions,
        });
      }
    }
  }

  if (sectionEntries.length === 0 && Array.isArray(parsed.questions)) {
    sectionEntries.push({
      sectionName: 'GENERAL',
      questions: parsed.questions,
    });
  }

  // If input was directly an array of questions
  if (sectionEntries.length === 0 && Array.isArray(parsed)) {
    sectionEntries.push({
      sectionName: 'GENERAL',
      questions: parsed as MockMatrixQuestion[],
    });
  }

  let totalQs = 0;
  sectionEntries.forEach((s) => {
    totalQs += s.questions.length;
  });

  if (totalQs === 0) {
    throw new Error('No questions found in the provided JSON structure.');
  }

  const lines: string[] = [];

  // Header Block
  lines.push('==================================================');
  lines.push(title);
  lines.push(`ID: ${id}`);
  lines.push(`Total Questions: ${totalQs}`);
  lines.push('Language Mode: Bilingual (English + Hindi)');
  lines.push('==================================================');
  lines.push('');
  lines.push('');

  let globalQNum = 1;

  for (const sec of sectionEntries) {
    lines.push(`### [ ${sec.sectionName} ] ###`);
    lines.push('');

    for (const q of sec.questions) {
      const qNumStr = `Q${globalQNum}`;
      globalQNum++;

      const { en: qEn, hi: qHi } = extractEnHi(q.question);

      // Question line(s)
      if (qEn && qHi && qEn !== qHi) {
        lines.push(`${qNumStr}. ${qEn}`);
        lines.push(`    ${qHi}`);
      } else {
        const mainQ = qEn || qHi || `Question ${globalQNum - 1}`;
        lines.push(`${qNumStr}. ${mainQ}`);
      }

      // Options
      const rawOptions = [
        extractEnHi(q.option_1),
        extractEnHi(q.option_2),
        extractEnHi(q.option_3),
        extractEnHi(q.option_4),
      ];
      if (q.option_5) {
        rawOptions.push(extractEnHi(q.option_5));
      }

      // Filter non-empty options
      const validOptions = rawOptions.filter((opt) => opt.en || opt.hi);

      validOptions.forEach((opt, idx) => {
        const letter = OPTION_LETTERS[idx] || `(${idx + 1})`;
        if (opt.en && opt.hi && opt.en !== opt.hi) {
          lines.push(`  (${letter}) ${opt.en} / ${opt.hi}`);
        } else {
          lines.push(`  (${letter}) ${opt.en || opt.hi}`);
        }
      });

      // Answer line
      let ansLetter = '';
      let ansText = '';
      const ansRaw = String(q.answer ?? '').trim();
      const ansNum = parseInt(ansRaw, 10);

      if (!isNaN(ansNum) && ansNum >= 1 && ansNum <= validOptions.length) {
        ansLetter = OPTION_LETTERS[ansNum - 1] || 'A';
        const chosenOpt = validOptions[ansNum - 1];
        if (chosenOpt) {
          ansText =
            chosenOpt.en && chosenOpt.hi && chosenOpt.en !== chosenOpt.hi
              ? `${chosenOpt.en} / ${chosenOpt.hi}`
              : chosenOpt.en || chosenOpt.hi;
        }
      } else if (ansRaw && ['A', 'B', 'C', 'D', 'E'].includes(ansRaw.toUpperCase())) {
        ansLetter = ansRaw.toUpperCase();
        const letterIdx = OPTION_LETTERS.indexOf(ansLetter);
        if (letterIdx >= 0 && validOptions[letterIdx]) {
          const chosenOpt = validOptions[letterIdx];
          ansText =
            chosenOpt.en && chosenOpt.hi && chosenOpt.en !== chosenOpt.hi
              ? `${chosenOpt.en} / ${chosenOpt.hi}`
              : chosenOpt.en || chosenOpt.hi;
        }
      } else {
        ansLetter = 'A';
      }

      if (ansLetter) {
        if (ansText) {
          lines.push(`Ans: (${ansLetter}) ${ansText}`);
        } else {
          lines.push(`Ans: (${ansLetter})`);
        }
      }

      // Solution / Explanation
      const { en: solEn, hi: solHi } = extractEnHi(q.solution_text);

      if (solEn) {
        lines.push(`Ex: ${solEn}`);
      }

      if (solHi) {
        lines.push('');
        lines.push('[Hindi / हिन्दी व्याख्या]:');
        lines.push(solHi);
      }

      lines.push('--------------------------------------------------');
      lines.push('');
    }
  }

  const cleanTxt = lines.join('\n').trim() + '\n';

  return {
    title,
    id,
    totalQuestions: totalQs,
    cleanTxt,
    sectionsCount: sectionEntries.length,
    parsedQuestionsCount: totalQs,
  };
}
