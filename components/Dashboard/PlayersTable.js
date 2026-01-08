import Link from 'next/link';
import styles from '@/styles/Dashboard.module.css';
import { formatCurrency } from '@/utils/formatters';

export default function PlayersTable({ players, sortBy, sortOrder, onSort }) {
  const getRankClass = (rank) => {
    if (rank === 1) return styles.gold;
    if (rank === 2) return styles.silver;
    if (rank === 3) return styles.bronze;
    return '';
  };

  if (!players || players.length === 0) {
    return (
      <section className={styles.tableSection}>
        <div className={styles.noResults}>
          <p>No players found</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.tableSection}>
      {/* Desktop Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.rankCol}>#</th>
              <th 
                className={`${styles.sortable} ${sortBy === "name" ? styles.active : ""}`}
                onClick={() => onSort("name")}
              >
                Player {sortBy === "name" && <span className={styles.sortArrow}>{sortOrder === "asc" ? "↑" : "↓"}</span>}
              </th>
              <th>Pos</th>
              <th 
                className={`${styles.sortable} ${sortBy === "rating" ? styles.active : ""}`}
                onClick={() => onSort("rating")}
              >
                Rating {sortBy === "rating" && <span className={styles.sortArrow}>{sortOrder === "asc" ? "↑" : "↓"}</span>}
              </th>
              <th>From</th>
              <th>To</th>
              <th title="NIL Valuation Estimate">NIL Value</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const displayRank = player.portalRank || (player.index != null ? player.index + 1 : index + 1);
              const nilVal = player.nilValuation;
              
              return (
                <tr key={`${player.key}-${index}`} className={styles.playerRow}>
                  <td>
                    <span className={`${styles.rank} ${getRankClass(displayRank)}`}>{displayRank}</span>
                  </td>
                  <td className={styles.playerCell}>
                    <Link href={`/players/${player.slug}`} className={styles.playerLink}>
                      <div className={styles.playerInfo}>
                        {player.imageUrl ? (
                          <img src={player.imageUrl} alt={player.name} className={styles.playerImage} />
                        ) : (
                          <div className={styles.playerImage} style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {player.name?.charAt(0)}
                          </div>
                        )}
                        <div className={styles.playerDetails}>
                          <span className={styles.playerName}>
                            {player.name}
                            {player.stars > 0 && <span className={styles.stars}>{"★".repeat(player.stars)}</span>}
                            <svg className={styles.viewIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          </span>
                          {player.hometown && <span className={styles.hometown}>{player.hometown}</span>}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <span className={styles.position}>{player.position || "—"}</span>
                  </td>
                  <td>
                    <span className={styles.ratingBadge}>{player.rating?.toFixed(1) || "—"}</span>
                  </td>
                  <td className={styles.schoolCell}>
                    {player.fromSchoolLogo ? (
                      <div className={styles.schoolInfo}>
                        <img src={player.fromSchoolLogo} alt={player.fromSchool} className={styles.schoolLogo} />
                        <span className={styles.schoolNameCell}>{player.fromSchool}</span>
                      </div>
                    ) : player.fromSchool ? (
                      <span className={styles.schoolNameCell}>{player.fromSchool}</span>
                    ) : (
                      <span className={styles.schoolNameCell} style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className={styles.schoolCell}>
                    {player.toSchoolLogo ? (
                      <div className={styles.schoolInfo}>
                        <img src={player.toSchoolLogo} alt={player.toSchool} className={styles.schoolLogo} />
                        <span className={styles.schoolNameCell}>{player.toSchool}</span>
                      </div>
                    ) : player.toSchool ? (
                      <span className={styles.schoolNameCell}>{player.toSchool}</span>
                    ) : (
                      <span className={`${styles.schoolNameCell} ${styles.inPortal}`}>In Portal</span>
                    )}
                  </td>
                  <td>
                    {nilVal ? (
                      <span className={styles.nilValue}>{formatCurrency(nilVal)}</span>
                    ) : (
                      <span className={styles.nilLocked} title="Private">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={styles.mobileCards}>
        {players.map((player, index) => {
          const displayRank = player.portalRank || (player.index != null ? player.index + 1 : index + 1);
          const nilVal = player.nilValuation;
          const isCommitted = !!player.toSchool;
          
          return (
            <Link 
              href={`/players/${player.slug}`} 
              key={`mobile-${player.key}-${index}`}
              className={`${styles.mobileCard} ${isCommitted ? styles.committed : ''}`}
            >
              {/* Animated border overlay for committed */}
              {isCommitted && <div className={styles.cardGlow} />}
              
              {/* Floating Rank Badge - Top Left */}
              <span className={`${styles.cardRankFloat} ${getRankClass(displayRank)}`}>
                {displayRank}
              </span>
              
              <div className={styles.cardInner}>
                {/* Top Row: Image + Info */}
                <div className={styles.cardTopRow}>
                  <div className={styles.cardThumb}>
                    {player.imageUrl ? (
                      <img src={player.imageUrl} alt={player.name} className={styles.cardImage} />
                    ) : (
                      <div className={styles.cardImagePlaceholder}>
                        {player.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.cardMain}>
                    <div className={styles.cardHeader}>
                      {player.position && (
                        <span className={styles.cardPos}>{player.position}</span>
                      )}
                    </div>
                    
                    <h3 className={styles.cardName}>{player.name}</h3>
                    
                    {player.stars > 0 && (
                      <div className={styles.cardStars}>
                        {"★".repeat(player.stars)}
                        <span className={styles.starsLabel}>{player.stars}-Star</span>
                      </div>
                    )}
                    
                    {player.rating > 0 && (
                      <div className={styles.cardRatingRow}>
                        <span className={styles.cardRatingValue}>{player.rating.toFixed(2)}</span>
                        <span className={styles.cardRatingLabel}>Rating</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transfer Section */}
                <div className={styles.cardTransferSection}>
                  <div className={styles.cardFromTo}>
                    <div className={styles.cardSchoolFrom}>
                      {player.fromSchoolLogo && (
                        <img src={player.fromSchoolLogo} alt="" className={styles.cardSchoolLogo} />
                      )}
                      <span>{player.fromSchool || 'Unknown'}</span>
                    </div>
                    <div className={styles.cardTransferArrow}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </div>
                    <div className={`${styles.cardSchoolTo} ${isCommitted ? styles.isCommitted : ''}`}>
                      {player.toSchoolLogo && (
                        <img src={player.toSchoolLogo} alt="" className={styles.cardSchoolLogo} />
                      )}
                      <span>{player.toSchool || 'In Portal'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: NIL & Status */}
                <div className={styles.cardFooter}>
                  {nilVal ? (
                    <span className={styles.cardNil}>{formatCurrency(nilVal)}</span>
                  ) : (
                    <span className={styles.cardNilPrivate}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Private
                    </span>
                  )}
                  <span className={`${styles.cardStatus} ${isCommitted ? styles.statusCommitted : styles.statusPortal}`}>
                    {isCommitted ? '✓ Committed' : '◎ In Portal'}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
