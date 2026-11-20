/**
 * Server-side service for vncodes.in (VN Video Editor Templates & QR Codes)
 * Automatically fetches both Old (2024+) and New (2026+) templates from vncodes.in
 * via WordPress REST API + vnc/v1 cards enrichment + authenticated account library proxy.
 */

export interface VnCodeCategoryItem {
  id: number;
  name: string;
  slug: string;
  count: number;
  link: string;
}

export interface VnCodeTemplateItem {
  id: number;
  title: string;
  slug: string;
  link: string;
  date: string;
  modified: string;
  year: string;
  isNew: boolean;
  categoryIds: number[];
  categoryNames: string[];
  tags: string[];
  thumbnailUrl: string;
  videoUrl: string;
  price: number;
  mrp: number;
  isFree: boolean;
  usedCountText: string;
  paid: boolean;
}

export interface VnCodeTemplateDetail extends VnCodeTemplateItem {
  sku: string;
  description: string;
  currency: string;
  publicQrUrl: string | null;
  publicMediaFiles: Array<{ id: number; url: string; mimeType: string; title: string }>;
  libraryDownloadUrl: string | null;
}

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export function decodeHtmlEntities(input: string): string {
  if (!input) return '';
  return input
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

interface ParsedCardMeta {
  id: number;
  title?: string;
  link?: string;
  thumbnailUrl: string;
  videoUrl: string;
  price: number;
  mrp: number;
  isFree: boolean;
  usedCountText: string;
}

function parseCardsHtml(html: string): Map<number, ParsedCardMeta> {
  const map = new Map<number, ParsedCardMeta>();
  if (!html) return map;

  // Split around top-level card wrapper blocks
  const blocks = html.split(/<div style="flex:none;width:226px">/i).slice(1);
  for (const block of blocks) {
    const idMatch = block.match(/data-add="(\d+)"/i);
    if (!idMatch) continue;
    const id = parseInt(idMatch[1], 10);
    if (!id) continue;

    const posterMatch =
      block.match(/poster="([^"]+)"/i) ||
      block.match(/background-image:url\('([^']+)'\)/i);
    const videoMatch = block.match(/<video[^>]+data-src="([^"]+)"/i);
    const linkMatch = block.match(/<a href="([^"]+)" style="color:inherit">([\s\S]*?)<\/a>/i);
    const usedMatch = block.match(/🔥<\/span>\s*([^<]+)<\/span>/i);

    let price = 99;
    let mrp = 0;
    let isFree = false;

    const pricePillMatch = block.match(/<a[^>]+data-add="\d+"[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i);
    if (pricePillMatch) {
      const rawPriceBlock = pricePillMatch[1];
      if (/\bfree\b/i.test(rawPriceBlock)) {
        price = 0;
        mrp = 0;
        isFree = true;
      } else {
        const mrpMatch = rawPriceBlock.match(/<s[^>]*>[^0-9]*(\d+(?:\.\d+)?)<\/s>/i);
        if (mrpMatch) mrp = parseFloat(mrpMatch[1]);
        const cleanedNoS = rawPriceBlock.replace(/<s[^>]*>[\s\S]*?<\/s>/gi, '');
        const currentPriceMatch = cleanedNoS.match(/(\d+(?:\.\d+)?)/);
        if (currentPriceMatch) {
          price = parseFloat(currentPriceMatch[1]);
        }
        isFree = price === 0;
      }
    }

    map.set(id, {
      id,
      title: linkMatch ? decodeHtmlEntities(linkMatch[2]) : undefined,
      link: linkMatch ? linkMatch[1] : undefined,
      thumbnailUrl: posterMatch ? posterMatch[1].replace(/\\\//g, '/') : '',
      videoUrl: videoMatch ? videoMatch[1].replace(/\\\//g, '/') : '',
      price,
      mrp,
      isFree,
      usedCountText: usedMatch ? decodeHtmlEntities(usedMatch[1]).trim() : '',
    });
  }

  return map;
}

async function fetchCardsMetadataBatch(ids: number[]): Promise<Map<number, ParsedCardMeta>> {
  const combined = new Map<number, ParsedCardMeta>();
  if (ids.length === 0) return combined;

  // vnc/v1/cards returns max 24 cards per call
  const chunkSize = 24;
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const url = `https://vncodes.in/wp-json/vnc/v1/cards?limit=100&ids=${chunk.join(',')}`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        if (!resp.ok) return new Map<number, ParsedCardMeta>();
        const data = (await resp.json()) as { html?: string };
        return parseCardsHtml(data?.html || '');
      } catch {
        return new Map<number, ParsedCardMeta>();
      }
    })
  );

  for (const m of results) {
    for (const [k, v] of m.entries()) {
      combined.set(k, v);
    }
  }
  return combined;
}

let cachedCategories: { items: VnCodeCategoryItem[]; fetchedAt: number } | null = null;
let cachedAllTemplates: {
  items: VnCodeTemplateItem[];
  total: number;
  syncedAt: string;
  fetchedAtMs: number;
} | null = null;

export async function getVnCodeCategories(force = false): Promise<VnCodeCategoryItem[]> {
  if (!force && cachedCategories && Date.now() - cachedCategories.fetchedAt < 10 * 60 * 1000) {
    return cachedCategories.items;
  }

  const all: VnCodeCategoryItem[] = [];
  for (let page = 1; page <= 3; page++) {
    const resp = await fetch(
      `https://vncodes.in/wp-json/wp/v2/template_category?per_page=100&page=${page}&hide_empty=false`,
      { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } }
    );
    if (!resp.ok) break;
    const raw = (await resp.json()) as any[];
    if (!Array.isArray(raw) || raw.length === 0) break;

    for (const c of raw) {
      all.push({
        id: Number(c.id),
        name: decodeHtmlEntities(String(c.name || '')),
        slug: String(c.slug || ''),
        count: Number(c.count || 0),
        link: String(c.link || ''),
      });
    }
    const totalPages = parseInt(resp.headers.get('x-wp-totalpages') || '1', 10);
    if (page >= totalPages) break;
  }

  all.sort((a, b) => b.count - a.count);
  cachedCategories = { items: all, fetchedAt: Date.now() };
  return all;
}

function mapWpTemplateItem(
  wp: any,
  cardMap: Map<number, ParsedCardMeta>,
  catLookup: Map<number, string>
): VnCodeTemplateItem {
  const id = Number(wp.id);
  const card = cardMap.get(id);
  const dateStr = String(wp.date || '');
  const year = dateStr.slice(0, 4) || '2026';
  const ageDays = dateStr ? (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24) : 999;

  const categoryIds: number[] = Array.isArray(wp.template_category)
    ? wp.template_category.map((n: any) => Number(n))
    : [];

  let categoryNames: string[] = [];
  if (Array.isArray(wp._embedded?.['wp:term']?.[0])) {
    categoryNames = wp._embedded['wp:term'][0].map((t: any) => decodeHtmlEntities(String(t.name || '')));
  } else {
    categoryNames = categoryIds.map((cid) => catLookup.get(cid) || '').filter(Boolean);
  }

  let tags: string[] = [];
  if (Array.isArray(wp._embedded?.['wp:term']?.[1])) {
    tags = wp._embedded['wp:term'][1].map((t: any) => decodeHtmlEntities(String(t.name || ''))).slice(0, 12);
  } else if (Array.isArray(wp.class_list)) {
    tags = (wp.class_list as string[])
      .filter((cls) => cls.startsWith('template_tag-'))
      .map((cls) => cls.replace('template_tag-', '').replace(/-/g, ' '))
      .slice(0, 10);
  }

  const title = decodeHtmlEntities(String(wp.title?.rendered || card?.title || `VN Template #${id}`));
  const isFreeByTitle = /\bfree\b/i.test(title) && (card ? card.isFree : true);
  const price = card ? card.price : isFreeByTitle ? 0 : 99;
  const isFree = card ? card.isFree : price === 0;

  return {
    id,
    title,
    slug: String(wp.slug || ''),
    link: String(wp.link || card?.link || `https://vncodes.in/?p=${id}`),
    date: dateStr,
    modified: String(wp.modified || dateStr),
    year,
    isNew: ageDays <= 45,
    categoryIds,
    categoryNames,
    tags,
    thumbnailUrl: card?.thumbnailUrl || '',
    videoUrl: card?.videoUrl || '',
    price,
    mrp: card?.mrp || 0,
    isFree,
    usedCountText: card?.usedCountText || '',
    paid: true,
  };
}

export async function fetchVnCodeTemplatesPage(params: {
  page?: number;
  perPage?: number;
  order?: 'desc' | 'asc';
  category?: number | null;
  search?: string;
}): Promise<{
  total: number;
  totalPages: number;
  page: number;
  templates: VnCodeTemplateItem[];
}> {
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(params.perPage) || 24));
  const order = params.order === 'asc' ? 'asc' : 'desc';

  const qs = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
    orderby: 'date',
    order,
    _fields: 'id,date,modified,slug,link,title,template_category,class_list',
  });
  if (params.category) {
    qs.set('template_category', String(params.category));
  }
  if (params.search && params.search.trim()) {
    qs.set('search', params.search.trim());
  }

  const [cats, wpResp] = await Promise.all([
    getVnCodeCategories().catch(() => [] as VnCodeCategoryItem[]),
    fetch(`https://vncodes.in/wp-json/wp/v2/template?${qs.toString()}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    }),
  ]);

  if (!wpResp.ok) {
    throw new Error(`vncodes.in API returned HTTP ${wpResp.status}`);
  }

  const total = parseInt(wpResp.headers.get('x-wp-total') || '0', 10);
  const totalPages = parseInt(wpResp.headers.get('x-wp-totalpages') || '1', 10);
  const wpList = (await wpResp.json()) as any[];

  const catLookup = new Map<number, string>(cats.map((c) => [c.id, c.name]));
  const ids = wpList.map((item) => Number(item.id)).filter(Boolean);
  const cardMap = await fetchCardsMetadataBatch(ids);

  const templates = wpList.map((wp) => mapWpTemplateItem(wp, cardMap, catLookup));

  return {
    total: total || templates.length,
    totalPages: totalPages || 1,
    page,
    templates,
  };
}

/**
 * Sync ALL Old + New templates automatically across all pages of vncodes.in
 */
export async function syncAllVnCodeTemplates(forceRefresh = false): Promise<{
  templates: VnCodeTemplateItem[];
  total: number;
  syncedAt: string;
  fromCache: boolean;
}> {
  if (
    !forceRefresh &&
    cachedAllTemplates &&
    Date.now() - cachedAllTemplates.fetchedAtMs < 3 * 60 * 1000
  ) {
    return {
      templates: cachedAllTemplates.items,
      total: cachedAllTemplates.total,
      syncedAt: cachedAllTemplates.syncedAt,
      fromCache: true,
    };
  }

  const cats = await getVnCodeCategories(forceRefresh).catch(() => [] as VnCodeCategoryItem[]);
  const catLookup = new Map<number, string>(cats.map((c) => [c.id, c.name]));

  // Fetch page 1 first to know totalPages
  const firstUrl =
    'https://vncodes.in/wp-json/wp/v2/template?per_page=100&page=1&orderby=date&order=desc&_fields=id,date,modified,slug,link,title,template_category,class_list';
  const firstResp = await fetch(firstUrl, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!firstResp.ok) {
    throw new Error(`vncodes.in API returned HTTP ${firstResp.status}`);
  }

  const total = parseInt(firstResp.headers.get('x-wp-total') || '0', 10);
  const totalPages = Math.min(25, Math.max(1, parseInt(firstResp.headers.get('x-wp-totalpages') || '1', 10)));
  const page1Data = (await firstResp.json()) as any[];

  const remainingPages: number[] = [];
  for (let p = 2; p <= totalPages; p++) {
    remainingPages.push(p);
  }

  const restPagesData = await Promise.all(
    remainingPages.map(async (p) => {
      try {
        const url = `https://vncodes.in/wp-json/wp/v2/template?per_page=100&page=${p}&orderby=date&order=desc&_fields=id,date,modified,slug,link,title,template_category,class_list`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        });
        if (!resp.ok) return [];
        const json = await resp.json();
        return Array.isArray(json) ? json : [];
      } catch {
        return [];
      }
    })
  );

  const allWpRows = [...page1Data, ...restPagesData.flat()];
  const allIds = allWpRows.map((x) => Number(x.id)).filter(Boolean);
  const cardMap = await fetchCardsMetadataBatch(allIds);

  const templates = allWpRows.map((wp) => mapWpTemplateItem(wp, cardMap, catLookup));
  const syncedAt = new Date().toISOString();

  cachedAllTemplates = {
    items: templates,
    total: total || templates.length,
    syncedAt,
    fetchedAtMs: Date.now(),
  };

  return {
    templates,
    total: cachedAllTemplates.total,
    syncedAt,
    fromCache: false,
  };
}

/**
 * Fetch detailed metadata, MP4 preview, public media/QR (for free templates),
 * and authenticated user library QR match (when session cookie is provided).
 */
export async function fetchVnCodeTemplateDetail(
  id: number,
  cookieHeader?: string
): Promise<VnCodeTemplateDetail> {
  const [wpResp, mediaResp, cardMap] = await Promise.all([
    fetch(`https://vncodes.in/wp-json/wp/v2/template/${id}?_embed`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    }),
    fetch(`https://vncodes.in/wp-json/wp/v2/media?parent=${id}&per_page=25`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    }),
    fetchCardsMetadataBatch([id]),
  ]);

  if (!wpResp.ok) {
    throw new Error(`Template #${id} not found on vncodes.in (HTTP ${wpResp.status})`);
  }

  const wp = (await wpResp.json()) as any;
  const cats = await getVnCodeCategories().catch(() => [] as VnCodeCategoryItem[]);
  const catLookup = new Map<number, string>(cats.map((c) => [c.id, c.name]));
  const base = mapWpTemplateItem(wp, cardMap, catLookup);

  let sku = `VNT-${id}`;
  let description = '';
  let currency = 'INR';
  let pageThumb = '';
  let pageVideo = '';
  let jsonLdPrice: number | null = null;

  // Fetch public page HTML for Product JSON-LD description, SKU, price
  try {
    const pageResp = await fetch(base.link, {
      headers: {
        'User-Agent': USER_AGENT,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    });
    if (pageResp.ok) {
      const html = await pageResp.text();
      const ldMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
      for (const m of ldMatches) {
        try {
          const parsed = JSON.parse(m[1]);
          if (parsed?.['@type'] === 'Product') {
            if (parsed.sku) sku = String(parsed.sku);
            if (parsed.description) description = decodeHtmlEntities(String(parsed.description));
            if (parsed.offers?.price !== undefined) jsonLdPrice = Number(parsed.offers.price);
            if (parsed.offers?.priceCurrency) currency = String(parsed.offers.priceCurrency);
            if (Array.isArray(parsed.image) && parsed.image[0]) pageThumb = String(parsed.image[0]);
          }
          if (Array.isArray(parsed?.['@graph'])) {
            for (const g of parsed['@graph']) {
              if (g?.['@type'] === 'VideoObject') {
                if (g.contentUrl) pageVideo = String(g.contentUrl);
                if (!pageThumb && g.thumbnailUrl) pageThumb = String(g.thumbnailUrl);
              }
            }
          }
        } catch {
          // ignore malformed JSON-LD block
        }
      }
    }
  } catch {
    // ignore HTML fetch error
  }

  const publicMediaFiles: Array<{ id: number; url: string; mimeType: string; title: string }> = [];
  let publicQrUrl: string | null = null;

  if (mediaResp.ok) {
    const mediaList = (await mediaResp.json()) as any[];
    if (Array.isArray(mediaList)) {
      for (const m of mediaList) {
        const src = String(m.source_url || '');
        const mime = String(m.mime_type || '');
        const mTitle = decodeHtmlEntities(String(m.title?.rendered || m.slug || 'Media'));
        if (!src) continue;
        publicMediaFiles.push({
          id: Number(m.id),
          url: src,
          mimeType: mime,
          title: mTitle,
        });

        // For free templates, vncodes.in attaches the public QR PNG directly as a child attachment
        const isThumb = /thumbnail|thumb|poster|og-cards/i.test(src);
        const isImage = mime.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/i.test(src);
        if (isImage && !isThumb && !publicQrUrl) {
          publicQrUrl = src;
        }
        if (!pageVideo && mime.startsWith('video/') && src.endsWith('.mp4')) {
          pageVideo = src;
        }
      }
    }
  }

  // If authenticated cookie provided, check user's real purchased library
  let libraryDownloadUrl: string | null = null;
  if (cookieHeader && cookieHeader.trim()) {
    try {
      const lib = await getVnCodesUserLibrary(cookieHeader);
      const match = (lib.items || []).find(
        (it: any) => Number(it.id) === id || Number(it.template_id) === id || it.slug === base.slug
      );
      if (match) {
        libraryDownloadUrl = match.qr_url || match.download_url || match.file || match.image || null;
      }
    } catch {
      // ignore library lookup error
    }
  }

  const finalPrice = jsonLdPrice !== null ? jsonLdPrice : base.price;

  return {
    ...base,
    price: finalPrice,
    isFree: finalPrice === 0,
    thumbnailUrl: base.thumbnailUrl || pageThumb,
    videoUrl: base.videoUrl || pageVideo,
    sku,
    description,
    currency,
    publicQrUrl,
    publicMediaFiles,
    libraryDownloadUrl,
  };
}

function extractCookieHeader(resp: Response): string {
  const anyHeaders = resp.headers as any;
  let cookies: string[] = [];
  if (typeof anyHeaders.getSetCookie === 'function') {
    cookies = anyHeaders.getSetCookie();
  } else {
    const single = resp.headers.get('set-cookie');
    if (single) cookies = [single];
  }
  return cookies
    .map((c) => c.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

export async function loginVnCodesAccount(email: string, password: string) {
  const resp = await fetch('https://vncodes.in/wp-json/vnc/v1/account/login', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  const data = (await resp.json().catch(() => ({}))) as any;
  const cookieHeader = extractCookieHeader(resp);

  if (!resp.ok || data?.code || data?.error) {
    return {
      ok: false,
      error: data?.message || data?.error || `Login failed (HTTP ${resp.status})`,
    };
  }

  return {
    ok: true,
    user: data?.user || data || { email },
    cookieHeader,
  };
}

export async function requestVnCodesOtp(email: string) {
  const resp = await fetch('https://vncodes.in/wp-json/vnc/v1/account/otp-request', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = (await resp.json().catch(() => ({}))) as any;
  if (!resp.ok || data?.code || data?.error) {
    return {
      ok: false,
      error: data?.message || data?.error || `Failed to send OTP (HTTP ${resp.status})`,
    };
  }
  return { ok: true, message: data?.message || 'OTP sent to your email.' };
}

export async function verifyVnCodesOtp(email: string, code: string) {
  const resp = await fetch('https://vncodes.in/wp-json/vnc/v1/account/otp-verify', {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email: email.trim(), code: code.trim(), otp: code.trim() }),
  });
  const data = (await resp.json().catch(() => ({}))) as any;
  const cookieHeader = extractCookieHeader(resp);
  if (!resp.ok || data?.code || data?.error) {
    return {
      ok: false,
      error: data?.message || data?.error || `OTP verification failed (HTTP ${resp.status})`,
    };
  }
  return {
    ok: true,
    user: data?.user || data || { email },
    cookieHeader,
  };
}

export async function getVnCodesUserLibrary(cookieHeader: string) {
  if (!cookieHeader || !cookieHeader.trim()) {
    return { ok: false, items: [], error: 'Not signed in to vncodes.in account' };
  }

  const [meResp, libResp] = await Promise.all([
    fetch('https://vncodes.in/wp-json/vnc/v1/account/me', {
      headers: { 'User-Agent': USER_AGENT, Cookie: cookieHeader, Accept: 'application/json' },
    }),
    fetch('https://vncodes.in/wp-json/vnc/v1/account/library', {
      headers: { 'User-Agent': USER_AGENT, Cookie: cookieHeader, Accept: 'application/json' },
    }),
  ]);

  const me = await meResp.json().catch(() => ({}));
  const lib = await libResp.json().catch(() => ({}));

  if (!libResp.ok) {
    return {
      ok: false,
      user: me,
      items: [],
      error: (lib as any)?.message || `Library unavailable (HTTP ${libResp.status})`,
    };
  }

  const items = Array.isArray((lib as any)?.items)
    ? (lib as any).items
    : Array.isArray((lib as any)?.library)
    ? (lib as any).library
    : Array.isArray(lib)
    ? lib
    : [];

  return {
    ok: true,
    user: me,
    items,
  };
}

export interface VnCodeOrderQrItem {
  id: number;
  title: string;
  slug: string;
  qrUrl: string;
  thumbnailUrl: string;
  orderKey: string;
  orderId: string;
}

function normalizeQrCandidateUrl(u: string): string {
  return decodeHtmlEntities(String(u || '')).replace(/\\\//g, '/').trim();
}

function extractOrderKeyFromInput(input: string): string | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  // Match query param ?key=wc_order_... or &key=...
  const keyParam = trimmed.match(/[?&]key=([A-Za-z0-9_-]+)/i);
  if (keyParam?.[1]) return keyParam[1];

  // Match raw WooCommerce/VNC order key like wc_order_... or vnc_order_...
  if (/^(?:wc_order_|vnc_order_|order_)?[A-Za-z0-9_-]{8,64}$/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export async function fetchVnCodesOrderByKey(
  keyOrUrl: string,
  cookieHeader?: string
): Promise<{
  ok: boolean;
  orderKey: string;
  orderId?: string;
  items: VnCodeOrderQrItem[];
  raw?: any;
  error?: string;
}> {
  const orderKey = extractOrderKeyFromInput(keyOrUrl);
  if (!orderKey) {
    return {
      ok: false,
      orderKey: '',
      items: [],
      error: 'Valid Order Key or vncodes.in email order link not found.',
    };
  }

  const headers: Record<string, string> = {
    'User-Agent': USER_AGENT,
    Accept: 'application/json',
  };
  if (cookieHeader?.trim()) {
    headers.Cookie = cookieHeader.trim();
  }

  const resp = await fetch(
    `https://vncodes.in/wp-json/vnc/v1/order?key=${encodeURIComponent(orderKey)}`,
    { headers }
  );

  const data = (await resp.json().catch(() => ({}))) as any;
  if (!resp.ok || data?.code || data?.error) {
    return {
      ok: false,
      orderKey,
      items: [],
      error: data?.message || data?.error || `Order lookup returned HTTP ${resp.status}`,
    };
  }

  const orderId = String(data?.id || data?.order_id || data?.number || orderKey);
  const rawItems: any[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.templates)
    ? data.templates
    : Array.isArray(data?.downloads)
    ? data.downloads
    : Array.isArray(data?.line_items)
    ? data.line_items
    : [];

  const items: VnCodeOrderQrItem[] = [];
  for (const it of rawItems) {
    const id = Number(it?.template_id || it?.product_id || it?.id || 0);
    const qrUrl = normalizeQrCandidateUrl(
      it?.qr_url || it?.qr || it?.download_url || it?.file || it?.image_url || it?.image || ''
    );
    if (!qrUrl && !id) continue;
    items.push({
      id,
      title: decodeHtmlEntities(String(it?.title || it?.name || (id ? `VN Template #${id}` : 'VN Code QR'))),
      slug: String(it?.slug || ''),
      qrUrl,
      thumbnailUrl: normalizeQrCandidateUrl(it?.thumbnail || it?.poster || ''),
      orderKey,
      orderId,
    });
  }

  // Fallback if single-level order payload contains direct qr_url / download_url
  if (items.length === 0) {
    const directQr = normalizeQrCandidateUrl(
      data?.qr_url || data?.qr || data?.download_url || data?.file || ''
    );
    if (directQr) {
      items.push({
        id: Number(data?.template_id || 0),
        title: decodeHtmlEntities(String(data?.title || 'Purchased VN Code QR')),
        slug: String(data?.slug || ''),
        qrUrl: directQr,
        thumbnailUrl: normalizeQrCandidateUrl(data?.thumbnail || ''),
        orderKey,
        orderId,
      });
    }
  }

  return {
    ok: true,
    orderKey,
    orderId,
    items,
    raw: data,
  };
}

export async function parseEmailOrderAndQr(
  rawEmailContent: string,
  cookieHeader?: string
): Promise<{
  ok: boolean;
  items: VnCodeOrderQrItem[];
  extractedUrls: string[];
  orderKeyFound: string | null;
  error?: string;
}> {
  const text = (rawEmailContent || '').trim();
  if (!text) {
    return { ok: false, items: [], extractedUrls: [], orderKeyFound: null, error: 'Email content is empty' };
  }

  const collectedItems: VnCodeOrderQrItem[] = [];
  const extractedUrls: string[] = [];

  // 1. Check for order key or vncodes order URL inside the email body
  const keyMatches = Array.from(
    text.matchAll(/(?:[?&]key=|order_key[:=\s]+)(wc_order_[A-Za-z0-9_-]+|[A-Za-z0-9_-]{10,64})/gi)
  ).map((m) => m[1]);

  const uniqueKeys = Array.from(new Set(keyMatches));
  let orderKeyFound: string | null = uniqueKeys[0] || extractOrderKeyFromInput(text);

  if (orderKeyFound) {
    const orderRes = await fetchVnCodesOrderByKey(orderKeyFound, cookieHeader).catch(() => null);
    if (orderRes?.ok && orderRes.items.length > 0) {
      collectedItems.push(...orderRes.items);
    }
  }

  // 2. Extract image/QR/download URLs present in the pasted email text or HTML
  const urlMatches = Array.from(
    text.matchAll(/https?:\/\/[^\s"'<>()]+/gi)
  ).map((m) => normalizeQrCandidateUrl(m[0]));

  for (const url of Array.from(new Set(urlMatches))) {
    if (
      /\.(png|jpg|jpeg|webp|svg)(?:\?|$)/i.test(url) ||
      /qr|download|wp-content\/uploads|vncodes\.in\/wp-json/i.test(url)
    ) {
      extractedUrls.push(url);
    }
  }

  // Try matching any referenced template slug in the email if no structured order items returned
  if (collectedItems.length === 0 && extractedUrls.length > 0) {
    const qrLikeUrl =
      extractedUrls.find((u) => /qr|download/i.test(u) && !/logo|icon|avatar/i.test(u)) ||
      extractedUrls.find((u) => /\.(png|jpg|jpeg|webp)(?:\?|$)/i.test(u) && !/logo|icon/i.test(u));

    if (qrLikeUrl) {
      const slugMatch = text.match(/https?:\/\/(?:www\.)?vncodes\.in\/template\/([a-z0-9-]+)\/?/i);
      collectedItems.push({
        id: 0,
        title: slugMatch?.[1]?.replace(/-/g, ' ') || 'Email Imported VN QR Code',
        slug: slugMatch?.[1] || '',
        qrUrl: qrLikeUrl,
        thumbnailUrl: '',
        orderKey: orderKeyFound || 'email-import',
        orderId: orderKeyFound || 'email-import',
      });
    }
  }

  return {
    ok: collectedItems.length > 0 || extractedUrls.length > 0,
    items: collectedItems,
    extractedUrls,
    orderKeyFound,
    error:
      collectedItems.length === 0 && extractedUrls.length === 0
        ? 'Could not detect a vncodes.in Order Key or QR URL in the pasted text.'
        : undefined,
  };
}

