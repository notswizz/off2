export default async function handler(req, res) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  
  try {
    const url = 'https://www.on3.com/transfer-portal/rankings/football/2026/';
    const response = await fetch(url, { headers, redirect: 'follow' });
    
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch schools' });
    }
    
    const html = await response.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (!match?.[1]) {
      return res.status(500).json({ error: 'Could not parse page data' });
    }
    
    const data = JSON.parse(match[1]);
    const pageProps = data.props?.pageProps;
    const filters = pageProps?.filters;
    
    // Extract schools from filters
    let schools = [];
    
    if (filters?.organizations) {
      schools = filters.organizations.map(org => ({
        key: org.key,
        name: org.name || org.fullName,
        logo: org.assetUrl || org.asset?.source
      }));
    }
    
    // Also collect unique schools from players as fallback
    const players = pageProps?.playerData?.list || [];
    const schoolsFromPlayers = new Map();
    
    players.forEach(player => {
      // From school (lastTeam)
      if (player.lastTeam?.key) {
        schoolsFromPlayers.set(player.lastTeam.key, {
          key: player.lastTeam.key,
          name: player.lastTeam.name || player.lastTeam.fullName,
          logo: player.lastTeam.assetUrl?.url || (player.lastTeam.asset ? `https://${player.lastTeam.asset.domain}${player.lastTeam.asset.source}` : null)
        });
      }
      
      // To school (committedOrganization)
      const toOrg = player.commitStatus?.committedOrganization;
      if (toOrg?.key) {
        schoolsFromPlayers.set(toOrg.key, {
          key: toOrg.key,
          name: toOrg.name || toOrg.fullName,
          logo: toOrg.assetUrl
        });
      }
    });
    
    // Merge schools
    if (schools.length === 0) {
      schools = Array.from(schoolsFromPlayers.values());
    }
    
    // Sort alphabetically
    schools.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.status(200).json({ schools });
    
  } catch (error) {
    console.error('Schools fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch schools' });
  }
}

