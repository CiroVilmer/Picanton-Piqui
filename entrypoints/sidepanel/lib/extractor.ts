export type PageContent = { url: string; title: string; mainText: string };

const MAIN_TEXT_MAX_CHARS = 20000;

const UNSCRAPPABLE_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'view-source:',
  'file://',
  'devtools://',
];

export function isScrappableUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !UNSCRAPPABLE_PREFIXES.some((p) => url.startsWith(p));
}

type RawExtract = {
  url: string;
  title: string;
  metas: string;
  jsonLds: string;
  mainText: string;
};

export async function getActivePageContent(): Promise<PageContent | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || tab.id == null || !isScrappableUrl(tab.url)) return null;

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (): RawExtract => {
      const collectText = (root: Element): string => {
        const filter = (node: Node): number => {
          const parent = (node as Text).parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          const tag = parent.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE') {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        };
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: filter });
        const parts: string[] = [];
        let current = walker.nextNode();
        while (current) {
          const text = current.nodeValue?.trim();
          if (text) parts.push(text);
          current = walker.nextNode();
        }
        return parts.join('\n');
      };

      const metas: string[] = [];
      document.querySelectorAll('meta[property], meta[name]').forEach((m) => {
        const key = m.getAttribute('property') || m.getAttribute('name') || '';
        const value = m.getAttribute('content') || '';
        if (!key || !value) return;
        const lower = key.toLowerCase();
        if (
          lower.startsWith('og:') ||
          lower.startsWith('twitter:') ||
          lower.startsWith('product:') ||
          lower.startsWith('article:') ||
          lower === 'description' ||
          lower === 'keywords' ||
          lower === 'author' ||
          lower === 'price' ||
          lower === 'currency'
        ) {
          metas.push(`${key}: ${value}`);
        }
      });

      const jsonLds: string[] = [];
      document.querySelectorAll('script[type="application/ld+json"]').forEach((n) => {
        const t = n.textContent?.trim();
        if (t) jsonLds.push(t);
      });

      const mainEl =
        document.querySelector('main') ||
        document.querySelector('article') ||
        document.querySelector('[role="main"]') ||
        document.body;

      return {
        url: location.href,
        title: document.title || '(sin título)',
        metas: metas.join('\n'),
        jsonLds: jsonLds.join('\n\n'),
        mainText: collectText(mainEl),
      };
    },
  });

  if (!result?.result) return null;
  const raw = result.result as RawExtract;

  const sections: string[] = [];
  if (raw.metas) sections.push(`META TAGS:\n${raw.metas}`);
  if (raw.jsonLds) sections.push(`STRUCTURED DATA (JSON-LD):\n${raw.jsonLds}`);
  sections.push(`PAGE TEXT:\n${raw.mainText}`);

  let combined = sections.join('\n\n---\n\n');
  if (combined.length > MAIN_TEXT_MAX_CHARS) {
    combined = combined.slice(0, MAIN_TEXT_MAX_CHARS) + '\n[...truncated]';
  }

  return {
    url: raw.url,
    title: raw.title,
    mainText: combined,
  };
}
