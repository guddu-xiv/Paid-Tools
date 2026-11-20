/**
 * Testwill (testwill.in / TestZone) Bilingual Question Converter
 * Converts Testwill GetTestData / Solution payloads (`sections[].questions[]` with
 * `questionInEnglish`, `questionInHindi`, `quesMaster`, `optRight`) into standard
 * Bilingual Clean .txt format + structured question cards compatible with PDF Studio.
 */

import {
  cleanRbeAppxHtml,
  convertRbeRevolutionToCleanTxt,
  RbeConvertedAppxResult,
} from './rbeRevolutionConverter';

export interface TestwillQuestionLangBlock {
  ques?: string;
  optA?: string;
  optB?: string;
  optC?: string;
  optD?: string;
  optE?: string;
  explanation?: string;
}

export interface TestwillRawQuestion {
  id?: string | number;
  quesMasterId?: string | number;
  optRight?: string;
  rightOption?: string;
  answer?: string | number;
  questionInEnglish?: TestwillQuestionLangBlock;
  questionInHindi?: TestwillQuestionLangBlock;
  direction?: string;
  directionHin?: string;
  explanation?: string;
  commonExplanation?: string;
  summary?: string;
  summaryHin?: string;
  sectionName?: string;
  catName?: string;
  // Fallback flat fields
  question?: string;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
}

export interface TestwillRawSection {
  catId?: string | number;
  name?: string;
  sectionName?: string;
  catName?: string;
  title?: string;
  questions?: TestwillRawQuestion[];
  quesMaster?: Array<{
    id?: string | number;
    quesMasterId?: string | number;
    direction?: string;
    directionHin?: string;
    passage?: string;
    passageHin?: string;
    explanation?: string;
    questionInEnglish?: { ques?: string; direction?: string; explanation?: string };
    questionInHindi?: { ques?: string; direction?: string; explanation?: string };
  }>;
}

function normalizeTestwillCorrectLetter(raw?: string | number | null): 'A' | 'B' | 'C' | 'D' | '' {
  if (raw === undefined || raw === null) return '';
  const s = String(raw).trim().toUpperCase();
  if (s === 'OPTA' || s === 'A' || s === '1' || s === 'OPT1' || s === 'OPT_1') return 'A';
  if (s === 'OPTB' || s === 'B' || s === '2' || s === 'OPT2' || s === 'OPT_2') return 'B';
  if (s === 'OPTC' || s === 'C' || s === '3' || s === 'OPT3' || s === 'OPT_3') return 'C';
  if (s === 'OPTD' || s === 'D' || s === '4' || s === 'OPT4' || s === 'OPT_4') return 'D';
  return '';
}

export function convertTestwillPayloadToCleanTxt(
  payload: any,
  meta: {
    id?: string;
    title: string;
    seriesTitle?: string;
    subjectTitle?: string;
  }
): RbeConvertedAppxResult {
  const testTitle = meta.title || payload?.testName || payload?.name || 'Testwill Practice Test';
  const seriesHeader = meta.seriesTitle || payload?.examName || 'Testwill (testwill.in)';
  const subjectHeader = meta.subjectTitle || 'All Sections';

  // Build master directions map from sections[].quesMaster or top-level quesMaster
  const masterMap = new Map<string, { dirEn: string; dirHi: string; exp: string }>();
  const rawSections: TestwillRawSection[] = Array.isArray(payload?.sections)
    ? payload.sections
    : Array.isArray(payload?.data?.sections)
    ? payload.data.sections
    : Array.isArray(payload?.questions)
    ? [{ name: subjectHeader, questions: payload.questions }]
    : Array.isArray(payload)
    ? [{ name: subjectHeader, questions: payload }]
    : [];

  const registerMasters = (list: any[] | undefined) => {
    if (!Array.isArray(list)) return;
    for (const m of list) {
      const mid = String(m?.id ?? m?.quesMasterId ?? '');
      if (!mid) continue;
      const dirEn = cleanRbeAppxHtml(
        m?.direction || m?.passage || m?.questionInEnglish?.direction || m?.questionInEnglish?.ques || ''
      );
      const dirHi = cleanRbeAppxHtml(
        m?.directionHin || m?.passageHin || m?.questionInHindi?.direction || m?.questionInHindi?.ques || ''
      );
      const exp = cleanRbeAppxHtml(m?.explanation || '');
      masterMap.set(mid, { dirEn, dirHi, exp });
    }
  };

  registerMasters(payload?.quesMaster);
  registerMasters(payload?.data?.quesMaster);
  for (const sec of rawSections) {
    registerMasters(sec.quesMaster);
  }

  const questions: RbeConvertedAppxResult['questions'] = [];
  const lines: string[] = [];

  // Count total questions first
  let totalCount = 0;
  for (const sec of rawSections) {
    if (Array.isArray(sec.questions)) totalCount += sec.questions.length;
  }

  lines.push('==================================================');
  lines.push(testTitle.toUpperCase());
  lines.push(`SERIES: ${seriesHeader}`);
  lines.push(`SECTION: ${subjectHeader}`);
  lines.push(`TOTAL QUESTIONS: ${totalCount}`);
  lines.push('STATUS: PAID (TRUE) - UNLOCKED FULL ACCESS');
  lines.push('FORMAT: BILINGUAL (ENGLISH + HINDI)');
  lines.push('SOURCE: testwill.in (Testwill / Careerwill)');
  lines.push('==================================================');
  lines.push('');

  let qNum = 0;
  let currentSection = '';

  for (const sec of rawSections) {
    const secName = (
      sec.name ||
      sec.sectionName ||
      sec.catName ||
      sec.title ||
      subjectHeader ||
      'GENERAL SECTION'
    )
      .trim()
      .toUpperCase();
    const secQuestions = Array.isArray(sec.questions) ? sec.questions : [];

    for (const rawQ of secQuestions) {
      qNum += 1;

      const resolvedSec = (rawQ.sectionName || rawQ.catName || secName).trim().toUpperCase();
      if (resolvedSec && resolvedSec !== currentSection) {
        currentSection = resolvedSec;
        lines.push(`### [ ${currentSection} ] ###`);
        lines.push('');
      }

      const master = rawQ.quesMasterId ? masterMap.get(String(rawQ.quesMasterId)) : undefined;
      const enBlock = rawQ.questionInEnglish || {};
      const hiBlock = rawQ.questionInHindi || {};

      const dirEn = cleanRbeAppxHtml(rawQ.direction || '') || master?.dirEn || '';
      const dirHi = cleanRbeAppxHtml(rawQ.directionHin || '') || master?.dirHi || '';

      let qEnText = cleanRbeAppxHtml(enBlock.ques || rawQ.question || '');
      let qHiText = cleanRbeAppxHtml(hiBlock.ques || '');

      if (dirEn && !qEnText.includes(dirEn.slice(0, 40))) {
        qEnText = qEnText ? `${dirEn}\n${qEnText}` : dirEn;
      }
      if (dirHi && !qHiText.includes(dirHi.slice(0, 40))) {
        qHiText = qHiText ? `${dirHi}\n${qHiText}` : dirHi;
      }

      if (qEnText && qHiText && qEnText !== qHiText) {
        lines.push(`Q${qNum}. ${qEnText}`);
        lines.push(`    ${qHiText}`);
      } else {
        lines.push(`Q${qNum}. ${qEnText || qHiText || `Question ${qNum}`}`);
      }

      const letters = ['A', 'B', 'C', 'D'] as const;
      const optKeys = ['optA', 'optB', 'optC', 'optD'] as const;
      const fallbackKeys = ['option_1', 'option_2', 'option_3', 'option_4'] as const;
      const optionsEn: string[] = [];
      const optionsHi: string[] = [];

      for (let i = 0; i < 4; i++) {
        const k = optKeys[i];
        const fk = fallbackKeys[i];
        const oEn = cleanRbeAppxHtml(enBlock[k] || rawQ[fk] || '');
        const oHi = cleanRbeAppxHtml(hiBlock[k] || '');
        optionsEn.push(oEn);
        optionsHi.push(oHi);

        const letter = letters[i];
        if (oEn && oHi && oEn !== oHi) {
          lines.push(`  (${letter}) ${oEn} / ${oHi}`);
        } else {
          lines.push(`  (${letter}) ${oEn || oHi || `Option ${letter}`}`);
        }
      }

      const correctLetter =
        normalizeTestwillCorrectLetter(rawQ.optRight ?? rawQ.rightOption ?? rawQ.answer) || 'A';
      const correctIdx = letters.indexOf(correctLetter as 'A' | 'B' | 'C' | 'D');
      const correctText =
        (correctIdx >= 0 ? optionsEn[correctIdx] || optionsHi[correctIdx] : '') || '';

      if (correctText) {
        lines.push(`Ans: (${correctLetter}) ${correctText}`);
      } else {
        lines.push(`Ans: (${correctLetter})`);
      }

      const solEn = cleanRbeAppxHtml(
        enBlock.explanation || rawQ.explanation || rawQ.commonExplanation || master?.exp || ''
      );
      const solHi = cleanRbeAppxHtml(hiBlock.explanation || '');

      if (solEn) {
        lines.push(`Ex: ${solEn}`);
      }
      if (solHi && solHi !== solEn) {
        lines.push('');
        lines.push('[Hindi / हिन्दी व्याख्या]:');
        lines.push(solHi);
      } else if (!solEn && solHi) {
        lines.push(`Ex: ${solHi}`);
      }

      lines.push('--------------------------------------------------');
      lines.push('');

      questions.push({
        qNum,
        questionEn: qEnText,
        questionHi: qHiText,
        optionsEn,
        optionsHi,
        correctOptionLetter: correctLetter,
        answerClean: correctText || `(${correctLetter})`,
        explanationEn: solEn,
        explanationHi: solHi,
        section: resolvedSec,
      });
    }
  }

  return {
    title: testTitle,
    seriesTitle: seriesHeader,
    totalQuestions: questions.length,
    cleanTxt: lines.join('\n').trim() + '\n',
    questions,
    rawJson: JSON.stringify(payload, null, 2),
  };
}

/**
 * Manual Paste converter: automatically handles Testwill JSON (`sections` / `questionInEnglish`)
 * and falls back seamlessly to the generic bilingual exam text/JSON parser.
 */
export function convertTestwillManualInput(rawText: string): {
  cleanTxt: string;
  totalQuestions: number;
  title: string;
} {
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const hasTestwillShape =
        Array.isArray(parsed?.sections) ||
        Array.isArray(parsed?.data?.sections) ||
        (Array.isArray(parsed) && parsed.some((q: any) => q?.questionInEnglish || q?.questionInHindi));
      if (hasTestwillShape) {
        const res = convertTestwillPayloadToCleanTxt(parsed, {
          title: parsed?.testName || parsed?.data?.testName || 'Testwill Mock Test',
          seriesTitle: parsed?.examName || parsed?.data?.examName || 'Testwill (testwill.in)',
        });
        if (res.totalQuestions > 0) {
          return {
            cleanTxt: res.cleanTxt,
            totalQuestions: res.totalQuestions,
            title: res.title,
          };
        }
      }
    } catch {
      // fall through to generic converter
    }
  }

  const fallback = convertRbeRevolutionToCleanTxt(rawText);
  return {
    cleanTxt: fallback.cleanTxt,
    totalQuestions: fallback.totalQuestions,
    title: fallback.title,
  };
}
