export default async function handler(req, res) {
  const { sport = 'football', year = '2026' } = req.query;
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  
  const years = [year, '2025', '2024'];
  
  for (const y of years) {
    try {
      // First, fetch page 1 to get pagination info
      const firstUrl = `https://www.on3.com/transfer-portal/rankings/${sport}/${y}/`;
      console.log(`Fetching first page: ${firstUrl}`);
      
      const firstResponse = await fetch(firstUrl, { headers, redirect: 'follow' });
      if (!firstResponse.ok) continue;
      
      const firstHtml = await firstResponse.text();
      const firstMatch = firstHtml.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      
      if (!firstMatch?.[1]) continue;
      
      const firstData = JSON.parse(firstMatch[1]);
      const pageProps = firstData.props?.pageProps;
      const playerData = pageProps?.playerData;
      const firstPlayers = playerData?.list || [];
      const pagination = playerData?.pagination;
      
      if (firstPlayers.length === 0) continue;
      
      const totalPages = pagination?.pageCount || Math.ceil((pagination?.count || 50) / 50);
      console.log(`Found ${firstPlayers.length} players on page 1, total pages: ${totalPages}`);
      
      // If only 1 page, return immediately
      if (totalPages <= 1) {
        res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 mins
        return res.status(200).json({ 
          pageProps: { ...pageProps, players: firstPlayers },
          pagination: { totalPages, totalPlayers: pagination?.count || firstPlayers.length },
          _fetchedYear: y
        });
      }
      
      // Fetch remaining pages in PARALLEL (much faster!)
      const pagePromises = [];
      for (let p = 2; p <= totalPages; p++) {
        const url = `https://www.on3.com/transfer-portal/rankings/${sport}/${y}/?page=${p}`;
        pagePromises.push(
          fetch(url, { headers, redirect: 'follow' })
            .then(r => r.ok ? r.text() : null)
            .then(html => {
              if (!html) return [];
              const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
              if (!match?.[1]) return [];
              const data = JSON.parse(match[1]);
              return data.props?.pageProps?.playerData?.list || [];
            })
            .catch(() => [])
        );
      }
      
      console.log(`Fetching ${pagePromises.length} additional pages in parallel...`);
      const additionalPages = await Promise.all(pagePromises);
      
      // Combine all players
      const allPlayers = [...firstPlayers, ...additionalPages.flat()];
      console.log(`SUCCESS! Total: ${allPlayers.length} players loaded in parallel`);
      
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 mins
      return res.status(200).json({ 
        pageProps: { ...pageProps, players: allPlayers },
        pagination: { totalPages, totalPlayers: allPlayers.length },
        _fetchedYear: y
      });
      
    } catch (error) {
      console.log(`Error fetching ${y}: ${error.message}`);
    }
  }
  
  console.error('Transfer portal fetch failed');
  res.status(500).json({ error: 'Failed to fetch transfer portal data' });
}
