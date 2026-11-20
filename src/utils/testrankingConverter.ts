/**
 * TestRanking (testranking.in / backend.opsolve.xyz) Bilingual Converter
 * Converts live mocktest-start / mocktest-result / quiz-start / quiz-result payloads
 * into clean Bilingual Question-Answer .txt format matching RBE / ExamQA A4 PDF Studio.
 */

import {
  cleanRbeAppxHtml,
  convertRbeRevolutionToCleanTxt,
  RbeConvertedAppxResult,
} from './rbeRevolutionConverter';

export interface TestrankingConversionMeta {
  slug?: string;
  title?: string;
  seriesTitle?: string;
  subjectTitle?: string;
  sourceLabel?: string;
}

function resolveCorrectLetter(q: any): 'A' | 'B' | 'C' | 'D' | '' {
  const letters = ['A', 'B', 'C', 'D'] as const;

  if (Array.isArray(q?.correctOptionIndices) && q.correctOptionIndices.length > 0) {
    const idx = Number(q.correctOptionIndices[0]);
    if (Number.isInteger(idx) && idx >= 0 && idx < letters.length) {
      return letters[idx];
    }
  }

  if (
    typeof q?.correctOptionIndex === 'number' &&
    q.correctOptionIndex >= 0 &&
    q.correctOptionIndex < letters.length
  ) {
    return letters[q.correctOptionIndex];
  }

  const rawAns = String(q?.correctAnswer ?? q?.correct ?? q?.answer ?? '')
    .trim()
    .toUpperCase();
  if (rawAns === 'A' || rawAns === '1') return 'A';
  if (rawAns === 'B' || rawAns === '2') return 'B';
  if (rawAns === 'C' || rawAns === '3') return 'C';
  if (rawAns === 'D' || rawAns === '4') return 'D';

  return '';
}

function readBilingualField(val: any): { en: string; hi: string } {
  if (!val) return { en: '', hi: '' };
  if (typeof val === 'string') {
    const cleaned = cleanRbeAppxHtml(val);
    return { en: cleaned, hi: '' };
  }
  if (typeof val === 'object') {
    return {
      en: cleanRbeAppxHtml(val.en ?? val.english ?? ''),
      hi: cleanRbeAppxHtml(val.hi ?? val.hindi ?? ''),
    };
  }
  return { en: '', hi: '' };
}

export function extractRawQuestionsFromPayload(payload: any): {
  questions: any[];
  attempt?: number;
  title?: string;
} {
  if (!payload || typeof payload !== 'object') {
    return { questions: [] };
  }
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const attempt = typeof data.attempt === 'number' ? data.attempt : undefined;
  const title =
    data.mockTest?.name ||
    data.mockTest?.shortName ||
    data.quiz?.name ||
    data.quiz?.shortName ||
    data.name ||
    data.title ||
    undefined;

  const collected: any[] = [];

  if (Array.isArray(data.groups)) {
    const sortedGroups = [...data.groups].sort(
      (a: any, b: any) => (Number(a?.order) || 0) - (Number(b?.order) || 0)
    );
    for (const grp of sortedGroups) {
      const grpName = String(grp?.groupName || grp?.name || '').trim();
      const quizzes = Array.isArray(grp?.quizzes) ? grp.quizzes : [];
      for (const qz of quizzes) {
        const secName = String(qz?.shortName || qz?.name || grpName || 'General').trim();
        const qs = Array.isArray(qz?.questions) ? qz.questions : [];
        for (const item of qs) {
          collected.push({
            ...item,
            __sectionName: secName || item.__sectionName || '',
          });
        }
      }
    }
  }

  if (collected.length === 0 && Array.isArray(data.questions)) {
    for (const item of data.questions) {
      collected.push(item);
    }
  }

  if (collected.length === 0 && Array.isArray(payload)) {
    for (const item of payload) {
      collected.push(item);
    }
  }

  return { questions: collected, attempt, title };
}

export function convertTestrankingQuestionsToCleanTxt(
  rawQuestions: any[],
  meta: TestrankingConversionMeta = {}
): RbeConvertedAppxResult {
  const letters = ['A', 'B', 'C', 'D'] as const;
  const parsedQuestions: RbeConvertedAppxResult['questions'] = [];
  const lines: string[] = [];

  const headerTitle = meta.title || 'TestRanking Mock Test';
  const seriesTitle = meta.seriesTitle || 'TestRanking (testranking.in)';
  const subjectHeader = meta.subjectTitle || 'All Sections';

  lines.push('==================================================');
  lines.push(headerTitle.toUpperCase());
  lines.push(`SERIES: ${seriesTitle}`);
  lines.push(`SECTION: ${subjectHeader}`);
  lines.push(`TOTAL QUESTIONS: ${rawQuestions.length}`);
  lines.push('FORMAT: BILINGUAL (ENGLISH + HINDI)');
  lines.push(`SOURCE: ${meta.sourceLabel || 'testranking.in (TestRanking)'}`);
  lines.push('==================================================');
  lines.push('');

  let currentSection = '';

  rawQuestions.forEach((rawQ, idx) => {
    const qNum = idx + 1;
    const section = String(
      rawQ?.__sectionName || rawQ?.subject || meta.subjectTitle || 'GENERAL SECTION'
    )
      .trim()
      .toUpperCase();

    if (section && section !== currentSection) {
      currentSection = section;
      lines.push(`### [ ${currentSection} ] ###`);
      lines.push('');
    }

    const content = readBilingualField(rawQ?.content ?? rawQ?.question);
    const comp = readBilingualField(rawQ?.comprehension);
    const imageUrl =
      typeof rawQ?.imageUrl === 'string' && rawQ.imageUrl.trim() ? rawQ.imageUrl.trim() : '';

    let questionEn = content.en || content.hi || `Question ${qNum}`;
    let questionHi = content.hi && content.hi !== questionEn ? content.hi : '';

    if (comp.en) {
      questionEn = `[Passage]\n${comp.en}\n\n${questionEn}`;
    }
    if (comp.hi && comp.hi !== comp.en) {
      questionHi = questionHi
        ? `[गद्यांश]\n${comp.hi}\n\n${questionHi}`
        : `[गद्यांश]\n${comp.hi}`;
    } else if (comp.en && questionHi) {
      questionHi = `[Passage]\n${comp.en}\n\n${questionHi}`;
    }

    if (imageUrl && !questionEn.includes(imageUrl)) {
      questionEn = `${questionEn}\n[Question Figure: ${imageUrl}]`;
    }

    const rawOptsEn: string[] = Array.isArray(rawQ?.options?.en)
      ? rawQ.options.en.map((o: any) => cleanRbeAppxHtml(o))
      : Array.isArray(rawQ?.options)
      ? rawQ.options.map((o: any) => cleanRbeAppxHtml(o?.text ?? o))
      : [];
    const rawOptsHi: string[] = Array.isArray(rawQ?.options?.hi)
      ? rawQ.options.hi.map((o: any) => cleanRbeAppxHtml(o))
      : Array.isArray(rawQ?.options)
      ? rawQ.options.map((o: any) => cleanRbeAppxHtml(o?.textHi ?? ''))
      : [];

    const optionsEn: string[] = [];
    const optionsHi: string[] = [];

    for (let i = 0; i < 4; i++) {
      const enVal = rawOptsEn[i] || rawOptsHi[i] || '';
      const hiVal = rawOptsHi[i] || '';
      optionsEn.push(enVal);
      optionsHi.push(hiVal);
    }

    if (questionHi && questionHi !== questionEn) {
      lines.push(`Q${qNum}. ${questionEn}`);
      lines.push(`    ${questionHi}`);
    } else {
      lines.push(`Q${qNum}. ${questionEn}`);
    }

    for (let i = 0; i < 4; i++) {
      const letter = letters[i];
      const enOpt = optionsEn[i] || '';
      const hiOpt = optionsHi[i] || '';
      if (enOpt && hiOpt && enOpt !== hiOpt) {
        lines.push(`  (${letter}) ${enOpt} / ${hiOpt}`);
      } else {
        lines.push(`  (${letter}) ${enOpt || hiOpt || `Option ${letter}`}`);
      }
    }

    const correctOptionLetter = resolveCorrectLetter(rawQ);
    const correctIdx = correctOptionLetter ? letters.indexOf(correctOptionLetter) : -1;
    const correctText =
      correctIdx >= 0 ? optionsEn[correctIdx] || optionsHi[correctIdx] || '' : '';
    const answerClean =
      correctOptionLetter && correctText
        ? `(${correctOptionLetter}) ${correctText}`
        : correctOptionLetter
        ? `(${correctOptionLetter})`
        : '(N/A)';

    lines.push(
      correctOptionLetter
        ? correctText
          ? `Ans: (${correctOptionLetter}) ${correctText}`
          : `Ans: (${correctOptionLetter})`
        : 'Ans: (N/A)'
    );

    const expl = readBilingualField(rawQ?.explanation ?? rawQ?.solution);
    const explanationEn = expl.en || '';
    const explanationHi = expl.hi && expl.hi !== expl.en ? expl.hi : '';

    if (explanationEn) {
      lines.push(`Ex: ${explanationEn}`);
    }
    if (explanationHi) {
      lines.push('');
      lines.push('[Hindi / हिन्दी व्याख्या]:');
      lines.push(explanationHi);
    }

    lines.push('--------------------------------------------------');
    lines.push('');

    parsedQuestions.push({
      qNum,
      questionEn,
      questionHi,
      optionsEn,
      optionsHi,
      correctOptionLetter,
      answerClean,
      explanationEn,
      explanationHi,
      section,
    });
  });

  return {
    title: headerTitle,
    seriesTitle,
    totalQuestions: parsedQuestions.length,
    cleanTxt: lines.join('\n').trim() + '\n',
    questions: parsedQuestions,
    rawJson: JSON.stringify(rawQuestions, null, 2),
  };
}

export function convertTestrankingRawInputToCleanTxt(rawText: string): {
  cleanTxt: string;
  totalQuestions: number;
  title: string;
} {
  const trimmed = (rawText || '').trim();
  if (!trimmed) {
    throw new Error('Please paste TestRanking JSON or raw mock test text first.');
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const { questions, title } = extractRawQuestionsFromPayload(parsed);
      if (questions.length > 0 && (questions[0].content || questions[0].options?.en)) {
        const res = convertTestrankingQuestionsToCleanTxt(questions, {
          title: title || 'TestRanking Pasted Mock Test',
        });
        return {
          cleanTxt: res.cleanTxt,
          totalQuestions: res.totalQuestions,
          title: res.title,
        };
      }
    } catch {
      // fall through to universal converter
    }
  }

  return convertRbeRevolutionToCleanTxt(trimmed);
}
