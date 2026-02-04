/**
 * Wikipedia API Service
 * Fetches and parses Wikipedia pages for automated belief generation
 */

import axios from 'axios';

const WIKIPEDIA_API_BASE = 'https://en.wikipedia.org/w/api.php';

/**
 * Fetch Wikipedia page data including content, categories, and infobox
 * @param {string} pageTitle - Title of the Wikipedia page
 * @returns {Promise<Object>} Page data
 */
export async function fetchWikipediaPage(pageTitle) {
  try {
    // Fetch page content, categories, and extract
    const response = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: 'query',
        format: 'json',
        titles: pageTitle,
        prop: 'extracts|categories|pageprops|info',
        exintro: true, // Get introduction only
        explaintext: true, // Plain text format
        cllimit: 'max', // Get all categories
        inprop: 'url|displaytitle',
        redirects: 1, // Follow redirects
      },
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];

    if (pageId === '-1') {
      throw new Error(`Wikipedia page "${pageTitle}" not found`);
    }

    // Fetch full content for detailed analysis
    const fullContentResponse = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: 'query',
        format: 'json',
        titles: pageTitle,
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
      },
    });

    const fullPages = fullContentResponse.data.query.pages;
    const fullPage = fullPages[pageId];
    const wikitext = fullPage?.revisions?.[0]?.slots?.main?.['*'] || '';

    return {
      title: page.title,
      displayTitle: page.displaytitle || page.title,
      url: page.fullurl,
      extract: page.extract || '',
      categories: (page.categories || []).map(cat => cat.title.replace('Category:', '')),
      wikitext,
      pageId,
    };
  } catch (error) {
    console.error('Error fetching Wikipedia page:', error);
    throw error;
  }
}

/**
 * Extract infobox data from wikitext
 * @param {string} wikitext - Raw Wikipedia markup
 * @returns {Object} Parsed infobox data
 */
export function extractInfobox(wikitext) {
  const infobox = {};

  // Match infobox template
  const infoboxMatch = wikitext.match(/\{\{Infobox[^}]*\n([\s\S]*?)\n\}\}/i);

  if (!infoboxMatch) {
    return infobox;
  }

  const infoboxContent = infoboxMatch[1];

  // Extract key-value pairs
  const lines = infoboxContent.split('\n');

  for (const line of lines) {
    const match = line.match(/^\s*\|\s*([^=]+?)\s*=\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      infobox[key] = cleanWikitext(value);
    }
  }

  return infobox;
}

/**
 * Clean wikitext formatting to plain text
 * @param {string} text - Text with wiki formatting
 * @returns {string} Clean text
 */
export function cleanWikitext(text) {
  if (!text) return '';

  return text
    // Remove refs
    .replace(/<ref[^>]*>.*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    // Remove comments
    .replace(/<!--.*?-->/gs, '')
    // Remove templates (basic)
    .replace(/\{\{[^}]*\}\}/g, '')
    // Remove internal links, keep text
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    // Remove external links
    .replace(/\[http[^\]]*\s([^\]]+)\]/g, '$1')
    // Remove formatting
    .replace(/'''([^']+)'''/g, '$1')
    .replace(/''([^']+)''/g, '$1')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Search Wikipedia for a topic
 * @param {string} query - Search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Search results
 */
export async function searchWikipedia(query, limit = 10) {
  try {
    const response = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: 'opensearch',
        format: 'json',
        search: query,
        limit,
      },
    });

    const [_, titles, descriptions, urls] = response.data;

    return titles.map((title, index) => ({
      title,
      description: descriptions[index],
      url: urls[index],
    }));
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    throw error;
  }
}

/**
 * Get random Wikipedia articles
 * @param {number} count - Number of random articles
 * @returns {Promise<Array>} Random article titles
 */
export async function getRandomArticles(count = 5) {
  try {
    const response = await axios.get(WIKIPEDIA_API_BASE, {
      params: {
        action: 'query',
        format: 'json',
        list: 'random',
        rnnamespace: 0, // Main namespace only
        rnlimit: count,
      },
    });

    return response.data.query.random.map(article => article.title);
  } catch (error) {
    console.error('Error fetching random articles:', error);
    throw error;
  }
}

/**
 * Extract key facts from Wikipedia extract/content
 * @param {string} extract - Wikipedia page extract
 * @param {string} wikitext - Full wikitext content
 * @returns {Array<string>} Key facts
 */
export function extractKeyFacts(extract, wikitext) {
  const facts = [];

  // Split extract into sentences
  const sentences = extract.match(/[^.!?]+[.!?]+/g) || [];

  // First 3-5 sentences are usually key facts
  facts.push(...sentences.slice(0, 5).map(s => s.trim()));

  // Extract from sections (basic parsing)
  const sections = wikitext.split(/\n==[^=]/);

  // Look for key sections
  const keywordSections = ['impact', 'significance', 'legacy', 'criticism', 'controversy', 'effects'];

  for (const section of sections) {
    const sectionLower = section.toLowerCase();

    for (const keyword of keywordSections) {
      if (sectionLower.includes(keyword)) {
        // Extract first few sentences from this section
        const sectionText = cleanWikitext(section);
        const sectionSentences = sectionText.match(/[^.!?]+[.!?]+/g) || [];
        facts.push(...sectionSentences.slice(0, 2).map(s => s.trim()));
      }
    }
  }

  return [...new Set(facts)].filter(f => f.length > 20 && f.length < 500);
}

export default {
  fetchWikipediaPage,
  extractInfobox,
  cleanWikitext,
  searchWikipedia,
  getRandomArticles,
  extractKeyFacts,
};
