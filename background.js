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
      },
      // Additional Health & Medicine Claims
      {
        id: 'natural-immunity-superior',
        title: 'Natural immunity is always better than vaccines',
        description: 'While natural immunity can be strong, it requires getting sick first, which carries serious risks. Vaccines provide protection without the danger of the actual disease.',
        url: 'https://ideastockexchange.com/w/page/natural-immunity',
        patterns: [
          'natural immunity (?:is )?(?:better|superior) (?:than|to) vaccines?',
          'natural immunity is (?:all you need|enough)',
          'vaccines? (?:aren\'t|are not) as good as natural immunity'
        ],
        confidence: 0.85,
        reasonsFor: 12,
        reasonsAgainst: 45,
        evidenceScore: 0.73,
        category: 'health'
      },
      {
        id: 'covid-just-flu',
        title: 'COVID-19 is just the flu',
        description: 'COVID-19 is significantly more deadly than seasonal flu, with higher hospitalization rates, long-term health effects, and different transmission patterns.',
        url: 'https://ideastockexchange.com/w/page/covid-vs-flu',
        patterns: [
          'COVID (?:is )?(?:just|only) (?:the|a) flu',
          'coronavirus (?:is )?(?:no worse than|just like) (?:the )?flu',
          'COVID (?:isn\'t|is not) any worse than flu'
        ],
        confidence: 0.88,
        reasonsFor: 6,
        reasonsAgainst: 78,
        evidenceScore: 0.95,
        category: 'health'
      },
      {
        id: 'microwave-food-harmful',
        title: 'Microwaving food removes nutrients',
        description: 'Microwaving is actually one of the best cooking methods for nutrient retention because of shorter cooking times and less water use.',
        url: 'https://ideastockexchange.com/w/page/microwave-nutrition',
        patterns: [
          'microwave(?:s|ing|d)? (?:removes?|destroys?|kills?) nutrients',
          'microwaved food (?:is|has) (?:no|less) nutrients',
          'microwave(?:s|ing) (?:is|makes food) (?:harmful|unhealthy|dangerous)'
        ],
        confidence: 0.82,
        reasonsFor: 8,
        reasonsAgainst: 42,
        evidenceScore: 0.87,
        category: 'health'
      },
      {
        id: 'detox-cleanses',
        title: 'You need detox cleanses to remove toxins',
        description: 'Your liver and kidneys naturally detoxify your body. Commercial detox products are not supported by scientific evidence and can sometimes be harmful.',
        url: 'https://ideastockexchange.com/w/page/detox-myths',
        patterns: [
          'you need (?:to )?detox (?:cleanses?)?',
          'detox (?:cleanses?|diets?) remove toxins',
          'your body needs? (?:help )?(?:to )?detox'
        ],
        confidence: 0.78,
        reasonsFor: 14,
        reasonsAgainst: 52,
        evidenceScore: 0.81,
        category: 'health'
      },
      {
        id: 'sugar-makes-kids-hyperactive',
        title: 'Sugar makes kids hyperactive',
        description: 'Multiple controlled studies have found no link between sugar consumption and hyperactivity in children. The belief persists due to confirmation bias.',
        url: 'https://ideastockexchange.com/w/page/sugar-hyperactivity',
        patterns: [
          'sugar makes (?:kids|children) (?:hyper|hyperactive)',
          'sugar (?:causes|leads to) hyperactivity',
          '(?:kids|children) get hyper(?:active)? from sugar'
        ],
        confidence: 0.86,
        reasonsFor: 9,
        reasonsAgainst: 38,
        evidenceScore: 0.89,
        category: 'health'
      },
      {
        id: 'msg-dangerous',
        title: 'MSG is dangerous',
        description: 'MSG (monosodium glutamate) is safe according to major health organizations. Studies have found no consistent evidence of adverse reactions in the general population.',
        url: 'https://ideastockexchange.com/w/page/msg-safety',
        patterns: [
          'MSG (?:is )?(?:dangerous|harmful|toxic|bad)',
          'monosodium glutamate (?:is )?(?:dangerous|harmful|unsafe)',
          'MSG (?:causes|gives) (?:headaches|problems|reactions)'
        ],
        confidence: 0.84,
        reasonsFor: 11,
        reasonsAgainst: 46,
        evidenceScore: 0.88,
        category: 'health'
      },
      // Nutrition Claims
      {
        id: 'breakfast-most-important',
        title: 'Breakfast is the most important meal',
        description: 'While breakfast can be beneficial, this claim is largely based on marketing. Meal timing is less important than overall diet quality and individual needs.',
        url: 'https://ideastockexchange.com/w/page/breakfast-myth',
        patterns: [
          'breakfast (?:is )?(?:the )?most important meal',
          'you (?:need|must|should) eat breakfast',
          'skipping breakfast (?:is )?(?:bad|unhealthy)'
        ],
        confidence: 0.81,
        reasonsFor: 22,
        reasonsAgainst: 34,
        evidenceScore: 0.62,
        category: 'nutrition'
      },
      {
        id: 'carbs-make-fat',
        title: 'Carbs make you fat',
        description: 'Weight gain is about total calorie intake, not specific macronutrients. Many healthy populations eat high-carb diets without obesity problems.',
        url: 'https://ideastockexchange.com/w/page/carbs-weight',
        patterns: [
          'carbs? make (?:you|people) fat',
          'carbohydrates (?:cause|lead to) (?:weight gain|obesity)',
          'cutting carbs? (?:is the only way|will make you) lose weight'
        ],
        confidence: 0.79,
        reasonsFor: 18,
        reasonsAgainst: 56,
        evidenceScore: 0.75,
        category: 'nutrition'
      },
      {
        id: 'organic-more-nutritious',
        title: 'Organic food is more nutritious',
        description: 'Studies show minimal nutritional differences between organic and conventional foods. The main benefits of organic are environmental and pesticide reduction.',
        url: 'https://ideastockexchange.com/w/page/organic-nutrition',
        patterns: [
          'organic (?:food|produce) (?:is )?(?:more )?nutritious',
          'organic (?:has|contains) more (?:nutrients|vitamins)',
          'organic (?:is )?(?:healthier|better) than conventional'
        ],
        confidence: 0.77,
        reasonsFor: 24,
        reasonsAgainst: 41,
        evidenceScore: 0.68,
        category: 'nutrition'
      },
      // Psychology & Neuroscience Claims
      {
        id: 'left-brain-right-brain',
        title: 'People are left-brained or right-brained',
        description: 'Brain imaging shows that people use both hemispheres equally. The left-brain/right-brain dichotomy is a myth not supported by neuroscience.',
        url: 'https://ideastockexchange.com/w/page/brain-hemispheres',
        patterns: [
          '(?:people|some) (?:are )?(?:left|right)[- ]brained',
          'left brain (?:vs|versus|and) right brain',
          '(?:i\'m|i am|they\'re|you\'re) (?:a )?(?:left|right)[- ]brain person'
        ],
        confidence: 0.86,
        reasonsFor: 7,
        reasonsAgainst: 54,
        evidenceScore: 0.92,
        category: 'psychology'
      },
      {
        id: 'only-use-10-percent-brain',
        title: 'We only use 10% of our brain',
        description: 'Brain imaging shows we use all parts of our brain. While not all neurons fire simultaneously, every region has a known function.',
        url: 'https://ideastockexchange.com/w/page/10-percent-brain',
        patterns: [
          '(?:we|humans|people) (?:only )?use (?:only )?(?:10|ten)(?:%| percent) (?:of )?(?:our|their|the) brain',
          'only (?:10|ten) percent (?:of )?(?:our|the) brain (?:is )?used',
          '(?:we|humans) don\'t use (?:most of|all) (?:our|the) brain'
        ],
        confidence: 0.91,
        reasonsFor: 3,
        reasonsAgainst: 67,
        evidenceScore: 0.97,
        category: 'psychology'
      },
      {
        id: 'learning-styles',
        title: 'People have different learning styles',
        description: 'While people have preferences, research shows no evidence that teaching to specific "learning styles" (visual, auditory, kinesthetic) improves outcomes.',
        url: 'https://ideastockexchange.com/w/page/learning-styles',
        patterns: [
          'people have different learning styles',
          '(?:visual|auditory|kinesthetic) learners?',
          'everyone learns? (?:in )?different (?:ways|styles)'
        ],
        confidence: 0.73,
        reasonsFor: 28,
        reasonsAgainst: 48,
        evidenceScore: 0.71,
        category: 'psychology'
      },
      // Technology Claims
      {
        id: 'incognito-mode-anonymous',
        title: 'Incognito mode makes you anonymous',
        description: 'Incognito mode only prevents local browsing history storage. Your ISP, employer, websites, and governments can still track your activity.',
        url: 'https://ideastockexchange.com/w/page/incognito-privacy',
        patterns: [
          'incognito (?:mode )?makes? (?:you|me) anonymous',
          'incognito (?:mode )?(?:hides?|protects?) (?:your|my) (?:identity|activity)',
          '(?:i\'m|you\'re) (?:safe|anonymous|private) in incognito'
        ],
        confidence: 0.87,
        reasonsFor: 5,
        reasonsAgainst: 58,
        evidenceScore: 0.94,
        category: 'technology'
      },
      {
        id: 'macs-dont-get-viruses',
        title: 'Macs don\'t get viruses',
        description: 'While Macs historically had fewer viruses due to smaller market share, they are vulnerable to malware. macOS malware has increased significantly.',
        url: 'https://ideastockexchange.com/w/page/mac-security',
        patterns: [
          'Macs? don\'t get viruses',
          'Mac(?:intosh|s|Books?) (?:can\'t|cannot) get (?:viruses|malware)',
          'Macs? (?:are )?immune to viruses'
        ],
        confidence: 0.89,
        reasonsFor: 8,
        reasonsAgainst: 51,
        evidenceScore: 0.91,
        category: 'technology'
      },
      {
        id: 'more-megapixels-better',
        title: 'More megapixels means better photos',
        description: 'Photo quality depends on many factors: sensor size, lens quality, image processing, and lighting. More megapixels only helps for very large prints.',
        url: 'https://ideastockexchange.com/w/page/megapixel-myth',
        patterns: [
          'more megapixels (?:means?|equals?) better (?:photos?|pictures?|camera)',
          'higher megapixels? (?:is )?better',
          'megapixels? (?:determine|make) photo quality'
        ],
        confidence: 0.82,
        reasonsFor: 15,
        reasonsAgainst: 47,
        evidenceScore: 0.79,
        category: 'technology'
      },
      // Economics Claims
      {
        id: 'trickle-down-economics',
        title: 'Trickle-down economics works',
        description: 'Economic research shows tax cuts for the wealthy do not significantly boost economic growth or wages for workers. Wealth tends to concentrate rather than trickle down.',
        url: 'https://ideastockexchange.com/w/page/trickle-down',
        patterns: [
          'trickle[- ]down (?:economics )?works?',
          'tax cuts (?:for the wealthy )?(?:help|benefit) everyone',
          'wealth trickles? down'
        ],
        confidence: 0.76,
        reasonsFor: 28,
        reasonsAgainst: 62,
        evidenceScore: 0.72,
        category: 'economics'
      },
      {
        id: 'minimum-wage-kills-jobs',
        title: 'Raising minimum wage kills jobs',
        description: 'Economic research shows mixed results, with many studies finding minimal job loss effects. Some areas see improved worker productivity and reduced turnover.',
        url: 'https://ideastockexchange.com/w/page/minimum-wage',
        patterns: [
          'raising (?:the )?minimum wage (?:kills|destroys|eliminates) jobs?',
          'minimum wage increases? (?:cause|lead to) (?:job loss|unemployment)',
          'higher minimum wage (?:will )?(?:destroy|hurt) (?:small )?business'
        ],
        confidence: 0.74,
        reasonsFor: 36,
        reasonsAgainst: 52,
        evidenceScore: 0.58,
        category: 'economics'
      },
      // Environmental Claims
      {
        id: 'recycling-pointless',
        title: 'Recycling is pointless',
        description: 'While recycling has challenges, it significantly reduces energy use, emissions, and landfill waste. Aluminum and glass recycling are particularly effective.',
        url: 'https://ideastockexchange.com/w/page/recycling-effectiveness',
        patterns: [
          'recycling (?:is )?(?:pointless|useless|waste)',
          'recycling doesn\'t (?:work|help|matter)',
          'recycling (?:is )?(?:a )?(?:scam|lie|myth)'
        ],
        confidence: 0.81,
        reasonsFor: 19,
        reasonsAgainst: 54,
        evidenceScore: 0.77,
        category: 'environment'
      },
      {
        id: 'electric-cars-worse',
        title: 'Electric cars are worse for the environment',
        description: 'Even accounting for battery production and electricity generation, EVs have lower lifetime emissions than gas cars in most regions.',
        url: 'https://ideastockexchange.com/w/page/ev-environment',
        patterns: [
          'electric (?:cars|vehicles) (?:are )?worse for (?:the )?environment',
          'EVs? (?:aren\'t|are not) (?:really )?(?:green|eco-friendly)',
          'electric cars? (?:cause|create) more pollution'
        ],
        confidence: 0.83,
        reasonsFor: 16,
        reasonsAgainst: 58,
        evidenceScore: 0.84,
        category: 'environment'
      },
      // History Claims
      {
        id: 'columbus-discovered-america',
        title: 'Columbus discovered America',
        description: 'Indigenous peoples lived in the Americas for over 15,000 years before Columbus. Vikings also reached North America around 1000 CE.',
        url: 'https://ideastockexchange.com/w/page/columbus-myth',
        patterns: [
          'Columbus discovered America',
          'Christopher Columbus (?:was|is) (?:the )?(?:first|who discovered)',
          'Columbus found America'
        ],
        confidence: 0.88,
        reasonsFor: 6,
        reasonsAgainst: 72,
        evidenceScore: 0.95,
        category: 'history'
      },
      {
        id: 'napoleon-short',
        title: 'Napoleon was short',
        description: 'Napoleon was about 5\'7", which was average or slightly above average for French men of his time. The "short Napoleon" myth came from British propaganda.',
        url: 'https://ideastockexchange.com/w/page/napoleon-height',
        patterns: [
          'Napoleon was short',
          'Napoleon (?:had )?(?:a )?(?:short|small) (?:stature|height)',
          'Napoleon complex'
        ],
        confidence: 0.85,
        reasonsFor: 7,
        reasonsAgainst: 48,
        evidenceScore: 0.91,
        category: 'history'
      },
      // Language & Communication Claims
      {
        id: 'eskimo-words-for-snow',
        title: 'Eskimos have hundreds of words for snow',
        description: 'This is an exaggeration. Inuit languages have about as many root words for snow as English. The myth grew from linguistic misunderstandings.',
        url: 'https://ideastockexchange.com/w/page/eskimo-snow-words',
        patterns: [
          'Eskimo(?:s|es) have (?:hundreds?|many|lots) (?:of )?words for snow',
          'Inuit (?:have|language has) (?:hundreds?|many) words for snow',
          '(?:hundreds?|many) words for snow'
        ],
        confidence: 0.79,
        reasonsFor: 12,
        reasonsAgainst: 44,
        evidenceScore: 0.83,
        category: 'language'
      },
      // Animal & Nature Claims
      {
        id: 'goldfish-memory-seconds',
        title: 'Goldfish have 3-second memory',
        description: 'Goldfish can remember things for months. Studies show they can learn routines, recognize faces, and be trained to perform tasks.',
        url: 'https://ideastockexchange.com/w/page/goldfish-memory',
        patterns: [
          'goldfish (?:have|has) (?:a )?(?:3|three)[- ]second memory',
          'goldfish (?:can\'t|cannot) remember (?:anything|things)',
          'goldfish (?:memory )?(?:is )?(?:only )?(?:3|three) seconds?'
        ],
        confidence: 0.87,
        reasonsFor: 4,
        reasonsAgainst: 52,
        evidenceScore: 0.93,
        category: 'nature'
      },
      {
        id: 'bulls-hate-red',
        title: 'Bulls hate the color red',
        description: 'Bulls are colorblind to red. They react to the movement of the cape, not its color. Bullfighters use red capes for tradition and to hide blood stains.',
        url: 'https://ideastockexchange.com/w/page/bulls-red',
        patterns: [
          'bulls? (?:hate|are (?:angered|enraged) by) (?:the color )?red',
          'red makes? bulls? (?:angry|mad|charge)',
          'bulls? (?:see|react to) red'
        ],
        confidence: 0.84,
        reasonsFor: 5,
        reasonsAgainst: 49,
        evidenceScore: 0.91,
        category: 'nature'
      },
      {
        id: 'touch-bird-reject',
        title: 'Birds reject babies if you touch them',
        description: 'Most birds have a poor sense of smell and won\'t abandon chicks due to human scent. However, it\'s still best not to disturb nests unnecessarily.',
        url: 'https://ideastockexchange.com/w/page/bird-abandonment',
        patterns: [
          '(?:birds?|mother birds?) (?:will )?(?:reject|abandon) (?:babies?|chicks?|young) if you touch',
          'touching (?:a )?(?:baby bird|chick) (?:makes?|causes) (?:the )?(?:mother|parents?) (?:to )?(?:reject|abandon)',
          'don\'t touch (?:baby )?birds? (?:or|because) (?:mother|parents?) will (?:reject|abandon)'
        ],
        confidence: 0.81,
        reasonsFor: 8,
        reasonsAgainst: 46,
        evidenceScore: 0.88,
        category: 'nature'
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
