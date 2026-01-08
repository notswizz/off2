import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  const { method } = req;

  switch (method) {
    case 'GET': {
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({ error: 'playerId required' });
      }

      try {
        const doc = await db.collection('votes').doc(playerId).get();
        
        if (!doc.exists) {
          return res.status(200).json({ upvotes: 0, downvotes: 0, score: 0 });
        }
        
        const data = doc.data();
        return res.status(200).json({
          upvotes: data.upvotes || 0,
          downvotes: data.downvotes || 0,
          score: (data.upvotes || 0) - (data.downvotes || 0)
        });
      } catch (error) {
        console.error('Error fetching votes:', error);
        return res.status(500).json({ error: 'Failed to fetch votes' });
      }
    }

    case 'POST': {
      const { playerId, voteType } = req.body;

      if (!playerId || !voteType) {
        return res.status(400).json({ error: 'playerId and voteType required' });
      }

      if (voteType !== 'up' && voteType !== 'down') {
        return res.status(400).json({ error: 'voteType must be "up" or "down"' });
      }

      try {
        const docRef = db.collection('votes').doc(playerId);
        const doc = await docRef.get();
        
        let upvotes = 0;
        let downvotes = 0;
        
        if (doc.exists) {
          const data = doc.data();
          upvotes = data.upvotes || 0;
          downvotes = data.downvotes || 0;
        }
        
        if (voteType === 'up') {
          upvotes += 1;
        } else {
          downvotes += 1;
        }
        
        await docRef.set({ upvotes, downvotes, updatedAt: new Date() });
        
        return res.status(200).json({
          upvotes,
          downvotes,
          score: upvotes - downvotes
        });
      } catch (error) {
        console.error('Error voting:', error);
        return res.status(500).json({ error: 'Failed to vote' });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

