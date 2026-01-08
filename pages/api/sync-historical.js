import { db } from '@/lib/firebase';

// Fetch and store historical transfer portal data for multiple years
export default async function handler(req, res) {
  if (!db) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  const years = ['2024', '2025', '2026'];
  const results = {};

  for (const year of years) {
    try {
      console.log(`Fetching data for ${year}...`);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transfer-portal?sport=football&year=${year}`
      );
      
      if (!response.ok) {
        results[year] = { error: `Failed to fetch: ${response.status}` };
        continue;
      }

      const data = await response.json();
      const players = data?.pageProps?.players || [];
      
      console.log(`Year ${year}: Found ${players.length} players in API response`);
      
      if (players.length === 0) {
        results[year] = { error: 'No players found' };
        continue;
      }

      const batch = db.batch();
      const yearRef = db.collection('historical').doc(year);
      
      // Store year summary
      const teamStats = {};
      let totalNilValue = 0;
      let playersWithNil = 0;

      for (const player of players) {
        const transferRating = player.transferRating || player.rosterRating || player.rating || {};
        const lastTeam = player.lastTeam;
        const commitStatus = player.commitStatus || {};
        const toOrg = commitStatus.committedOrganization;
        const valuation = player.valuation || {};
        const nilValue = valuation.totalValue || null;

        // Track team stats (destination team)
        const teamName = toOrg?.name || toOrg?.fullName || 'Uncommitted';
        const teamKey = toOrg?.key || 'uncommitted';
        
        if (!teamStats[teamKey]) {
          teamStats[teamKey] = {
            name: teamName,
            logo: toOrg?.assetUrl || null,
            players: [],
            totalNil: 0,
            playerCount: 0,
          };
        }

        const playerData = {
          key: player.key,
          name: player.name,
          slug: player.slug,
          position: player.positionAbbreviation,
          imageUrl: player.defaultAssetUrl,
          fromSchool: lastTeam?.name || lastTeam?.fullName || null,
          toSchool: teamName,
          rating: transferRating.consensusRating || transferRating.rating || null,
          stars: transferRating.consensusStars || transferRating.stars || null,
          nationalRank: transferRating.consensusNationalRank || transferRating.nationalRank || null,
          nilValue: nilValue,
          year: parseInt(year),
        };

        teamStats[teamKey].players.push(playerData);
        teamStats[teamKey].playerCount++;
        
        if (nilValue) {
          teamStats[teamKey].totalNil += nilValue;
          totalNilValue += nilValue;
          playersWithNil++;
        }

        // Store individual player historical record
        const playerRef = yearRef.collection('players').doc(String(player.key));
        batch.set(playerRef, playerData);
      }

      // Store team summaries
      for (const [teamKey, stats] of Object.entries(teamStats)) {
        const teamRef = yearRef.collection('teams').doc(String(teamKey));
        batch.set(teamRef, {
          name: stats.name,
          logo: stats.logo,
          totalNil: stats.totalNil,
          playerCount: stats.playerCount,
          avgNil: stats.playerCount > 0 ? stats.totalNil / stats.playerCount : 0,
          year: parseInt(year),
        });
      }

      // Store year summary
      batch.set(yearRef, {
        year: parseInt(year),
        totalPlayers: players.length,
        totalNilValue: totalNilValue,
        playersWithNil: playersWithNil,
        avgNilValue: playersWithNil > 0 ? totalNilValue / playersWithNil : 0,
        teamCount: Object.keys(teamStats).length,
        syncedAt: new Date(),
      });

      await batch.commit();
      
      results[year] = {
        success: true,
        players: players.length,
        teams: Object.keys(teamStats).length,
        totalNil: totalNilValue,
      };
      
      console.log(`✅ ${year}: ${players.length} players, ${Object.keys(teamStats).length} teams`);
      
    } catch (error) {
      console.error(`Error for ${year}:`, error);
      results[year] = { error: error.message };
    }
  }

  res.status(200).json({ message: 'Historical sync complete', results });
}

