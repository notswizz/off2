// Transform raw Transfer Portal API data into normalized player objects
export function transformPortalPlayers(portalData) {
  if (!portalData?.pageProps?.players) return [];
  
  const rawPlayers = portalData.pageProps.players;

  return rawPlayers.map((player, idx) => {
    const transferRating = player.transferRating || player.rosterRating || player.rating || {};
    const lastTeam = player.lastTeam || {};
    const commitStatus = player.commitStatus || {};
    const toOrg = commitStatus.committedOrganization || {};
    const valuation = player.valuation || {};
    
    return {
      key: player.key,
      name: player.name || "Unknown",
      slug: player.slug,
      imageUrl: player.defaultAssetUrl,
      position: player.positionAbbreviation || transferRating.positionAbbr,
      height: player.height,
      weight: player.weight,
      hometown: player.homeTownName,
      highSchool: player.highSchoolName,
      classYear: player.classYear,
      classRank: commitStatus.classRank,
      
      // Transfer specific - FROM school
      fromSchool: lastTeam.name || lastTeam.fullName,
      fromSchoolLogo: lastTeam.assetUrl?.url || lastTeam.asset?.source,
      
      // Transfer specific - TO school
      toSchool: toOrg.name || toOrg.fullName,
      toSchoolLogo: toOrg.assetUrl,
      
      // Status
      transferStatus: player.recStatus || commitStatus.type || "In Portal",
      enteredPortal: commitStatus.transferEntered,
      committedDate: commitStatus.date,
      
      // Ratings
      stars: transferRating.consensusStars || transferRating.stars,
      rating: transferRating.consensusRating || transferRating.rating,
      nationalRank: transferRating.consensusNationalRank || transferRating.nationalRank,
      positionRank: transferRating.consensusPositionRank || transferRating.positionRank,
      
      // Rank
      portalRank: player.index != null ? player.index + 1 : (idx + 1),
      
      // NIL valuation
      nilStatus: player.nilStatus,
      nilValuation: valuation.totalValue || valuation.valuation || null,
      valuation: valuation,
      
      // Player record status
      recStatus: player.recStatus,
      
      type: "portal",
    };
  });
}

// Filter players based on search term, position, and status
export function filterPlayers(players, searchTerm, positionFilter, statusFilter = "all") {
  let filtered = [...players];

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.toSchool?.toLowerCase().includes(term) ||
        p.fromSchool?.toLowerCase().includes(term) ||
        p.hometown?.toLowerCase().includes(term)
    );
  }

  if (positionFilter !== "all") {
    filtered = filtered.filter((p) => p.position === positionFilter);
  }

  if (statusFilter !== "all") {
    filtered = filtered.filter((p) => {
      switch (statusFilter) {
        case "committed":
          return p.toSchool;
        case "inPortal":
          return !p.toSchool;
        default:
          return true;
      }
    });
  }

  return filtered;
}

// Sort players by field
export function sortPlayers(players, sortBy, sortOrder) {
  return [...players].sort((a, b) => {
    let aVal, bVal;
    
    switch (sortBy) {
      case "name":
        aVal = a.name || "";
        bVal = b.name || "";
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      case "school":
        aVal = a.toSchool || a.fromSchool || "";
        bVal = b.toSchool || b.fromSchool || "";
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      case "rank":
        aVal = a.portalRank || 9999;
        bVal = b.portalRank || 9999;
        break;
      case "rating":
        aVal = a.rating || 0;
        bVal = b.rating || 0;
        break;
      default:
        aVal = a.portalRank || 9999;
        bVal = b.portalRank || 9999;
    }
    
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });
}

// Get unique positions from players
export function getUniquePositions(players) {
  const posSet = new Set();
  players.forEach((p) => {
    if (p.position) posSet.add(p.position);
  });
  return Array.from(posSet).sort();
}
