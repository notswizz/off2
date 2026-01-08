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
              <th>NIL</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => {
              const displayRank = player.portalRank || (player.index != null ? player.index + 1 : index + 1);
              const nilVal = player.valuation?.totalValue;
              
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
                      <span className={styles.nilLocked}>
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
    </section>
  );
}
