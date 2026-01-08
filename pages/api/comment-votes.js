import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  const { method } = req;

  switch (method) {
    case 'POST': {
      const { commentId, voteType } = req.body;

      if (!commentId || !voteType) {
        return res.status(400).json({ error: 'commentId and voteType required' });
      }

      if (voteType !== 'up' && voteType !== 'down') {
        return res.status(400).json({ error: 'voteType must be "up" or "down"' });
      }

      try {
        const commentRef = db.collection('comments').doc(commentId);
        const doc = await commentRef.get();
        
        if (!doc.exists) {
          return res.status(404).json({ error: 'Comment not found' });
        }
        
        const data = doc.data();
        let upvotes = data.upvotes || 0;
        let downvotes = data.downvotes || 0;
        
        if (voteType === 'up') {
          upvotes += 1;
        } else {
          downvotes += 1;
        }
        
        await commentRef.update({ upvotes, downvotes });
        
        return res.status(200).json({
          upvotes,
          downvotes,
          score: upvotes - downvotes
        });
      } catch (error) {
        console.error('Error voting on comment:', error);
        return res.status(500).json({ error: 'Failed to vote' });
      }
    }

    default:
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

