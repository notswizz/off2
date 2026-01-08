import { db } from '@/lib/firebase';

// This API syncs portal data and detects changes
export default async function handler(req, res) {
  // Verify cron secret or allow in development
  const authHeader = req.headers.authorization;
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!db) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  try {
    // Fetch current portal data
    const portalRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/transfer-portal?sport=football&year=2026`);
    const portalData = await portalRes.json();
    
    const currentPlayers = portalData?.pageProps?.players || [];
    if (currentPlayers.length === 0) {
      return res.status(200).json({ message: 'No players found', events: 0 });
    }

    const batch = db.batch();
    const eventsRef = db.collection('events');
    const playersRef = db.collection('players');
    const now = new Date();
    let eventsCreated = 0;

    for (const player of currentPlayers) {
      const playerDocRef = playersRef.doc(String(player.key));
      const playerDoc = await playerDocRef.get();
      const existingData = playerDoc.exists ? playerDoc.data() : null;

      const commitStatus = player.commitStatus || {};
      const toOrg = commitStatus.committedOrganization;
      const lastTeam = player.lastTeam;
      const valuation = player.valuation || {};
      const transferRating = player.transferRating || player.rosterRating || player.rating || {};

      // Current state
      const currentState = {
        key: player.key,
        name: player.name,
        slug: player.slug,
        position: player.positionAbbreviation,
        imageUrl: player.defaultAssetUrl,
        fromSchool: lastTeam?.name || lastTeam?.fullName || null,
        fromSchoolLogo: lastTeam?.assetUrl?.url || null,
        toSchool: toOrg?.name || toOrg?.fullName || null,
        toSchoolLogo: toOrg?.assetUrl || null,
        status: player.recStatus || (toOrg ? 'Committed' : 'In Portal'),
        nilValue: valuation.totalValue || null,
        rating: transferRating.consensusRating || transferRating.rating || null,
        stars: transferRating.consensusStars || transferRating.stars || null,
        nationalRank: transferRating.consensusNationalRank || transferRating.nationalRank || null,
        lastUpdated: now,
      };

      // Get player's vote score
      const voteDoc = await db.collection('votes').doc(String(player.key)).get();
      const voteData = voteDoc.exists ? voteDoc.data() : { upvotes: 0, downvotes: 0 };
      const voteScore = (voteData.upvotes || 0) - (voteData.downvotes || 0);

      if (!existingData) {
        // New player entered the portal!
        const eventRef = eventsRef.doc();
        batch.set(eventRef, {
          type: 'portal_entry',
          playerId: player.key,
          playerName: player.name,
          playerSlug: player.slug,
          playerImage: player.defaultAssetUrl,
          position: player.positionAbbreviation,
          stars: currentState.stars,
          rating: currentState.rating,
          fromSchool: currentState.fromSchool,
          fromSchoolLogo: currentState.fromSchoolLogo,
          nilValue: currentState.nilValue,
          voteScore: voteScore,
          description: `${player.name} has entered the transfer portal`,
          timestamp: now,
          read: false,
        });
        eventsCreated++;
      } else {
        // Check for commitment change
        if (!existingData.toSchool && currentState.toSchool) {
          const eventRef = eventsRef.doc();
          batch.set(eventRef, {
            type: 'commitment',
            playerId: player.key,
            playerName: player.name,
            playerSlug: player.slug,
            playerImage: player.defaultAssetUrl,
            position: player.positionAbbreviation,
            stars: currentState.stars,
            rating: currentState.rating,
            fromSchool: currentState.fromSchool,
            fromSchoolLogo: currentState.fromSchoolLogo,
            toSchool: currentState.toSchool,
            toSchoolLogo: currentState.toSchoolLogo,
            nilValue: currentState.nilValue,
            voteScore: voteScore,
            description: `${player.name} has committed to ${currentState.toSchool}`,
            timestamp: now,
            read: false,
          });
          eventsCreated++;
        }

        // Check for NIL value change (significant change > 10%)
        if (existingData.nilValue && currentState.nilValue) {
          const change = Math.abs(currentState.nilValue - existingData.nilValue) / existingData.nilValue;
          if (change > 0.1) {
            const eventRef = eventsRef.doc();
            const increased = currentState.nilValue > existingData.nilValue;
            batch.set(eventRef, {
              type: 'nil_change',
              playerId: player.key,
              playerName: player.name,
              playerSlug: player.slug,
              playerImage: player.defaultAssetUrl,
              position: player.positionAbbreviation,
              stars: currentState.stars,
              rating: currentState.rating,
              fromSchool: currentState.fromSchool,
              fromSchoolLogo: currentState.fromSchoolLogo,
              toSchool: currentState.toSchool,
              toSchoolLogo: currentState.toSchoolLogo,
              oldValue: existingData.nilValue,
              newValue: currentState.nilValue,
              voteScore: voteScore,
              description: `${player.name}'s NIL value ${increased ? 'increased' : 'decreased'} to $${(currentState.nilValue / 1000000).toFixed(2)}M`,
              timestamp: now,
              read: false,
            });
            eventsCreated++;
          }
        }

        // Check for ranking change
        if (existingData.nationalRank && currentState.nationalRank && existingData.nationalRank !== currentState.nationalRank) {
          const improved = currentState.nationalRank < existingData.nationalRank;
          const diff = Math.abs(currentState.nationalRank - existingData.nationalRank);
          if (diff >= 5) { // Only track significant ranking changes
            const eventRef = eventsRef.doc();
            batch.set(eventRef, {
              type: 'ranking_change',
              playerId: player.key,
              playerName: player.name,
              playerSlug: player.slug,
              playerImage: player.defaultAssetUrl,
              position: player.positionAbbreviation,
              stars: currentState.stars,
              rating: currentState.rating,
              fromSchool: currentState.fromSchool,
              fromSchoolLogo: currentState.fromSchoolLogo,
              toSchool: currentState.toSchool,
              toSchoolLogo: currentState.toSchoolLogo,
              oldRank: existingData.nationalRank,
              newRank: currentState.nationalRank,
              nilValue: currentState.nilValue,
              voteScore: voteScore,
              description: `${player.name} ${improved ? 'rose' : 'dropped'} to #${currentState.nationalRank} in rankings`,
              timestamp: now,
              read: false,
            });
            eventsCreated++;
          }
        }
      }

      // Update player document
      batch.set(playerDocRef, currentState, { merge: true });
    }

    await batch.commit();

    // Update last sync time
    await db.collection('meta').doc('sync').set({ lastSync: now });

    res.status(200).json({ 
      message: 'Sync complete', 
      playersProcessed: currentPlayers.length,
      eventsCreated 
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
}

