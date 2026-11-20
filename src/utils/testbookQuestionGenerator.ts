/**
 * Testbook Full Mock Generator
 * Synthesizes authentic Testbook JSON test structures with complete bilingual (English + Hindi)
 * questions, options, correct answers, and step-by-step solutions when remote Testbook API
 * requires authentication (Pass Pro / SuperCoaching) or returns private/premium locks.
 */

import {
  REAL_REASONING_BANK,
  REAL_GA_BANK,
  REAL_ENGLISH_BANK,
  REAL_MATH_BANK,
  RealQuestionData,
} from './mockMatrixQuestionBank';
import { REAL_COMPUTER_BANK } from './oliveboardQuestionBank';
import { REAL_HINDI_BANK, REAL_AAO_FINANCE_BANK } from './rbeQuestionBank';

export interface TestbookGeneratedPayload {
  success: boolean;
  data: {
    _id: string;
    course: string;
    title: string;
    duration: number;
    paid: boolean;
    pass_pro: boolean;
    sections: Array<{
      _id: string;
      qCount: number;
      title: string;
      questions: any[];
    }>;
  };
}

export function generateTestbookMockPayload(
  testId: string,
  testTitle = 'Testbook Live Full Mock Test',
  courseName = 'SSC / General Competitive',
  customTargetTotal?: number
): TestbookGeneratedPayload {
  const normTitle = testTitle.toLowerCase();
  const isTier2 =
    normTitle.includes('tier-2') ||
    normTitle.includes('tier 2') ||
    normTitle.includes('mains') ||
    customTargetTotal === 130 ||
    customTargetTotal === 150;

  const isReasoningOnly =
    normTitle.includes('reasoning') ||
    normTitle.includes('general intelligence') ||
    normTitle.includes('tarkshakti');

  const isMathOnly =
    normTitle.includes('math') ||
    normTitle.includes('quantitative') ||
    normTitle.includes('ganit');

  const isEnglishOnly =
    normTitle.includes('english') ||
    normTitle.includes('comprehension');

  const isGaOnly =
    normTitle.includes('general awareness') ||
    normTitle.includes('general knowledge') ||
    normTitle.includes('current affairs') ||
    normTitle.includes('gk') ||
    normTitle.includes('gs');

  const isComputerOnly = normTitle.includes('computer');
  const isHindiOnly = normTitle.includes('hindi') || normTitle.includes('हिंदी');
  const isAaoOnly = normTitle.includes('aao') || normTitle.includes('finance') || normTitle.includes('economics');

  let sectionConfigs: Array<{
    name: string;
    id: string;
    bank: RealQuestionData[];
    count: number;
    posMarks: number;
    negMarks: number;
  }> = [];

  if (isReasoningOnly) {
    const qCount = customTargetTotal || 25;
    sectionConfigs = [
      {
        name: 'General Intelligence & Reasoning',
        id: 'sec_tb_reasoning',
        bank: REAL_REASONING_BANK,
        count: qCount,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  } else if (isMathOnly) {
    const qCount = customTargetTotal || 25;
    sectionConfigs = [
      {
        name: 'Quantitative Aptitude / Numerical Ability',
        id: 'sec_tb_maths',
        bank: REAL_MATH_BANK,
        count: qCount,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  } else if (isEnglishOnly) {
    const qCount = customTargetTotal || 25;
    sectionConfigs = [
      {
        name: 'English Language & Comprehension',
        id: 'sec_tb_english',
        bank: REAL_ENGLISH_BANK,
        count: qCount,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  } else if (isGaOnly) {
    const qCount = customTargetTotal || 25;
    sectionConfigs = [
      {
        name: 'General Awareness & Static GK',
        id: 'sec_tb_ga',
        bank: REAL_GA_BANK,
        count: qCount,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  } else if (isComputerOnly) {
    const qCount = customTargetTotal || 20;
    sectionConfigs = [
      {
        name: 'Computer Knowledge Module (Qualifying)',
        id: 'sec_tb_comp',
        bank: REAL_COMPUTER_BANK as RealQuestionData[],
        count: qCount,
        posMarks: 3,
        negMarks: 1,
      },
    ];
  } else if (isHindiOnly) {
    const qCount = customTargetTotal || 25;
    sectionConfigs = [
      {
        name: 'सामान्य हिन्दी एवं भाषा बोध (General Hindi)',
        id: 'sec_tb_hindi',
        bank: REAL_HINDI_BANK,
        count: qCount,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  } else if (isAaoOnly) {
    const qCount = customTargetTotal || 100;
    const half = Math.floor(qCount / 2);
    sectionConfigs = [
      {
        name: 'Part A: Financial Accounting & CAG Powers',
        id: 'sec_tb_aao_a',
        bank: REAL_AAO_FINANCE_BANK,
        count: half,
        posMarks: 2,
        negMarks: 0.5,
      },
      {
        name: 'Part B: Micro/Macro Economics & Fiscal Policy',
        id: 'sec_tb_aao_b',
        bank: REAL_AAO_FINANCE_BANK,
        count: qCount - half,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  } else if (isTier2) {
    // Tier-2 Mains 130 or 150 questions
    sectionConfigs = [
      {
        name: 'Section 1 - Module I: Mathematical Abilities',
        id: 'sec_tb_mains_math',
        bank: REAL_MATH_BANK,
        count: 30,
        posMarks: 3,
        negMarks: 1,
      },
      {
        name: 'Section 1 - Module II: Reasoning and General Intelligence',
        id: 'sec_tb_mains_reasoning',
        bank: REAL_REASONING_BANK,
        count: 30,
        posMarks: 3,
        negMarks: 1,
      },
      {
        name: 'Section 2 - Module I: English Language and Comprehension',
        id: 'sec_tb_mains_english',
        bank: REAL_ENGLISH_BANK,
        count: 45,
        posMarks: 3,
        negMarks: 1,
      },
      {
        name: 'Section 2 - Module II: General Awareness',
        id: 'sec_tb_mains_ga',
        bank: REAL_GA_BANK,
        count: 25,
        posMarks: 3,
        negMarks: 1,
      },
      {
        name: 'Section 3 - Module I: Computer Knowledge (Mains Special)',
        id: 'sec_tb_mains_comp',
        bank: REAL_COMPUTER_BANK as RealQuestionData[],
        count: 20,
        posMarks: 3,
        negMarks: 1,
      },
    ];
  } else {
    // Standard Full Mock (100 Questions)
    sectionConfigs = [
      {
        name: 'General Intelligence and Reasoning',
        id: 'sec_tb_pre_reasoning',
        bank: REAL_REASONING_BANK,
        count: 25,
        posMarks: 2,
        negMarks: 0.5,
      },
      {
        name: 'General Awareness',
        id: 'sec_tb_pre_ga',
        bank: REAL_GA_BANK,
        count: 25,
        posMarks: 2,
        negMarks: 0.5,
      },
      {
        name: 'Quantitative Aptitude',
        id: 'sec_tb_pre_math',
        bank: REAL_MATH_BANK,
        count: 25,
        posMarks: 2,
        negMarks: 0.5,
      },
      {
        name: 'English Comprehension',
        id: 'sec_tb_pre_english',
        bank: REAL_ENGLISH_BANK,
        count: 25,
        posMarks: 2,
        negMarks: 0.5,
      },
    ];
  }

  let globalQuestionIndex = 1;
  const sectionsPayload = sectionConfigs.map((sec) => {
    const qList = [];
    const bLen = sec.bank.length;

    for (let i = 0; i < sec.count; i++) {
      const q = sec.bank[i % bLen];
      const qId = `tb_q_${testId.slice(-6)}_${globalQuestionIndex}`;

      const enOptions = q.opts.map((optVal, optIdx) => ({
        prompt: String(optIdx + 1),
        value: optVal,
      }));

      const hnOptions = q.opts.map((optVal, optIdx) => ({
        prompt: String(optIdx + 1),
        value: optVal,
      }));

      qList.push({
        _id: qId,
        id: qId,
        type: 'mcq',
        posMarks: sec.posMarks,
        negMarks: sec.negMarks,
        en: {
          value: q.enQ,
          options: enOptions,
          solution: q.enSol,
          explanation: q.enSol,
        },
        hn: {
          value: q.hiQ || q.enQ,
          options: hnOptions,
          solution: q.hiSol || q.enSol,
          explanation: q.hiSol || q.enSol,
        },
        correctOption: q.ans,
        ans: q.ans,
        solution: q.enSol,
        source: (q as any).source || (q as any).examDetails || testTitle,
      });

      globalQuestionIndex++;
    }

    return {
      _id: sec.id,
      id: sec.id,
      title: sec.name,
      name: sec.name,
      qCount: qList.length,
      questions: qList,
    };
  });

  return {
    success: true,
    data: {
      _id: testId || '6a2138c574cd84724468b013',
      course: courseName,
      title: testTitle,
      duration: isTier2 ? 8100 : 3600,
      paid: true,
      pass_pro: true,
      sections: sectionsPayload,
    },
  };
}
