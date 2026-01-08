import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  const { method } = req;

  switch (method) {
    case 'GET': {
      // Get comments for a player
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({ error: 'playerId required' });
      }

      try {
        const snapshot = await db.collection('comments')
          .where('playerId', '==', playerId)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();

        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        return res.status(200).json(comments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ error: 'Failed to fetch comments' });
      }
    }

    case 'POST': {
      // Add a new comment
      const { playerId, playerName, userId, college, collegeLogo, message, parentId, replyToUser, isAiGenerated } = req.body;

      if (!playerId || !userId || !college || !message) {
        return res.status(400).json({ error: 'playerId, userId, college, and message required' });
      }

      // AI messages can be longer
      const maxLength = isAiGenerated ? 1000 : 500;
      if (message.length > maxLength) {
        return res.status(400).json({ error: `Message too long (max ${maxLength} chars)` });
      }

      if (!isAiGenerated && userId.length > 30) {
        return res.status(400).json({ error: 'User ID too long (max 30 chars)' });
      }

      if (!isAiGenerated && college.length > 50) {
        return res.status(400).json({ error: 'College too long (max 50 chars)' });
      }

      try {
        const commentData = {
          playerId,
          playerName: playerName || 'Unknown',
          userId: userId.trim(),
          college: college.trim(),
          collegeLogo: collegeLogo || null,
          message: message.trim(),
          parentId: parentId || null,
          replyToUser: replyToUser || null,
          isAiGenerated: isAiGenerated || false,
          upvotes: 0,
          downvotes: 0,
          createdAt: new Date()
        };

        const docRef = await db.collection('comments').add(commentData);

        return res.status(201).json({ 
          id: docRef.id, 
          ...commentData,
          createdAt: commentData.createdAt.toISOString()
        });
      } catch (error) {
        console.error('Error adding comment:', error);
        return res.status(500).json({ error: 'Failed to add comment' });
      }
    }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}

