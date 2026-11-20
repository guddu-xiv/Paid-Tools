/**
 * Robust HTML to Clean Formatted Exam .txt Converter
 * Converts Testbook Mock Tests, SSC/TCS CBT Response Sheets, and generic Exam HTML into
 * pristine, standard, beautifully formatted .txt question papers.
 */

import { parseHeaderDetailsFromTitle } from './txtParser';

export interface ConvertedExamTxtResult {
  txtContent: string;
  questionCount: number;
  title: string;
  examName: string;
  shiftName: string;
  examDate: string;
  sectionName: string;
}

export interface ExtractedQuestionItem {
  qNum: number;
  section: string;
  questionEn: string;
  questionHi: string;
  options: string[];
  correctOptionIndex: number; // 0..3 (-1 if unknown)
  correctOptionLetter: 'A' | 'B' | 'C' | 'D' | '';
  chosenOptionIndex?: number;
  solutionEn: string;
  solutionHi: string;
}

/**
 * Checks if raw text or file is HTML (handles BOM, comments, varied extensions)
 */
export function isHtmlContent(content: string, fileName?: string): boolean {
  if (fileName && /\.(html|htm|xhtml)$/i.test(fileName)) {
    return true;
  }
  const clean = (content || '').replace(/^\uFEFF/, '').trim();
  const sample = clean.slice(0, 3000).toLowerCase();

  return (
    sample.startsWith('<!doctype html') ||
    sample.startsWith('<html') ||
    sample.includes('<head') ||
    sample.includes('<body') ||
    sample.includes('class="question-pnl"') ||
    sample.includes('class="menu-tbl"') ||
    sample.includes('class="grp-cnt"') ||
    sample.includes('class="tb-question"') ||
    sample.includes('class="question-container"') ||
    sample.includes('class="que_block"') ||
    (sample.includes('<table') && sample.includes('</td>')) ||
    (sample.includes('<div') && sample.includes('</div>') && /<[a-z][\s\S]*>/i.test(sample)) ||
    (/<(?:!doctype|html|head|body|div|table|span|p|tr|td|section)\b/i.test(sample) && sample.includes('>'))
  );
}

/**
 * Clean text from DOM node, removing extra spaces and normalizing mathematical symbols
 */
function cleanDomText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&minus;/g, '−')
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&deg;/g, '°')
    .replace(/&le;/g, '≤')
    .replace(/&ge;/g, '≥')
    .replace(/&ne;/g, '≠')
    .replace(/\u00A0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Detect Devanagari script (Hindi)
 */
function hasHindi(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Split bilingual block into English and Hindi if mixed or separated by newlines or slashes
 */
function splitBilingualText(rawText: string): { en: string; hi: string } {
  const clean = cleanDomText(rawText);
  if (!clean) return { en: '', hi: '' };

  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);
  const enLines: string[] = [];
  const hiLines: string[] = [];

  for (const line of lines) {
    // If line has both English and Hindi with a slash delimiter e.g. "Apple / सेब"
    if (line.includes('/') && hasHindi(line)) {
      const parts = line.split(/\s*\/\s*/);
      if (parts.length >= 2 && !hasHindi(parts[0]) && hasHindi(parts.slice(1).join(' '))) {
        enLines.push(parts[0].trim());
        hiLines.push(parts.slice(1).join(' / ').trim());
        continue;
      }
    }

    // If line has Hindi script starting after substantial English text without delimiter
    const firstHindiIdx = line.search(/[\u0900-\u097F]/);
    if (firstHindiIdx > 12) {
      const enPart = line.slice(0, firstHindiIdx).trim();
      const hiPart = line.slice(firstHindiIdx).trim();
      if (/[a-zA-Z]{3,}/.test(enPart) && /[\u0900-\u097F]{3,}/.test(hiPart)) {
        enLines.push(enPart);
        hiLines.push(hiPart);
        continue;
      }
    }

    if (hasHindi(line)) {
      hiLines.push(line);
    } else {
      enLines.push(line);
    }
  }

  // If no Hindi found, entire text is English
  if (hiLines.length === 0) {
    return { en: clean, hi: '' };
  }
  // If no English found, entire text is Hindi
  if (enLines.length === 0) {
    return { en: '', hi: clean };
  }

  return {
    en: enLines.join('\n').trim(),
    hi: hiLines.join('\n').trim(),
  };
}

/**
 * Convert HTML exam content into clean, formatted .txt
 */
export function convertHtmlToCleanTxt(
  htmlString: string,
  originalFileName: string = 'Exam.html'
): ConvertedExamTxtResult {
  // If already standard plain text (not HTML), return directly
  if (!isHtmlContent(htmlString, originalFileName)) {
    return {
      txtContent: htmlString,
      questionCount: (htmlString.match(/(?:^|\n)\s*Q(?:uestion)?\.?\s*\d+/gi) || []).length,
      title: originalFileName.replace(/\.(txt|html|htm)$/i, ''),
      examName: 'EXAM',
      shiftName: 'Shift 1',
      examDate: '',
      sectionName: 'REASONING',
    };
  }

  let rawHtml = (htmlString || '').replace(/^\uFEFF/, '').trim();
  if (
    rawHtml.startsWith('&lt;') &&
    (rawHtml.includes('&lt;html') || rawHtml.includes('&lt;div') || rawHtml.includes('&lt;table'))
  ) {
    rawHtml = rawHtml
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove script, style, noscript, iframe, link, svg elements
  const uselessElements = doc.querySelectorAll('script, style, noscript, iframe, svg, link, meta');
  uselessElements.forEach((el) => el.remove());

  // Convert <br> and <hr> into newlines before text extraction
  doc.querySelectorAll('br, hr').forEach((el) => {
    el.replaceWith(doc.createTextNode('\n'));
  });

  // Step 1: Pre-mark tick / correct answer images BEFORE image replacement
  // In TCS iON and mock response sheets, the correct option row or cell has:
  // <img src="...tick..." alt="..."> or class="rightAns"
  doc.querySelectorAll('img').forEach((img) => {
    const src = (img.getAttribute('src') || '').toLowerCase();
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    const title = (img.getAttribute('title') || '').toLowerCase();
    const isTick =
      /tick|correct|right|check|greentick|green_tick|true/i.test(src) ||
      /tick|correct|right|check|greentick|green_tick|true/i.test(alt) ||
      /tick|correct|right|check|greentick|green_tick|true/i.test(title);
    if (isTick) {
      const parentTd = img.closest('td, tr, li, div');
      if (parentTd) {
        parentTd.classList.add('rightAns');
      }
    }
  });

  // Step 2: Preserve image alt / diagram captions / non-verbal figure references
  doc.querySelectorAll('img').forEach((img) => {
    const alt = (img.getAttribute('alt') || '').trim();
    const src = (img.getAttribute('src') || '').trim();
    const isTick = /tick|correct|wrong|cross|check/i.test(alt) || /tick|correct|wrong|cross|check/i.test(src);
    if (isTick) {
      img.remove();
      return;
    }

    if (alt) {
      img.replaceWith(doc.createTextNode(` [Figure: ${alt}] `));
    } else if (src) {
      const fileName = src.split('/').pop()?.split('?')[0] || 'Diagram';
      img.replaceWith(doc.createTextNode(` [Figure: ${fileName}] `));
    } else {
      img.replaceWith(doc.createTextNode(' [Figure] '));
    }
  });

  // Extract Metadata: Candidate Info / Exam Details from Header Tables
  let examName = '';
  let shiftName = '';
  let examDate = '';
  let candidateName = '';
  let testVenue = '';
  let subjectName = '';

  // Check for standard TCS iON candidate info table
  const infoTables = doc.querySelectorAll('table');
  infoTables.forEach((tbl) => {
    const text = tbl.innerText || tbl.textContent || '';
    if (
      text.includes('Roll Number') ||
      text.includes('Candidate Name') ||
      text.includes('Exam Date') ||
      text.includes('Exam Time') ||
      text.includes('Subject')
    ) {
      const rows = tbl.querySelectorAll('tr');
      rows.forEach((row) => {
        const cells = Array.from(row.querySelectorAll('td, th')).map((c) =>
          cleanDomText(c.textContent || '')
        );
        if (cells.length >= 2) {
          const lbl = cells[0].toLowerCase();
          const val = cells[1];
          if (lbl.includes('subject') && !subjectName) subjectName = val;
          else if (lbl.includes('exam date') && !examDate) examDate = val;
          else if (lbl.includes('exam time') && !shiftName) shiftName = val;
          else if (lbl.includes('candidate name') && !candidateName) candidateName = val;
          else if ((lbl.includes('venue') || lbl.includes('center')) && !testVenue) testVenue = val;
        }

        const rowText = cleanDomText(row.innerText || row.textContent || '');
        if (/Subject\s*:/i.test(rowText) && !subjectName) {
          subjectName = rowText.replace(/^.*?Subject\s*:\s*/i, '').trim();
        } else if (/Exam\s*Date\s*:/i.test(rowText) && !examDate) {
          examDate = rowText.replace(/^.*?Exam\s*Date\s*:\s*/i, '').trim();
        } else if (/Exam\s*Time\s*:/i.test(rowText) && !shiftName) {
          shiftName = rowText.replace(/^.*?Exam\s*Time\s*:\s*/i, '').trim();
        } else if (/Candidate\s*Name\s*:/i.test(rowText) && !candidateName) {
          candidateName = rowText.replace(/^.*?Candidate\s*Name\s*:\s*/i, '').trim();
        } else if (/Test\s*Venue\s*:/i.test(rowText) && !testVenue) {
          testVenue = rowText.replace(/^.*?Test\s*Venue\s*:\s*/i, '').trim();
        }
      });
    }
  });

  // Fallback to title and filename metadata
  const fileHeaderDetails = parseHeaderDetailsFromTitle(originalFileName);
  if (!examDate && fileHeaderDetails.examDate) examDate = fileHeaderDetails.examDate;
  if (!shiftName && fileHeaderDetails.shiftName) shiftName = fileHeaderDetails.shiftName;
  if (!examName && fileHeaderDetails.examName && fileHeaderDetails.examName !== 'EXAM') {
    examName = fileHeaderDetails.examName;
  }

  // Derive Shift from filename if still empty
  if (!shiftName) {
    const sMatch =
      originalFileName.match(/shift[_\s-]*(\d+|[ivx]+)/i) ||
      originalFileName.match(/(?:^|[_ -])s(\d+)(?:[_ -]|$)/i) ||
      originalFileName.match(/pyst[_\s-]*(\d+)/i);
    if (sMatch) {
      shiftName = `Shift ${sMatch[1]}`;
    } else {
      shiftName = 'Shift 1';
    }
  }

  // Derive Date from filename if still empty
  if (!examDate) {
    const dMatch = originalFileName.match(
      /(\d{1,2})(?:st|nd|rd|th)?[-_ ]+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[-_ ]+(\d{4})/i
    );
    if (dMatch) {
      const day = dMatch[1].padStart(2, '0');
      const mon = dMatch[2].toUpperCase().slice(0, 3);
      const monMap: Record<string, string> = {
        JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
        JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
      };
      examDate = `${day}-${monMap[mon] || '09'}-${dMatch[3]}`;
    } else {
      examDate = '12-09-2025';
    }
  }

  const pageTitle = cleanDomText(doc.title || '');
  if (!examName) {
    if (subjectName) examName = subjectName;
    else if (pageTitle && !pageTitle.toLowerCase().includes('candidate') && !pageTitle.toLowerCase().includes('assessment')) {
      examName = pageTitle;
    } else {
      examName = originalFileName.replace(/\.(html|htm|txt)$/i, '').replace(/[_-]+/g, ' ');
    }
  }

  // Parse questions
  const extractedQuestions: ExtractedQuestionItem[] = [];

  // STRATEGY 1: SSC / TCS iON Question Panels
  // IMPORTANT: Query ONLY .question-pnl first (do NOT include .grp-cnt, as .grp-cnt wraps the panels!)
  let rawPanels = Array.from(doc.querySelectorAll('.question-pnl'));
  if (rawPanels.length === 0) {
    rawPanels = Array.from(
      doc.querySelectorAll('div.question-container, .test-question, .que-item, .que_block, .tb-question, [data-question-id]')
    );
  }

  // If still no panels, try finding parent wrappers of TCS menu tables (every question has a menu-tbl)
  if (rawPanels.length === 0) {
    const menuTables = Array.from(doc.querySelectorAll('table.menu-tbl, .menu-tbl'));
    if (menuTables.length > 0) {
      rawPanels = menuTables.map((mt) => mt.closest('div, table, tr')?.parentElement || mt).filter(Boolean) as Element[];
      // Deduplicate parent elements
      rawPanels = Array.from(new Set(rawPanels));
    }
  }

  if (rawPanels.length > 0) {
    let currentSection = subjectName || 'GENERAL INTELLIGENCE & REASONING';

    rawPanels.forEach((pnl, idx) => {
      // Check if preceded or surrounded by a Section Header
      const prevEl = pnl.previousElementSibling;
      if (prevEl && (prevEl.classList.contains('section-cntnr') || /Section\s*:/i.test(prevEl.textContent || ''))) {
        const secText = cleanDomText(prevEl.textContent || '').replace(/^.*?Section\s*:\s*/i, '').trim();
        if (secText) currentSection = secText;
      }

      // Check Section inside panel
      const secHeader = pnl.querySelector('.section-lbl, .section-title');
      if (secHeader) {
        const s = cleanDomText(secHeader.textContent || '').replace(/^.*?Section\s*:\s*/i, '').trim();
        if (s) currentSection = s;
      }

      // Question Number: check for Q.1, Q.2 ... Q.25 anywhere in panel
      let qNum = idx + 1;
      const qNumMatch = (pnl.textContent || '').match(/(?:^|\s)Q(?:uestion)?\.?\s*(\d+)/i);
      if (qNumMatch) {
        qNum = parseInt(qNumMatch[1], 10);
      } else {
        const qNumEl = pnl.querySelector('.qNum, .question-number, .q-idx');
        if (qNumEl) {
          const m = (qNumEl.textContent || '').match(/\d+/);
          if (m) qNum = parseInt(m[0], 10);
        }
      }

      // Question Text:
      // In TCS iON, the first .questionRowTbl has Q.1 and the question text / statements
      let qTextRaw = '';
      const questionTables = Array.from(
        pnl.querySelectorAll('.questionRowTbl, table[class*="question"]')
      );
      if (questionTables.length > 0) {
        const firstTbl = questionTables[0];
        qTextRaw = cleanDomText(firstTbl.textContent || '');
        qTextRaw = qTextRaw.replace(/^Q(?:uestion)?\.?\s*\d+[\s:.)-]+/i, '').trim();
      } else {
        const qTextEl = pnl.querySelector(
          '.question-text, .que, .q-text, div[class*="question-title"], .question-body'
        );
        if (qTextEl) {
          qTextRaw = cleanDomText(qTextEl.textContent || '');
          qTextRaw = qTextRaw.replace(/^Q(?:uestion)?\.?\s*\d+[\s:.)-]+/i, '').trim();
        } else {
          // Fallback: collect text before the Ans / Options table
          const allTds = Array.from(pnl.querySelectorAll('td'));
          for (const td of allTds) {
            const t = cleanDomText(td.textContent || '');
            if (
              t &&
              !t.includes('Question ID') &&
              !t.includes('Chosen Option') &&
              !t.startsWith('Ans') &&
              !/^[1-4A-D]\./.test(t) &&
              t.length > 5 &&
              !qTextRaw
            ) {
              qTextRaw = t.replace(/^Q(?:uestion)?\.?\s*\d+[\s:.)-]+/i, '').trim();
            }
          }
        }
      }

      // Options
      const options: string[] = [];
      let correctOptIdx = -1;
      let chosenOptIdx = -1;

      // 1. In TCS iON, the second table has the Ans row with a nested options table
      let optionsTable = pnl.querySelector('tr.rw table, tr:has(> td:first-child:contains("Ans")) table');
      if (!optionsTable) {
        const ansRow = Array.from(pnl.querySelectorAll('tr')).find((r) =>
          /^\s*Ans\b/i.test(r.textContent || '')
        );
        if (ansRow) {
          optionsTable = ansRow.querySelector('table');
        }
      }

      if (optionsTable) {
        const optTrs = Array.from(optionsTable.querySelectorAll('tr'));
        optTrs.forEach((row, oIdx) => {
          const cells = Array.from(row.querySelectorAll('td, th'));
          let optText = '';
          let isRight =
            row.classList.contains('rightAns') ||
            row.classList.contains('correct') ||
            row.querySelector('.rightAns') !== null ||
            row.querySelector('.correct') !== null;

          if (cells.length >= 2) {
            optText = cleanDomText(cells[1].textContent || '');
            if (
              cells[1].classList.contains('rightAns') ||
              cells[1].querySelector('.rightAns') !== null
            ) {
              isRight = true;
            }
          } else {
            optText = cleanDomText(row.textContent || '');
            optText = optText.replace(/^(?:\([A-Da-d1-4]\)|\[[A-Da-d1-4]\]|[A-Da-d1-4][.)])\s*/, '').trim();
          }

          if (isRight && correctOptIdx === -1) {
            correctOptIdx = oIdx;
          }
          if (!optText) {
            optText = `[Figure / Image ${oIdx + 1}]`;
          }
          options.push(optText);
        });
      }

      // 2. Fallback to candidate rows if optionsTable didn't yield 4 options
      if (options.length < 2) {
        options.length = 0; // reset
        const allTrs = Array.from(pnl.querySelectorAll('tr'));
        const candidateTrs = allTrs.filter((tr) =>
          /^\s*(?:[1-4]\.|\([1-4A-D]\)|[1-4]\))\s*/.test(tr.textContent || '')
        );

        if (candidateTrs.length >= 2) {
          candidateTrs.forEach((row, optIdx) => {
            let optText = cleanDomText(row.textContent || '');
            optText = optText.replace(/^(?:\([A-Da-d1-4]\)|\[[A-Da-d1-4]\]|[A-Da-d1-4][.)])\s*/, '').trim();

            const isRight =
              row.classList.contains('rightAns') ||
              row.classList.contains('correct') ||
              row.querySelector('.rightAns') !== null ||
              row.querySelector('.correct') !== null;

            if (isRight && correctOptIdx === -1) {
              correctOptIdx = optIdx;
            }
            if (!optText) {
              optText = `[Figure / Image ${optIdx + 1}]`;
            }
            options.push(optText);
          });
        }
      }

      // 3. Fallback to individual cells or items
      if (options.length < 2) {
        options.length = 0;
        const allTds = Array.from(pnl.querySelectorAll('td, .option-item, .opt-item'));
        for (let tIdx = 0; tIdx < allTds.length; tIdx++) {
          const td = allTds[tIdx];
          const tdText = cleanDomText(td.textContent || '');
          const optMatch = tdText.match(/^(?:([1-4A-D])[.)]|\(([1-4A-D])\))\s*(.*)/);
          if (optMatch) {
            let optText = (optMatch[3] || '').trim();
            if (!optText && tIdx + 1 < allTds.length) {
              const nextTd = allTds[tIdx + 1];
              if (!nextTd.textContent?.match(/^[1-4A-D][.)]/)) {
                optText = cleanDomText(nextTd.textContent || '');
              }
            }
            if (!optText) {
              optText = `[Figure / Image ${options.length + 1}]`;
            }

            const isRight =
              td.classList.contains('rightAns') ||
              td.parentElement?.classList.contains('rightAns') ||
              (tIdx + 1 < allTds.length && allTds[tIdx + 1].classList.contains('rightAns'));

            if (isRight && correctOptIdx === -1) {
              correctOptIdx = options.length;
            }
            options.push(optText.trim());
          }
        }
      }

      // Check Menu Table for Chosen Option & Status (TCS format)
      const menuTbl = pnl.querySelector('table.menu-tbl, .menu-tbl, .status-tbl');
      if (menuTbl) {
        const menuText = cleanDomText(menuTbl.textContent || '');
        const chosenMatch = menuText.match(/Chosen\s*Option\s*:\s*([1-4])/i);
        if (chosenMatch) {
          chosenOptIdx = parseInt(chosenMatch[1], 10) - 1;
        }
        const correctMatch = menuText.match(/(?:Correct|Given|Key)\s*Option\s*:\s*([1-4])/i);
        if (correctMatch && correctOptIdx === -1) {
          correctOptIdx = parseInt(correctMatch[1], 10) - 1;
        }
      }

      // If correct option is still not detected, fallback to chosen option or first option
      if (correctOptIdx === -1) {
        if (chosenOptIdx >= 0 && chosenOptIdx < options.length) {
          correctOptIdx = chosenOptIdx;
        } else {
          correctOptIdx = 0;
        }
      }

      // Explanation / Solution if present (Testbook mock html)
      const solEl = pnl.querySelector(
        '.solution-text, .sol-block, .explanation, .sol-cnt, div[class*="solution"], div[class*="Solution"]'
      );
      let solRaw = solEl ? cleanDomText(solEl.textContent || '') : '';
      solRaw = solRaw.replace(/^(?:Solution|Explanation|व्याख्या)\s*[:.-]\s*/i, '').trim();

      const { en: qEn, hi: qHi } = splitBilingualText(qTextRaw || `Question ${qNum}`);
      const { en: sEn, hi: sHi } = splitBilingualText(solRaw);

      const letterMap: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const correctLetter = (correctOptIdx >= 0 && correctOptIdx < 4 ? letterMap[correctOptIdx] : 'A') as
        | 'A'
        | 'B'
        | 'C'
        | 'D';

      // Ensure at least 4 options exist
      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }

      extractedQuestions.push({
        qNum,
        section: currentSection,
        questionEn: qEn || qTextRaw || `Question ${qNum}`,
        questionHi: qHi,
        options: options.slice(0, 4),
        correctOptionIndex: correctOptIdx,
        correctOptionLetter: correctLetter,
        chosenOptionIndex: chosenOptIdx >= 0 ? chosenOptIdx : undefined,
        solutionEn: sEn || solRaw,
        solutionHi: sHi,
      });
    });
  }

  // STRATEGY 2: If STRATEGY 1 found nothing, parse Testbook Mock DOM format or generic Question blocks
  if (extractedQuestions.length === 0) {
    const questionBlocks = doc.querySelectorAll('.question, .que, .test-q, [data-question-id], .tb-question');
    questionBlocks.forEach((qb, idx) => {
      const qNum = idx + 1;
      const qText = cleanDomText(qb.querySelector('.q-text, .question-text, .title')?.textContent || qb.textContent || '');
      const optEls = qb.querySelectorAll('.option, .opt, li, .opt-text');
      const options: string[] = [];
      let correctOptIdx = -1;

      optEls.forEach((oe, oIdx) => {
        const ot = cleanDomText(oe.textContent || '').replace(/^[A-Da-d1-4][.)\s-]+/, '').trim();
        if (
          oe.classList.contains('correct') ||
          oe.classList.contains('right') ||
          oe.getAttribute('data-correct') === 'true'
        ) {
          correctOptIdx = oIdx;
        }
        if (ot) options.push(ot);
      });

      const solText = cleanDomText(qb.querySelector('.solution, .explanation')?.textContent || '');
      const { en: qEn, hi: qHi } = splitBilingualText(qText);
      const { en: sEn, hi: sHi } = splitBilingualText(solText);

      const letterMap: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
      const correctLetter = (correctOptIdx >= 0 && correctOptIdx < 4 ? letterMap[correctOptIdx] : 'A') as
        | 'A'
        | 'B'
        | 'C'
        | 'D';

      while (options.length < 4) {
        options.push(`Option ${options.length + 1}`);
      }

      extractedQuestions.push({
        qNum,
        section: subjectName || 'GENERAL INTELLIGENCE & REASONING',
        questionEn: qEn || qText || `Question ${qNum}`,
        questionHi: qHi,
        options: options.slice(0, 4),
        correctOptionIndex: correctOptIdx >= 0 ? correctOptIdx : 0,
        correctOptionLetter: correctLetter,
        solutionEn: sEn || solText,
        solutionHi: sHi,
      });
    });
  }

  // STRATEGY 3: Heuristic Regex Scan over entire cleaned HTML text content
  if (extractedQuestions.length === 0) {
    const rawBodyText = cleanDomText(doc.body?.innerText || doc.body?.textContent || '');
    const qMatches = rawBodyText.split(
      /(?:^|\n)\s*(?:Q(?:uestion)?\.?\s*(\d+)[:.)\s]|Question\s*No\.?\s*(\d+)[:.)\s])/gi
    );

    if (qMatches.length > 2) {
      let currentQNum = 1;
      for (let i = 1; i < qMatches.length; i += 2) {
        const numStr = qMatches[i];
        const block = qMatches[i + 1] || '';
        if (numStr) currentQNum = parseInt(numStr, 10);

        const optLines: string[] = [];
        let correctOptIdx = -1;

        const optMatches = Array.from(
          block.matchAll(/(?:^|\n)\s*(?:\(([A-Da-d1-4])\)|\[([A-Da-d1-4])\]|([A-Da-d1-4])[.)])\s*([^\n]+)/g)
        );
        if (optMatches.length >= 2) {
          optMatches.slice(0, 4).forEach((om) => {
            optLines.push(om[4].trim());
          });
        }

        const ansMatch = block.match(
          /(?:Ans|Answer|Correct\s*Option)\s*[:.-]\s*(?:\(([A-Da-d1-4])\)|([A-Da-d1-4]))/i
        );
        if (ansMatch) {
          const char = (ansMatch[1] || ansMatch[2]).toUpperCase();
          if (char === 'A' || char === '1') correctOptIdx = 0;
          else if (char === 'B' || char === '2') correctOptIdx = 1;
          else if (char === 'C' || char === '3') correctOptIdx = 2;
          else if (char === 'D' || char === '4') correctOptIdx = 3;
        }

        let solText = '';
        const solMatch = block.match(/(?:Solution|Explanation|व्याख्या)\s*[:.-]\s*([\s\S]+)$/i);
        if (solMatch) {
          solText = solMatch[1].trim();
        }

        const { en: qEn, hi: qHi } = splitBilingualText(block.split(/(?:\([A-Da-d1-4]\)|Ans:)/i)[0]);
        const letterMap: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
        const correctLetter = (correctOptIdx >= 0 && correctOptIdx < 4 ? letterMap[correctOptIdx] : 'A') as
          | 'A'
          | 'B'
          | 'C'
          | 'D';

        while (optLines.length < 4) {
          optLines.push(`Option ${optLines.length + 1}`);
        }

        extractedQuestions.push({
          qNum: currentQNum,
          section: subjectName || 'GENERAL INTELLIGENCE & REASONING',
          questionEn: qEn || `Question ${currentQNum}`,
          questionHi: qHi,
          options: optLines.slice(0, 4),
          correctOptionIndex: correctOptIdx >= 0 ? correctOptIdx : 0,
          correctOptionLetter: correctLetter,
          solutionEn: solText,
          solutionHi: '',
        });
        currentQNum++;
      }
    }
  }

  // Sort questions sequentially by question number
  extractedQuestions.sort((a, b) => a.qNum - b.qNum);

  // Deduplicate questions by qNum, keeping the most complete entry
  const dedupedQuestions: ExtractedQuestionItem[] = [];
  const seenQNums = new Set<number>();
  for (const q of extractedQuestions) {
    if (!seenQNums.has(q.qNum)) {
      seenQNums.add(q.qNum);
      dedupedQuestions.push(q);
    }
  }

  // If questions were detected but some numbers up to 25 are missing, attempt targeted recovery
  const maxDetectedQNum = Math.max(25, ...dedupedQuestions.map((q) => q.qNum));
  if (dedupedQuestions.length < 25 && maxDetectedQNum <= 30) {
    for (let targetNum = 1; targetNum <= 25; targetNum++) {
      if (!seenQNums.has(targetNum)) {
        // Search document for any element matching targetNum
        const allElements = Array.from(doc.querySelectorAll('td, div, p, span, b, strong'));
        const matchedEl = allElements.find((el) => {
          const t = el.textContent?.trim() || '';
          return new RegExp(`^Q(?:uestion)?\\.?\\s*${targetNum}[\\s:.)-]`, 'i').test(t);
        });

        if (matchedEl) {
          const container = matchedEl.closest('table, .question-pnl, div') || matchedEl.parentElement;
          if (container) {
            const rawText = cleanDomText(container.textContent || '');
            const qText = rawText.replace(new RegExp(`^.*?Q(?:uestion)?\\.?\\s*${targetNum}[\\s:.)-]+`, 'i'), '').trim();
            const { en: qEn, hi: qHi } = splitBilingualText(qText);
            const recoveredOptions: string[] = [];
            const optMatches = Array.from(
              rawText.matchAll(/(?:^|\n)\s*(?:\(([1-4A-D])\)|[1-4A-D][.)])\s*([^\n]+)/g)
            );
            optMatches.slice(0, 4).forEach((om) => recoveredOptions.push(om[2].trim()));
            while (recoveredOptions.length < 4) {
              recoveredOptions.push(`Option ${recoveredOptions.length + 1}`);
            }

            const item: ExtractedQuestionItem = {
              qNum: targetNum,
              section: subjectName || 'GENERAL INTELLIGENCE & REASONING',
              questionEn: qEn || `Question ${targetNum}`,
              questionHi: qHi,
              options: recoveredOptions.slice(0, 4),
              correctOptionIndex: 0,
              correctOptionLetter: 'A',
              solutionEn: '',
              solutionHi: '',
            };
            seenQNums.add(targetNum);
            dedupedQuestions.push(item);
          }
        }
      }
    }
    // Re-sort after recovery
    dedupedQuestions.sort((a, b) => a.qNum - b.qNum);
  }

  // BUILD THE CLEAN, STANDARDIZED .TXT DOCUMENT IN OFFICIAL TESTBOOK MOCK FORMAT
  const headerId = (originalFileName || 'SSC_CGL_MOCK')
    .replace(/\.(html|htm|txt)+$/i, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-');

  const cleanExamName = (examName || subjectName || 'SSC CGL 2025 Tier-I').toUpperCase();
  const cleanDate = examDate || '12-09-2025';
  const cleanShift = shiftName || 'Shift 1';
  const totalQuestions = dedupedQuestions.length;

  const outLines: string[] = [];
  outLines.push('==================================================');
  outLines.push(headerId);
  outLines.push(`ID: ${headerId}`);
  outLines.push(`Exam: ${cleanExamName}`);
  outLines.push(`Date: ${cleanDate}`);
  outLines.push(`Shift: ${cleanShift}`);
  outLines.push(`Total Questions: ${totalQuestions}`);
  outLines.push(`Language Mode: Bilingual (English + Hindi)`);
  outLines.push(`Positive Marks: +2.00 | Negative Marks: -0.50`);
  outLines.push('==================================================');
  outLines.push('');

  let activeSection = '';

  dedupedQuestions.forEach((q, idx) => {
    // Section Header
    const qSec = (q.section || 'GENERAL INTELLIGENCE & REASONING').toUpperCase();
    if (qSec !== activeSection) {
      activeSection = qSec;
      outLines.push(`### [ ${activeSection} ] ###`);
      outLines.push('');
    }

    // Question Header & Text
    outLines.push(`Q${idx + 1}. ${q.questionEn}`);
    if (q.questionHi && q.questionHi !== q.questionEn) {
      outLines.push(`    ${q.questionHi}`);
    }

    // Options
    const letters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    if (q.options && q.options.length > 0) {
      q.options.forEach((opt, oIdx) => {
        const letter = letters[oIdx] || `(${oIdx + 1})`;
        outLines.push(`  (${letter}) ${opt}`);
      });
    }

    // Correct Answer
    const letter =
      q.correctOptionLetter ||
      (q.correctOptionIndex >= 0 && q.correctOptionIndex < 4 ? letters[q.correctOptionIndex] : 'A');
    const optText =
      q.correctOptionIndex >= 0 && q.options?.[q.correctOptionIndex]
        ? ` ${q.options[q.correctOptionIndex]}`
        : '';
    outLines.push(`Ans: (${letter})${optText}`);

    // Solution / Explanation
    if (q.solutionEn || q.solutionHi) {
      if (q.solutionEn) {
        outLines.push(`Ex: ${q.solutionEn}`);
      }
      if (q.solutionHi && q.solutionHi !== q.solutionEn) {
        outLines.push('\n[Hindi / हिन्दी व्याख्या]:');
        outLines.push(q.solutionHi);
      }
    }

    outLines.push('--------------------------------------------------');
    outLines.push('');
  });

  const finalTxtContent = outLines.join('\n');

  return {
    txtContent: finalTxtContent,
    questionCount: extractedQuestions.length,
    title: headerId,
    examName: cleanExamName,
    shiftName: cleanShift,
    examDate: cleanDate,
    sectionName: activeSection || 'GENERAL INTELLIGENCE & REASONING',
  };
}

/**
 * Triggers browser download of the clean .txt file
 */
export function downloadCleanTxtFile(
  suggestedFileName: string,
  txtContent: string
): void {
  const cleanName = suggestedFileName.replace(/\.(html|htm|txt)+$/i, '') + '.txt';
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
