import { loadBlockedCompanies, normalizeCompanyName, STORAGE_KEY } from '../shared/storage';

const HIDDEN_ATTRIBUTE = 'data-openmachete-hidden';
const STATUS_ID = 'openmachete-status';

let blockedCompanies = new Set<string>();
let statusNode: HTMLDivElement | null = null;
let scheduled = false;
let lastUrl = location.href;

function normalizeCandidate(value: string): string {
  return normalizeCompanyName(value);
}

function getTextLines(element: Element): string[] {
  const rawText = element instanceof HTMLElement ? element.innerText : element.textContent ?? '';

  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line, index, lines) => line.length >= 2 && line.length <= 80 && lines.indexOf(line) === index);
}

function collectCandidateNames(card: Element): string[] {
  const names = new Set<string>();

  for (const image of Array.from(card.querySelectorAll('img[alt]'))) {
    const alt = image.getAttribute('alt')?.trim();

    if (alt) {
      names.add(alt);
    }
  }

  for (const line of getTextLines(card).slice(0, 8)) {
    names.add(line);
  }

  return [...names];
}

function isCompanyMatch(candidate: string): boolean {
  const normalizedCandidate = normalizeCandidate(candidate);

  if (!normalizedCandidate) {
    return false;
  }

  for (const company of blockedCompanies) {
    if (
      normalizedCandidate === company ||
      normalizedCandidate.includes(company) ||
      company.includes(normalizedCandidate)
    ) {
      return true;
    }
  }

  return false;
}

function isLikelyJobCard(element: Element): boolean {
  const text = element instanceof HTMLElement ? element.innerText : element.textContent ?? '';

  if (text.length < 40 || text.length > 2500) {
    return false;
  }

  const jobLinks = element.querySelectorAll('a[href*="/jobs/"]').length;
  return jobLinks >= 1;
}

function findJobCard(start: Element): HTMLElement | null {
  const preferredSelectors = ['li', 'article', '[role="listitem"]'];
  let current = start.parentElement;
  let fallback: HTMLElement | null = null;

  while (current && current !== document.body) {
    const element = current;

    if (isLikelyJobCard(element)) {
      if (preferredSelectors.some((selector) => element.matches(selector))) {
        return element;
      }

      fallback ??= element;
    }

    current = element.parentElement;
  }

  return fallback;
}

function collectJobCards(): HTMLElement[] {
  const cards = new Set<HTMLElement>();
  const anchors = document.querySelectorAll('a[href*="/jobs/"]');

  for (const anchor of Array.from(anchors)) {
    const card = findJobCard(anchor);

    if (card) {
      cards.add(card);
    }
  }

  return [...cards];
}

function setCardVisibility(card: HTMLElement, hidden: boolean): void {
  if (hidden) {
    card.setAttribute(HIDDEN_ATTRIBUTE, 'true');
    card.style.display = 'none';
    return;
  }

  card.removeAttribute(HIDDEN_ATTRIBUTE);
  card.style.display = '';
}

function ensureStatusNode(): HTMLDivElement {
  if (statusNode) {
    return statusNode;
  }

  statusNode = document.createElement('div');
  statusNode.id = STATUS_ID;
  statusNode.style.position = 'fixed';
  statusNode.style.right = '16px';
  statusNode.style.bottom = '16px';
  statusNode.style.zIndex = '2147483647';
  statusNode.style.maxWidth = '280px';
  statusNode.style.padding = '10px 14px';
  statusNode.style.borderRadius = '999px';
  statusNode.style.background = 'rgba(18, 25, 38, 0.92)';
  statusNode.style.color = '#f4f7fb';
  statusNode.style.font = '600 12px/1.2 ui-sans-serif, system-ui, sans-serif';
  statusNode.style.boxShadow = '0 12px 36px rgba(18, 25, 38, 0.24)';
  statusNode.style.pointerEvents = 'none';
  document.body.append(statusNode);

  return statusNode;
}

function renderStatus(hiddenCount: number): void {
  const node = ensureStatusNode();

  if (blockedCompanies.size === 0) {
    node.textContent = 'OpenMachete inactive: add companies in the extension popup.';
    return;
  }

  const companyLabel = blockedCompanies.size === 1 ? 'company' : 'companies';
  const jobLabel = hiddenCount === 1 ? 'job card hidden' : 'job cards hidden';
  node.textContent = `OpenMachete: ${hiddenCount} ${jobLabel} from ${blockedCompanies.size} blocked ${companyLabel}.`;
}

function applyFilters(): void {
  const cards = collectJobCards();
  let hiddenCount = 0;

  for (const card of cards) {
    const hidden = blockedCompanies.size > 0 && collectCandidateNames(card).some(isCompanyMatch);
    setCardVisibility(card, hidden);

    if (hidden) {
      hiddenCount += 1;
    }
  }

  renderStatus(hiddenCount);
}

function scheduleApply(): void {
  if (scheduled) {
    return;
  }

  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    applyFilters();
  });
}

function observeDom(): void {
  const observer = new MutationObserver((mutations) => {
    const changedOutsideStatus = mutations.some(
      (mutation) => !statusNode || !statusNode.contains(mutation.target),
    );

    if (changedOutsideStatus) {
      scheduleApply();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function watchUrlChanges(): void {
  const handleUrlChange = () => {
    if (location.href === lastUrl) {
      return;
    }

    lastUrl = location.href;
    scheduleApply();
  };

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function pushState(...args) {
    const result = originalPushState.apply(this, args);
    queueMicrotask(handleUrlChange);
    return result;
  };

  history.replaceState = function replaceState(...args) {
    const result = originalReplaceState.apply(this, args);
    queueMicrotask(handleUrlChange);
    return result;
  };

  window.addEventListener('popstate', handleUrlChange);
}

async function refreshBlockedCompanies(): Promise<void> {
  const companies = await loadBlockedCompanies();
  blockedCompanies = new Set(companies.map(normalizeCompanyName));
  scheduleApply();
}

async function bootstrap(): Promise<void> {
  await refreshBlockedCompanies();
  observeDom();
  watchUrlChanges();

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'sync' || !(STORAGE_KEY in changes)) {
      return;
    }

    void refreshBlockedCompanies();
  });
}

void bootstrap();
