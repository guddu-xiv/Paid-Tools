import { cleanMathAndText, hasDevanagari } from './txtParser';

export type LanguageModeId =
  | 'bilingual'
  | 'english'
  | 'hindi'
  | 'te'
  | 'ur'
  | 'as'
  | 'gom'
  | 'mr'
  | 'gu'
  | 'kn'
  | 'ml'
  | 'kha'
  | 'lus'
  | 'or'
  | 'pa'
  | 'bn'
  | 'trp'
  | 'sat'
  | 'ta';

export interface LanguageOption {
  id: LanguageModeId;
  label: string;
  code: string | null; // null for bilingual
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { id: 'bilingual', label: 'EN + HI', code: null },
  { id: 'english', label: 'English', code: 'en' },
  { id: 'hindi', label: 'Hindi', code: 'hi' },
  { id: 'te', label: 'Telugu', code: 'te' },
  { id: 'ur', label: 'Urdu', code: 'ur' },
  { id: 'as', label: 'Assamese', code: 'as' },
  { id: 'gom', label: 'Konkani', code: 'gom' },
  { id: 'mr', label: 'Marathi', code: 'mr' },
  { id: 'gu', label: 'Gujarati', code: 'gu' },
  { id: 'kn', label: 'Kannada', code: 'kn' },
  { id: 'ml', label: 'Malayalam', code: 'ml' },
  { id: 'kha', label: 'Khasi', code: 'kha' },
  { id: 'lus', label: 'Mizo', code: 'lus' },
  { id: 'or', label: 'Odia', code: 'or' },
  { id: 'pa', label: 'Punjabi', code: 'pa' },
  { id: 'bn', label: 'Bengali', code: 'bn' },
  { id: 'trp', label: 'Kokborok', code: 'trp' },
  { id: 'sat', label: 'Santhali', code: 'sat' },
  { id: 'ta', label: 'Tamil', code: 'ta' },
];

const singleTextCache = new Map<string, string>();

export async function translateSingleText(
  text: string,
  targetLangCode: string,
  sourceLangCode: string = 'auto'
): Promise<string> {
  const clean = (text || '').trim();
  if (!clean) return '';

  const cacheKey = `${sourceLangCode}::${targetLangCode}::${clean}`;
  const cached = singleTextCache.get(cacheKey);
  if (cached !== undefined) return cached;

  // Split long text into safe chunks under 1800 chars
  if (clean.length > 1800) {
    const chunks = clean.match(/.{1,1800}(?:\s|$)/g) || [clean];
    const parts = await Promise.all(
      chunks.map((c) => translateSingleRequest(c.trim(), targetLangCode, sourceLangCode))
    );
    const joined = parts.map((p, idx) => p.text || chunks[idx]).join(' ').trim();
    if (parts.every((p) => p.ok)) {
      singleTextCache.set(cacheKey, joined);
    }
    return joined;
  }

  const res = await translateSingleRequest(clean, targetLangCode, sourceLangCode);
  if (res.ok && res.text) {
    singleTextCache.set(cacheKey, res.text);
  }
  return res.text || clean;
}

async function translateSingleRequest(
  text: string,
  targetLangCode: string,
  sourceLangCode: string = 'auto'
): Promise<{ ok: boolean; text: string }> {
  if (!text) return { ok: true, text: '' };
  const sl = sourceLangCode === 'auto' && hasDevanagari(text) ? 'hi' : sourceLangCode;
  const baseUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
    sl
  )}&tl=${encodeURIComponent(targetLangCode)}&dt=t`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      let res: Response;
      if (attempt < 2) {
        const body = new URLSearchParams({ q: text });
        res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: body.toString(),
        });
      } else {
        // Fallback to GET on final attempt
        res = await fetch(`${baseUrl}&q=${encodeURIComponent(text)}`);
      }

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const out = data[0]
            .map((segment: unknown) =>
              Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''
            )
            .join('')
            .trim();
          if (out) {
            return { ok: true, text: cleanMathAndText(out) };
          }
        }
      }
    } catch {
      // retry after short backoff
    }
    await new Promise((r) => setTimeout(r, 220 * (attempt + 1)));
  }

  return { ok: false, text };
}

async function translateGroupWithFallback(
  indices: number[],
  texts: string[],
  targetLangCode: string,
  results: string[]
): Promise<void> {
  if (indices.length === 0) return;

  const joinedPayload = texts.join('\n');
  const res = await translateSingleRequest(joinedPayload, targetLangCode, 'auto');
  const splitLines = res.text.split('\n').map((s) => s.trim());

  if (res.ok && splitLines.length === indices.length) {
    indices.forEach((origIdx, k) => {
      const val = splitLines[k] || texts[k];
      results[origIdx] = val;
      singleTextCache.set(`auto::${targetLangCode}::${texts[k]}`, val);
    });
    return;
  }

  // If group had more than 4 items and newline alignment shifted, split in half and translate sub-groups
  if (indices.length > 4) {
    const mid = Math.ceil(indices.length / 2);
    await translateGroupWithFallback(
      indices.slice(0, mid),
      texts.slice(0, mid),
      targetLangCode,
      results
    );
    await translateGroupWithFallback(
      indices.slice(mid),
      texts.slice(mid),
      targetLangCode,
      results
    );
    return;
  }

  // Final fallback for small group (<= 4 items): translate individually
  const fallbackVals = await Promise.all(
    texts.map((t) => translateSingleText(t, targetLangCode, 'auto'))
  );
  indices.forEach((origIdx, k) => {
    results[origIdx] = fallbackVals[k] || texts[k];
  });
}

/**
 * Translates an array of strings rapidly in parallel batches while preserving exact 1-to-1 alignment.
 */
export async function translateBatchStrings(
  items: string[],
  targetLangCode: string,
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const results: string[] = new Array(items.length).fill('');
  const total = items.length;
  let completed = 0;

  interface BatchGroup {
    indices: number[];
    texts: string[];
  }

  const groups: BatchGroup[] = [];
  let currentGroup: BatchGroup = { indices: [], texts: [] };
  let currentLen = 0;

  for (let i = 0; i < items.length; i++) {
    const clean = (items[i] || '').replace(/\r?\n/g, ' ').trim();
    if (!clean) {
      results[i] = '';
      completed++;
      continue;
    }

    const cacheKey = `auto::${targetLangCode}::${clean}`;
    const cached = singleTextCache.get(cacheKey);
    if (cached !== undefined) {
      results[i] = cached;
      completed++;
      continue;
    }

    if (currentGroup.indices.length >= 20 || currentLen + clean.length > 2400) {
      if (currentGroup.indices.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = { indices: [i], texts: [clean] };
      currentLen = clean.length;
    } else {
      currentGroup.indices.push(i);
      currentGroup.texts.push(clean);
      currentLen += clean.length + 2;
    }
  }

  if (currentGroup.indices.length > 0) {
    groups.push(currentGroup);
  }

  if (onProgress) {
    onProgress(completed, total);
  }

  const concurrency = 4;
  for (let gIdx = 0; gIdx < groups.length; gIdx += concurrency) {
    const slice = groups.slice(gIdx, gIdx + concurrency);
    await Promise.all(
      slice.map(async (group) => {
        await translateGroupWithFallback(
          group.indices,
          group.texts,
          targetLangCode,
          results
        );
        completed += group.indices.length;
        if (onProgress) {
          onProgress(Math.min(completed, total), total);
        }
      })
    );
  }

  return results;
}
