import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }

  const { userId, actionType, limit = 100 } = req.query;

  try {
    let query = db.collection('user_actions')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (actionType) {
      query = query.where('actionType', '==', actionType);
    }

    const snapshot = await query.get();
    
    const actions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    }));

    // Also get some stats
    const statsSnapshot = await db.collection('user_actions').get();
    const allActions = statsSnapshot.docs.map(d => d.data());
    
    const stats = {
      totalActions: allActions.length,
      uniqueUsers: [...new Set(allActions.map(a => a.userId))].length,
      byType: allActions.reduce((acc, a) => {
        acc[a.actionType] = (acc[a.actionType] || 0) + 1;
        return acc;
      }, {})
    };

    res.status(200).json({ actions, stats });
  } catch (error) {
    console.error('Error fetching user actions:', error);
    res.status(500).json({ error: 'Failed to fetch user actions' });
  }
}

