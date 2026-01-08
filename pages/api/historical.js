import { db } from '@/lib/firebase';

export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  const { type = 'summary', team, player, year } = req.query;

  try {
    if (type === 'summary') {
      // Get year-over-year summary
      const snapshot = await db.collection('historical').get();
      const years = snapshot.docs.map(doc => ({
        year: doc.id,
        ...doc.data(),
        syncedAt: doc.data().syncedAt?.toDate?.()?.toISOString() || null,
      }));
      
      return res.status(200).json({ years: years.sort((a, b) => a.year - b.year) });
    }

    if (type === 'teams' && year) {
      // Get all teams for a specific year
      const snapshot = await db.collection('historical').doc(year).collection('teams')
        .orderBy('totalNil', 'desc')
        .limit(50)
        .get();
      
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return res.status(200).json({ teams, year });
    }

    if (type === 'team-history' && team) {
      // Get a specific team's data across all years
      const years = ['2024', '2025', '2026'];
      const teamHistory = [];
      
      for (const y of years) {
        const teamDoc = await db.collection('historical').doc(y).collection('teams').doc(team).get();
        if (teamDoc.exists) {
          teamHistory.push({
            year: y,
            ...teamDoc.data(),
          });
        }
      }
      
      return res.status(200).json({ team, history: teamHistory });
    }

    if (type === 'top-nil' && year) {
      // Get ALL players for a year
      const snapshot = await db.collection('historical').doc(year).collection('players')
        .get();
      
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Sort by NIL value (nulls last), then by rating
      players.sort((a, b) => {
        if (a.nilValue && b.nilValue) return b.nilValue - a.nilValue;
        if (a.nilValue) return -1;
        if (b.nilValue) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
      
      return res.status(200).json({ players, year, totalCount: players.length });
    }

    if (type === 'player-history' && player) {
      // Get a specific player's data across years
      const years = ['2024', '2025', '2026'];
      const playerHistory = [];
      
      for (const y of years) {
        const playerDoc = await db.collection('historical').doc(y).collection('players').doc(player).get();
        if (playerDoc.exists) {
          playerHistory.push({
            year: y,
            ...playerDoc.data(),
          });
        }
      }
      
      return res.status(200).json({ player, history: playerHistory });
    }

    res.status(400).json({ error: 'Invalid type parameter' });
  } catch (error) {
    console.error('Historical API error:', error);
    res.status(500).json({ error: error.message });
  }
}

