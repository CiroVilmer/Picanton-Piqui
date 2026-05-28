export type PageContent = { url: string; title: string; mainText: string };

const MAIN_TEXT_MAX_CHARS = 6000;

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

export async function getActivePageContent(): Promise<PageContent | null> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || tab.id == null || !isScrappableUrl(tab.url)) return null;

  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const filter = (node: Node): number => {
        const parent = (node as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: filter });
      const parts: string[] = [];
      let current = walker.nextNode();
      while (current) {
        const text = current.nodeValue?.trim();
        if (text) parts.push(text);
        current = walker.nextNode();
      }
      return {
        url: location.href,
        title: document.title || '(sin título)',
        mainText: parts.join('\n'),
      };
    },
  });

  if (!result?.result) return null;
  const raw = result.result as PageContent;
  return {
    url: raw.url,
    title: raw.title,
    mainText:
      raw.mainText.length > MAIN_TEXT_MAX_CHARS
        ? raw.mainText.slice(0, MAIN_TEXT_MAX_CHARS)
        : raw.mainText,
  };
}
