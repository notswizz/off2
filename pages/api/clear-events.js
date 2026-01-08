import { db } from '@/lib/firebase';

// One-time endpoint to clear old events
export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  try {
    const eventsRef = db.collection('events');
    const snapshot = await eventsRef.get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    
    res.status(200).json({ message: `Cleared ${snapshot.size} events` });
  } catch (error) {
    console.error('Clear events error:', error);
    res.status(500).json({ error: error.message });
  }
}

