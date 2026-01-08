import { 
  analyzeRecruitingTrends, 
  batchAnalyze, 
  detectCommitmentSignals,
  generateIntelReport 
} from '@/lib/recruitingAnalyzer';
import { db } from '@/lib/firebase';

/**
 * API endpoint for AI-powered recruiting analysis
 * Uses GPT Responses API with web search to find tweets
 * 
 * POST /api/analyze-recruiting
 * Body: { 
 *   player: "Player Name",
 *   playerInfo?: { position, currentSchool },
 *   mode?: "full" | "signals"
 * }
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { player, players, playerInfo, mode = 'full' } = req.body;

    // Batch analysis for multiple players
    if (players && Array.isArray(players)) {
      const analyses = {};
      
      for (const p of players) {
        analyses[p] = await analyzeRecruitingTrends(p, [], {});
        await new Promise(r => setTimeout(r, 2000)); // Rate limit
      }
      
      const analysesArray = Object.values(analyses);
      const report = await generateIntelReport(analysesArray);
      
      if (db) {
        try {
          await db.collection('recruiting_analyses').add({
            type: 'batch',
            players,
            analyses,
            report,
            createdAt: new Date()
          });
        } catch (dbError) {
          console.error('DB error:', dbError);
        }
      }
      
      return res.status(200).json({
        type: 'batch',
        analyses,
        report,
        analyzedAt: new Date().toISOString()
      });
    }

    // Single player analysis
    if (!player) {
      return res.status(400).json({ error: 'Provide a player name' });
    }

    console.log(`Analyzing: ${player} (using web search)`);

    let result;

    if (mode === 'signals') {
      result = await detectCommitmentSignals(player);
    } else {
      // Full analysis with web search
      result = await analyzeRecruitingTrends(player, [], playerInfo || {});
    }

    // Store in Firebase
    if (db) {
      try {
        await db.collection('recruiting_analyses').add({
          ...result,
          createdAt: new Date()
        });
      } catch (dbError) {
        console.error('DB error:', dbError);
      }
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export const config = {
  maxDuration: 90, // Longer timeout for web search
};
