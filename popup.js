/**
 * IdeaStockExchange Fact Checker - Popup UI Logic
 */

// DOM Elements
const enableToggle = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const totalClaimsEl = document.getElementById('totalClaims');
const detectedTodayEl = document.getElementById('detectedToday');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const refreshBtn = document.getElementById('refreshBtn');
const settingsBtn = document.getElementById('settingsBtn');

// Initialize popup
async function init() {
  // Load settings
  const settings = await chrome.storage.sync.get(['enabled']);
  enableToggle.checked = settings.enabled !== false;
  updateStatusText(enableToggle.checked);

  // Load stats
  await loadStats();

  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Toggle detection
  enableToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    await chrome.storage.sync.set({ enabled });
    updateStatusText(enabled);

    // Notify all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggle',
        enabled: enabled
      }).catch(() => {
        // Ignore errors for tabs that don't have content script
      });
    });
  });

  // Search functionality
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 300);
  });

  // Refresh database
  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '🔄 Updating...';

    chrome.runtime.sendMessage({ action: 'updateDatabase' }, async (response) => {
      if (response.success) {
        await loadStats();
        showNotification('Database updated successfully!');
      }
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄 Refresh Database';
    });
  });

  // Settings (placeholder)
  settingsBtn.addEventListener('click', () => {
    alert('Settings panel coming soon!\n\nPlanned features:\n• Custom highlight colors\n• Confidence threshold\n• Category filters\n• Custom claims');
  });
}

function updateStatusText(enabled) {
  statusText.textContent = enabled ? 'Active' : 'Inactive';
  statusText.classList.toggle('inactive', !enabled);
}

async function loadStats() {
  // Get claims from background
  chrome.runtime.sendMessage({ action: 'getClaimsDatabase' }, (response) => {
    if (response && response.claims) {
      totalClaimsEl.textContent = response.claims.length;

      // Get detection count from storage
      chrome.storage.local.get(['detectionsToday', 'lastResetDate'], (result) => {
        const today = new Date().toDateString();

        if (result.lastResetDate !== today) {
          // Reset daily counter
          detectedTodayEl.textContent = '0';
          chrome.storage.local.set({
            detectionsToday: 0,
            lastResetDate: today
          });
        } else {
          detectedTodayEl.textContent = result.detectionsToday || 0;
        }
      });
    }
  });
}

async function performSearch(query) {
  if (!query.trim()) {
    searchResults.innerHTML = '';
    return;
  }

  chrome.runtime.sendMessage({
    action: 'searchClaims',
    query: query
  }, (response) => {
    displaySearchResults(response.results);
  });
}

function displaySearchResults(results) {
  if (!results || results.length === 0) {
    searchResults.innerHTML = '<div class="no-results">No claims found</div>';
    return;
  }

  searchResults.innerHTML = results.map(claim => `
    <div class="search-result" data-url="${claim.url}">
      <div class="search-result-title">${claim.title}</div>
      <div class="search-result-desc">${truncate(claim.description, 80)}</div>
    </div>
  `).join('');

  // Add click handlers
  searchResults.querySelectorAll('.search-result').forEach(el => {
    el.addEventListener('click', () => {
      const url = el.dataset.url;
      chrome.tabs.create({ url });
    });
  });
}

function truncate(text, length) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

function showNotification(message) {
  // Simple notification (could be enhanced)
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #28a745;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 13px;
    z-index: 1000;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize when popup opens
init();
