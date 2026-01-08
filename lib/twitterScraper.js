/**
 * Twitter/X Data Fetcher
 * Multiple methods to get recruiting intel
 */

// Common recruiting accounts
const RECRUITING_ACCOUNTS = [
  'Hayesfawcett3', 'On3Recruits', 'Rivals', '247Sports',
  'ESPNRecruiting', 'TomLoy247', 'SWiltfong247', 'On3sports'
];

/**
 * Fetch with proper headers
 */
async function safeFetch(url, options = {}) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    ...options.headers
  };
  
  try {
    const response = await fetch(url, { ...options, headers, timeout: 10000 });
    return response;
  } catch (error) {
    console.log(`Fetch failed for ${url}:`, error.message);
    return null;
  }
}

/**
 * Search On3 for player news
 */
async function searchOn3(playerName) {
  const results = [];
  
  try {
    const searchUrl = `https://www.on3.com/search/?q=${encodeURIComponent(playerName)}`;
    const response = await safeFetch(searchUrl);
    
    if (response?.ok) {
      const html = await response.text();
      
      // Extract article snippets from search results
      const titleMatches = html.match(/<h[23][^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)</g) || [];
      const snippetMatches = html.match(/<p[^>]*class="[^"]*excerpt[^"]*"[^>]*>([^<]+)</g) || [];
      
      for (let i = 0; i < Math.min(titleMatches.length, 5); i++) {
        const title = titleMatches[i]?.replace(/<[^>]+>/g, '').trim() || '';
        const snippet = snippetMatches[i]?.replace(/<[^>]+>/g, '').trim() || '';
        
        if (title) {
          results.push({
            text: `${title} - ${snippet}`.trim(),
            user: 'On3',
            handle: 'on3sports',
            timestamp: new Date().toISOString(),
            source: 'on3'
          });
        }
      }
    }
  } catch (error) {
    console.log('On3 search failed:', error.message);
  }
  
  return results;
}

/**
 * Search 247Sports for player info
 */
async function search247(playerName) {
  const results = [];
  
  try {
    const searchUrl = `https://247sports.com/Season/2025-Football/Recruits/?name=${encodeURIComponent(playerName)}`;
    const response = await safeFetch(searchUrl);
    
    if (response?.ok) {
      const html = await response.text();
      
      // Look for player info in the HTML
      if (html.includes(playerName) || html.toLowerCase().includes(playerName.toLowerCase())) {
        // Extract any commitment or school info
        const commitMatch = html.match(/committed to ([^<"]+)/i);
        const schoolMatch = html.match(/class="school-name">([^<]+)</i);
        
        if (commitMatch || schoolMatch) {
          results.push({
            text: `247Sports: ${playerName} ${commitMatch ? `committed to ${commitMatch[1]}` : ''} ${schoolMatch ? schoolMatch[1] : ''}`.trim(),
            user: '247Sports',
            handle: '247sports',
            timestamp: new Date().toISOString(),
            source: '247sports'
          });
        }
      }
    }
  } catch (error) {
    console.log('247 search failed:', error.message);
  }
  
  return results;
}

/**
 * Search Rivals for player info
 */
async function searchRivals(playerName) {
  const results = [];
  
  try {
    const searchUrl = `https://n.rivals.com/search?q=${encodeURIComponent(playerName)}`;
    const response = await safeFetch(searchUrl);
    
    if (response?.ok) {
      const html = await response.text();
      
      // Extract any relevant info
      const matches = html.match(/<div[^>]*class="[^"]*result[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
      
      for (const match of matches.slice(0, 3)) {
        const text = match.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (text && text.length > 20) {
          results.push({
            text: text.slice(0, 200),
            user: 'Rivals',
            handle: 'rivals',
            timestamp: new Date().toISOString(),
            source: 'rivals'
          });
        }
      }
    }
  } catch (error) {
    console.log('Rivals search failed:', error.message);
  }
  
  return results;
}

/**
 * Get Google News results for the player
 */
async function searchGoogleNews(playerName) {
  const results = [];
  
  try {
    // Use Google News RSS feed
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(playerName + ' football recruit')}&hl=en-US&gl=US&ceid=US:en`;
    const response = await safeFetch(rssUrl);
    
    if (response?.ok) {
      const xml = await response.text();
      
      // Parse RSS items
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of items.slice(0, 8)) {
        const title = item.match(/<title>([^<]+)<\/title>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>([^<]+)<\/pubDate>/)?.[1] || '';
        const source = item.match(/<source[^>]*>([^<]+)<\/source>/)?.[1] || 'News';
        
        if (title) {
          results.push({
            text: title.replace(/&amp;/g, '&').replace(/&quot;/g, '"'),
            user: source,
            handle: 'news',
            timestamp: pubDate || new Date().toISOString(),
            source: 'google_news'
          });
        }
      }
    }
  } catch (error) {
    console.log('Google News search failed:', error.message);
  }
  
  return results;
}

/**
 * Main scrape function - tries multiple sources
 */
export async function scrapeTweets(query, maxTweets = 50) {
  console.log(`Fetching data for: ${query}`);
  const allResults = [];
  
  // Try all sources in parallel
  const [on3Results, news247Results, rivalsResults, googleNews] = await Promise.all([
    searchOn3(query),
    search247(query),
    searchRivals(query),
    searchGoogleNews(query)
  ]);
  
  console.log(`On3: ${on3Results.length}, 247: ${news247Results.length}, Rivals: ${rivalsResults.length}, News: ${googleNews.length}`);
  
  allResults.push(...on3Results, ...news247Results, ...rivalsResults, ...googleNews);
  
  // If we got nothing, return some context for the AI
  if (allResults.length === 0) {
    console.log('No results from any source, adding context note');
    allResults.push({
      text: `Searching for recruiting information about ${query}. Please analyze based on your knowledge of this player.`,
      user: 'system',
      handle: 'system',
      timestamp: new Date().toISOString(),
      source: 'system'
    });
  }
  
  return allResults.slice(0, maxTweets);
}

/**
 * Additional search for more context
 */
export async function scrapeRecruitingAccounts(playerName) {
  // Get more Google News results
  const results = await searchGoogleNews(playerName + ' commitment');
  console.log(`Additional news search found ${results.length} results`);
  return results;
}

/**
 * Monitor multiple players
 */
export async function monitorPlayers(playerNames) {
  const results = {};
  
  for (const player of playerNames) {
    console.log(`Fetching data for: ${player}`);
    const tweets = await scrapeTweets(player, 30);
    const additionalResults = await scrapeRecruitingAccounts(player);
    
    results[player] = {
      generalTweets: tweets,
      recruitingTweets: additionalResults,
      totalFound: tweets.length + additionalResults.length,
      scrapedAt: new Date().toISOString()
    };
    
    // Small delay between players
    await new Promise(r => setTimeout(r, 1000));
  }
  
  return results;
}
