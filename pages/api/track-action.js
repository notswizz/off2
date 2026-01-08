import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  const { userId, college, collegeLogo, actionType, targetType, targetId, targetName, metadata } = req.body;

  // Only track if user has identity
  if (!userId || !college) {
    return res.status(400).json({ error: 'User identity required for tracking' });
  }

  // Validate action type
  const validActions = ['upvote', 'downvote', 'comment', 'reply', 'view_player', 'view_activity'];
  if (!validActions.includes(actionType)) {
    return res.status(400).json({ error: 'Invalid action type' });
  }

  try {
    const actionRef = db.collection('user_actions').doc();
    
    await actionRef.set({
      id: actionRef.id,
      userId,
      college,
      collegeLogo: collegeLogo || null,
      actionType,
      targetType, // 'player', 'comment', 'activity'
      targetId: targetId || null,
      targetName: targetName || null,
      metadata: metadata || {},
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, actionId: actionRef.id });
  } catch (error) {
    console.error('Error tracking action:', error);
    res.status(500).json({ error: 'Failed to track action' });
  }
}

