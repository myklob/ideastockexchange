/**
 * IdeaStockExchange Fact Checker - Content Script
 * Detects beliefs/claims in web pages and provides links to analysis
 */

class ClaimDetector {
  constructor() {
    this.knownClaims = [];
    this.processedNodes = new WeakSet();
    this.enabled = true;
    this.observerActive = false;

    // Initialize
    this.loadSettings();
    this.loadClaimsDatabase();
    this.startObserving();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(['enabled']);
    this.enabled = result.enabled !== false; // Default to true
  }

  async loadClaimsDatabase() {
    // Load claims from background script
    chrome.runtime.sendMessage({ action: 'getClaimsDatabase' }, (response) => {
      if (response && response.claims) {
        this.knownClaims = response.claims;
        this.scanPage();
      }
    });
  }

  startObserving() {
    if (this.observerActive) return;

    // Initial scan
    this.scanPage();

    // Watch for dynamic content
    const observer = new MutationObserver((mutations) => {
      if (!this.enabled) return;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.scanElement(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.observerActive = true;
  }

  scanPage() {
    if (!this.enabled) return;
    this.scanElement(document.body);
  }

  scanElement(element) {
    if (!element || this.processedNodes.has(element)) return;
    this.processedNodes.add(element);

    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip scripts, styles, and already processed nodes
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();
          if (['script', 'style', 'noscript', 'iframe'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // Skip if parent already has our markers
          if (parent.classList.contains('ise-claim-detected')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => this.processTextNode(textNode));
  }

  processTextNode(textNode) {
    const text = textNode.textContent;
    if (!text || text.trim().length < 10) return;

    // Find matching claims
    const matches = this.findClaimsInText(text);

    if (matches.length === 0) return;

    // Create a document fragment to replace the text node
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    // Sort matches by position
    matches.sort((a, b) => a.index - b.index);

    matches.forEach(match => {
      // Add text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.substring(lastIndex, match.index))
        );
      }

      // Add the highlighted claim with tooltip
      const span = this.createClaimElement(match);
      fragment.appendChild(span);

      lastIndex = match.index + match.text.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
    }

    // Replace the text node with our fragment
    textNode.parentNode.replaceChild(fragment, textNode);
  }

  findClaimsInText(text) {
    const matches = [];
    const lowerText = text.toLowerCase();

    this.knownClaims.forEach(claim => {
      // Try exact phrase matching
      claim.patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'gi');
        let match;

        while ((match = regex.exec(text)) !== null) {
          matches.push({
            claim: claim,
            text: match[0],
            index: match.index,
            confidence: claim.confidence || 0.8
          });
        }
      });
    });

    return matches;
  }

  createClaimElement(match) {
    const span = document.createElement('span');
    span.className = 'ise-claim-detected';
    span.textContent = match.text;

    // Add confidence level as data attribute
    span.dataset.confidence = match.confidence;
    span.dataset.claimId = match.claim.id;

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'ise-tooltip';
    tooltip.innerHTML = `
      <div class="ise-tooltip-header">
        <strong>Claim Detected</strong>
        <span class="ise-confidence">${Math.round(match.confidence * 100)}% match</span>
      </div>
      <div class="ise-tooltip-body">
        <p><strong>${match.claim.title}</strong></p>
        <p class="ise-preview">${match.claim.description}</p>
        <div class="ise-scores">
          <span class="ise-score-pro">✓ ${match.claim.reasonsFor || 0} reasons for</span>
          <span class="ise-score-con">✗ ${match.claim.reasonsAgainst || 0} reasons against</span>
        </div>
      </div>
      <div class="ise-tooltip-footer">
        <a href="${match.claim.url}" target="_blank" class="ise-link">View Full Analysis →</a>
      </div>
    `;

    span.appendChild(tooltip);

    // Show tooltip on hover
    span.addEventListener('mouseenter', () => {
      tooltip.style.display = 'block';
      this.positionTooltip(span, tooltip);
    });

    span.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });

    return span;
  }

  positionTooltip(trigger, tooltip) {
    const rect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    // Position below the trigger by default
    let top = rect.bottom + window.scrollY + 5;
    let left = rect.left + window.scrollX;

    // Adjust if tooltip would go off screen
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    if (rect.bottom + tooltipRect.height > window.innerHeight) {
      // Position above instead
      top = rect.top + window.scrollY - tooltipRect.height - 5;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }
}

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggle') {
    if (detector) {
      detector.enabled = request.enabled;
      if (request.enabled) {
        detector.scanPage();
      }
    }
    sendResponse({ success: true });
  }
  return true;
});

// Initialize detector when page is ready
let detector;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detector = new ClaimDetector();
  });
} else {
  detector = new ClaimDetector();
}
