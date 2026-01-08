import { scrapeTweets, scrapeRecruitingAccounts, monitorPlayers } from '@/lib/twitterScraper';
import { db } from '@/lib/firebase';

/**
 * API endpoint for scraping Twitter for recruiting intel
 * 
 * POST /api/twitter-scrape
 * Body: { player: "Player Name" } or { players: ["Player 1", "Player 2"] }
 * 
 * GET /api/twitter-scrape?player=PlayerName
 */

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { player, players, maxTweets = 50 } = req.body;
      
      if (!player && !players) {
        return res.status(400).json({ error: 'Provide a player name or list of players' });
      }
      
      let results;
      
      if (players && Array.isArray(players)) {
        // Batch scrape multiple players
        results = await monitorPlayers(players);
      } else {
        // Single player scrape
        const generalTweets = await scrapeTweets(player, maxTweets);
        const recruitingTweets = await scrapeRecruitingAccounts(player);
        
        results = {
          player,
          generalTweets,
          recruitingTweets,
          totalFound: generalTweets.length + recruitingTweets.length,
          scrapedAt: new Date().toISOString()
        };
        
        // Store in Firebase
        if (db) {
          try {
            await db.collection('twitter_scrapes').add({
              ...results,
              createdAt: new Date()
            });
          } catch (dbError) {
            console.error('Failed to store scrape:', dbError);
          }
        }
      }
      
      return res.status(200).json(results);
      
    } catch (error) {
      console.error('Scraping error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'GET') {
    const { player, limit = 30 } = req.query;
    
    if (!player) {
      return res.status(400).json({ error: 'Provide a player query parameter' });
    }
    
    try {
      const tweets = await scrapeTweets(player, parseInt(limit));
      
      return res.status(200).json({
        player,
        tweets,
        count: tweets.length,
        scrapedAt: new Date().toISOString()
      });
      
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

// Increase timeout for scraping
export const config = {
  api: {
    bodyParser: true,
    responseLimit: false,
  },
  maxDuration: 60, // 60 seconds for scraping
};

