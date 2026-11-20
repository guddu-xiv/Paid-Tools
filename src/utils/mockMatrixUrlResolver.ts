/**
 * Universal Mock Matrix Hub URL resolver, chapter crawler, and comprehensive
 * question generator for all exams, subjects, and mock formats.
 */

import {
  getRealReasoningQuestion,
  getRealGeneralAwarenessQuestion,
  getRealEnglishQuestion,
  getRealMathQuestion,
} from './mockMatrixQuestionBank';

export {
  getRealReasoningQuestion,
  getRealGeneralAwarenessQuestion,
  getRealEnglishQuestion,
  getRealMathQuestion,
};

export interface MockMatrixChapterItem {
  id: string;
  quizId?: string;
  section?: string;
  partNumber?: number;
  partsCount?: number;
  topic?: string;
  subtopic?: string;
  chapterName: string;
  title: string;
  subject: string;
  year: string;
  totalQs: number;
  type?: 'free' | 'paid';
  isFullMock?: boolean;
  testUrl?: string;
}

export interface ResolvedMockMatrixResult {
  success: boolean;
  url: string;
  examId: string;
  examTitle: string;
  board: string;
  year: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  totalChapters: number;
  totalQuestions: number;
  chapters: MockMatrixChapterItem[];
  availableSubjects?: string[];
  availableYears?: string[];
  isFullMock?: boolean;
}

/**
 * Pre-indexed fallback chapters for SSC 2026 Math
 */
export const FALLBACK_SSC_2026_MATH_CHAPTERS: MockMatrixChapterItem[] = [
  { id: 'SSC-SUB-26-MATH-SIMPLIFICATION-AND-APPROXIMATION', chapterName: 'SIMPLIFICATION AND APPROXIMATION', title: 'SSC 2026 SIMPLIFICATION AND APPROXIMATION', subject: 'Math', year: '2026', totalQs: 54, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-NUMBER-SYSTEM', chapterName: 'NUMBER SYSTEM', title: 'SSC 2026 NUMBER SYSTEM', subject: 'Math', year: '2026', totalQs: 50, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-LCM-AND-HCF', chapterName: 'LCM AND HCF', title: 'SSC 2026 LCM AND HCF', subject: 'Math', year: '2026', totalQs: 5, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-AVERAGE', chapterName: 'AVERAGE', title: 'SSC 2026 AVERAGE', subject: 'Math', year: '2026', totalQs: 21, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-PERCENTAGE', chapterName: 'PERCENTAGE', title: 'SSC 2026 PERCENTAGE', subject: 'Math', year: '2026', totalQs: 19, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-RATIO-AND-PROPORTION', chapterName: 'RATIO AND PROPORTION', title: 'SSC 2026 RATIO AND PROPORTION', subject: 'Math', year: '2026', totalQs: 19, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-PROFIT-AND-LOSS', chapterName: 'PROFIT AND LOSS', title: 'SSC 2026 PROFIT AND LOSS', subject: 'Math', year: '2026', totalQs: 25, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-DISCOUNT', chapterName: 'DISCOUNT', title: 'SSC 2026 DISCOUNT', subject: 'Math', year: '2026', totalQs: 31, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-SIMPLE-INTEREST-SI', chapterName: 'SIMPLE INTEREST (SI)', title: 'SSC 2026 SIMPLE INTEREST (SI)', subject: 'Math', year: '2026', totalQs: 16, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-COMPOUND-INTEREST-CI', chapterName: 'COMPOUND INTEREST (CI)', title: 'SSC 2026 COMPOUND INTEREST (CI)', subject: 'Math', year: '2026', totalQs: 18, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-PARTNERSHIP', chapterName: 'PARTNERSHIP', title: 'SSC 2026 PARTNERSHIP', subject: 'Math', year: '2026', totalQs: 15, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-MIXTURE-AND-ALLIGATION', chapterName: 'MIXTURE AND ALLIGATION', title: 'SSC 2026 MIXTURE AND ALLIGATION', subject: 'Math', year: '2026', totalQs: 29, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-TIME-AND-WORK', chapterName: 'TIME AND WORK', title: 'SSC 2026 TIME AND WORK', subject: 'Math', year: '2026', totalQs: 38, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-TIME-SPEED-AND-DISTANCE', chapterName: 'TIME SPEED AND DISTANCE', title: 'SSC 2026 TIME SPEED AND DISTANCE', subject: 'Math', year: '2026', totalQs: 25, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-BOAT-AND-STREAM', chapterName: 'BOAT AND STREAM', title: 'SSC 2026 BOAT AND STREAM', subject: 'Math', year: '2026', totalQs: 2, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-PROBLEMS-ON-TRAINS', chapterName: 'PROBLEMS ON TRAINS', title: 'SSC 2026 PROBLEMS ON TRAINS', subject: 'Math', year: '2026', totalQs: 18, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-PIPE-AND-CISTERN', chapterName: 'PIPE AND CISTERN', title: 'SSC 2026 PIPE AND CISTERN', subject: 'Math', year: '2026', totalQs: 14, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-ALGEBRA', chapterName: 'ALGEBRA', title: 'SSC 2026 ALGEBRA', subject: 'Math', year: '2026', totalQs: 56, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-PROGRESSION', chapterName: 'PROGRESSION', title: 'SSC 2026 PROGRESSION', subject: 'Math', year: '2026', totalQs: 4, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-GEOMETRY', chapterName: 'GEOMETRY', title: 'SSC 2026 GEOMETRY', subject: 'Math', year: '2026', totalQs: 58, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-MENSURATION-2D', chapterName: 'MENSURATION (2D)', title: 'SSC 2026 MENSURATION (2D)', subject: 'Math', year: '2026', totalQs: 58, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-MENSURATION-3D', chapterName: 'MENSURATION (3D)', title: 'SSC 2026 MENSURATION (3D)', subject: 'Math', year: '2026', totalQs: 77, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-TRIGONOMETRY', chapterName: 'TRIGONOMETRY', title: 'SSC 2026 TRIGONOMETRY', subject: 'Math', year: '2026', totalQs: 39, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-HEIGHT-AND-DISTANCE', chapterName: 'HEIGHT AND DISTANCE', title: 'SSC 2026 HEIGHT AND DISTANCE', subject: 'Math', year: '2026', totalQs: 10, type: 'paid' },
  { id: 'SSC-SUB-26-MATH-COORDINATE-GEOMETRY', chapterName: 'COORDINATE GEOMETRY', title: 'SSC 2026 COORDINATE GEOMETRY', subject: 'Math', year: '2026', totalQs: 14, type: 'paid' },
];

/**
 * Parse a Mock Matrix Hub URL and extract exam parameters.
 */
export function parseMockMatrixUrlParams(rawUrl: string): {
  examId: string;
  board: string;
  year: string;
  tier: string;
  filterType: string;
  category: string;
  subject: string;
  topic: string;
  subtopic: string;
  isFullMock: boolean;
} {
  let cleanUrl = rawUrl.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://mockmatrixhub.in/${cleanUrl.replace(/^\/+/, '')}`;
  }

  try {
    const u = new URL(cleanUrl);
    const isFullMock = u.pathname.includes('/mocks') || u.pathname.includes('mocks.html');

    let examId = '';
    for (const k of u.searchParams.keys()) {
      if (
        k !== 'b' &&
        k !== 'filter' &&
        k !== 'year' &&
        k !== 'subject' &&
        k !== 'topic' &&
        k !== 'subtopic'
      ) {
        examId = k;
        break;
      }
    }
    if (!examId) {
      if (u.pathname.includes('chapters-wise')) {
        examId = 'ssc-sub';
      } else {
        const parts = u.pathname.split('/').filter(Boolean);
        examId = parts[parts.length - 1]?.replace(/\.html$/i, '') || (isFullMock ? 'chsl' : 'ssc-sub');
      }
    }

    const board = u.searchParams.get('b') || 'ssc';
    const rawFilter = u.searchParams.get('filter') || '';
    const filterMap: Record<string, string> = {};

    if (rawFilter) {
      rawFilter.split(',').forEach((part) => {
        const eqIdx = part.indexOf('=');
        if (eqIdx > -1) {
          const k = part.slice(0, eqIdx).trim().toLowerCase();
          const v = part.slice(eqIdx + 1).trim();
          if (k) {
            try {
              filterMap[k] = decodeURIComponent(v.replace(/\+/g, ' '));
            } catch {
              filterMap[k] = v;
            }
          }
        }
      });
    }

    const directYear = u.searchParams.get('year');
    const directSub = u.searchParams.get('subject');
    const directTopic = u.searchParams.get('topic');
    const directSubtopic = u.searchParams.get('subtopic');

    const year = filterMap['year'] || directYear || '';
    const tier = filterMap['tier'] || '';
    const filterType = filterMap['type'] || 'full_mocks';
    const category = filterMap['category'] || '';
    const subject = filterMap['subject'] || directSub || (isFullMock ? 'Full Mock' : 'ALL');
    const topic = filterMap['topic'] || directTopic || '';
    const subtopic = filterMap['subtopic'] || directSubtopic || '';

    return {
      examId,
      board,
      year: year || '2026',
      tier,
      filterType,
      category,
      subject,
      topic,
      subtopic,
      isFullMock,
    };
  } catch {
    return {
      examId: 'ssc-sub',
      board: 'ssc',
      year: '2026',
      tier: 'tier1',
      filterType: 'full_mocks',
      category: '',
      subject: 'Math',
      topic: '',
      subtopic: '',
      isFullMock: false,
    };
  }
}

function expandTopicParts(
  meta: any,
  chapName: string,
  subName: string,
  targetYear: string,
  defaultCfg: any
): MockMatrixChapterItem[] {
  if (Array.isArray(meta)) {
    return meta.map((item: any, idx: number) => ({
      id: String(item.id || `${chapName}-${idx + 1}`),
      quizId: String(item.quizId || item.id || ''),
      section: item.section || undefined,
      partNumber: idx + 1,
      partsCount: meta.length,
      topic: chapName,
      chapterName: item.title || `${chapName} PART-${idx + 1}`,
      title: item.title || `SSC ${targetYear} ${chapName} PART-${idx + 1}`,
      subject: subName,
      year: targetYear,
      totalQs: Number(item.qs || item.totalQs || 25),
      type: item.type || 'paid',
      testUrl: item.link || undefined,
    }));
  }

  const cfg = defaultCfg || {};
  const baseId = String(meta.id || meta.commonId || meta.baseId || '');
  const baseTitle = String(meta.title || meta.commonTitle || `SSC ${targetYear} ${chapName}`);
  const partQs = Number(meta.partQs ?? meta.qsPerPart ?? cfg.partQs ?? 25) || 25;
  const totalQs = Number(meta.totalQs ?? meta.total_qs ?? meta.qs ?? 0) || 25;
  const mergeLast =
    meta.mergeLast != null ? !!meta.mergeLast : cfg.mergeLast != null ? !!cfg.mergeLast : true;
  const mergeThreshold = Number(meta.mergeThreshold ?? cfg.mergeThreshold ?? 15) || 15;
  const suffixId = String(meta.partSuffixId ?? cfg.partSuffixId ?? '-part-');
  const suffixTitle = String(meta.partSuffixTitle ?? cfg.partSuffixTitle ?? ' PART-');
  const defaultType: 'free' | 'paid' = meta.type === 'free' ? 'free' : 'paid';

  let partCounts: number[] = [];
  if (Array.isArray(meta.parts) && meta.parts.length > 0) {
    partCounts = meta.parts.map((p: any) =>
      typeof p === 'object' && p !== null ? Number(p.qs || partQs) : Number(p || partQs)
    );
  } else if (totalQs <= partQs) {
    partCounts = [totalQs];
  } else {
    const count = Math.floor(totalQs / partQs);
    const rem = totalQs % partQs;
    if (rem === 0) {
      partCounts = Array(count).fill(partQs);
    } else if (mergeLast && rem < mergeThreshold && count >= 1) {
      partCounts = Array(count - 1).fill(partQs);
      partCounts.push(partQs + rem);
    } else {
      partCounts = Array(count).fill(partQs);
      partCounts.push(rem);
    }
  }

  const typesList: Array<'free' | 'paid'> | null = Array.isArray(meta.types) ? meta.types : null;

  return partCounts.map((pQs, idx) => {
    const pNum = idx + 1;
    let pType: 'free' | 'paid' = defaultType;
    if (typesList && idx < typesList.length) {
      pType = typesList[idx];
    } else if (meta.freeParts != null) {
      pType = pNum <= Number(meta.freeParts) ? 'free' : 'paid';
    }
    const sectionName = `PART-${pNum}`;
    return {
      id: `${baseId}${suffixId}${pNum}`,
      quizId: baseId,
      section: sectionName,
      partNumber: pNum,
      partsCount: partCounts.length,
      topic: chapName,
      chapterName: `${chapName}${suffixTitle}${pNum}`,
      title: `${baseTitle}${suffixTitle}${pNum}`,
      subject: subName,
      year: targetYear,
      totalQs: pQs,
      type: pType,
      testUrl: `https://mockmatrixhub.in/exams/test.html?id=${encodeURIComponent(baseId)}&section=${encodeURIComponent(sectionName)}`,
    };
  });
}

/**
 * Fetch and resolve all chapters or full mocks for any Mock Matrix URL.
 */
export async function resolveMockMatrixChapters(rawUrl: string): Promise<ResolvedMockMatrixResult> {
  const { examId, board, year, tier, filterType, subject, topic, subtopic, isFullMock } =
    parseMockMatrixUrlParams(rawUrl);

  try {
    // -------------------------------------------------------------------------
    // CASE 1: FULL MOCK URL (e.g. mocks?steno&b=ssc or mocks?chsl&b=ssc)
    // -------------------------------------------------------------------------
    if (isFullMock) {
      const dataFile = `${examId}-data.json`;
      const mainUrl = `https://data.mockmatrixhub.in/data/${dataFile}`;
      const mainRes = await fetch(mainUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
        },
      });

      if (!mainRes.ok) {
        throw new Error(`Failed to load ${dataFile}: HTTP ${mainRes.status}`);
      }

      const mockData = await mainRes.json();
      const tiersContainer = mockData.data?.['PYQ MOCK'] || mockData.data || {};
      const mockItems: MockMatrixChapterItem[] = [];

      for (const [tierName, tierObj] of Object.entries<any>(tiersContainer)) {
        if (!tierObj || typeof tierObj !== 'object') continue;
        if (tier && !tierName.toLowerCase().includes(tier.toLowerCase())) continue;

        const availableYears = Object.keys(tierObj);
        // If requested year exists in data, match it. If not, match available year (e.g. 2025 for CHSL)
        const matchSpecificYear = year && year !== 'ALL' && tierObj[year] ? year : '';

        for (const [yKey, yObj] of Object.entries<any>(tierObj)) {
          if (!yObj || typeof yObj !== 'object') continue;
          if (matchSpecificYear && yKey !== matchSpecificYear) continue;

          const list =
            filterType === 'full_mocks'
              ? yObj.full_mocks || []
              : filterType === 'subject_wise'
                ? yObj.subject_wise || []
                : yObj.full_mocks || yObj.subject_wise || [];

          const fullMocks = Array.isArray(list) ? list : [];
          fullMocks.forEach((m: any, mIdx: number) => {
            const mTitle = m.title || `${examId.toUpperCase()} ${yKey} Mock ${mIdx + 1}`;
            const defaultQs = examId.toLowerCase() === 'steno' ? 200 : 100;
            mockItems.push({
              id: m.id || `${examId.toUpperCase()}-${yKey}-MOCK-${mIdx + 1}`,
              chapterName: mTitle,
              title: mTitle,
              subject: `${examId.toUpperCase()} Full Mock (${tierName.toUpperCase()})`,
              year: yKey,
              totalQs: m.qs || defaultQs,
              type: m.type || 'free',
              isFullMock: true,
            });
          });
        }
      }

      const totalQuestions = mockItems.reduce((acc, c) => acc + (c.totalQs || 100), 0);

      return {
        success: true,
        url: rawUrl,
        examId,
        examTitle: `SSC ${examId.toUpperCase()} ${year || ''} Full Mocks (${mockItems.length} Tests Available)`,
        board,
        year: year || '2026',
        subject: 'Full Mock',
        totalChapters: mockItems.length,
        totalQuestions,
        chapters: mockItems,
        availableSubjects: ['Full Mock (Tier 1)', 'Tier 2'],
        availableYears: ['2026', '2025', '2024'],
        isFullMock: true,
      };
    }

    // -------------------------------------------------------------------------
    // CASE 2: CHAPTER-WISE URL (General Awareness, English, Reasoning, Math)
    // -------------------------------------------------------------------------
    const dataFile = `${examId || 'ssc-sub'}-data.json`;
    const mainUrl = `https://data.mockmatrixhub.in/data/${dataFile}`;
    const mainRes = await fetch(mainUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!mainRes.ok) {
      throw new Error(`Failed to load ${dataFile}: HTTP ${mainRes.status}`);
    }

    const mainJson = await mainRes.json();
    const availableYears: string[] = mainJson.years || ['2026', '2025'];
    const targetYear = year || availableYears[0] || '2026';
    const yearFile = mainJson.yearFiles?.[targetYear] || `${examId}-${targetYear}.json`;

    // Fetch year file
    const yearUrl = `https://data.mockmatrixhub.in/data/${yearFile}`;
    const yearRes = await fetch(yearUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    if (!yearRes.ok) {
      throw new Error(`Failed to load ${yearFile}: HTTP ${yearRes.status}`);
    }

    const yearData = await yearRes.json();
    const defaultCfg = yearData.config?.default || yearData[targetYear]?.config?.default || {};
    const yearRoot = yearData[targetYear] || yearData;
    const availableSubjects = Object.keys(yearRoot).filter((k) => k !== 'config' && k !== 'year');

    const isAllSubjects = !subject || subject.toUpperCase() === 'ALL';
    const hasTopicFilter = Boolean(topic && topic.trim());
    const normTopic = (topic || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
    const normSubtopic = (subtopic || '').trim().toLowerCase().replace(/[_-]+/g, ' ');

    const topicEntries: Array<{
      chapName: string;
      subtopicName?: string;
      subName: string;
      meta: any;
    }> = [];

    availableSubjects.forEach((subName) => {
      if (isAllSubjects || subName.toLowerCase() === subject.toLowerCase()) {
        const subMap = yearRoot[subName] || {};
        for (const [chapName, rawMeta] of Object.entries<any>(subMap)) {
          if (!rawMeta) continue;

          if (rawMeta.id || Array.isArray(rawMeta) || rawMeta.totalQs != null) {
            topicEntries.push({ chapName, subName, meta: rawMeta });
          } else if (typeof rawMeta === 'object') {
            for (const [subTopicName, subMeta] of Object.entries<any>(rawMeta)) {
              if (subMeta && (subMeta.id || Array.isArray(subMeta) || subMeta.totalQs != null)) {
                topicEntries.push({
                  chapName,
                  subtopicName: subTopicName,
                  subName,
                  meta: subMeta,
                });
              }
            }
          }
        }
      }
    });

    let matchedEntries = topicEntries;
    if (hasTopicFilter) {
      const exactTopicMatches = topicEntries.filter((e) => {
        const cn = e.chapName.toLowerCase().replace(/[_-]+/g, ' ');
        const combined = e.subtopicName
          ? `${e.chapName}: ${e.subtopicName}`.toLowerCase().replace(/[_-]+/g, ' ')
          : cn;
        return cn === normTopic || combined === normTopic;
      });
      if (exactTopicMatches.length > 0) {
        matchedEntries = exactTopicMatches;
      } else {
        const partial = topicEntries.filter((e) => {
          const combined = `${e.chapName} ${e.subtopicName || ''}`.toLowerCase().replace(/[_-]+/g, ' ');
          return combined.includes(normTopic);
        });
        if (partial.length > 0) matchedEntries = partial;
      }
    }

    if (normSubtopic) {
      const subMatches = matchedEntries.filter(
        (e) =>
          e.subtopicName &&
          e.subtopicName.toLowerCase().replace(/[_-]+/g, ' ').includes(normSubtopic)
      );
      if (subMatches.length > 0) matchedEntries = subMatches;
    }

    const finalChapters: MockMatrixChapterItem[] = [];

    if (hasTopicFilter) {
      // Expand all real parts (PART-1, PART-2, ..., PART-21) just like mockmatrixhub.in/exams/chapters-wise!
      for (const entry of matchedEntries) {
        const label = entry.subtopicName
          ? `${entry.chapName}: ${entry.subtopicName}`
          : entry.chapName;
        const expanded = expandTopicParts(
          entry.meta,
          label,
          entry.subName,
          targetYear,
          defaultCfg
        );
        for (const p of expanded) {
          if (entry.subtopicName) p.subtopic = entry.subtopicName;
          finalChapters.push(p);
        }
      }
    } else {
      // Overview mode: list all chapters in the selected subject with their real part counts & PART-1 test metadata
      for (const entry of matchedEntries) {
        const label = entry.subtopicName
          ? `${entry.chapName}: ${entry.subtopicName}`
          : entry.chapName;
        const expanded = expandTopicParts(
          entry.meta,
          label,
          entry.subName,
          targetYear,
          defaultCfg
        );
        const firstPart = expanded[0];
        const totalTopicQs = expanded.reduce((acc, p) => acc + p.totalQs, 0);
        finalChapters.push({
          id: entry.meta.id || firstPart?.id || label,
          quizId: entry.meta.id || firstPart?.quizId || '',
          section: firstPart?.section || 'PART-1',
          partNumber: 1,
          partsCount: expanded.length,
          topic: entry.chapName,
          subtopic: entry.subtopicName,
          chapterName: label,
          title: entry.meta.title || `SSC ${targetYear} ${label}`,
          subject: entry.subName,
          year: targetYear,
          totalQs: totalTopicQs,
          type: entry.meta.type || 'paid',
          testUrl: firstPart?.testUrl,
        });
      }
    }

    const totalQuestions = finalChapters.reduce((acc, c) => acc + (c.totalQs || 0), 0);

    return {
      success: true,
      url: rawUrl,
      examId,
      examTitle: topic
        ? `SSC ${targetYear} ${subject || 'Chapter-Wise'} — ${topic}${subtopic ? ` (${subtopic})` : ''}`
        : `SSC ${targetYear} Chapter-Wise (${subject || 'All Subjects'})`,
      board,
      year: targetYear,
      subject: isAllSubjects ? 'ALL' : subject,
      topic: topic || undefined,
      subtopic: subtopic || undefined,
      totalChapters: finalChapters.length,
      totalQuestions,
      chapters: finalChapters,
      availableSubjects,
      availableYears,
      isFullMock: false,
    };
  } catch (err: unknown) {
    console.warn('Network resolve failed, using pre-indexed fallback:', err);
    const targetChapters = FALLBACK_SSC_2026_MATH_CHAPTERS;
    const totalQuestions = targetChapters.reduce((acc, c) => acc + c.totalQs, 0);

    return {
      success: true,
      url: rawUrl,
      examId: 'ssc-sub',
      examTitle: `SSC ${year} Chapter-Wise (Math)`,
      board: 'ssc',
      year,
      subject: 'Math',
      totalChapters: targetChapters.length,
      totalQuestions,
      chapters: targetChapters,
      availableSubjects: ['Math', 'Reasoning', 'English', 'General Awareness'],
      availableYears: ['2026', '2025'],
      isFullMock: false,
    };
  }
}

/**
 * Universal question generator for any subject (General Awareness, English, Reasoning, Math, Full Mock)
 */
export function generateChapterPracticeQuestions(
  chapterName: string,
  subject: string,
  year: string,
  targetCount: number = 25
) {
  const norm = chapterName.toUpperCase();
  const subNorm = (subject || '').toUpperCase();
  const count = Math.max(1, Math.min(250, targetCount));
  const questions: any[] = [];

  // ---------------------------------------------------------------------------
  // A. FULL MOCKS (STENO, CHSL, CGL, MTS) - GENERATE REAL MULTI-SECTION QUESTIONS
  // ---------------------------------------------------------------------------
  const isChapterSubjectOnly =
    subNorm === 'ENGLISH' ||
    subNorm === 'MATH' ||
    subNorm === 'MATHEMATICS' ||
    subNorm === 'REASONING' ||
    subNorm === 'GENERAL AWARENESS' ||
    subNorm === 'COMPUTER';

  const isMultiSectionFullMock =
    !isChapterSubjectOnly &&
    (subNorm.includes('FULL MOCK') ||
      norm.includes('FULL MOCK') ||
      norm.includes('MOCK ') ||
      norm.includes('SHIFT') ||
      count >= 100);

  if (isMultiSectionFullMock) {
    const isSteno = norm.includes('STENO') || subNorm.includes('STENO');

    for (let i = 1; i <= count; i++) {
      if (isSteno) {
        // SSC Stenographer syllabus: 50 Reasoning + 50 GA + 100 English = 200 Questions
        if (i <= 50) {
          questions.push(getRealReasoningQuestion(i, year, 'General Intelligence & Reasoning'));
        } else if (i <= 100) {
          questions.push(getRealGeneralAwarenessQuestion(i, year, 'General Awareness'));
        } else {
          questions.push(getRealEnglishQuestion(i, year, 'English Language & Comprehension'));
        }
      } else {
        // Standard 4-section 100-question pattern (CGL, CHSL, CPO, MTS)
        if (i <= 25) {
          questions.push(getRealReasoningQuestion(i, year, 'Reasoning'));
        } else if (i <= 50) {
          questions.push(getRealGeneralAwarenessQuestion(i, year, 'General Awareness'));
        } else if (i <= 75) {
          questions.push(getRealMathQuestion(i, year, 'Quantitative Aptitude'));
        } else {
          questions.push(getRealEnglishQuestion(i, year, 'English Comprehension'));
        }
      }
    }
    return questions;
  }

  // ---------------------------------------------------------------------------
  // B. GENERAL AWARENESS (History, Polity, Geography, Static GK, Science)
  // ---------------------------------------------------------------------------
  if (subNorm.includes('GENERAL AWARENESS') || subNorm.includes('GA') || subNorm.includes('GK')) {
    for (let i = 1; i <= count; i++) {
      questions.push(getRealGeneralAwarenessQuestion(i, year, chapterName));
    }
    return questions;
  }

  // ---------------------------------------------------------------------------
  // C. ENGLISH (Synonyms, Antonyms, Idioms, One-Word, Grammar, Cloze Test)
  // ---------------------------------------------------------------------------
  if (subNorm.includes('ENGLISH')) {
    for (let i = 1; i <= count; i++) {
      questions.push(getRealEnglishQuestion(i, year, chapterName));
    }
    return questions;
  }

  // ---------------------------------------------------------------------------
  // D. REASONING (Series, Syllogism, Blood Relations, Coding, Analogy)
  // ---------------------------------------------------------------------------
  if (subNorm.includes('REASONING') || norm.includes('SERIES') || norm.includes('SYLLOGISM') || norm.includes('CODING')) {
    for (let i = 1; i <= count; i++) {
      questions.push(getRealReasoningQuestion(i, year, chapterName));
    }
    return questions;
  }

  // ---------------------------------------------------------------------------
  // E. MATH (Arithmetic, Advanced, Mensuration, Algebra)
  // ---------------------------------------------------------------------------
  for (let i = 1; i <= count; i++) {
    questions.push(getRealMathQuestion(i, year, chapterName));
  }

  return questions;
}
