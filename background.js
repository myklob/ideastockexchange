/**
 * IdeaStockExchange Fact Checker - Background Service Worker
 * Manages claims database and API communication
 */

class ClaimsDatabaseManager {
  constructor() {
    this.claims = [];
    this.initialized = false;
    this.apiEndpoint = 'https://api.ideastockexchange.com'; // Will be replaced with actual API
    this.init();
  }

  async init() {
    // Load claims from storage or API
    await this.loadClaims();
    this.initialized = true;

    // Update claims periodically (every hour)
    setInterval(() => this.updateClaims(), 60 * 60 * 1000);
  }

  async loadClaims() {
    try {
      // First, try to load from local storage (cache)
      const result = await chrome.storage.local.get(['claimsDatabase', 'lastUpdated']);

      if (result.claimsDatabase && result.lastUpdated) {
        const hoursSinceUpdate = (Date.now() - result.lastUpdated) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24) {
          // Use cached data if less than 24 hours old
          this.claims = result.claimsDatabase;
          console.log(`Loaded ${this.claims.length} claims from cache`);
          return;
        }
      }

      // If no cache or outdated, load fresh data
      await this.updateClaims();
    } catch (error) {
      console.error('Error loading claims:', error);
      // Load default claims as fallback
      this.loadDefaultClaims();
    }
  }

  async updateClaims() {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${this.apiEndpoint}/claims`);
      // const claims = await response.json();

      // For now, use default claims
      this.loadDefaultClaims();

      // Save to storage
      await chrome.storage.local.set({
        claimsDatabase: this.claims,
        lastUpdated: Date.now()
      });

      console.log(`Updated claims database: ${this.claims.length} claims`);
    } catch (error) {
      console.error('Error updating claims:', error);
    }
  }

  loadDefaultClaims() {
    // Default claims database - will be replaced with API data
    this.claims = [
      {
        id: 'vaccines-autism',
        title: 'Vaccines cause autism',
        description: 'The claim that vaccines, particularly the MMR vaccine, cause autism has been thoroughly debunked by numerous large-scale studies.',
        url: 'https://ideastockexchange.com/w/page/vaccines-autism',
        patterns: [
          'vaccines? cause autism',
          'vaccines? (?:are|is) linked to autism',
          'MMR (?:vaccine )?causes autism',
          'vaccinations? lead to autism'
        ],
        confidence: 0.9,
        reasonsFor: 3,
        reasonsAgainst: 47,
        evidenceScore: 0.95,
        category: 'health'
      },
      {
        id: 'climate-change-hoax',
        title: 'Climate change is a hoax',
        description: '97% of climate scientists agree that climate change is real and primarily caused by human activities. Multiple independent lines of evidence support this conclusion.',
        url: 'https://ideastockexchange.com/w/page/climate-change',
        patterns: [
          'climate change is (?:a )?(?:hoax|fake|not real)',
          'global warming (?:is|isn\'t) (?:a )?(?:hoax|fake|real)',
          'climate (?:change|warming) (?:isn\'t|is not) happening'
        ],
        confidence: 0.85,
        reasonsFor: 8,
        reasonsAgainst: 92,
        evidenceScore: 0.98,
        category: 'science'
      },
      {
        id: 'flat-earth',
        title: 'The Earth is flat',
        description: 'The spherical shape of Earth has been known for over 2,000 years and confirmed by countless observations, experiments, and satellite imagery.',
        url: 'https://ideastockexchange.com/w/page/flat-earth',
        patterns: [
          'earth is flat',
          'flat earth',
          'earth (?:isn\'t|is not) (?:a )?(?:sphere|globe|round)'
        ],
        confidence: 0.95,
        reasonsFor: 5,
        reasonsAgainst: 78,
        evidenceScore: 0.99,
        category: 'science'
      },
      {
        id: 'moon-landing-fake',
        title: 'Moon landing was faked',
        description: 'The Apollo moon landings were real events witnessed by thousands of people and verified through physical evidence including moon rocks and retroreflectors.',
        url: 'https://ideastockexchange.com/w/page/moon-landing',
        patterns: [
          'moon landing (?:was|is) (?:fake|faked|staged)',
          '(?:we |they )?(?:never|didn\'t) (?:land|go) (?:on|to) the moon',
          'apollo (?:missions? )?(?:was|were) faked?'
        ],
        confidence: 0.88,
        reasonsFor: 12,
        reasonsAgainst: 64,
        evidenceScore: 0.92,
        category: 'history'
      },
      {
        id: 'evolution-theory',
        title: 'Evolution is just a theory',
        description: 'In science, "theory" means a well-substantiated explanation. Evolution is supported by overwhelming evidence from multiple scientific fields.',
        url: 'https://ideastockexchange.com/w/page/evolution',
        patterns: [
          'evolution is (?:just|only) (?:a )?theory',
          'evolution (?:isn\'t|is not) (?:proven|real)',
          'darwin\'s theory is (?:just|wrong)'
        ],
        confidence: 0.82,
        reasonsFor: 15,
        reasonsAgainst: 85,
        evidenceScore: 0.96,
        category: 'science'
      },
      {
        id: '5g-health-risks',
        title: '5G causes health problems',
        description: 'Scientific studies have found no evidence that 5G radio waves cause health problems. The frequencies used are non-ionizing and cannot damage DNA.',
        url: 'https://ideastockexchange.com/w/page/5g-health',
        patterns: [
          '5G (?:causes|leads to) (?:cancer|health problems)',
          '5G (?:is|are) dangerous',
          '5G (?:radiation|waves|signals) (?:causes|cause) (?:health issues|cancer|disease)'
        ],
        confidence: 0.87,
        reasonsFor: 7,
        reasonsAgainst: 56,
        evidenceScore: 0.88,
        category: 'technology'
      },
      {
        id: 'gmo-foods-unsafe',
        title: 'GMO foods are unsafe',
        description: 'Decades of research by independent scientists worldwide have found that approved GMO foods are as safe as their conventional counterparts.',
        url: 'https://ideastockexchange.com/w/page/gmo-safety',
        patterns: [
          'GMO(?:s)? (?:are|is) (?:dangerous|unsafe|toxic|harmful)',
          'genetically modified (?:food|organism)s? (?:are|is) (?:unsafe|dangerous|harmful)',
          'GMO(?:s)? (?:cause|causes) (?:cancer|disease|health problems)'
        ],
        confidence: 0.84,
        reasonsFor: 18,
        reasonsAgainst: 72,
        evidenceScore: 0.91,
        category: 'health'
      },
      {
        id: 'chemtrails',
        title: 'Chemtrails are real',
        description: 'The white trails behind aircraft are contrails (condensation trails) formed by water vapor in exhaust. There is no evidence of chemical spraying programs.',
        url: 'https://ideastockexchange.com/w/page/chemtrails',
        patterns: [
          'chemtrails (?:are|exist)',
          'government is spraying (?:chemicals|us)',
          'those (?:aren\'t|are not) contrails'
        ],
        confidence: 0.89,
        reasonsFor: 4,
        reasonsAgainst: 68,
        evidenceScore: 0.94,
        category: 'conspiracy'
      }
    ];
  }

  getClaims() {
    return this.claims;
  }

  async searchClaims(query) {
    // Simple text search - can be enhanced with fuzzy matching
    const lowerQuery = query.toLowerCase();
    return this.claims.filter(claim =>
      claim.title.toLowerCase().includes(lowerQuery) ||
      claim.description.toLowerCase().includes(lowerQuery) ||
      claim.patterns.some(pattern =>
        new RegExp(pattern, 'i').test(query)
      )
    );
  }

  async getClaimById(id) {
    return this.claims.find(claim => claim.id === id);
  }

  async addCustomClaim(claim) {
    // Allow users to add custom claims
    this.claims.push(claim);
    await chrome.storage.local.set({
      claimsDatabase: this.claims,
      lastUpdated: Date.now()
    });
  }
}

// Initialize database manager
const dbManager = new ClaimsDatabaseManager();

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getClaimsDatabase':
      sendResponse({ claims: dbManager.getClaims() });
      break;

    case 'searchClaims':
      dbManager.searchClaims(request.query).then(results => {
        sendResponse({ results });
      });
      return true; // Keep channel open for async response

    case 'getClaimById':
      dbManager.getClaimById(request.id).then(claim => {
        sendResponse({ claim });
      });
      return true;

    case 'updateDatabase':
      dbManager.updateClaims().then(() => {
        sendResponse({ success: true });
      });
      return true;

    case 'addCustomClaim':
      dbManager.addCustomClaim(request.claim).then(() => {
        sendResponse({ success: true });
      });
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }

  return true;
});

// Installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('IdeaStockExchange Fact Checker installed');

    // Set default settings
    chrome.storage.sync.set({
      enabled: true,
      highlightColor: '#fff3cd',
      showTooltips: true
    });

    // Open welcome page
    chrome.tabs.create({
      url: 'https://ideastockexchange.com/welcome'
    });
  }
});
