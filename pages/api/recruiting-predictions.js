import { db } from '@/lib/firebase';

/**
 * API endpoint to get/store recruiting predictions
 * 
 * GET /api/recruiting-predictions - Get all predictions
 * GET /api/recruiting-predictions?player=Name - Get predictions for specific player
 * POST /api/recruiting-predictions - Store a new prediction
 */

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { player, limit = 50 } = req.query;
      
      if (!db) {
        return res.status(500).json({ error: 'Database not configured' });
      }
      
      let query = db.collection('recruiting_predictions')
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit));
      
      if (player) {
        query = db.collection('recruiting_predictions')
          .where('player', '==', player)
          .orderBy('createdAt', 'desc')
          .limit(parseInt(limit));
      }
      
      const snapshot = await query.get();
      const predictions = [];
      
      snapshot.forEach(doc => {
        predictions.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        });
      });
      
      return res.status(200).json({ predictions, count: predictions.length });
      
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'POST') {
    try {
      const { player, predictions, analysis, source = 'ai_analysis' } = req.body;
      
      if (!player || !predictions) {
        return res.status(400).json({ error: 'Player and predictions required' });
      }
      
      if (!db) {
        return res.status(500).json({ error: 'Database not configured' });
      }
      
      const docRef = await db.collection('recruiting_predictions').add({
        player,
        predictions,
        analysis,
        source,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return res.status(201).json({
        id: docRef.id,
        player,
        predictions,
        message: 'Prediction stored successfully'
      });
      
    } catch (error) {
      console.error('Error storing prediction:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Prediction ID required' });
      }
      
      if (!db) {
        return res.status(500).json({ error: 'Database not configured' });
      }
      
      await db.collection('recruiting_predictions').doc(id).delete();
      
      return res.status(200).json({ message: 'Prediction deleted' });
      
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

