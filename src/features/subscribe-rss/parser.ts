import { XMLParser } from 'fast-xml-parser';
import { fetchWithTimeout } from '@shared/api';

export interface ParsedEpisodeItem {
  guid: string;
  title: string;
  description: string;
  audioUrl: string;
  artworkUrl: string;
  duration: number;
  publishedAt: number;
  fileSize: number;
}

export interface ParsedPodcastFeed {
  feedUrl: string;
  title: string;
  author: string;
  description: string;
  artworkUrl: string;
  etag: string | null;
  lastModified: string | null;
  episodes: ParsedEpisodeItem[];
}

export interface FetchRssFeedResult {
  notModified: boolean;
  feed: ParsedPodcastFeed | null;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  textNodeName: '#text',
  trimValues: true,
  parseTagValue: false,
});

export function sanitizeHtmlAndCdata(rawText: string): string {
  if (!rawText) {
    return '';
  }

  return rawText
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractTextNode(node: unknown): string {
  if (typeof node === 'string') {
    return sanitizeHtmlAndCdata(node);
  }
  if (typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node) && node.length > 0) {
    return extractTextNode(node[0]);
  }
  if (typeof node === 'object' && node !== null) {
    const record = node as Record<string, unknown>;
    if (typeof record.__cdata === 'string') {
      return sanitizeHtmlAndCdata(record.__cdata);
    }
    if (typeof record['#text'] === 'string') {
      return sanitizeHtmlAndCdata(record['#text']);
    }
  }
  return '';
}

export function parseItunesDurationToSeconds(rawDuration: unknown): number {
  const text = extractTextNode(rawDuration);
  if (!text) {
    return 0;
  }

  if (/^\d+$/.test(text)) {
    const seconds = Number.parseInt(text, 10);
    return Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
  }

  const parts = text.split(':').map((part) => Number.parseInt(part.trim(), 10));
  if (parts.some((num) => !Number.isFinite(num) || num < 0)) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export function parseResilientTimestamp(rawDate: unknown, fallbackTimestamp: number): number {
  const text = extractTextNode(rawDate);
  if (!text) {
    return fallbackTimestamp;
  }

  const parsed = Date.parse(text);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }

  const normalized = text.replace(/\s+[A-Z]{2,5}$/, ' GMT');
  const retryParsed = Date.parse(normalized);
  if (Number.isFinite(retryParsed) && retryParsed > 0) {
    return retryParsed;
  }

  return fallbackTimestamp;
}

function extractArtworkFromNode(
  node: Record<string, unknown>,
  channelFallbackUrl: string,
): string {
  const itunesImage = node['itunes:image'];
  if (typeof itunesImage === 'object' && itunesImage !== null) {
    const imageRecord = itunesImage as Record<string, unknown>;
    if (typeof imageRecord['@_href'] === 'string' && imageRecord['@_href'].trim()) {
      return imageRecord['@_href'].trim();
    }
  }

  const mediaThumbnail = node['media:thumbnail'] ?? node['media:content'];
  if (typeof mediaThumbnail === 'object' && mediaThumbnail !== null) {
    const mediaRecord = mediaThumbnail as Record<string, unknown>;
    if (typeof mediaRecord['@_url'] === 'string' && mediaRecord['@_url'].trim()) {
      return mediaRecord['@_url'].trim();
    }
  }

  const imageTag = node.image;
  if (typeof imageTag === 'object' && imageTag !== null) {
    const imageRecord = imageTag as Record<string, unknown>;
    const urlText = extractTextNode(imageRecord.url);
    if (urlText) {
      return urlText;
    }
  }

  return channelFallbackUrl;
}

function extractAudioEnclosure(itemNode: Record<string, unknown>): {
  audioUrl: string;
  fileSize: number;
} {
  const enclosure = itemNode.enclosure;
  const candidate = Array.isArray(enclosure) ? enclosure[0] : enclosure;

  if (typeof candidate === 'object' && candidate !== null) {
    const record = candidate as Record<string, unknown>;
    const url = typeof record['@_url'] === 'string' ? record['@_url'].trim() : '';
    const lengthRaw =
      typeof record['@_length'] === 'string' ? Number.parseInt(record['@_length'], 10) : 0;
    const fileSize = Number.isFinite(lengthRaw) && lengthRaw > 0 ? lengthRaw : 0;
    if (url) {
      return { audioUrl: url, fileSize };
    }
  }

  const mediaContent = itemNode['media:content'];
  const mediaCandidate = Array.isArray(mediaContent) ? mediaContent[0] : mediaContent;
  if (typeof mediaCandidate === 'object' && mediaCandidate !== null) {
    const record = mediaCandidate as Record<string, unknown>;
    const url = typeof record['@_url'] === 'string' ? record['@_url'].trim() : '';
    const lengthRaw =
      typeof record['@_fileSize'] === 'string'
        ? Number.parseInt(record['@_fileSize'], 10)
        : 0;
    const fileSize = Number.isFinite(lengthRaw) && lengthRaw > 0 ? lengthRaw : 0;
    if (url) {
      return { audioUrl: url, fileSize };
    }
  }

  return { audioUrl: '', fileSize: 0 };
}

export function parseRssXmlContent(
  xmlString: string,
  feedUrl: string,
  etag: string | null = null,
  lastModified: string | null = null,
): ParsedPodcastFeed {
  const parsedRoot: unknown = xmlParser.parse(xmlString);
  if (typeof parsedRoot !== 'object' || parsedRoot === null) {
    throw new Error('Malformed XML document');
  }

  const rootRecord = parsedRoot as Record<string, unknown>;
  const rssObj =
    typeof rootRecord.rss === 'object' && rootRecord.rss !== null
      ? (rootRecord.rss as Record<string, unknown>)
      : rootRecord;

  const channelRaw = rssObj.channel ?? rootRecord.feed;
  const channel = Array.isArray(channelRaw) ? channelRaw[0] : channelRaw;

  if (typeof channel !== 'object' || channel === null) {
    throw new Error('Missing RSS channel element');
  }

  const channelRecord = channel as Record<string, unknown>;
  const title = extractTextNode(channelRecord.title) || 'Untitled Podcast';
  const author =
    extractTextNode(channelRecord['itunes:author']) ||
    extractTextNode(channelRecord['dc:creator']) ||
    extractTextNode(channelRecord.managingEditor) ||
    extractTextNode(channelRecord.author) ||
    'Unknown Author';
  const description =
    extractTextNode(channelRecord.description) ||
    extractTextNode(channelRecord['itunes:summary']) ||
    extractTextNode(channelRecord.subtitle) ||
    '';
  const channelArtworkUrl = extractArtworkFromNode(channelRecord, '');

  const rawItems = channelRecord.item ?? channelRecord.entry ?? [];
  const itemList: unknown[] = Array.isArray(rawItems) ? rawItems : [rawItems];

  const now = Date.now();
  const episodes: ParsedEpisodeItem[] = [];

  itemList.forEach((rawItem, index) => {
    if (typeof rawItem !== 'object' || rawItem === null) {
      return;
    }

    const itemRecord = rawItem as Record<string, unknown>;
    const { audioUrl, fileSize } = extractAudioEnclosure(itemRecord);
    if (!audioUrl) {
      return;
    }

    const episodeTitle =
      extractTextNode(itemRecord.title) ||
      extractTextNode(itemRecord['itunes:title']) ||
      `Episode ${index + 1}`;
    const guidText =
      extractTextNode(itemRecord.guid) ||
      extractTextNode(itemRecord.id) ||
      `${feedUrl}::${audioUrl}`;
    const episodeDescription =
      extractTextNode(itemRecord['content:encoded']) ||
      extractTextNode(itemRecord.description) ||
      extractTextNode(itemRecord['itunes:summary']) ||
      extractTextNode(itemRecord.summary) ||
      '';
    const duration = parseItunesDurationToSeconds(
      itemRecord['itunes:duration'] ?? itemRecord.duration,
    );
    const publishedAt = parseResilientTimestamp(
      itemRecord.pubDate ?? itemRecord.published ?? itemRecord.updated ?? itemRecord['dc:date'],
      now - index * 1000,
    );
    const artworkUrl = extractArtworkFromNode(itemRecord, channelArtworkUrl);

    episodes.push({
      guid: guidText,
      title: episodeTitle,
      description: episodeDescription,
      audioUrl,
      artworkUrl,
      duration,
      publishedAt,
      fileSize,
    });
  });

  return {
    feedUrl,
    title,
    author,
    description,
    artworkUrl: channelArtworkUrl,
    etag,
    lastModified,
    episodes,
  };
}

export async function fetchAndParseRssFeed(
  feedUrl: string,
  cachedEtag?: string | null,
  cachedLastModified?: string | null,
): Promise<FetchRssFeedResult> {
  const normalizedUrl = feedUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    throw new Error('RSS feed URL must start with http:// or https://');
  }

  const requestHeaders: Record<string, string> = {
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
    'User-Agent': 'RadioPodcastPlayer/1.0',
  };

  if (cachedEtag) {
    requestHeaders['If-None-Match'] = cachedEtag;
  }
  if (cachedLastModified) {
    requestHeaders['If-Modified-Since'] = cachedLastModified;
  }

  const response = await fetchWithTimeout(
    normalizedUrl,
    {
      method: 'GET',
      headers: requestHeaders,
    },
    20000,
  );

  if (response.status === 304) {
    return {
      notModified: true,
      feed: null,
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed (HTTP ${response.status})`);
  }

  const xmlText = await response.text();
  const nextEtag = response.headers.get('etag') ?? cachedEtag ?? null;
  const nextLastModified =
    response.headers.get('last-modified') ?? cachedLastModified ?? null;

  const parsedFeed = parseRssXmlContent(
    xmlText,
    normalizedUrl,
    nextEtag,
    nextLastModified,
  );

  return {
    notModified: false,
    feed: parsedFeed,
  };
}

