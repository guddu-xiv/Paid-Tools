/**
 * The Pundits Official (thepunditsofficial.in) Test Paper Converter
 * Converts The Pundits / OpSolve API test payloads (groups/quizzes/questions or raw text)
 * into clean, standard bilingual .txt format without fabrications.
 */

import { cleanRbeAppxHtml } from './rbeRevolutionConverter';

export interface PunditsOptionItem {
  id?: string | number;
  text?: string;
  textHi?: string;
}

export interface PunditsQuestionItem {
  id?: string | number;
  questionId?: string;
  text?: string;
  textHi?: string;
  comprehension?: string;
  comprehensionHi?: string;
  options?: PunditsOptionItem[] | { en?: string[]; hi?: string[] };
  optionsHi?: string[];
  correct?: string | number;
  correctOption?: string | number;
  correctOptionIndices?: number[];
  correctIndices?: number[];
  answer?: string | number;
  rightAnswer?: string | number;
  userAnswer?: number | null;
  selectedOptionIndices?: number[];
  right?: boolean;
  solution?: string;
  solutionHi?: string;
  explanation?: string | { en?: string; hi?: string };
  explanationHi?: string;
  imageUrl?: string | null;
  sectionName?: string;
  groupName?: string;
  content?: {
    en?: string;
    hi?: string;
    imageUrl?: string | null;
    image?: string | null;
    comprehension?: { en?: string; hi?: string } | string;
  };
  [key: string]: unknown;
}

export interface PunditsTestMeta {
  id?: string;
  title: string;
  seriesTitle?: string;
  categoryName?: string;
  totalQuestions?: number;
  durationMinutes?: number | string;
  marks?: number | string;
  isPaid?: boolean;
}

export interface PunditsConvertedResult {
  title: string;
  seriesTitle: string;
  totalQuestions: number;
  cleanTxt: string;
  questions: Array<{
    qNum: number;
    questionEn: string;
    questionHi: string;
    comprehensionEn?: string;
    comprehensionHi?: string;
    optionsEn: string[];
    optionsHi: string[];
    correctOptionLetter: 'A' | 'B' | 'C' | 'D' | '';
    answerClean: string;
    explanationEn: string;
    explanationHi: string;
    section: string;
    imageUrl?: string | null;
  }>;
  rawJson: string;
}

export function cleanPunditsText(raw?: string | null): string {
  if (!raw) return '';
  return cleanRbeAppxHtml(String(raw));
}

export function mapPunditsOptionLetter(val: any): 'A' | 'B' | 'C' | 'D' | '' {
  if (val === undefined || val === null) return '';
  if (Array.isArray(val)) {
    if (val.length === 0) return '';
    return mapPunditsOptionLetter(val[0]);
  }
  const clean = String(val).trim().toUpperCase();
  if (!clean) return '';
  if (clean === '0' || clean === 'A' || clean === '(A)' || clean === 'OPTION 1' || clean === '1ST') return 'A';
  if (clean === '1' || clean === 'B' || clean === '(B)' || clean === 'OPTION 2' || clean === '2ND') return 'B';
  if (clean === '2' || clean === 'C' || clean === '(C)' || clean === 'OPTION 3' || clean === '3RD') return 'C';
  if (clean === '3' || clean === 'D' || clean === '(D)' || clean === 'OPTION 4' || clean === '4TH') return 'D';
  if (clean === '4') return 'D';
  return '';
}

function mapOneBasedOptionLetter(val: any): 'A' | 'B' | 'C' | 'D' | '' {
  const n = Number(val);
  if (n === 1) return 'A';
  if (n === 2) return 'B';
  if (n === 3) return 'C';
  if (n === 4) return 'D';
  return mapPunditsOptionLetter(val);
}

export function extractPunditsRawQuestionsFromPayload(payload: any): {
  title?: string;
  durationMinutes?: string | number;
  questions: PunditsQuestionItem[];
} {
  if (!payload) return { questions: [] };
  const root = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
  const title =
    root?.title ||
    root?.name ||
    root?.mockTest?.title ||
    root?.mockTest?.name ||
    root?.quiz?.title ||
    root?.quiz?.name ||
    payload?.title ||
    undefined;
  const durationMinutes =
    root?.duration ||
    root?.time ||
    root?.mockTest?.duration ||
    root?.mockTest?.time ||
    undefined;

  const collected: PunditsQuestionItem[] = [];

  // Format 1: Opsolve mocktest groups[].quizzes[].questions[]
  const groups = Array.isArray(root?.groups)
    ? root.groups
    : Array.isArray(payload?.groups)
    ? payload.groups
    : null;
  if (groups) {
    for (const grp of groups) {
      const grpName = grp?.groupName || grp?.name || '';
      const quizzes = Array.isArray(grp?.quizzes) ? grp.quizzes : [];
      if (quizzes.length > 0) {
        for (const qz of quizzes) {
          const secName = qz?.shortName || qz?.name || qz?.title || grpName || '';
          const qs = Array.isArray(qz?.questions) ? qz.questions : [];
          for (const q of qs) {
            collected.push({ ...q, sectionName: q?.sectionName || secName });
          }
        }
      } else if (Array.isArray(grp?.questions)) {
        for (const q of grp.questions) {
          collected.push({ ...q, sectionName: q?.sectionName || grpName });
        }
      }
    }
  }

  // Format 2: Opsolve quiz sections / quizzes[]
  if (collected.length === 0 && Array.isArray(root?.quizzes)) {
    for (const qz of root.quizzes) {
      const secName = qz?.shortName || qz?.name || qz?.title || '';
      for (const q of Array.isArray(qz?.questions) ? qz.questions : []) {
        collected.push({ ...q, sectionName: q?.sectionName || secName });
      }
    }
  }

  // Format 3: Flat questions array
  const flatCandidates = [
    root?.questions,
    root?.quiz?.questions,
    root?.mockTest?.questions,
    root?.result?.questions,
    payload?.questions,
    Array.isArray(payload) ? payload : null,
  ];
  if (collected.length === 0) {
    for (const arr of flatCandidates) {
      if (Array.isArray(arr) && arr.length > 0) {
        for (const q of arr) collected.push(q);
        break;
      }
    }
  }

  return { title, durationMinutes, questions: collected };
}

export function convertThePunditsToCleanTxt(
  questions: PunditsQuestionItem[],
  meta?: PunditsTestMeta
): PunditsConvertedResult {
  const testTitle = meta?.title?.trim() || 'The Pundits Test';
  const seriesTitle = meta?.seriesTitle?.trim() || 'The Pundits Official (thepunditsofficial.in)';
  const duration = meta?.durationMinutes ? String(meta.durationMinutes).trim() : '';
  const totalQuestions = questions.length;

  const parsedQuestions: PunditsConvertedResult['questions'] = [];
  const lines: string[] = [];

  lines.push('==================================================');
  lines.push('EXAM: THE PUNDITS OFFICIAL (thepunditsofficial.in)');
  lines.push(`SERIES: ${seriesTitle}`);
  lines.push(`TEST: ${testTitle}`);
  if (meta?.categoryName) lines.push(`SECTION / CATEGORY: ${meta.categoryName}`);
  lines.push(
    `TOTAL QUESTIONS: ${totalQuestions}${duration ? ` | DURATION: ${duration}` : ''}${
      meta?.marks ? ` | MARKS: ${meta.marks}` : ''
    }`
  );
  lines.push('==================================================');
  lines.push('');

  let currentSection = '';

  for (let idx = 0; idx < questions.length; idx++) {
    const qItem: any = questions[idx] || {};
    const qNum = idx + 1;

    const secName = String(qItem.sectionName || qItem.groupName || qItem.section || '').trim();
    if (secName && secName !== currentSection) {
      currentSection = secName;
      lines.push('');
      lines.push(`=== [ SECTION: ${currentSection.toUpperCase()} ] ===`);
      lines.push('');
    }

    const compRaw = qItem.content?.comprehension;
    const compEn = cleanPunditsText(
      qItem.comprehension ||
        qItem.comprehensionEn ||
        (typeof compRaw === 'string' ? compRaw : compRaw?.en)
    );
    const compHi = cleanPunditsText(
      qItem.comprehensionHi ||
        (typeof compRaw === 'object' ? compRaw?.hi : '')
    );

    if (compEn || compHi) {
      if (compEn && compHi && compEn !== compHi) {
        lines.push(`[Direction / निर्देश]: ${compEn}`);
        lines.push(`    ${compHi}`);
      } else {
        lines.push(`[Direction / निर्देश]: ${compEn || compHi}`);
      }
    }

    let qEn = cleanPunditsText(
      qItem.questionEn || qItem.text || qItem.question || qItem.content?.en || qItem.title
    );
    const qHi = cleanPunditsText(qItem.questionHi || qItem.textHi || qItem.content?.hi);

    if (!qEn && qHi) qEn = qHi;

    let imgUrl: string | null =
      qItem.imageUrl ||
      qItem.image ||
      qItem.img ||
      qItem.content?.imageUrl ||
      qItem.content?.image ||
      null;

    if (!imgUrl) {
      const rawText = String(qItem.text || qItem.content?.en || '');
      const srcMatch = rawText.match(/src=["']([^"']+)["']/i);
      if (srcMatch) imgUrl = srcMatch[1];
    }

    if (imgUrl && !qEn.includes(imgUrl)) {
      qEn += ` [Figure: ${imgUrl}]`;
    }

    let enOpts: string[] = [];
    let hiOpts: string[] = [];

    if (Array.isArray(qItem.optionsEn)) {
      enOpts = qItem.optionsEn.map((o: any) => cleanPunditsText(String(o || '')));
      hiOpts = Array.isArray(qItem.optionsHi)
        ? qItem.optionsHi.map((o: any) => cleanPunditsText(String(o || '')))
        : [];
    } else if (Array.isArray(qItem.options)) {
      enOpts = qItem.options.map((o: any) =>
        cleanPunditsText(typeof o === 'string' ? o : o?.text || o?.en || o?.value)
      );
      hiOpts = qItem.options.map((o: any) =>
        cleanPunditsText(typeof o === 'string' ? '' : o?.textHi || o?.hi)
      );
    } else if (Array.isArray(qItem.options?.en) || Array.isArray(qItem.options?.hi)) {
      enOpts = Array.isArray(qItem.options?.en)
        ? qItem.options.en.map((o: string) => cleanPunditsText(o))
        : [];
      hiOpts = Array.isArray(qItem.options?.hi)
        ? qItem.options.hi.map((o: string) => cleanPunditsText(o))
        : [];
    } else {
      enOpts = [
        cleanPunditsText(qItem.option_1 || qItem.optionA || ''),
        cleanPunditsText(qItem.option_2 || qItem.optionB || ''),
        cleanPunditsText(qItem.option_3 || qItem.optionC || ''),
        cleanPunditsText(qItem.option_4 || qItem.optionD || ''),
      ].filter((_, i) => i < 4);
    }

    if (hiOpts.length === 0 && Array.isArray(qItem.optionsHi)) {
      hiOpts = qItem.optionsHi.map((o: any) => cleanPunditsText(String(o || '')));
    }

    while (enOpts.length < 4) enOpts.push('');
    while (hiOpts.length < 4) hiOpts.push('');

    let letter: 'A' | 'B' | 'C' | 'D' | '' = '';
    if (Array.isArray(qItem.correctOptionIndices) && qItem.correctOptionIndices.length > 0) {
      letter = mapPunditsOptionLetter(qItem.correctOptionIndices[0]);
    } else if (Array.isArray(qItem.correctIndices) && qItem.correctIndices.length > 0) {
      letter = mapPunditsOptionLetter(qItem.correctIndices[0]);
    } else if (qItem.correctOptionLetter) {
      letter = mapPunditsOptionLetter(qItem.correctOptionLetter);
    } else if (qItem.correct !== undefined && qItem.correct !== null) {
      letter = mapPunditsOptionLetter(qItem.correct);
    } else if (qItem.correctOption !== undefined && qItem.correctOption !== null) {
      letter = mapOneBasedOptionLetter(qItem.correctOption);
    } else if (qItem.answer !== undefined && qItem.answer !== null) {
      letter = mapOneBasedOptionLetter(qItem.answer);
    } else if (qItem.rightAnswer !== undefined && qItem.rightAnswer !== null) {
      letter = mapOneBasedOptionLetter(qItem.rightAnswer);
    } else if (qItem.userAnswer !== null && qItem.userAnswer !== undefined && qItem.right) {
      letter = mapPunditsOptionLetter(qItem.userAnswer);
    }

    let answerClean = '';
    if (letter === 'A') answerClean = enOpts[0] || hiOpts[0];
    else if (letter === 'B') answerClean = enOpts[1] || hiOpts[1];
    else if (letter === 'C') answerClean = enOpts[2] || hiOpts[2];
    else if (letter === 'D') answerClean = enOpts[3] || hiOpts[3];

    const rawExp = qItem.explanation;
    const exEn = cleanPunditsText(
      typeof rawExp === 'object' && rawExp !== null
        ? rawExp.en
        : rawExp || qItem.explanationEn || qItem.solution
    );
    const exHi = cleanPunditsText(
      (typeof rawExp === 'object' && rawExp !== null ? rawExp.hi : '') ||
        qItem.explanationHi ||
        qItem.solutionHi
    );

    parsedQuestions.push({
      qNum,
      questionEn: qEn,
      questionHi: qHi,
      comprehensionEn: compEn,
      comprehensionHi: compHi,
      optionsEn: enOpts.slice(0, 4),
      optionsHi: hiOpts.slice(0, 4),
      correctOptionLetter: letter,
      answerClean,
      explanationEn: exEn,
      explanationHi: exHi,
      section: currentSection,
      imageUrl: imgUrl,
    });

    lines.push(`${qNum}. ${qEn}`);
    if (qHi && qHi !== qEn) {
      lines.push(`   ${qHi}`);
    }

    const letters = ['(A)', '(B)', '(C)', '(D)'];
    for (let oIdx = 0; oIdx < 4; oIdx++) {
      const optEn = enOpts[oIdx] || '';
      const optHi = hiOpts[oIdx] || '';
      if (optEn && optHi && optEn !== optHi) {
        lines.push(`   ${letters[oIdx]} ${optEn} / ${optHi}`);
      } else {
        lines.push(`   ${letters[oIdx]} ${optEn || optHi || `Option ${letters[oIdx]}`}`);
      }
    }

    if (letter) {
      const ansText = answerClean ? `(${letter}) ${answerClean}` : `(${letter})`;
      lines.push(`   Ans: ${ansText}`);
    }

    if (exEn || exHi) {
      if (exEn && exHi && exEn !== exHi) {
        lines.push(`   Ex: ${exEn}`);
        lines.push(`       ${exHi}`);
      } else {
        lines.push(`   Ex: ${exEn || exHi}`);
      }
    }

    lines.push('');
  }

  return {
    title: testTitle,
    seriesTitle,
    totalQuestions,
    cleanTxt: lines.join('\n'),
    questions: parsedQuestions,
    rawJson: JSON.stringify(questions, null, 2),
  };
}

export function convertPunditsRawInputToCleanTxt(rawInput: string): PunditsConvertedResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error('Please paste test questions text or JSON payload.');
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);
    const extracted = extractPunditsRawQuestionsFromPayload(parsed);
    if (extracted.questions.length > 0) {
      return convertThePunditsToCleanTxt(extracted.questions, {
        title: extracted.title || 'The Pundits Mock Test (JSON Import)',
        seriesTitle: 'The Pundits Official (thepunditsofficial.in)',
        durationMinutes: extracted.durationMinutes,
      });
    }
    throw new Error('Valid JSON detected, but no questions array was found in the payload.');
  }

  // Raw plain-text parser (numbered questions 1. / Q1.)
  const blocks = trimmed
    .split(/\n(?=(?:Q\.?\s*\d+[\.\):]|\d+[\.\)])\s+)/i)
    .map((b) => b.trim())
    .filter(Boolean);

  const rawQuestions: PunditsQuestionItem[] = [];
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    const firstLine = lines[0].replace(/^(?:Q\.?\s*\d+[\.\):]|\d+[\.\)])\s+/i, '').trim();
    const opts: string[] = [];
    let ansLetter = '';
    const expLines: string[] = [];
    const stemLines: string[] = [firstLine];
    let inExp = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^(?:\(([A-D])\)|([A-D])[\.\)])\s+(.*)$/i);
      const ansMatch = line.match(/^(?:Ans(?:wer)?|Correct)\s*[:\-]\s*(?:\(?([A-D])\)?)/i);
      const expMatch = line.match(/^(?:Ex(?:p|planation)?|Sol(?:ution)?)\s*[:\-]\s*(.*)$/i);

      if (ansMatch) {
        ansLetter = ansMatch[1].toUpperCase();
        inExp = false;
      } else if (expMatch) {
        if (expMatch[1]) expLines.push(expMatch[1]);
        inExp = true;
      } else if (optMatch && !inExp) {
        opts.push(optMatch[3].trim());
      } else if (inExp) {
        expLines.push(line);
      } else if (opts.length === 0) {
        stemLines.push(line);
      }
    }

    if (stemLines.length > 0 && opts.length >= 2) {
      rawQuestions.push({
        text: stemLines.join(' '),
        options: opts.map((t) => ({ text: t })),
        correct: ansLetter || undefined,
        explanation: expLines.join(' '),
      });
    }
  }

  if (rawQuestions.length === 0) {
    throw new Error(
      'Could not detect numbered questions (e.g. "1. Question..." with (A)-(D) options) or The Pundits JSON.'
    );
  }

  return convertThePunditsToCleanTxt(rawQuestions, {
    title: 'The Pundits Mock Test (Text Import)',
    seriesTitle: 'The Pundits Official (thepunditsofficial.in)',
  });
}
