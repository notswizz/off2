import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (!db) {
    return res.status(200).json({ 
      events: [],
      message: 'Firebase not configured - run sync first or check env vars'
    });
  }

  try {
    const { limit = 50, type } = req.query;

    let query = db.collection('events')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));

    if (type && type !== 'all') {
      query = db.collection('events')
        .where('type', '==', type)
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit));
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
    }));

    res.status(200).json({ events });
  } catch (error) {
    console.error('Events fetch error:', error);
    
    // Handle index not ready error
    if (error.code === 9) {
      return res.status(200).json({ 
        events: [],
        message: 'Firestore index being created - try again in a few minutes'
      });
    }
    
    res.status(500).json({ error: error.message });
  }
}
